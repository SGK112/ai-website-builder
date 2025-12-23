import mongoose, { Schema, Document } from 'mongoose'

export interface IChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  aiAgent?: 'claude' | 'gemini' | 'openai'
  tokens?: number
  codeBlocks?: Array<{
    language: string
    code: string
    filePath?: string
  }>
  wizardStep?: number
  actionSuggestions?: string[]
}

export interface IChatSession extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  projectId?: mongoose.Types.ObjectId
  title: string
  type: 'project-builder' | 'support' | 'general'
  messages: IChatMessage[]
  systemPrompt: string
  contextSummary?: string
  tourState: {
    currentStep: number
    totalSteps: number
    completedSteps: number[]
    isActive: boolean
  }
  totalTokens: number
  totalCost: number
  isActive: boolean
  lastMessageAt: Date
  createdAt: Date
  updatedAt: Date
}

const chatSessionSchema = new Schema<IChatSession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      index: true,
    },
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ['project-builder', 'support', 'general'],
      default: 'project-builder',
    },
    messages: [
      {
        id: { type: String, required: true },
        role: {
          type: String,
          enum: ['user', 'assistant', 'system'],
          required: true,
        },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        aiAgent: {
          type: String,
          enum: ['claude', 'gemini', 'openai'],
        },
        tokens: Number,
        codeBlocks: [
          {
            language: String,
            code: String,
            filePath: String,
          },
        ],
        wizardStep: Number,
        actionSuggestions: [String],
      },
    ],
    systemPrompt: { type: String, required: true },
    contextSummary: String,
    tourState: {
      currentStep: { type: Number, default: 1 },
      totalSteps: { type: Number, default: 5 },
      completedSteps: [Number],
      isActive: { type: Boolean, default: true },
    },
    totalTokens: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    lastMessageAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
)

// Note: userId and projectId already have indexes via 'index: true' in schema
chatSessionSchema.index({ userId: 1, isActive: 1 }) // Compound index for active session queries
chatSessionSchema.index({ lastMessageAt: -1 })

export const ChatSession = mongoose.models.ChatSession || mongoose.model<IChatSession>('ChatSession', chatSessionSchema)
