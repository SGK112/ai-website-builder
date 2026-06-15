// POST /api/tools/grade
// Body: { url: string } OR { html: string, contextUrl?: string }
// Returns: GraderResult (see src/lib/grader.ts) + { quota: { remaining, limit, scope } }
//
// Auth model — three tiers:
//   • anon:    3 lifetime grades per browser (wsgrader cookie). After that,
//              402 + signupWall flag. No /api/grader/share access.
//   • authed:  GRADER_DAILY_LIMIT grades per UTC day (default 3 — a free
//              taste that resets daily, not 3-lifetime like anon). After
//              that, 429 with retryAfter to next midnight UTC.
//   • bot UA / bad reputation IP: 403 from abuse-guard regardless of session.
//
// Tweak the daily limit with env var GRADER_DAILY_LIMIT.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { gradeWebsite, gradeHtml } from '@/lib/grader'
import { guardAnonAbuse } from '@/lib/abuse-guard'
import { connectDB } from '@/lib/db'
import { isAdminEmail } from '@ai-website-builder/database'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'
export const maxDuration = 25

const MAX_HTML_CHARS = 1_500_000
const ANON_GRADER_COOKIE = 'wsgrader'
const ANON_GRADER_LIMIT = 3

// Daily grader quota by plan. Free is the env-tunable baseline (keeps the old
// GRADER_DAILY_LIMIT lever); each paid tier grades more; Enterprise (and admins)
// are unlimited. Anonymous users get ANON_GRADER_LIMIT lifetime (handled below).
type PlanId = 'free' | 'starter' | 'pro' | 'scale' | 'enterprise'
const FREE_DAILY = parseInt(process.env.GRADER_DAILY_LIMIT || '3', 10) || 3
const GRADER_DAILY_LIMITS: Record<PlanId, number> = {
  free: FREE_DAILY,
  starter: 25,
  pro: 100,
  scale: 500,
  enterprise: Infinity,
}

// Resolve a signed-in user's daily grader limit from their plan. Admins and
// Enterprise subscribers are unlimited. Falls back to free on any lookup miss so
// a DB hiccup never locks a paying user out harder than a free one.
async function resolveDailyLimit(userId: string, email?: string | null): Promise<{ limit: number; plan: PlanId }> {
  if (email && isAdminEmail(email)) return { limit: Infinity, plan: 'enterprise' }
  try {
    const mongoose = await connectDB()
    const db = mongoose.connection.db
    if (db && ObjectId.isValid(userId)) {
      const u = await db.collection('users').findOne({ _id: new ObjectId(userId) }, { projection: { plan: 1 } })
      const raw = String(u?.plan || 'free') as PlanId
      const plan: PlanId = raw in GRADER_DAILY_LIMITS ? raw : 'free'
      return { limit: GRADER_DAILY_LIMITS[plan], plan }
    }
  } catch { /* fall through to free */ }
  return { limit: GRADER_DAILY_LIMITS.free, plan: 'free' }
}

