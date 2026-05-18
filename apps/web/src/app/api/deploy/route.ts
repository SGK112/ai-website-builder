import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/api-auth'
import { checkApiRateLimit, handleRateLimitError } from '@/lib/rate-limit-middleware'
import { loadProjectCms } from '@/lib/cms-store'
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
      checkApiRateLimit(req, 'deployment')
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

    // Step 1: Create GitHub repo
    console.log('Creating GitHub repo:', repoName, 'CMS files baked:', cmsCounts)
    const repoUrl = await createGitHubRepo(repoName, finalFiles, githubToken)

    // Step 2: Create Render service. Pick static_site vs web_service based on
    // the framework signature in package.json — see detectDeployShape below.
    const shape = detectDeployShape(finalFiles)
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
          await db.collection('projects').updateOne(
            { _id: new ObjectId(projectId) },
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

// Bake the project's published CMS items into the file tree so the deployed
// site can read them. Two formats:
//   • `cms/<collection>.json` — array of published items. Universal; any
//     framework can fetch / import this at build or runtime.
//   • For Astro projects (package.json has `astro`), additionally write each
//     item as a markdown file in `src/content/<collection>/<slug>.md` with
//     YAML frontmatter — that's the idiomatic Astro Content Collections shape.
//
// Files already present in the project (e.g. user wrote their own
// `cms/services.json` manually) are NOT overwritten.
async function injectPublishedCms(
  files: ProjectFile[],
  projectId: string,
  userId: string,
): Promise<{ files: ProjectFile[]; counts: Record<string, number> }> {
  try {
    const loaded = await loadProjectCms(projectId, userId)
    if (!loaded.ok) {
      console.warn('[deploy] CMS load skipped:', loaded.error)
      return { files, counts: {} }
    }
    const { cms } = loaded
    const counts: Record<string, number> = {}
    const isAstro = files.some(f =>
      (f.path === 'package.json' || f.path.endsWith('/package.json')) &&
      /"astro"\s*:/.test(f.content)
    )
    const existingPaths = new Set(files.map(f => f.path))
    const extra: ProjectFile[] = []

    for (const slug of Object.keys(cms.schemas)) {
      const items = Object.values(cms.items[slug] || {})
        .filter((item: any) => item.status === 'published')
      counts[slug] = items.length
      if (items.length === 0) continue

      // Universal JSON dump — keep this even for Astro; the agent might want
      // to use the json instead of the markdown collection.
      const jsonPath = `cms/${slug}.json`
      if (!existingPaths.has(jsonPath)) {
        extra.push({
          path: jsonPath,
          content: JSON.stringify(items.map((i: any) => ({
            slug: i.slug,
            ...i.fields,
            updatedAt: i.updatedAt,
          })), null, 2),
        })
      }

      // Astro-idiomatic markdown
      if (isAstro) {
        for (const item of items as any[]) {
          const mdPath = `src/content/${slug}/${item.slug}.md`
          if (existingPaths.has(mdPath)) continue
          extra.push({ path: mdPath, content: toAstroMarkdown(item) })
        }
      }
    }
    return { files: [...files, ...extra], counts }
  } catch (e: any) {
    // Never block deploy on a CMS injection failure — just log and continue
    // with the un-injected files. Missing CMS content is better than a failed
    // deploy.
    console.error('[deploy] CMS injection failed:', e?.message || e)
    return { files, counts: {} }
  }
}

function toAstroMarkdown(item: any): string {
  const fields = { ...item.fields }
  // Pull `body` out — it becomes the markdown body, everything else is frontmatter.
  // Common keys for body: body, content, description, markdown. Prefer in order.
  const bodyKey = ['body', 'content', 'markdown', 'description'].find(k => typeof fields[k] === 'string')
  const body = bodyKey ? fields[bodyKey] : ''
  if (bodyKey) delete fields[bodyKey]
  // Astro picks up `pubDate` / `description` as common conventions; we just
  // pass through whatever the schema defined.
  const yaml = Object.entries(fields)
    .map(([k, v]) => `${k}: ${yamlValue(v)}`)
    .join('\n')
  return `---\n${yaml}\n---\n\n${body}\n`
}

function yamlValue(v: any): string {
  if (v === null || v === undefined) return 'null'
  if (typeof v === 'boolean' || typeof v === 'number') return String(v)
  if (v instanceof Date) return `"${v.toISOString()}"`
  // Strings: quote and escape minimal characters. Multi-line falls back to a
  // block scalar so YAML stays valid for paragraph-long fields.
  const s = String(v)
  if (s.includes('\n')) return `|\n  ${s.replace(/\n/g, '\n  ')}`
  return JSON.stringify(s)
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
      private: false,
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
// This stays narrow on purpose: every branch matches a target /app-builder can
// actually generate. Native iOS/Android builds go through EAS, not Render —
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
