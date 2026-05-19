// GET /api/templates/owned — return the list of template IDs the current
// user has purchased. Powers the "you own this — open in workspace" state
// on /templates so users see what they've already paid for.

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    // Anonymous → empty list, NOT 401. The /templates page renders fine
    // for anon users and just routes them to /signup on purchase intent.
    return NextResponse.json({ owned: [] })
  }
  try {
    const client = await clientPromise
    const db = client.db('ai-website-builder')
    const docs = await db
      .collection('template_purchases')
      .find(
        { buyerId: session.user.id, status: { $ne: 'refunded' } },
        { projection: { templateId: 1, _id: 0 } },
      )
      .toArray()
    const owned = Array.from(new Set(docs.map((d) => String(d.templateId)).filter(Boolean)))
    return NextResponse.json({ owned })
  } catch (e: any) {
    console.error('[templates.owned]', e?.message || e)
    return NextResponse.json({ owned: [] })
  }
}
