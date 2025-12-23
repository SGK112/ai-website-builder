export const PROJECT_TYPES = ['business-portfolio', 'ecommerce', 'saas'] as const

export const PROJECT_STATUSES = [
  'draft',
  'generating',
  'ready',
  'deployed',
  'failed',
] as const

export const AI_AGENTS = ['claude', 'gemini', 'openai'] as const

export const CREDENTIAL_TYPES = [
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
] as const

export const USER_PLANS = ['free', 'pro', 'enterprise'] as const

export const WIZARD_STEPS = [
  { id: 1, key: 'project-type', title: 'Project Type' },
  { id: 2, key: 'template', title: 'Template' },
  { id: 3, key: 'customization', title: 'Customize' },
  { id: 4, key: 'credentials', title: 'Credentials' },
  { id: 5, key: 'generate', title: 'Generate' },
] as const

export const FREE_PLAN_LIMITS = {
  projects: 3,
  deploysPerMonth: 5,
  aiCredits: 100,
}

export const PRO_PLAN_LIMITS = {
  projects: 20,
  deploysPerMonth: 50,
  aiCredits: 1000,
}

export const ENTERPRISE_PLAN_LIMITS = {
  projects: Infinity,
  deploysPerMonth: Infinity,
  aiCredits: Infinity,
}
