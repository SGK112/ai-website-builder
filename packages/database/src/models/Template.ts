import mongoose, { Schema, Document } from 'mongoose'

export interface ITemplate extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  description: string
  type: 'business-portfolio' | 'ecommerce' | 'saas'
  category: string
  thumbnail: string
  screenshots: string[]
  demoUrl?: string
  baseFiles: Array<{
    path: string
    content: string
    isRequired: boolean
    variables: string[]
  }>
  configurableOptions: Array<{
    key: string
    label: string
    type: 'text' | 'color' | 'select' | 'boolean' | 'array'
    options?: string[]
    default?: any
    required: boolean
  }>
  dependencies: {
    npm: Record<string, string>
    devDependencies: Record<string, string>
  }
  techStack: string[]
  isPremium: boolean
  price?: number
  usageCount: number
  rating: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const templateSchema = new Schema<ITemplate>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    type: {
      type: String,
      enum: ['business-portfolio', 'ecommerce', 'saas'],
      required: true,
    },
    category: { type: String, required: true },
    thumbnail: { type: String, required: true },
    screenshots: [String],
    demoUrl: String,
    baseFiles: [
      {
        path: { type: String, required: true },
        content: { type: String, required: true },
        isRequired: { type: Boolean, default: true },
        variables: [String],
      },
    ],
    configurableOptions: [
      {
        key: { type: String, required: true },
        label: { type: String, required: true },
        type: {
          type: String,
          enum: ['text', 'color', 'select', 'boolean', 'array'],
          required: true,
        },
        options: [String],
        default: Schema.Types.Mixed,
        required: { type: Boolean, default: false },
      },
    ],
    dependencies: {
      npm: { type: Map, of: String, default: {} },
      devDependencies: { type: Map, of: String, default: {} },
    },
    techStack: [String],
    isPremium: { type: Boolean, default: false },
    price: Number,
    usageCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
)

templateSchema.index({ type: 1, isActive: 1 })
templateSchema.index({ category: 1 })
templateSchema.index({ usageCount: -1 })

export const Template = mongoose.models.Template || mongoose.model<ITemplate>('Template', templateSchema)
