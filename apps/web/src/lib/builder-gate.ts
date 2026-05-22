// Shared auth + credit gate for the multi-target builder routes
// (/api/builder/app, /astro, /nextjs, /react). The /generate route has its
// own bespoke gate with anon trial cookies + image-marker pre-fetch — keep
// that one as-is; this helper mirrors the post-auth credit/plan check only.
//
// Why a helper: until now the 4 multi-target routes had ZERO credit checks
// — anyone signed in could burn unmetered Anthropic credits. The website
// route has 13. Parity was overdue.

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User, checkUsageLimits, trackUsage, PLAN_LIMITS, isAdminEmail } from '@ai-website-builder/database'

export type BuilderKind = 'expo' | 'astro' | 'nextjs' | 'react'

export interface BuilderGateOk {
  ok: true
  userId: string
  userEmail: string
  userPlan: 'free' | 'starter' | 'pro' | 'scale' | 'enterprise'
  isAdmin: boolean
  remainingCredits: number | 'unlimited'
}

export interface BuilderGateFail {
  ok: false
  response: NextResponse
}

export type BuilderGateResult = BuilderGateOk | BuilderGateFail

interface UserDoc {
  _id: string
  email?: string
  plan?: 'free' | 'starter' | 'pro' | 'scale' | 'enterprise'
  credits?: number
}

// Check auth + plan + monthly-credit budget for a multi-target generation.
// Returns either a Ok payload (caller proceeds with generation) or a Fail
// payload with a ready-to-return NextResponse (401/402/429 with the right
// shape the workspace client already knows how to handle).
export async function gateBuilderRequest(model?: string): Promise<BuilderGateResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    }
  }

  const userId = session.user.id
  const sessionEmail = session.user.email || ''

  try {
    await connectDB()
    const user = (await User.findById(userId).lean()) as (UserDoc & { emailVerified?: boolean }) | null
    const userEmail = user?.email || sessionEmail
    const isAdmin = userEmail ? isAdminEmail(userEmail) : false
    const userPlan = (isAdmin ? 'enterprise' : (user?.plan || 'free')) as BuilderGateOk['userPlan']

    // Email-verification gate. Each free account is worth ~$8 of Anthropic
    // credits — unverified accounts are the cheapest abuse vector. Block
    // generation until verified. NOTE: only accounts where emailVerified is
    // EXPLICITLY false are blocked — legacy users (field absent) + admins
    // are grandfathered through, so this can't lock out anyone who signed
    // up before the verification flow existed.
    if (user && user.emailVerified === false && !isAdmin) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            error: 'Verify your email to start generating. Check your inbox for the verification link — or resend it from your workspace.',
            needsEmailVerification: true,
          },
          { status: 403 },
        ),
      }
    }

    // Limit check — mirrors /generate's behavior. Admins bypass via isAdmin.
    const limitCheck = await checkUsageLimits(userId, userPlan, 'generation', userEmail)
    if (!limitCheck.allowed) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            error: limitCheck.reason || 'Monthly generation limit reached',
            upgrade: true,
            remaining: 0,
            plan: userPlan,
          },
          { status: 429 },
        ),
      }
    }

    // Premium-model gate (same set as /generate). Free plan can pick Haiku
    // or HuggingFace/Cloudflare; Sonnet/Opus/GPT-4 require paid plan.
    const premiumModels = ['gpt-4', 'gpt-4-turbo', 'gpt-4o', 'claude-3-opus', 'claude-3.5-sonnet', 'claude-3-sonnet', 'claude-sonnet', 'claude-opus']
    const isPremiumModel = premiumModels.some((pm) => (model || '').toLowerCase().includes(pm.toLowerCase()))
    const limits = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free
    if (isPremiumModel && userPlan === 'free' && !isAdmin) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            error: `Model '${model}' requires a Pro plan. Upgrade or pick Haiku.`,
            upgrade: true,
            availableModels: limits.models,
          },
          { status: 403 },
        ),
      }
    }

    return {
      ok: true,
      userId,
      userEmail,
      userPlan,
      isAdmin,
      remainingCredits: typeof limitCheck.remaining === 'number' ? limitCheck.remaining : 'unlimited',
    }
  } catch (e) {
    console.warn('[builder-gate] DB check failed, soft-allow:', e)
    // Soft-allow on DB hiccup — don't block users if Mongo blinks. /generate
    // does the same.
    return {
      ok: true,
      userId,
      userEmail: sessionEmail,
      userPlan: 'free',
      isAdmin: false,
      remainingCredits: 'unlimited',
    }
  }
}

// Anthropic API price per 1M tokens (input, output) by model family.
// Update if Anthropic changes pricing.
const MODEL_PRICING: Record<'opus' | 'sonnet' | 'haiku', { in: number; out: number }> = {
  opus:   { in: 15, out: 75 },
  sonnet: { in: 3,  out: 15 },
  haiku:  { in: 1,  out: 5 },
}

// Raw AI cost (COGS, in USD) that ONE credit is priced to cover. Credits
// retail at ~$0.05–$0.10 in the credit packs, so covering $0.02 of COGS
// per credit leaves gross margin for infra + profit. Tunable WITHOUT a
// deploy via the CREDIT_USD_COGS env var — set it once the cost table is
// reviewed. At 0.02 a typical Haiku build ≈ 2 credits (unchanged), while a
// conversion or an Opus build costs proportionally more (they used to be
// mispriced flat).
const USD_PER_CREDIT = Number(process.env.CREDIT_USD_COGS) || 0.02

function modelFamily(model: string): 'opus' | 'sonnet' | 'haiku' {
  const m = (model || '').toLowerCase()
  if (m.includes('opus')) return 'opus'
  if (m.includes('sonnet')) return 'sonnet'
  return 'haiku'
}

// Credits for a generation, derived from REAL token usage (COGS) — not a
// flat per-model rate. A conversion that burns 70k tokens now costs many
// more credits than a 5k-token fresh build; the old flat rate charged both
// the same and lost money on the big ones.
export function creditsForUsage(model: string, inputTokens: number, outputTokens: number): number {
  const p = MODEL_PRICING[modelFamily(model)]
  const cogs = (inputTokens / 1_000_000) * p.in + (outputTokens / 1_000_000) * p.out
  return Math.max(1, Math.ceil(cogs / USD_PER_CREDIT))
}

// Record a successful multi-target generation, metered on real token usage.
// Fire-and-forget — never block on this. Callers must skip it for BYOK
// builds (the user pays Anthropic directly).
export async function trackBuilderUsage(input: {
  userId: string
  kind: BuilderKind
  model: string
  inputTokens: number
  outputTokens: number
  prompt?: string
}): Promise<void> {
  try {
    await trackUsage(input.userId, {
      type: 'generation',
      provider: 'anthropic',
      model: input.model,
      tokensUsed: input.inputTokens + input.outputTokens,
      creditsUsed: creditsForUsage(input.model, input.inputTokens, input.outputTokens),
      prompt: input.prompt?.slice(0, 500),
      metadata: {
        responseLength: input.outputTokens,
        success: true,
      },
    })
  } catch (e: any) {
    console.warn('[builder-gate] trackUsage failed:', e?.message || e)
  }
}
