import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/api-auth'
import { checkApiRateLimit, handleRateLimitError } from '@/lib/rate-limit-middleware'
import { injectPublishedCms } from '@/lib/cms-publish'
import { getUserCredential } from '@/lib/credentials-store'

// Env defaults — used only when the user hasn't stored their own credentials.
// BYO keys take precedence so multiple users can deploy to their own accounts.
const ENV_RENDER_API_KEY = process.env.RENDER_API_KEY
const ENV_GITHUB_TOKEN = process.env.GITHUB_ACCESS_TOKEN

interface ProjectFile {
  path: string
  content: string
}

export async function POST(req: NextRequest) {
  try {
    // SECURITY: Require authentication to deploy (supports API key for Aria)
    const session = await getApiSession(req)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Rate limit: 10 deployments per hour
    try {
      await checkApiRateLimit(req, 'deployment')
    } catch (error) {
      const rateLimitResponse = handleRateLimitError(error)
      if (rateLimitResponse) return rateLimitResponse
      throw error
    }

    const { projectId, files, name, analytics } = await req.json() as {
      projectId?: string
      files: ProjectFile[]
      name: string
      // Optional analytics injection — workspace deploy panel sets this from
      // the user's Integrations selection so they don't have to copy-paste
      // tracking snippets into every site they deploy.
      analytics?: {
        googleAnalyticsId?: string  // 'G-XXXXXX' or 'UA-XXXXXX'
        plausibleDomain?: string    // 'mysite.com' — emits the script.js tag
      }
    }

    if (!files || !name) {
      return NextResponse.json({ error: 'Files and name are required' }, { status: 400 })
    }

    // Sanitize name for repo/service name
    const safeName = name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50)

    const repoName = `${safeName}-${Date.now().toString(36)}`

    // CMS injection — if the caller passed a projectId we own, bake the
    // project's published CMS items into the file tree as JSON (and as
    // markdown for Astro). Skips entirely when projectId is absent so the
    // deploy path stays backward-compatible.
    let finalFiles: ProjectFile[] = files
    let cmsCounts: Record<string, number> = {}
    if (projectId) {
      const cmsResult = await injectPublishedCms(files, projectId, session.user.id)
      finalFiles = cmsResult.files
      cmsCounts = cmsResult.counts
    }

    // Resolve credentials — BYO first, env fallback. This is what makes
    // multi-tenant deploys possible: each user's deploy lands in *their*
    // GitHub + Render accounts.
    const githubToken = (await getUserCredential(session.user.id, 'github')) || ENV_GITHUB_TOKEN
    // Platform hosts in the cloud on Render by default (that's the product) —
    // BYO key just lets a user deploy into their own Render account instead.
    const renderKey = (await getUserCredential(session.user.id, 'render')) || ENV_RENDER_API_KEY
    if (!githubToken) {
      return NextResponse.json({
        error: 'No GitHub token. Add one in Profile → Deploy credentials, or set GITHUB_ACCESS_TOKEN in the environment.',
        needsCredential: 'github',
      }, { status: 400 })
    }
    if (!renderKey) {
      return NextResponse.json({
        error: 'No Render API key. Add one in Profile → Deploy credentials, or set RENDER_API_KEY in the environment.',
        needsCredential: 'render',
      }, { status: 400 })
    }

    // Absolutize /api/media URLs so they still resolve after the site is
    // deployed as a static bundle on Render (which has no Next.js API layer).
    const appOrigin =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.RENDER_EXTERNAL_URL ||
      'https://ai-website-builder-ntzg.onrender.com'
    finalFiles = finalFiles.map(f =>
      /\.(html?)$/i.test(f.path)
        ? { ...f, content: f.content.replace(/(['"\(])\/api\/media\?/g, `$1${appOrigin}/api/media?`) }
        : f
    )

    // Inject analytics tags right before </head> in every HTML file so the
    // user doesn't have to paste GA/Plausible snippets manually after deploy.
    // Idempotent — skips files that already contain the gtag/plausible script
    // (e.g., re-deploys, or sites the agent already instrumented).
    if (analytics?.googleAnalyticsId || analytics?.plausibleDomain) {
      const gaId = String(analytics.googleAnalyticsId || '').trim()
      const plausibleDomain = String(analytics.plausibleDomain || '').trim()
      const tags: string[] = []
      if (gaId && /^(G|UA|GTM)-[A-Z0-9-]+$/i.test(gaId)) {
        tags.push(
          `<!-- Google Analytics (injected by Webstew) -->`,
          `<script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>`,
          `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');</script>`,
        )
      }
      if (plausibleDomain && /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(plausibleDomain)) {
        tags.push(
          `<!-- Plausible (injected by Webstew) -->`,
          `<script defer data-domain="${plausibleDomain}" src="https://plausible.io/js/script.js"></script>`,
        )
      }
      if (tags.length > 0) {
        const block = tags.join('\n')
        finalFiles = finalFiles.map(f => {
          if (!/\.(html?)$/i.test(f.path)) return f
          if (/googletagmanager\.com\/gtag|plausible\.io\/js/.test(f.content)) return f
          if (!/<\/head>/i.test(f.content)) return f
          return { ...f, content: f.content.replace(/<\/head>/i, `${block}\n</head>`) }
        })
      }
    }

    const shape = detectDeployShape(finalFiles)

    // Never push secret-bearing dotfiles (.env*) into the repo.
    finalFiles = finalFiles.filter(f => !/(^|\/)\.env(\.|$)/i.test(String(f?.path || '')))

    // Step 1: Create GitHub repo
    console.log('Creating GitHub repo:', repoName, 'CMS files baked:', cmsCounts)
    const repoUrl = await createGitHubRepo(repoName, finalFiles, githubToken)

    // Step 2: Create Render service.
    console.log('Creating Render service:', shape)
    const renderResult = await createRenderService(repoName, repoUrl, shape, renderKey)

    // Persist deployment metadata on the project so downstream features
    // (custom domain, redeploy, status checks) can find the Render service.
    if (projectId) {
      try {
        const { connectDB } = await import('@/lib/db')
        const { ObjectId } = await import('mongodb')
        const mongoose = await connectDB()
        const db = mongoose.connection.db
        if (db && ObjectId.isValid(projectId)) {
          // IDOR guard: only the project owner may write deploy metadata. userId
          // is a string on some docs and an ObjectId on others, so match both
          // (mirrors the GET /api/projects $or pattern).
          const ownerOr: any[] = [{ userId: session.user.id }]
          if (ObjectId.isValid(session.user.id)) ownerOr.push({ userId: new ObjectId(session.user.id) })
          await db.collection('projects').updateOne(
            { _id: new ObjectId(projectId), $or: ownerOr },
            {
              $set: {
                deployment: {
                  renderServiceId: renderResult.serviceId,
                  liveUrl: renderResult.url,
                  repoUrl,
                  framework: shape.framework,
                  deployedAt: new Date(),
                },
                liveUrl: renderResult.url,
                status: 'deployed',
                updatedAt: new Date(),
              },
            },
          )
        }
      } catch (e: any) {
        console.warn('[deploy] Failed to persist deployment metadata:', e?.message)
      }
    }

    return NextResponse.json({
      success: true,
      framework: shape.framework,
      url: renderResult.url,
      serviceId: renderResult.serviceId,
      repoUrl,
      cms: cmsCounts,
    })
  } catch (error: any) {
    console.error('Deploy error:', error)
    return NextResponse.json(
      { error: error.message || 'Deployment failed' },
      { status: 500 }
    )
  }
}

async function createGitHubRepo(name: string, files: ProjectFile[], token: string): Promise<string> {
  if (!token) {
    throw new Error('GitHub token not configured')
  }
  const GITHUB_TOKEN = token

  // Create repo
  const createRes = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github.v3+json',
    },
    body: JSON.stringify({
      name,
      // Private by default — don't publish a user's source/secrets publicly.
      private: true,
      auto_init: true,
    }),
  })

  if (!createRes.ok) {
    const error = await createRes.json()
    throw new Error(`Failed to create repo: ${error.message}`)
  }

  const repo = await createRes.json()
  const repoFullName = repo.full_name

  // Wait a moment for repo to be ready
  await new Promise(r => setTimeout(r, 2000))

  // Get default branch SHA
  const refRes = await fetch(
    `https://api.github.com/repos/${repoFullName}/git/ref/heads/main`,
    {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  )

  if (!refRes.ok) {
    throw new Error('Failed to get repo ref')
  }

  const refData = await refRes.json()
  const baseSha = refData.object.sha

  // Create blobs for each file
  const blobs = await Promise.all(
    files.map(async (file) => {
      const blobRes = await fetch(
        `https://api.github.com/repos/${repoFullName}/git/blobs`,
        {
          method: 'POST',
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json',
            Accept: 'application/vnd.github.v3+json',
          },
          body: JSON.stringify({
            content: Buffer.from(file.content).toString('base64'),
            encoding: 'base64',
          }),
        }
      )
      const blob = await blobRes.json()
      return {
        path: file.path,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: blob.sha,
      }
    })
  )

  // Create tree
  const treeRes = await fetch(
    `https://api.github.com/repos/${repoFullName}/git/trees`,
    {
      method: 'POST',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        base_tree: baseSha,
        tree: blobs,
      }),
    }
  )

  const tree = await treeRes.json()

  // Create commit
  const commitRes = await fetch(
    `https://api.github.com/repos/${repoFullName}/git/commits`,
    {
      method: 'POST',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        message: 'Initial commit from Webstew',
        tree: tree.sha,
        parents: [baseSha],
      }),
    }
  )

  const commit = await commitRes.json()

  // Update ref
  await fetch(
    `https://api.github.com/repos/${repoFullName}/git/refs/heads/main`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        sha: commit.sha,
      }),
    }
  )

  return repo.html_url
}

