import mongoose, { Schema, Document } from 'mongoose'

export interface IUsage {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  type: 'generation' | 'image' | 'chat' | 'deploy' | 'api'
  provider: 'openai' | 'anthropic' | 'huggingface' | 'together' | 'cloudflare' | 'runpod' | 'pixabay' | 'render' | 'github'
  aiModel?: string
  tokensUsed?: number
  creditsUsed: number
  prompt?: string
  metadata?: {
    projectId?: string
    responseLength?: number
    duration?: number
    success?: boolean
    errorMessage?: string
  }
  createdAt: Date
}

// Input type for trackUsage function
export interface UsageInput {
  type: IUsage['type']
  provider: IUsage['provider']
  model?: string
  tokensUsed?: number
  creditsUsed: number
  prompt?: string
  metadata?: IUsage['metadata']
}

export interface IUsageSummary {
  userId: mongoose.Types.ObjectId
  period: 'daily' | 'monthly'
  date: Date // Start of day/month
  totalGenerations: number
  totalImages: number
  totalChats: number
  totalDeploys: number
  totalTokens: number
  totalCredits: number
  byProvider: {
    provider: string
    count: number
    tokens: number
    credits: number
  }[]
}

const usageSchema = new Schema<IUsage>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['generation', 'image', 'chat', 'deploy', 'api'],
      required: true,
    },
    provider: {
      type: String,
      enum: ['openai', 'anthropic', 'huggingface', 'together', 'cloudflare', 'runpod', 'pixabay', 'render', 'github'],
      required: true,
    },
    aiModel: String,
    tokensUsed: { type: Number, default: 0 },
    creditsUsed: { type: Number, required: true },
    prompt: String, // Store first 500 chars for debugging
    metadata: {
      projectId: String,
      responseLength: Number,
      duration: Number,
      success: { type: Boolean, default: true },
      errorMessage: String,
    },
  },
  {
    timestamps: true,
  }
)

// Compound index for efficient querying
usageSchema.index({ userId: 1, createdAt: -1 })
usageSchema.index({ userId: 1, type: 1, createdAt: -1 })

const usageSummarySchema = new Schema<IUsageSummary>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    period: {
      type: String,
      enum: ['daily', 'monthly'],
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    totalGenerations: { type: Number, default: 0 },
    totalImages: { type: Number, default: 0 },
    totalChats: { type: Number, default: 0 },
    totalDeploys: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    totalCredits: { type: Number, default: 0 },
    byProvider: [{
      provider: String,
      count: { type: Number, default: 0 },
      tokens: { type: Number, default: 0 },
      credits: { type: Number, default: 0 },
    }],
  },
  {
    timestamps: true,
  }
)

// Compound index for efficient summary lookup
usageSummarySchema.index({ userId: 1, period: 1, date: 1 }, { unique: true })

export const Usage = mongoose.models.Usage || mongoose.model<IUsage>('Usage', usageSchema)
export const UsageSummary = mongoose.models.UsageSummary || mongoose.model<IUsageSummary>('UsageSummary', usageSummarySchema)

// Helper functions
export async function trackUsage(
  userId: string | mongoose.Types.ObjectId,
  data: UsageInput
): Promise<IUsage> {
  const usage = await Usage.create({
    userId: typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId,
    type: data.type,
    provider: data.provider,
    aiModel: data.model, // Map model to aiModel for storage
    tokensUsed: data.tokensUsed,
    creditsUsed: data.creditsUsed,
    prompt: data.prompt,
    metadata: data.metadata,
  })
  return usage
}

export async function getUserUsageToday(userId: string | mongoose.Types.ObjectId): Promise<{
  generations: number
  images: number
  tokens: number
  credits: number
}> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const result = await Usage.aggregate([
    {
      $match: {
        userId: typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId,
        createdAt: { $gte: startOfDay },
      },
    },
    {
      $group: {
        _id: null,
        generations: { $sum: { $cond: [{ $eq: ['$type', 'generation'] }, 1, 0] } },
        images: { $sum: { $cond: [{ $eq: ['$type', 'image'] }, 1, 0] } },
        tokens: { $sum: '$tokensUsed' },
        credits: { $sum: '$creditsUsed' },
      },
    },
  ])

  return result[0] || { generations: 0, images: 0, tokens: 0, credits: 0 }
}

