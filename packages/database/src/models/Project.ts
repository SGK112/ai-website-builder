import mongoose, { Schema, Document } from 'mongoose'

export type ProjectType = 'business-portfolio' | 'ecommerce' | 'saas'
export type ProjectStatus = 'draft' | 'generating' | 'ready' | 'deployed' | 'failed'

export interface IProject extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  name: string
  description: string
  type: ProjectType
  templateId?: mongoose.Types.ObjectId
  config: {
    businessName?: string
    tagline?: string
    industry?: string
    storeName?: string
    currency?: string
    paymentGateways?: string[]
    appName?: string
    features?: string[]
    authMethods?: string[]
    colorScheme?: {
      primary: string
      secondary: string
      accent: string
    }
    typography?: {
      headingFont: string
      bodyFont: string
    }
    pages?: string[]
    integrations?: string[]
  }
  aiAgent: 'claude' | 'gemini' | 'openai'
  generationPrompts: string[]
  generationHistory: Array<{
    timestamp: Date
    agent: string
    prompt: string
    filesGenerated: string[]
  }>
  files: Array<{
    path: string
    content: string
    language: string
    generatedBy: 'claude' | 'gemini' | 'openai' | 'template'
    lastModified: Date
  }>
  status: ProjectStatus
  repositoryUrl?: string
  deploymentId?: mongoose.Types.ObjectId
  liveUrl?: string
  wizardStep: number
  wizardCompleted: boolean
  credentialIds: mongoose.Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

const projectSchema = new Schema<IProject>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    description: String,
    type: {
      type: String,
      enum: ['business-portfolio', 'ecommerce', 'saas'],
      required: true,
    },
    templateId: { type: Schema.Types.ObjectId, ref: 'Template' },
    config: {
      type: Schema.Types.Mixed,
      default: {},
    },
    aiAgent: {
      type: String,
      enum: ['claude', 'gemini', 'openai'],
      default: 'claude',
    },
    generationPrompts: [String],
    generationHistory: [
      {
        timestamp: { type: Date, default: Date.now },
        agent: String,
        prompt: String,
        filesGenerated: [String],
      },
    ],
    files: [
      {
        path: { type: String, required: true },
        content: { type: String, required: true },
        language: String,
        generatedBy: {
          type: String,
          enum: ['claude', 'gemini', 'openai', 'template'],
        },
        lastModified: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'generating', 'ready', 'deployed', 'failed'],
      default: 'draft',
    },
    repositoryUrl: String,
    deploymentId: { type: Schema.Types.ObjectId, ref: 'Deployment' },
    liveUrl: String,
    wizardStep: { type: Number, default: 1 },
    wizardCompleted: { type: Boolean, default: false },
    credentialIds: [{ type: Schema.Types.ObjectId, ref: 'Credential' }],
  },
  {
    timestamps: true,
  }
)

projectSchema.index({ userId: 1, status: 1 })
projectSchema.index({ userId: 1, type: 1 })
projectSchema.index({ createdAt: -1 })

export const Project = mongoose.models.Project || mongoose.model<IProject>('Project', projectSchema)
