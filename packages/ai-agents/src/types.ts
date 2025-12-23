export interface GenerationResult {
  content: string
  tokens: {
    input: number
    output: number
    total: number
  }
  model: string
  finishReason: string
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AIAgent {
  name: string
  provider: 'anthropic' | 'google' | 'openai'
  generate(prompt: string, context?: string): Promise<GenerationResult>
  streamGenerate(prompt: string, context?: string): AsyncGenerator<string>
  chat(messages: ChatMessage[]): Promise<string>
  streamChat(messages: ChatMessage[]): AsyncGenerator<string>
}

export type TaskType =
  | 'code-generation'
  | 'refactoring'
  | 'debugging'
  | 'documentation'
  | 'chat'
  | 'analysis'
  | 'template-customization'

export interface RouterDecision {
  agent: 'claude' | 'gemini' | 'openai'
  reasoning: string
  confidence: number
}

export interface AgentCapabilities {
  claude: {
    strengths: string[]
    contextWindow: number
    costPer1kTokens: { input: number; output: number }
  }
  gemini: {
    strengths: string[]
    contextWindow: number
    costPer1kTokens: { input: number; output: number }
  }
  openai: {
    strengths: string[]
    contextWindow: number
    costPer1kTokens: { input: number; output: number }
  }
}
