import mongoose, { Schema, Document } from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId
  email: string
  password?: string
  name: string
  avatar?: string
  googleId?: string
  githubId?: string
  plan: 'free' | 'starter' | 'pro' | 'scale' | 'enterprise' | 'custom'
  stripeCustomerId?: string
  subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'trialing'
  credits: number
  defaultAIAgent: 'claude' | 'gemini' | 'openai' | 'auto'
  preferences: {
    theme: 'light' | 'dark' | 'system'
    notifications: boolean
    tourCompleted: boolean
  }
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
  // Tenant marker — see schema below. 'webstew' separates this product
  // from VoiceNow co-tenants in the shared users collection.
  app?: 'webstew' | string
  firstSeenWebstewAt?: Date
  // Marketplace seller fields (Stripe Connect + earnings ledger).
  marketplace_earnings_credits?: number
  stripe_account_id?: string
  stripe_account_created_at?: Date
  seed?: string
  // Public profile fields — rendered on /u/<username>. Optional; defaults
  // to empty so existing accounts don't show "undefined" anywhere.
  bio?: string
  tagline?: string
  matchPassword(enteredPassword: string): Promise<boolean>
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      select: false,
      minlength: 8,
    },
    name: {
      type: String,
      // Not required — OAuth providers don't always populate it (e.g., GitHub
      // accounts without a public name). Falls back to email prefix at read.
      trim: true,
      default: '',
    },
    avatar: String,
    googleId: { type: String, sparse: true, unique: true },
    githubId: { type: String, sparse: true, unique: true },
    plan: {
      type: String,
      // 'custom' kept for legacy user records from pre-tier-migration.
      enum: ['free', 'starter', 'pro', 'scale', 'enterprise', 'custom'],
      default: 'free',
    },
    stripeCustomerId: String,
    subscriptionStatus: {
      type: String,
      enum: ['active', 'canceled', 'past_due', 'trialing'],
      default: 'active',
    },
    credits: { type: Number, default: 100 },
    defaultAIAgent: {
      type: String,
      enum: ['claude', 'gemini', 'openai', 'auto'],
      default: 'auto',
    },
    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system',
      },
      notifications: { type: Boolean, default: true },
      tourCompleted: { type: Boolean, default: false },
    },
    lastLoginAt: Date,
    // Tenant marker. MONGODB_URI's default DB is 'voiceflow-crm' which is
    // shared with the VoiceNow app — both products write to the same
    // `users` collection. This field separates them at query time so the
    // Webstew admin panel doesn't show VoiceNow accounts.
    //   'webstew' — signed up / signed in through Webstew at any point
    //   undefined — legacy or VoiceNow-only user
    app: { type: String, index: true },
    firstSeenWebstewAt: Date,
    // Marketplace earnings ledger (credits). Cashout to Stripe Connect
    // happens via /api/stripe/connect/payout (v2). Field added late;
    // safe to keep in schema so future writes don't get stripped per
    // the doc.save()-strips-unknown-fields rule.
    marketplace_earnings_credits: { type: Number, default: 0 },
    stripe_account_id: String,
    stripe_account_created_at: Date,
    // Admin seed marker for the marketplace demo data.
    seed: String,
    // Public profile fields. Length caps prevent abuse + keep the UI tight.
    bio: { type: String, maxlength: 600, default: '' },
    tagline: { type: String, maxlength: 80, default: '' },
  },
  {
    timestamps: true,
  }
)

// Note: email, googleId, githubId already have indexes via 'unique: true' in schema
// No need for additional schema.index() calls

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next()
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

userSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password)
}

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema)
