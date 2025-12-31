import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import {
  User,
  Usage,
  getUserUsageToday,
  getUserUsageThisMonth,
  checkUsageLimits,
  PLAN_LIMITS
} from '@ai-website-builder/database'

// Define user type for lean queries
interface UserDoc {
  _id: string
  plan?: 'free' | 'pro' | 'enterprise'
  credits?: number
}

// GET /api/usage - Get user's usage stats
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await connectDB()

    const user = await User.findById(session.user.id).lean() as UserDoc | null
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const todayUsage = await getUserUsageToday(session.user.id)
    const monthUsage = await getUserUsageThisMonth(session.user.id)
    const userPlan = user.plan || 'free'
    const limits = PLAN_LIMITS[userPlan]

    // Get recent usage history
    const recentUsage = await Usage.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()

    return NextResponse.json({
      user: {
        plan: userPlan,
        credits: user.credits || 0,
      },
      today: {
        generations: todayUsage.generations,
        images: todayUsage.images,
        tokens: todayUsage.tokens,
        credits: todayUsage.credits,
      },
      month: {
        generations: monthUsage.generations,
        images: monthUsage.images,
        tokens: monthUsage.tokens,
        credits: monthUsage.credits,
      },
      limits: {
        dailyGenerations: limits.dailyGenerations,
        dailyImages: limits.dailyImages,
        monthlyCredits: limits.monthlyCredits,
        availableModels: limits.models,
      },
      remaining: {
        dailyGenerations: limits.dailyGenerations === -1 ? 'unlimited' : Math.max(0, limits.dailyGenerations - todayUsage.generations),
        dailyImages: limits.dailyImages === -1 ? 'unlimited' : Math.max(0, limits.dailyImages - todayUsage.images),
        credits: user.credits || 0,
      },
      history: recentUsage.map((u: any) => ({
        type: u.type,
        provider: u.provider,
        model: u.aiModel,
        credits: u.creditsUsed,
        tokens: u.tokensUsed,
        createdAt: u.createdAt,
      })),
    })
  } catch (error) {
    console.error('GET usage error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage' },
      { status: 500 }
    )
  }
}

// POST /api/usage/check - Check if user can perform an action
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      // Allow anonymous users with strict limits
      return NextResponse.json({
        allowed: true,
        plan: 'free',
        remaining: 3,
        warning: 'Sign in to track your usage and get more generations',
      })
    }

    const { type, model } = await req.json()

    await connectDB()

    const user = await User.findById(session.user.id).lean() as UserDoc | null
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const plan = user.plan || 'free'
    const limits = PLAN_LIMITS[plan]

    // Check if model is allowed for plan
    if (model && !limits.models.includes(model)) {
      return NextResponse.json({
        allowed: false,
        reason: `Model '${model}' requires a higher plan. Available models: ${limits.models.join(', ')}`,
        upgrade: true,
      })
    }

    // Check usage limits
    const limitCheck = await checkUsageLimits(session.user.id, plan, type || 'generation')

    return NextResponse.json({
      allowed: limitCheck.allowed,
      reason: limitCheck.reason,
      remaining: limitCheck.remaining,
      plan,
      credits: user.credits || 0,
    })
  } catch (error) {
    console.error('POST usage check error:', error)
    return NextResponse.json(
      { error: 'Failed to check usage' },
      { status: 500 }
    )
  }
}
