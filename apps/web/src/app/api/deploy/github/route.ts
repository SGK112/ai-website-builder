import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface ProjectFile {
  path: string
  content: string
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    const { projectId, files, repoName, isPrivate, useUserToken } = await req.json()

    if (!files || !repoName) {
      return NextResponse.json(
        { error: 'Files and repo name are required' },
        { status: 400 }
      )
    }

    // Determine which token to use
    let githubToken: string | undefined

    if (useUserToken && session?.user?.githubAccessToken) {
      githubToken = session.user.githubAccessToken
    } else {
      // Fall back to platform token
      githubToken = process.env.GITHUB_ACCESS_TOKEN
    }

    if (!githubToken) {
      return NextResponse.json(
        { error: 'GitHub authentication required. Please connect your GitHub account.' },
        { status: 401 }
      )
    }

    // Create the repository
    const repoUrl = await createGitHubRepo(githubToken, repoName, files, isPrivate)

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
      description: 'Created with AI Website Builder',
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
