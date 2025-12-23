import mongoose, { Schema, Document } from 'mongoose'

export type DeploymentStatus = 'pending' | 'building' | 'live' | 'failed' | 'stopped'

export interface IDeployment extends Document {
  _id: mongoose.Types.ObjectId
  projectId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  platform: 'render'
  serviceId?: string
  serviceName: string
  liveUrl?: string
  dashboardUrl?: string
  repositoryUrl?: string
  github: {
    repoName: string
    repoUrl: string
    branch: string
    lastCommitSha?: string
  }
  environmentVariables: Array<{
    key: string
    value: string
    isSecret: boolean
  }>
  renderYaml: string
  status: DeploymentStatus
  buildLogs: string[]
  lastDeployedAt?: Date
  errorMessage?: string
  retryCount: number
  createdAt: Date
  updatedAt: Date
}

const deploymentSchema = new Schema<IDeployment>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ['render'],
      default: 'render',
    },
    serviceId: String,
    serviceName: { type: String, required: true },
    liveUrl: String,
    dashboardUrl: String,
    repositoryUrl: String,
    github: {
      repoName: { type: String, required: true },
      repoUrl: String,
      branch: { type: String, default: 'main' },
      lastCommitSha: String,
    },
    environmentVariables: [
      {
        key: { type: String, required: true },
        value: { type: String, required: true },
        isSecret: { type: Boolean, default: false },
      },
    ],
    renderYaml: String,
    status: {
      type: String,
      enum: ['pending', 'building', 'live', 'failed', 'stopped'],
      default: 'pending',
    },
    buildLogs: [String],
    lastDeployedAt: Date,
    errorMessage: String,
    retryCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
)

// Note: projectId and userId already have indexes via 'index: true' in schema
deploymentSchema.index({ userId: 1, status: 1 }) // Compound index for status queries
deploymentSchema.index({ serviceId: 1 }, { sparse: true })

export const Deployment = mongoose.models.Deployment || mongoose.model<IDeployment>('Deployment', deploymentSchema)
