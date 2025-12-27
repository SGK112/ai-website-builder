import { NextRequest, NextResponse } from 'next/server'

const RENDER_API_KEY = process.env.RENDER_API_KEY
const GITHUB_TOKEN = process.env.GITHUB_ACCESS_TOKEN

interface ProjectFile {
  path: string
  content: string
}

export async function POST(req: NextRequest) {
  try {
    const { projectId, files, name } = await req.json()

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

    // Step 1: Create GitHub repo
    console.log('Creating GitHub repo:', repoName)
    const repoUrl = await createGitHubRepo(repoName, files)

    // Step 2: Create Render web service
    console.log('Creating Render service...')
    const serviceUrl = await createRenderService(repoName, repoUrl)

    return NextResponse.json({
      success: true,
      url: serviceUrl,
      repoUrl,
    })
  } catch (error: any) {
    console.error('Deploy error:', error)
    return NextResponse.json(
      { error: error.message || 'Deployment failed' },
      { status: 500 }
    )
  }
}

async function createGitHubRepo(name: string, files: ProjectFile[]): Promise<string> {
  if (!GITHUB_TOKEN) {
    throw new Error('GitHub token not configured')
  }

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
        message: 'Initial commit from AI Website Builder',
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

async function createRenderService(name: string, repoUrl: string): Promise<string> {
  if (!RENDER_API_KEY) {
    throw new Error('Render API key not configured')
  }

  // First get the owner ID
  const ownersRes = await fetch('https://api.render.com/v1/owners', {
    headers: {
      Authorization: `Bearer ${RENDER_API_KEY}`,
      Accept: 'application/json',
    },
  })

  if (!ownersRes.ok) {
    throw new Error('Failed to get Render owner ID')
  }

  const owners = await ownersRes.json()
  const ownerId = owners[0]?.owner?.id

  if (!ownerId) {
    throw new Error('No Render owner found')
  }

  // Create static site (simpler for HTML sites)
  const res = await fetch('https://api.render.com/v1/services', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RENDER_API_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      type: 'static_site',
      name,
      ownerId,
      repo: repoUrl,
      branch: 'main',
      autoDeploy: 'yes',
      serviceDetails: {
        publishPath: '.',
      },
    }),
  })

  if (!res.ok) {
    const error = await res.json()
    console.error('Render error:', error)
    throw new Error(`Failed to create Render service: ${JSON.stringify(error)}`)
  }

  const service = await res.json()
  return service.service?.serviceDetails?.url || `https://${name}.onrender.com`
}
