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
    const user = (await User.findById(userId).lean()) as UserDoc | null
    const userEmail = user?.email || sessionEmail
    const isAdmin = userEmail ? isAdminEmail(userEmail) : false
    const userPlan = (isAdmin ? 'enterprise' : (user?.plan || 'free')) as BuilderGateOk['userPlan']

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

// Record a successful multi-target generation. Mirrors /generate's
// trackUsage call. Fire-and-forget — never block on this.
export async function trackBuilderUsage(input: {
  userId: string
  kind: BuilderKind
  model: string
  rawSize: number
  prompt?: string
}): Promise<void> {
  try {
    await trackUsage(input.userId, {
      type: 'generation',
      provider: 'anthropic',
      model: input.model,
      tokensUsed: Math.ceil(input.rawSize / 4),
      creditsUsed: input.model.includes('opus') ? 10 : input.model.includes('sonnet') ? 5 : 2,
      prompt: input.prompt?.slice(0, 500),
      metadata: {
        responseLength: input.rawSize,
        success: true,
      },
    })
  } catch (e: any) {
    console.warn('[builder-gate] trackUsage failed:', e?.message || e)
  }
}
