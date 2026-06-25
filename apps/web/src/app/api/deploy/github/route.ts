import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkApiRateLimit, handleRateLimitError } from '@/lib/rate-limit-middleware'

interface ProjectFile {
  path: string
  content: string
}

export async function POST(req: NextRequest) {
  try {
    // Signed-in only. This route was unauthenticated AND fell back to the
    // platform GitHub token — so anyone could create unlimited repos on
    // Webstew's own GitHub account. Now: auth required, and we ONLY use the
    // user's own connected token (users own their repos; the platform never
    // creates them under its account).
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    try {
      await checkApiRateLimit(req, 'deployment')
    } catch (error) {
      const rateLimitResponse = handleRateLimitError(error)
      if (rateLimitResponse) return rateLimitResponse
      throw error
    }

    const { files, repoName, isPrivate } = await req.json()

    if (!files || !repoName) {
      return NextResponse.json(
        { error: 'Files and repo name are required' },
        { status: 400 }
      )
    }

    const githubToken = session.user.githubAccessToken
    if (!githubToken) {
      return NextResponse.json(
        { error: 'Connect your GitHub account first to deploy to GitHub.', needsGithub: true },
        { status: 401 }
      )
    }

    // Never push secret-bearing dotfiles (.env*) into a repo.
    const safeFiles: ProjectFile[] = (Array.isArray(files) ? files : []).filter(
      (f: ProjectFile) => !/(^|\/)\.env(\.|$)/i.test(String(f?.path || ''))
    )

    // Private by default — don't publish a user's source/secrets unless they opt in.
    const repoUrl = await createGitHubRepo(githubToken, repoName, safeFiles, isPrivate !== false)

    return NextResponse.json({
      success: true,
      repoUrl,
      message: 'Repository created successfully'
    })
  } catch (error: any) {
    console.error('GitHub deploy error:', error)
    return NextResponse.json(
      { error: error.message || 'Deployment failed' },
      { status: 500 }
    )
  }
}

async function createGitHubRepo(
  token: string,
  name: string,
  files: ProjectFile[],
  isPrivate: boolean
): Promise<string> {
  // Create repo
  const createRes = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github.v3+json',
    },
    body: JSON.stringify({
      name,
      private: isPrivate,
      auto_init: true,
      description: 'Created with Webstew (https://webstew.net)',
    }),
  })

  if (!createRes.ok) {
    const error = await createRes.json()
    if (error.errors?.[0]?.message?.includes('already exists')) {
      throw new Error(`Repository "${name}" already exists. Please choose a different name.`)
    }
    throw new Error(`Failed to create repository: ${error.message || 'Unknown error'}`)
  }

  const repo = await createRes.json()
  const repoFullName = repo.full_name

  // Wait for repo to be ready
  await new Promise(r => setTimeout(r, 2000))

  // Get default branch SHA
  const refRes = await fetch(
    `https://api.github.com/repos/${repoFullName}/git/ref/heads/main`,
    {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  )

  if (!refRes.ok) {
    throw new Error('Failed to get repository reference')
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
            Authorization: `token ${token}`,
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
        Authorization: `token ${token}`,
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
        Authorization: `token ${token}`,
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
        Authorization: `token ${token}`,
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