export async function getUserUsageThisMonth(userId: string | mongoose.Types.ObjectId): Promise<{
  generations: number
  images: number
  tokens: number
  credits: number
}> {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const result = await Usage.aggregate([
    {
      $match: {
        userId: typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId,
        createdAt: { $gte: startOfMonth },
      },
    },
    {
      $group: {
        _id: null,
        generations: { $sum: { $cond: [{ $eq: ['$type', 'generation'] }, 1, 0] } },
        images: { $sum: { $cond: [{ $eq: ['$type', 'image'] }, 1, 0] } },
        tokens: { $sum: '$tokensUsed' },
        credits: { $sum: '$creditsUsed' },
      },
    },
  ])

  return result[0] || { generations: 0, images: 0, tokens: 0, credits: 0 }
}

// Admin emails with unlimited access
export const ADMIN_EMAILS = [
  'joshb@surprisegranite.com',
]

// Check if email is an admin
export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

export type UserPlan = 'free' | 'starter' | 'pro' | 'scale' | 'enterprise'

// Plan limits
export const PLAN_LIMITS: Record<UserPlan, {
  dailyGenerations: number
  dailyImages: number
  monthlyCredits: number
  models: string[]
  maxTokensPerRequest: number
}> = {
  free: {
    dailyGenerations: 5,
    dailyImages: 10,
    monthlyCredits: 100,
    models: ['llama-3.2-3b', 'mistral-7b', 'gpt-3.5-turbo'],
    maxTokensPerRequest: 4000,
  },
  starter: {
    dailyGenerations: 20,
    dailyImages: 40,
    monthlyCredits: 200,
    models: ['gpt-4o', 'gpt-4-turbo', 'claude-3.5-sonnet', 'claude-3-haiku', 'llama-3.2-3b', 'mistral-7b', 'gpt-3.5-turbo'],
    maxTokensPerRequest: 8000,
  },
  pro: {
    dailyGenerations: 50,
    dailyImages: 100,
    monthlyCredits: 500,
    models: ['gpt-4', 'gpt-4o', 'gpt-4-turbo', 'claude-3.5-sonnet', 'claude-3-haiku', 'llama-3.2-3b', 'mistral-7b'],
    maxTokensPerRequest: 16000,
  },
  scale: {
    dailyGenerations: 200,
    dailyImages: 500,
    monthlyCredits: 2000,
    models: ['gpt-4', 'gpt-4o', 'gpt-4-turbo', 'claude-3-opus', 'claude-3.5-sonnet', 'claude-3-sonnet', 'claude-3-haiku', 'llama-3.2-3b', 'mistral-7b'],
    maxTokensPerRequest: 24000,
  },
  enterprise: {
    dailyGenerations: -1, // unlimited
    dailyImages: -1,
    monthlyCredits: -1,
    models: ['gpt-4', 'gpt-4o', 'gpt-4-turbo', 'claude-3-opus', 'claude-3.5-sonnet', 'claude-3-sonnet', 'claude-3-haiku', 'llama-3.2-3b', 'mistral-7b'],
    maxTokensPerRequest: 32000,
  },
}

export async function checkUsageLimits(
  userId: string | mongoose.Types.ObjectId,
  plan: UserPlan,
  type: 'generation' | 'image',
  userEmail?: string
): Promise<{ allowed: boolean; reason?: string; remaining?: number | string }> {
  // Admin emails get unlimited access
  if (userEmail && isAdminEmail(userEmail)) {
    return { allowed: true, remaining: 'unlimited' }
  }

  const limits = PLAN_LIMITS[plan]
  const todayUsage = await getUserUsageToday(userId)

  if (type === 'generation') {
    if (limits.dailyGenerations === -1) {
      return { allowed: true }
    }
    if (todayUsage.generations >= limits.dailyGenerations) {
      return {
        allowed: false,
        reason: `Daily generation limit reached (${limits.dailyGenerations}/day). Upgrade to Pro for more.`,
        remaining: 0,
      }
    }
    return { allowed: true, remaining: limits.dailyGenerations - todayUsage.generations }
  }

  if (type === 'image') {
    if (limits.dailyImages === -1) {
      return { allowed: true }
    }
    if (todayUsage.images >= limits.dailyImages) {
      return {
        allowed: false,
        reason: `Daily image limit reached (${limits.dailyImages}/day). Upgrade to Pro for more.`,
        remaining: 0,
      }
    }
    return { allowed: true, remaining: limits.dailyImages - todayUsage.images }
  }

  return { allowed: true }
}
