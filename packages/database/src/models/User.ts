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
  plan: 'free' | 'pro' | 'enterprise'
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
      required: true,
      trim: true,
    },
    avatar: String,
    googleId: { type: String, sparse: true, unique: true },
    githubId: { type: String, sparse: true, unique: true },
    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
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
