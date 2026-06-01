// GET /api/domains/search?q=mycafe — availability + pricing for the in-app
// buy flow. Auth-gated (cheap, but keeps anon scrapers off). Returns retail
// prices (wholesale + markup); see lib/domains.ts. Mock until a registrar key
// is configured, real after.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { searchDomains } from '@/lib/domains'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  const q = req.nextUrl.searchParams.get('q') || ''
  if (q.trim().length < 2) {
    return NextResponse.json({ error: 'Type at least 2 characters.' }, { status: 400 })
  }
  const { live, root, results } = await searchDomains(q)
  return NextResponse.json({ live, root, results })
}