// Decide what kind of Render service to create based on the project shape.
//
//   • No package.json → plain HTML site → Render `static_site`, publishPath '.'
//   • package.json with `next` → Render `web_service` (Node), build + start
//   • package.json with `vite`  → Render `static_site`, build → publishPath 'dist'
//   • package.json with `astro` → Render `static_site`, build → publishPath 'dist'
//   • package.json with `expo`  → Render `static_site`, `expo export --platform web` → 'dist'
//   • package.json with anything else (Express, custom Node) → web_service node
//
// This stays narrow on purpose: every branch matches a target the workspace
// can actually generate. Native iOS/Android builds go through EAS, not Render —
// that's a separate pipeline (Apple/Google creds, store submission). The
// expo→web path here gives Expo apps a shareable URL today.
type DeployShape =
  | { kind: 'static'; framework: 'html' | 'vite' | 'astro' | 'expo-web'; buildCommand?: string; publishPath: string }
  | { kind: 'web'; framework: 'nextjs' | 'node'; buildCommand: string; startCommand: string }

function detectDeployShape(files: ProjectFile[]): DeployShape {
  const pkgFile = files.find(f => f.path === 'package.json' || f.path.endsWith('/package.json'))
  if (!pkgFile) {
    return { kind: 'static', framework: 'html', publishPath: '.' }
  }
  let pkg: any = {}
  try { pkg = JSON.parse(pkgFile.content) } catch { /* malformed package.json — fall through */ }
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }

  if (deps.next) {
    return {
      kind: 'web',
      framework: 'nextjs',
      buildCommand: 'npm install && npm run build',
      startCommand: (pkg.scripts?.start as string) || 'npm start',
    }
  }
  if (deps.expo) {
    // Expo's web export. SDK 50+ writes to `dist/`. Older SDKs use `web-build/`
    // — if you generate against an old SDK the deploy will 404 and you'll need
    // to bump the publishPath.
    return {
      kind: 'static',
      framework: 'expo-web',
      buildCommand: 'npm install && npx expo export --platform web',
      publishPath: 'dist',
    }
  }
  if (deps.astro) {
    return {
      kind: 'static',
      framework: 'astro',
      buildCommand: 'npm install && npm run build',
      publishPath: 'dist',
    }
  }
  if (deps.vite || deps['@vitejs/plugin-react']) {
    return {
      kind: 'static',
      framework: 'vite',
      buildCommand: 'npm install && npm run build',
      publishPath: 'dist',
    }
  }
  // Generic Node service — assume `npm start` works.
  return {
    kind: 'web',
    framework: 'node',
    buildCommand: 'npm install' + (pkg.scripts?.build ? ' && npm run build' : ''),
    startCommand: (pkg.scripts?.start as string) || 'node index.js',
  }
}

