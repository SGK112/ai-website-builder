import { z } from 'zod'

/**
 * Zod Schemas for AI Website Builder
 * Centralized validation schemas for all data types
 */

// ============================================
// Primitive Validators
// ============================================

export const emailSchema = z
  .string()
  .email('Invalid email address')
  .min(5, 'Email is too short')
  .max(255, 'Email is too long')
  .toLowerCase()
  .trim()

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  )

export const simplePasswordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(128, 'Password is too long')

export const urlSchema = z
  .string()
  .url('Invalid URL')
  .max(2048, 'URL is too long')

export const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color (use format #RRGGBB)')

export const slugSchema = z
  .string()
  .min(2, 'Slug is too short')
  .max(100, 'Slug is too long')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug can only contain lowercase letters, numbers, and hyphens')

// ============================================
// User Schemas
// ============================================

export const signupSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .trim(),
  email: emailSchema,
  password: passwordSchema,
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .trim()
    .optional(),
  email: emailSchema.optional(),
  avatar: urlSchema.optional(),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    notifications: z.boolean().optional(),
    aiAgent: z.enum(['claude', 'gemini', 'openai', 'auto']).optional(),
  }).optional(),
})

export const passwordResetRequestSchema = z.object({
  email: emailSchema,
})

export const passwordResetSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

// ============================================
// Project Schemas
// ============================================

export const projectTypeSchema = z.enum([
  'business-portfolio',
  'ecommerce',
  'saas',
])

export const projectStatusSchema = z.enum([
  'draft',
  'generating',
  'ready',
  'deployed',
  'failed',
  'deleted',
])

export const colorSchemeSchema = z.object({
  primary: hexColorSchema.default('#3b82f6'),
  secondary: hexColorSchema.default('#64748b'),
  accent: hexColorSchema.default('#f59e0b'),
  background: hexColorSchema.default('#ffffff'),
  foreground: hexColorSchema.default('#0f172a'),
})

export const businessConfigSchema = z.object({
  name: z.string().min(1).max(100),
  industry: z.string().max(100).optional(),
  tagline: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  phone: z.string().max(20).optional(),
  email: emailSchema.optional(),
  address: z.string().max(500).optional(),
  socialLinks: z.object({
    facebook: urlSchema.optional(),
    twitter: urlSchema.optional(),
    instagram: urlSchema.optional(),
    linkedin: urlSchema.optional(),
  }).optional(),
})

export const ecommerceConfigSchema = z.object({
  currency: z.string().length(3).default('USD'),
  paymentGateways: z.array(z.enum(['stripe', 'paypal', 'square'])).default(['stripe']),
  shippingEnabled: z.boolean().default(true),
  taxEnabled: z.boolean().default(true),
  inventoryTracking: z.boolean().default(true),
})

export const saasConfigSchema = z.object({
  features: z.array(z.string().max(100)).max(20).default([]),
  pricingTiers: z.array(z.object({
    name: z.string().max(50),
    price: z.number().min(0),
    interval: z.enum(['month', 'year']),
    features: z.array(z.string().max(100)).max(10),
  })).max(5).optional(),
  authMethods: z.array(z.enum(['email', 'google', 'github', 'magic-link'])).default(['email']),
})

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(3, 'Project name must be at least 3 characters')
    .max(50, 'Project name must be under 50 characters')
    .regex(
      /^[a-zA-Z0-9-_\s]+$/,
      'Project name can only contain letters, numbers, hyphens, underscores, and spaces'
    )
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be under 500 characters')
    .optional(),
  type: projectTypeSchema,
  colors: colorSchemeSchema.optional(),
  businessConfig: businessConfigSchema.optional(),
  ecommerceConfig: ecommerceConfigSchema.optional(),
  saasConfig: saasConfigSchema.optional(),
  aiAgent: z.enum(['claude', 'gemini', 'openai', 'auto']).default('auto'),
})

export const updateProjectSchema = createProjectSchema.partial().extend({
  id: z.string().min(1, 'Project ID is required'),
})

// ============================================
// File Schemas
// ============================================

