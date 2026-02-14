import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

const BUILDER_API_KEY = process.env.BUILDER_API_KEY

interface ApiUser {
  id: string
  email: string
  name: string
  plan: string
  githubAccessToken?: string
  isServiceAccount?: boolean
}

interface ApiSession {
  user: ApiUser
}

/**
 * Get authenticated user from either API key or NextAuth session.
 * API key auth allows server-to-server calls from Aria/VoiceNow CRM.
 *
 * Usage:
 *   const session = await getApiSession(req)
 *   if (!session?.user?.id) return NextResponse.json({ error: 'Auth required' }, { status: 401 })
 */
export async function getApiSession(req: NextRequest): Promise<ApiSession | null> {
  // Check API key first (server-to-server from Aria)
  const apiKey = req.headers.get('x-api-key')
  if (apiKey && BUILDER_API_KEY && apiKey === BUILDER_API_KEY) {
    // Optional: allow caller to specify which user's projects to access
    const userId = req.headers.get('x-user-id') || 'aria-service'
    const userName = req.headers.get('x-user-name') || 'Aria'

    return {
      user: {
        id: userId,
        email: 'aria@voicenow.app',
        name: userName,
        plan: 'pro',
        isServiceAccount: true,
      },
    }
  }

  // Fall back to NextAuth session
  const session = await getServerSession(authOptions)
  if (session?.user?.id) {
    return session as ApiSession
  }

  return null
}
