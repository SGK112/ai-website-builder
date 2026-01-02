/**
 * Agent Types - Core type definitions for the autonomous agent system
 * Inspired by Manus.im's architecture for autonomous task execution
 */

// Tool parameter definition
export interface ToolParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  description: string
  required?: boolean
  default?: any
  enum?: string[]
}

// Tool definition - what the AI can use
export interface Tool {
  name: string
  description: string
  parameters: ToolParameter[]
  execute: (params: Record<string, any>, context: AgentContext) => Promise<ToolResult>
  // Optional: estimate cost/time
  estimateCost?: (params: Record<string, any>) => { credits: number; timeMs: number }
}

// Result of a tool execution
export interface ToolResult {
  success: boolean
  output: any
  error?: string
  artifacts?: Artifact[]  // Files, images, etc. produced
  metadata?: Record<string, any>
}

// Artifacts produced by tools
export interface Artifact {
  id: string
  type: 'file' | 'image' | 'code' | 'data' | 'url'
  name: string
  content: string | Buffer
  mimeType?: string
  metadata?: Record<string, any>
}

// A single step in the agent's plan
export interface PlanStep {
  id: string
  description: string
  tool: string
  parameters: Record<string, any>
  dependsOn?: string[]  // IDs of steps that must complete first
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  result?: ToolResult
  startedAt?: Date
  completedAt?: Date
}

// The agent's execution plan
export interface ExecutionPlan {
  id: string
  goal: string
  steps: PlanStep[]
  createdAt: Date
  status: 'planning' | 'executing' | 'completed' | 'failed' | 'paused'
  currentStepIndex: number
}

// Message in the agent's thought process
export interface AgentMessage {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  toolName?: string
  toolResult?: ToolResult
  timestamp: Date
}

// Agent context - shared state across tool executions
export interface AgentContext {
  sessionId: string
  userId?: string
  workingDirectory: string
  artifacts: Artifact[]
  variables: Record<string, any>
  messages: AgentMessage[]
  plan?: ExecutionPlan
  // Limits
  maxSteps: number
  maxTokens: number
  timeout: number  // ms
  // Callbacks
  onProgress?: (update: AgentProgressUpdate) => void
  onArtifact?: (artifact: Artifact) => void
}

// Progress update for UI
export interface AgentProgressUpdate {
  type: 'thinking' | 'planning' | 'executing' | 'observing' | 'complete' | 'error' | 'waiting_input'
  message: string
  step?: PlanStep
  progress?: number  // 0-100
  artifacts?: Artifact[]
  question?: string  // For waiting_input type - question to ask user
}

// Agent configuration
export interface AgentConfig {
  model: string
  apiKey?: string
  provider: 'anthropic' | 'openai' | 'huggingface' | 'together'
  maxSteps: number
  maxRetries: number
  timeout: number
  tools: string[]  // Tool names to enable
  systemPrompt?: string
}

// Task request from user
export interface AgentTask {
  id: string
  goal: string
  context?: string
  attachments?: Artifact[]
  config?: Partial<AgentConfig>
  createdAt: Date
}

// Task result
export interface AgentTaskResult {
  taskId: string
  success: boolean
  summary: string
  artifacts: Artifact[]
  plan: ExecutionPlan
  messages: AgentMessage[]
  tokensUsed: number
  creditsUsed: number
  duration: number  // ms
  error?: string
}

// Agent state for persistence
export interface AgentState {
  sessionId: string
  context: AgentContext
  config: AgentConfig
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error'
  createdAt: Date
  updatedAt: Date
}
