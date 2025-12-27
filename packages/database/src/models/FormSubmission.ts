import mongoose, { Schema, Document } from 'mongoose'

export interface IFormSubmission extends Document {
  _id: mongoose.Types.ObjectId
  projectId: mongoose.Types.ObjectId
  formId: string // e.g., 'contact', 'newsletter', 'custom-1'
  data: Record<string, any>
  metadata: {
    ip?: string
    userAgent?: string
    referrer?: string
    page?: string
  }
  status: 'new' | 'read' | 'replied' | 'archived'
  createdAt: Date
  updatedAt: Date
}

const formSubmissionSchema = new Schema<IFormSubmission>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    formId: {
      type: String,
      required: true,
      default: 'contact',
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
    metadata: {
      ip: String,
      userAgent: String,
      referrer: String,
      page: String,
    },
    status: {
      type: String,
      enum: ['new', 'read', 'replied', 'archived'],
      default: 'new',
    },
  },
  {
    timestamps: true,
  }
)

formSubmissionSchema.index({ projectId: 1, createdAt: -1 })
formSubmissionSchema.index({ projectId: 1, status: 1 })

export const FormSubmission = mongoose.models.FormSubmission || mongoose.model<IFormSubmission>('FormSubmission', formSubmissionSchema)
