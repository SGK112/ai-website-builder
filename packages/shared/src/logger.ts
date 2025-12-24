import pino, { Logger, LoggerOptions } from 'pino'

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test'

// Logger configuration
const loggerOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  base: {
    env: process.env.NODE_ENV,
    service: 'ai-website-builder',
  },
  // Redact sensitive information
  redact: {
    paths: [
      'password',
      'token',
      'apiKey',
      'api_key',
      'secret',
      'authorization',
      'cookie',
      '*.password',
      '*.token',
      '*.apiKey',
      '*.secret',
    ],
    censor: '[REDACTED]',
  },
  // Pretty print in development
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  // Disable logging in tests unless explicitly enabled
  enabled: !isTest || process.env.LOG_ENABLED === 'true',
}

// Create the base logger
export const logger: Logger = pino(loggerOptions)

// Type definitions for structured logging
export interface RequestLogContext {
  method: string
  url: string
  userId?: string
  duration?: number
  statusCode?: number
  userAgent?: string
  ip?: string
}

export interface AIGenerationLogContext {
  agent: 'claude' | 'gemini' | 'openai'
  model?: string
  tokensIn?: number
  tokensOut?: number
  duration: number
  success: boolean
  error?: string
  projectId?: string
  taskType?: string
}

export interface DeploymentLogContext {
  projectId: string
  userId?: string
  provider: 'github' | 'render'
  status: 'started' | 'in_progress' | 'success' | 'failed'
  duration?: number
  error?: string
  url?: string
  repoUrl?: string
}

export interface ProjectLogContext {
  projectId: string
  userId?: string
  action: 'created' | 'updated' | 'deleted' | 'generated' | 'deployed'
  projectType?: string
  filesCount?: number
}

export interface AuthLogContext {
  userId?: string
  email?: string
  action: 'login' | 'logout' | 'signup' | 'password_reset' | 'token_refresh'
  provider?: 'credentials' | 'google' | 'github'
  success: boolean
  error?: string
  ip?: string
}

// Specialized logging functions
export const logRequest = (context: RequestLogContext) => {
  const { method, url, statusCode, duration } = context
  const level = statusCode && statusCode >= 400 ? 'warn' : 'info'

  logger[level]({
    type: 'http_request',
    ...context,
  }, `${method} ${url} ${statusCode || ''} ${duration ? `${duration}ms` : ''}`.trim())
}

export const logAIGeneration = (context: AIGenerationLogContext) => {
  const level = context.success ? 'info' : 'error'

  logger[level]({
    type: 'ai_generation',
    ...context,
  }, `AI ${context.agent}: ${context.success ? 'success' : 'failed'} (${context.duration}ms)`)
}

export const logDeployment = (context: DeploymentLogContext) => {
  const level = context.status === 'failed' ? 'error' : 'info'

  logger[level]({
    type: 'deployment',
    ...context,
  }, `Deployment ${context.provider}: ${context.status}${context.url ? ` - ${context.url}` : ''}`)
}

export const logProject = (context: ProjectLogContext) => {
  logger.info({
    type: 'project',
    ...context,
  }, `Project ${context.action}: ${context.projectId}`)
}

export const logAuth = (context: AuthLogContext) => {
  const level = context.success ? 'info' : 'warn'

  logger[level]({
    type: 'auth',
    ...context,
  }, `Auth ${context.action}: ${context.success ? 'success' : 'failed'}${context.provider ? ` (${context.provider})` : ''}`)
}

export const logError = (error: Error, context?: Record<string, unknown>) => {
  logger.error({
    type: 'error',
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    ...context,
  }, `Error: ${error.message}`)
}

// Create child loggers for specific modules
export const createModuleLogger = (moduleName: string): Logger => {
  return logger.child({ module: moduleName })
}

// API route helper - creates request-scoped logger
export const createRequestLogger = (requestId: string): Logger => {
  return logger.child({ requestId })
}

export default logger
