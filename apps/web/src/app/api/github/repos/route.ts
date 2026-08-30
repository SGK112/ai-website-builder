// GET /api/github/repos          → the signed-in user's repos (newest push first)
// GET /api/github/repos?owner=&repo=&branches=1 → that repo's branches
//
// So "import from GitHub" is a pick-from-a-list, not a hand-typed URL.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireGithubToken } from '@/lib/github-token'
import { listUserRepos, listRepoBranches } from '@/lib/github-sync'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const gate = await requireGithubToken(session.user.id, (session.user as any).githubAccessToken)
  if ('err' in gate) return gate.err

  const owner = req.nextUrl.searchParams.get('owner')
  const repo = req.nextUrl.searchParams.get('repo')

  try {
    if (owner && repo) {
      const branches = await listRepoBranches(owner, repo, gate.token)
      return NextResponse.json({ branches })
    }
    const repos = await listUserRepos(gate.token)
    return NextResponse.json({ repos })
  } catch (e: any) {
    const msg = String(e?.message || 'GitHub request failed')
    // A token without `repo` scope lists nothing useful and 403s on private
    // repos — tell the user to reconnect rather than showing an empty list.
    if (/\b(401|403)\b/.test(msg)) {
      return NextResponse.json(
        { error: 'GitHub rejected that token. Sign in with GitHub again to grant repository access.', needsGithub: true },
        { status: 401 },
      )
    }
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