// Per-user, per-UTC-day usage counter. Stored in a tiny standalone
// collection so we don't have to extend the User schema for what's
// effectively an analytics-grade integer.
async function bumpDailyUsage(userId: string, limit: number): Promise<{ ok: true; count: number } | { ok: false; resetAt: Date }> {
  const mongoose = await connectDB()
  const db = mongoose.connection.db
  if (!db) return { ok: true, count: 0 } // fail-open if DB is unreachable — we'd rather grade than 500
  const day = new Date()
  day.setUTCHours(0, 0, 0, 0)
  const dayBucket = day.toISOString().slice(0, 10) // YYYY-MM-DD UTC
  const key = `${userId}:${dayBucket}`
  // Atomic upsert + increment so concurrent calls don't race.
  const r = await db.collection('grader_usage').findOneAndUpdate(
    { key },
    { $inc: { count: 1 }, $setOnInsert: { userId, dayBucket, createdAt: new Date() }, $set: { updatedAt: new Date() } },
    { upsert: true, returnDocument: 'after' }
  )
  // mongodb driver v6 returns the doc directly (no {value} wrapper); `r.value`
  // was always undefined, so count defaulted to 1 and the daily cap never bit.
  const count: number = r?.count ?? 1
  if (count > limit) { // limit === Infinity (enterprise/admin) never trips
    // Decrement back since we tipped over — keeps the counter honest if
    // a different user retries later.
    await db.collection('grader_usage').updateOne({ key }, { $inc: { count: -1 } })
    const resetAt = new Date(day.getTime() + 24 * 60 * 60 * 1000)
    return { ok: false, resetAt }
  }
  return { ok: true, count }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions).catch(() => null)
  const isAuthed = !!session?.user?.id

  // Bot UA / reputation guard regardless of auth — applies to everyone.
  const blocked = await guardAnonAbuse(req, isAuthed ? undefined : { rateLimit: 'anonAi' })
  if (blocked) return blocked

  // Anon: cookie-based lifetime cap. 3 free grades per browser.
  let anonCount = 0
  if (!isAuthed) {
    anonCount = parseInt(req.cookies.get(ANON_GRADER_COOKIE)?.value || '0', 10) || 0
    if (anonCount >= ANON_GRADER_LIMIT) {
      return NextResponse.json(
        {
          error: `You've used your ${ANON_GRADER_LIMIT} free grades. Sign up free for ${FREE_DAILY}/day.`,
          limit: ANON_GRADER_LIMIT,
          used: anonCount,
          signupWall: true,
        },
        { status: 402 }
      )
    }
  }

  // Authed: per-day quota check (atomic increment), tiered by plan.
  let quotaUsed = 0
  let dailyLimit = FREE_DAILY
  let userPlan: PlanId = 'free'
  if (isAuthed) {
    const resolved = await resolveDailyLimit(session!.user!.id!, session!.user!.email)
    dailyLimit = resolved.limit
    userPlan = resolved.plan
    const r = await bumpDailyUsage(session!.user!.id!, dailyLimit)
    if (!r.ok) {
      const secondsToReset = Math.max(60, Math.floor((r.resetAt.getTime() - Date.now()) / 1000))
      return NextResponse.json(
        {
          error: `You've used your ${dailyLimit} grades for today (${userPlan} plan). Resets at ${r.resetAt.toISOString().slice(11, 16)} UTC — upgrade for more.`,
          limit: dailyLimit,
          plan: userPlan,
          retryAfter: secondsToReset,
          quotaExhausted: true,
        },
        { status: 429, headers: { 'Retry-After': String(secondsToReset) } }
      )
    }
    quotaUsed = r.count
  }

  let body: { url?: string; html?: string; contextUrl?: string; siteType?: 'auto' | 'saas' | 'local-business' | 'general' }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }

  // siteType controls which scoring profile applies:
  //  - 'saas'           → skip Yelp/address/service-area penalties, weight GitHub/LinkedIn/security badges
  //  - 'local-business' → original contractor-style rubric
  //  - 'general'        → middle ground, no penalty either way
  //  - 'auto' (default) → detectSiteType() picks one based on HTML signals + schema
  const validTypes = new Set(['auto', 'saas', 'local-business', 'general'])
  const siteType: 'auto' | 'saas' | 'local-business' | 'general' =
    body.siteType && validTypes.has(body.siteType) ? body.siteType : 'auto'

  try {
    let result: any
    if (body.html) {
      if (body.html.length > MAX_HTML_CHARS) {
        return NextResponse.json({ error: 'html too large' }, { status: 400 })
      }
      result = await gradeHtml(body.html, body.contextUrl || 'https://draft.local', siteType)
    } else {
      const url = (body.url || '').trim()
      if (!url) return NextResponse.json({ error: 'url or html required' }, { status: 400 })
      if (url.length > 2048) return NextResponse.json({ error: 'url too long' }, { status: 400 })
      result = await gradeWebsite(url, siteType)
    }

    // Stamp the response with quota info so the widget can show
    // "X grades left today" / "2 of 3 free grades used."
    // Unlimited (enterprise/admin) → limit/remaining of -1 so the widget can
    // render "Unlimited" instead of a number.
    const quota = isAuthed
      ? dailyLimit === Infinity
        ? { remaining: -1, limit: -1, scope: 'daily' as const, plan: userPlan }
        : { remaining: Math.max(0, dailyLimit - quotaUsed), limit: dailyLimit, scope: 'daily' as const, plan: userPlan }
      : { remaining: Math.max(0, ANON_GRADER_LIMIT - (anonCount + 1)), limit: ANON_GRADER_LIMIT, scope: 'anon-lifetime' as const }

    const response = NextResponse.json({ ...result, quota })

    // Bump the anon cookie only on success — botched requests don't count.
    if (!isAuthed) {
      response.cookies.set(ANON_GRADER_COOKIE, String(anonCount + 1), {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year — effectively lifetime per browser
        httpOnly: true,
        sameSite: 'lax',
      })
    }
    return response
  } catch (e: any) {
    const msg = e?.message || String(e)
    console.error('[grader] Failed:', msg)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
