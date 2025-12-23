import { ClaudeAgent } from './agents/claude'
import { GeminiAgent } from './agents/gemini'
import { OpenAIAgent } from './agents/openai'
import type { AIAgent, TaskType, RouterDecision, AgentCapabilities } from './types'

const AGENT_CAPABILITIES: AgentCapabilities = {
  claude: {
    strengths: [
      'complex-code-generation',
      'code-review',
      'architecture-design',
      'detailed-explanations',
      'typescript',
      'react',
      'next.js',
    ],
    contextWindow: 200000,
    costPer1kTokens: { input: 0.003, output: 0.015 },
  },
  gemini: {
    strengths: [
      'long-context-analysis',
      'multi-file-operations',
      'fast-generation',
      'cost-effective',
      'template-processing',
    ],
    contextWindow: 1000000,
    costPer1kTokens: { input: 0.00035, output: 0.00105 },
  },
  openai: {
    strengths: [
      'conversational-chat',
      'tour-guide',
      'user-interaction',
      'general-purpose',
      'function-calling',
      'json-mode',
    ],
    contextWindow: 128000,
    costPer1kTokens: { input: 0.005, output: 0.015 },
  },
}

export class AIAgentRouter {
  private agents: {
    claude: ClaudeAgent
    gemini: GeminiAgent
    openai: OpenAIAgent
  }

  constructor() {
    this.agents = {
      claude: new ClaudeAgent(),
      gemini: new GeminiAgent(),
      openai: new OpenAIAgent(),
    }
  }

  /**
   * Route task to the most appropriate AI agent
   */
  async route(task: {
    type: TaskType
    prompt: string
    context?: string
    projectType?: string
    preferredAgent?: 'claude' | 'gemini' | 'openai'
    budgetSensitive?: boolean
  }): Promise<RouterDecision> {
    // If user has explicit preference, honor it
    if (task.preferredAgent) {
      return {
        agent: task.preferredAgent,
        reasoning: 'User preference',
        confidence: 1.0,
      }
    }

    // Calculate context size (rough token estimate)
    const contextSize =
      (task.prompt.length + (task.context?.length || 0)) / 4

    // Decision logic based on task type
    switch (task.type) {
      case 'code-generation':
        // Claude excels at complex code generation
        if (contextSize > 100000) {
          // Gemini for very large contexts
          return {
            agent: 'gemini',
            reasoning: 'Large context window needed for multi-file generation',
            confidence: 0.9,
          }
        }
        return {
          agent: 'claude',
          reasoning: 'Superior code generation quality for TypeScript/React',
          confidence: 0.95,
        }

      case 'refactoring':
      case 'debugging':
        return {
          agent: 'claude',
          reasoning: 'Best at understanding and fixing code issues',
          confidence: 0.9,
        }

      case 'chat':
        // OpenAI for conversational interactions (tour guide)
        return {
          agent: 'openai',
          reasoning: 'Optimized for natural conversational flow',
          confidence: 0.9,
        }

      case 'template-customization':
        // Gemini for cost-effective bulk operations
        if (task.budgetSensitive) {
          return {
            agent: 'gemini',
            reasoning: 'Cost-effective for template processing',
            confidence: 0.85,
          }
        }
        return {
          agent: 'claude',
          reasoning: 'Higher quality template customization',
          confidence: 0.85,
        }

      case 'analysis':
        if (contextSize > 50000) {
          return {
            agent: 'gemini',
            reasoning: 'Large context analysis capability',
            confidence: 0.9,
          }
        }
        return {
          agent: 'claude',
          reasoning: 'Detailed analysis and insights',
          confidence: 0.85,
        }

      case 'documentation':
        return {
          agent: 'claude',
          reasoning: 'Clear and comprehensive documentation generation',
          confidence: 0.9,
        }

      default:
        return {
          agent: 'claude',
          reasoning: 'Default to Claude for general tasks',
          confidence: 0.7,
        }
    }
  }

  /**
   * Get the agent instance
   */
  getAgent(agentName: 'claude' | 'gemini' | 'openai'): AIAgent {
    return this.agents[agentName]
  }

  /**
   * Get agent capabilities
   */
  getCapabilities(agentName: 'claude' | 'gemini' | 'openai') {
    return AGENT_CAPABILITIES[agentName]
  }

  /**
   * Execute task with the appropriate agent
   */
  async execute(task: {
    type: TaskType
    prompt: string
    context?: string
    projectType?: string
    preferredAgent?: 'claude' | 'gemini' | 'openai'
    stream?: boolean
  }): Promise<{
    decision: RouterDecision
    result: Promise<string> | AsyncGenerator<string>
  }> {
    const decision = await this.route(task)
    const agent = this.getAgent(decision.agent)

    return {
      decision,
      result: task.stream
        ? agent.streamGenerate(task.prompt, task.context)
        : agent.generate(task.prompt, task.context).then((r) => r.content),
    }
  }

  /**
   * Execute chat with the appropriate agent
   */
  async executeChat(options: {
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
    preferredAgent?: 'claude' | 'gemini' | 'openai'
    stream?: boolean
  }): Promise<{
    agent: 'claude' | 'gemini' | 'openai'
    result: Promise<string> | AsyncGenerator<string>
  }> {
    // For chat, default to OpenAI (tour guide)
    const agentName = options.preferredAgent || 'openai'
    const agent = this.getAgent(agentName)

    return {
      agent: agentName,
      result: options.stream
        ? agent.streamChat(options.messages)
        : agent.chat(options.messages),
    }
  }
}
