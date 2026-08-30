// One place that answers "what GitHub token do we act as?".
//
// There used to be three different fallback chains across the GitHub routes,
// and every one of them ended at `process.env.GITHUB_ACCESS_TOKEN` — the
// PLATFORM's own PAT, which is set in production. That meant any signed-in
// user's import/pull ran as Webstew's GitHub account and could reach every
// private repo that account can see. The platform token is gone from this
// path entirely: we act as the user or we act as nobody.
//
// Resolution order:
//   1. the user's stored credential (OAuth token captured at sign-in, or a
//      PAT they pasted in Profile → Deploy credentials)
//   2. the GitHub OAuth token on their current session (first request after
//      sign-in, before the credential write lands)
//
// `null` is a legitimate result — anonymous GitHub API calls still work for
// public repos, just at a lower rate limit. Routes that REQUIRE a token
// (create repo, push, list my repos) should use `requireGithubToken`.

import { NextResponse } from 'next/server'
import { getUserCredential } from '@/lib/credentials-store'

export async function resolveGithubToken(
  userId: string | null | undefined,
  sessionToken?: string | null,
): Promise<string | null> {
  if (userId) {
    try {
      const stored = await getUserCredential(userId, 'github')
      if (stored) return stored
    } catch { /* credential unreadable (secret rotated) — fall through */ }
  }
  return sessionToken || null
}

// The 401 every GitHub surface returns when we have no user token. `needsGithub`
// is the flag the client uses to show "Connect GitHub" instead of a raw error.
export function githubConnectRequired(
  message = 'Connect your GitHub account to continue.',
): NextResponse {
  return NextResponse.json({ error: message, needsGithub: true }, { status: 401 })
}

export async function requireGithubToken(
  userId: string | null | undefined,
  sessionToken?: string | null,
): Promise<{ token: string } | { err: NextResponse }> {
  const token = await resolveGithubToken(userId, sessionToken)
  if (!token) return { err: githubConnectRequired() }
  return { token }
}