async function createRenderService(name: string, repoUrl: string, shape: DeployShape, apiKey: string): Promise<{ url: string; serviceId: string | null }> {
  if (!apiKey) {
    throw new Error('Render API key not configured')
  }
  const RENDER_API_KEY = apiKey

  // First get the owner ID
  const ownersRes = await fetch('https://api.render.com/v1/owners', {
    headers: {
      Authorization: `Bearer ${RENDER_API_KEY}`,
      Accept: 'application/json',
    },
  })

  if (!ownersRes.ok) {
    const body = await ownersRes.text().catch(() => '')
    throw new Error(`Render /v1/owners returned ${ownersRes.status} ${ownersRes.statusText}: ${body.slice(0, 300)}`)
  }

  const owners = await ownersRes.json()
  const ownerId = owners[0]?.owner?.id

  if (!ownerId) {
    throw new Error(`No Render owner found. API returned ${JSON.stringify(owners).slice(0, 200)}`)
  }

  // Render's `serviceDetails` shape differs by service type. The API rejects
  // unknown keys, so build the body discriminantly.
  const body: any = {
    name,
    ownerId,
    repo: repoUrl,
    branch: 'main',
    autoDeploy: 'yes',
  }
  if (shape.kind === 'static') {
    body.type = 'static_site'
    body.serviceDetails = {
      publishPath: shape.publishPath,
      ...(shape.buildCommand ? { buildCommand: shape.buildCommand } : {}),
    }
  } else {
    body.type = 'web_service'
    body.serviceDetails = {
      env: 'node',
      plan: 'starter',
      buildCommand: shape.buildCommand,
      startCommand: shape.startCommand,
    }
  }

  const res = await fetch('https://api.render.com/v1/services', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RENDER_API_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const error = await res.json()
    console.error('Render error:', error)
    throw new Error(`Failed to create Render service: ${JSON.stringify(error)}`)
  }

  const service = await res.json()
  return {
    url: service.service?.serviceDetails?.url || `https://${name}.onrender.com`,
    serviceId: service.service?.id || null,
  }
}
