import mongoose, { Schema, Document } from 'mongoose'

export type CredentialType =
  | 'stripe'
  | 'mongodb'
  | 'github'
  | 'render'
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'sendgrid'
  | 'twilio'
  | 'cloudinary'
  | 'custom'

export interface ICredential extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  name: string
  type: CredentialType
  provider: string
  credentials: Record<string, string>
  description?: string
  isValid: boolean
  lastValidatedAt?: Date
  projectIds: mongoose.Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

const credentialSchema = new Schema<ICredential>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'stripe',
        'mongodb',
        'github',
        'render',
        'openai',
        'anthropic',
        'google',
        'sendgrid',
        'twilio',
        'cloudinary',
        'custom',
      ],
      required: true,
    },
    provider: { type: String, required: true },
    credentials: {
      type: Map,
      of: String,
      required: true,
      select: false,
    },
    description: String,
    isValid: { type: Boolean, default: false },
    lastValidatedAt: Date,
    projectIds: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
  },
  {
    timestamps: true,
  }
)

credentialSchema.index({ userId: 1, type: 1 })
credentialSchema.index({ userId: 1, name: 1 }, { unique: true })

export const Credential = mongoose.models.Credential || mongoose.model<ICredential>('Credential', credentialSchema)
