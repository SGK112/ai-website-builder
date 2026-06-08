// PATCH  /api/admin/listings/[id] — approve / reject a listing.
// DELETE /api/admin/listings/[id] — hard-delete (escape hatch for
//                                    spam/copyright that shouldn't sit in
//                                    'rejected' forever).
// Admin-only. Records who did what in admin_audit for traceability.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { isAdminEmail } from '@ai-website-builder/database'
import { sendMail } from '@/lib/mailer'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !isAdminEmail(session.user.email)) return null
  return session
}

async function audit(action: string, listingId: string, by: string, note?: string) {
  const client = await clientPromise
  const db = client.db('ai-website-builder')
  await db.collection('admin_audit').insertOne({
    action,
    target: 'community_post',
    listingId,
    by,
    note: note || null,
    at: new Date(),
  })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!ObjectId.isValid(params.id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  let body: { status?: string; note?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const status = body.status
  if (status !== 'approved' && status !== 'rejected' && status !== 'pending') {
    return NextResponse.json({ error: 'status must be approved | rejected | pending' }, { status: 400 })
  }

  const client = await clientPromise
  const db = client.db('ai-website-builder')
  const r = await db.collection('community_posts').findOneAndUpdate(
    { _id: new ObjectId(params.id) },
    {
      $set: {
        status,
        moderatedAt: new Date(),
        moderatedBy: session.user!.email,
        moderationNote: body.note || null,
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after', projection: { html: 0 } }
  )
  // mongodb driver v6 returns the doc directly (no {value} wrapper); the old
  // `r?.value` was always undefined, so every approve/reject 404'd and
  // listings could never go live.
  if (!r) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await audit(`listing.${status}`, params.id, session.user!.email!, body.note)

  // Fire-and-forget notification to the author when a listing goes live or
  // gets rejected. Best-effort — never block the admin response on SMTP.
  // Skip seed/dummy accounts (their email domain ends in @webstew.demo and
  // those mailboxes don't exist, would just bounce noise).
  if (status === 'approved' || status === 'rejected') {
    const post: any = r
    void (async () => {
      try {
        const authorId = post?.author?.id
        if (!authorId || !ObjectId.isValid(authorId)) return
        const user = await db
          .collection('users')
          .findOne({ _id: new ObjectId(authorId) }, { projection: { email: 1, name: 1, username: 1 } })
        const to: string | undefined = user?.email
        if (!to || to.endsWith('@webstew.demo')) return
        const username: string | undefined = user?.username || post?.author?.username
        const profileUrl = username ? `https://www.webstew.net/u/${username}` : 'https://www.webstew.net/community'
        const niceName = user?.name || username || 'there'
        if (status === 'approved') {
          await sendMail({
            to,
            subject: `Your listing is live · ${post.title}`,
            text:
              `Hey ${niceName},\n\n` +
              `Your listing "${post.title}" was just approved and is live in the Webstew community.\n\n` +
              `View it: ${profileUrl}\n\n` +
              `Thanks for sharing your work — keep building.\n` +
              `— Webstew`,
            html:
              `<p>Hey ${niceName},</p>` +
              `<p>Your listing <strong>${post.title}</strong> was just approved and is live in the Webstew community.</p>` +
              `<p><a href="${profileUrl}" style="color:#7c3aed">View your creator page →</a></p>` +
              `<p style="color:#71717a;font-size:12px">— Webstew</p>`,
          })
        } else if (status === 'rejected') {
          const reason = body.note ? `\n\nReason: ${body.note}` : ''
          await sendMail({
            to,
            subject: `Your listing wasn't approved · ${post.title}`,
            text:
              `Hey ${niceName},\n\n` +
              `Your listing "${post.title}" wasn't approved for the community feed this time.${reason}\n\n` +
              `You can edit + resubmit at any time from your workspace.\n\n` +
              `— Webstew`,
          })
        }
      } catch (e: any) {
        console.warn('[listing-moderation] author email failed:', e?.message || e)
      }
    })()
  }

  return NextResponse.json({ post: r })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!ObjectId.isValid(params.id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const client = await clientPromise
  const db = client.db('ai-website-builder')
  const r = await db.collection('community_posts').deleteOne({ _id: new ObjectId(params.id) })
  if (r.deletedCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await audit('listing.delete', params.id, session.user!.email!)
  return NextResponse.json({ ok: true })
}
