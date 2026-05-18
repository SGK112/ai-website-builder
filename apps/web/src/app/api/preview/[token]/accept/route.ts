import { NextRequest, NextResponse } from 'next/server'
import { acceptProposal } from '@/lib/preview-store'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const { name, email, phone } = await req.json().catch(() => ({}))
    const snap = await acceptProposal(params.token, { name, email, phone })
    if (!snap) {
      return NextResponse.json({ error: 'Proposal not found or already accepted' }, { status: 404 })
    }
    // Fire-and-forget owner notification via Resend if wired
    if (snap.ownerEmail) {
      notifyOwner(snap.ownerEmail, snap.name || 'Your proposal', { name, email, phone }).catch(() => {})
    }
    return NextResponse.json({ ok: true, acceptedAt: snap.acceptedAt })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}

async function notifyOwner(
  to: string,
  proposalName: string,
  acceptor: { name?: string; email?: string; phone?: string }
) {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return
  const who = [acceptor.name, acceptor.email, acceptor.phone].filter(Boolean).join(' · ')
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Webstew <noreply@webstew.net>',
      to,
      subject: `✅ Proposal accepted — ${proposalName}`,
      html: `<p><strong>${who || 'A client'}</strong> accepted your proposal <strong>${proposalName}</strong>.</p><p>Log in to Webstew to view details.</p>`,
    }),
  })
}
