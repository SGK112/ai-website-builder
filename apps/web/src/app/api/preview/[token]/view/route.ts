import { NextRequest, NextResponse } from 'next/server'
import { incrementViewCount } from '@/lib/preview-store'

export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest, { params }: { params: { token: string } }) {
  try {
    await incrementViewCount(params.token)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