export const filePathSchema = z
  .string()
  .min(1, 'File path is required')
  .max(500, 'File path is too long')
  .refine(
    (path) => !path.includes('..'),
    'File path cannot contain parent directory references (..)'
  )
  .refine(
    (path) => !path.startsWith('/'),
    'File path must be relative'
  )

export const projectFileSchema = z.object({
  path: filePathSchema,
  content: z.string().max(1000000, 'File content is too large (max 1MB)'),
  type: z.enum(['file', 'directory']).default('file'),
})

// ============================================
// AI Generation Schemas
// ============================================

export const aiAgentSchema = z.enum(['claude', 'gemini', 'openai'])

export const generateCodeRequestSchema = z.object({
  prompt: z
    .string()
    .min(10, 'Prompt must be at least 10 characters')
    .max(5000, 'Prompt is too long'),
  projectId: z.string().optional(),
  context: z.object({
    files: z.array(projectFileSchema).max(50).optional(),
    projectType: projectTypeSchema.optional(),
  }).optional(),
  agent: aiAgentSchema.optional(),
  stream: z.boolean().default(false),
})

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(50000),
  timestamp: z.date().optional(),
})

export const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message is required').max(10000),
  projectId: z.string().optional(),
  sessionId: z.string().optional(),
  agent: aiAgentSchema.optional(),
})

// ============================================
// Deployment Schemas
// ============================================

export const deploymentProviderSchema = z.enum(['github', 'render', 'vercel', 'netlify'])

export const deployRequestSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  provider: deploymentProviderSchema.default('render'),
  options: z.object({
    repoName: z.string().regex(/^[a-z0-9-]+$/, 'Repository name can only contain lowercase letters, numbers, and hyphens').optional(),
    private: z.boolean().default(true),
    branch: z.string().default('main'),
    autoDeploy: z.boolean().default(true),
  }).optional(),
})

export const deploymentStatusSchema = z.enum([
  'queued',
  'building',
  'deploying',
  'live',
  'failed',
  'cancelled',
])

// ============================================
// API Key / Credentials Schemas
// ============================================

export const credentialProviderSchema = z.enum([
  'openai',
  'anthropic',
  'google',
  'github',
  'render',
  'stripe',
  'sendgrid',
])

export const saveCredentialSchema = z.object({
  provider: credentialProviderSchema,
  value: z.string().min(1, 'API key is required').max(500),
})

// ============================================
// Webhook / Integration Schemas
// ============================================

export const webhookEventSchema = z.enum([
  'project.created',
  'project.updated',
  'project.deleted',
  'deployment.started',
  'deployment.succeeded',
  'deployment.failed',
  'user.signup',
])

export const createWebhookSchema = z.object({
  url: urlSchema,
  events: z.array(webhookEventSchema).min(1, 'At least one event is required'),
  secret: z.string().min(16, 'Secret must be at least 16 characters').optional(),
  active: z.boolean().default(true),
})

// ============================================
// Search / Filter Schemas
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const sortOrderSchema = z.enum(['asc', 'desc'])

export const projectFilterSchema = paginationSchema.extend({
  type: projectTypeSchema.optional(),
  status: projectStatusSchema.optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('updatedAt'),
  sortOrder: sortOrderSchema.default('desc'),
})

// ============================================
// Type Exports
// ============================================

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type ProjectType = z.infer<typeof projectTypeSchema>
export type ProjectStatus = z.infer<typeof projectStatusSchema>
export type ColorScheme = z.infer<typeof colorSchemeSchema>
export type ProjectFile = z.infer<typeof projectFileSchema>
export type AIAgent = z.infer<typeof aiAgentSchema>
export type GenerateCodeRequest = z.infer<typeof generateCodeRequestSchema>
export type ChatMessage = z.infer<typeof chatMessageSchema>
export type ChatRequest = z.infer<typeof chatRequestSchema>
export type DeployRequest = z.infer<typeof deployRequestSchema>
export type DeploymentStatus = z.infer<typeof deploymentStatusSchema>
export type CredentialProvider = z.infer<typeof credentialProviderSchema>
export type SaveCredentialInput = z.infer<typeof saveCredentialSchema>
export type ProjectFilter = z.infer<typeof projectFilterSchema>
export type Pagination = z.infer<typeof paginationSchema>
