/**
 * Agent Core - The autonomous execution engine
 * Implements the Plan → Execute → Observe → Iterate loop
 */

import {
  AgentConfig,
  AgentContext,
  AgentMessage,
  AgentTask,
  AgentTaskResult,
  AgentProgressUpdate,
  ExecutionPlan,
  PlanStep,
  Artifact,
  ToolResult,
} from './types'
import { toolRegistry } from './tool-registry'

// Default agent configuration
const DEFAULT_CONFIG: AgentConfig = {
  model: 'claude-3-5-sonnet-20241022',
  provider: 'anthropic',
  maxSteps: 20,
  maxRetries: 3,
  timeout: 300000, // 5 minutes
  tools: ['think', 'search_web', 'read_file', 'write_file', 'generate_code', 'execute_code'],
}

// System prompt for the agent
const AGENT_SYSTEM_PROMPT = `You are StewAgent, an autonomous AI chef that builds amazing websites. You work like a real chef - planning your recipe, gathering ingredients, and cooking up professional websites.

## Your Specialty
You create complete, production-ready HTML websites using Tailwind CSS. Unlike simple generators, you can:
- Research topics before building
- Plan multi-section websites
- Generate and refine code iteratively
- Create multiple page variations

## Your Workflow
1. THINK - Understand what the user wants (use "think" tool)
2. PLAN - Break down the website into sections
3. GENERATE - Use "generate_code" with language="html" to create the complete website
4. DELIVER - Complete with a summary

## IMPORTANT: For ANY website request, your FIRST action after thinking should be:
{
  "thought": "I'll generate a complete HTML website for this request",
  "action": "generate_code",
  "parameters": {
    "description": "[detailed description of the website]",
    "language": "html"
  }
}

## Response Format
ALWAYS respond with valid JSON:
{
  "thought": "Your reasoning",
  "action": "tool_name",
  "parameters": { ... }
}

When done:
{
  "thought": "Summary of the website created",
  "action": "complete",
  "result": "Your website is ready! I created a [description of what was built]"
}

## Available Tools
{TOOL_DESCRIPTIONS}

REMEMBER: You are a CHEF - be enthusiastic, creative, and always deliver delicious websites! Start cooking immediately when given a task.
`

export class Agent {
  private config: AgentConfig
  private context: AgentContext

  constructor(config: Partial<AgentConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.context = this.createContext()
  }

  private createContext(): AgentContext {
    return {
      sessionId: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workingDirectory: '/tmp/agent',
      artifacts: [],
      variables: {},
      messages: [],
      maxSteps: this.config.maxSteps,
      maxTokens: 100000,
      timeout: this.config.timeout,
    }
  }

  /**
   * Execute a task autonomously
   */
  async execute(task: AgentTask): Promise<AgentTaskResult> {
    const startTime = Date.now()
    let tokensUsed = 0
    let creditsUsed = 0

    try {
      // Initialize context
      this.context.messages = []
      this.context.artifacts = task.attachments || []

      // Emit initial progress
      this.emitProgress({
        type: 'thinking',
        message: 'Analyzing task...',
      })

      // Build system prompt with available tools
      const toolDescriptions = toolRegistry.getToolDescriptions(this.config.tools)
      const systemPrompt = (this.config.systemPrompt || AGENT_SYSTEM_PROMPT)
        .replace('{TOOL_DESCRIPTIONS}', toolDescriptions)

      // Add system message
      this.context.messages.push({
        role: 'system',
        content: systemPrompt,
        timestamp: new Date(),
      })

      // Add user task
      this.context.messages.push({
        role: 'user',
        content: task.context
          ? `${task.goal}\n\nContext:\n${task.context}`
          : task.goal,
        timestamp: new Date(),
      })

      // Execute the agent loop
      let stepCount = 0
      let isComplete = false
      let finalResult = ''

      while (stepCount < this.config.maxSteps && !isComplete) {
        stepCount++

        this.emitProgress({
          type: 'thinking',
          message: `Step ${stepCount}: Thinking...`,
          progress: (stepCount / this.config.maxSteps) * 100,
        })

        // Get next action from LLM
        const response = await this.getNextAction()
        tokensUsed += response.tokensUsed || 0

        if (!response.success) {
          throw new Error(response.error || 'Failed to get next action')
        }

        const action = response.action

        // Check if task is complete
        if (action.action === 'complete') {
          isComplete = true
          finalResult = action.result || action.thought
          break
        }

        // Execute the tool
        this.emitProgress({
          type: 'executing',
          message: `Executing: ${action.action}`,
          progress: (stepCount / this.config.maxSteps) * 100,
        })

        const toolResult = await this.executeTool(action.action, action.parameters || {})

        // Add tool result to messages
        this.context.messages.push({
          role: 'tool',
          content: JSON.stringify(toolResult),
          toolName: action.action,
          toolResult,
          timestamp: new Date(),
        })

        // Collect artifacts
        if (toolResult.artifacts) {
          this.context.artifacts.push(...toolResult.artifacts)
          toolResult.artifacts.forEach(artifact => {
            this.context.onArtifact?.(artifact)
          })
        }

        // Observe result
        this.emitProgress({
          type: 'observing',
          message: toolResult.success
            ? `Completed: ${action.action}`
            : `Failed: ${action.action} - ${toolResult.error}`,
          progress: (stepCount / this.config.maxSteps) * 100,
        })

        // Add assistant thought
        this.context.messages.push({
          role: 'assistant',
          content: JSON.stringify(action),
          timestamp: new Date(),
        })
      }

      // Calculate credits (simplified: 1 credit per step + tokens)
      creditsUsed = stepCount + Math.ceil(tokensUsed / 1000)

      this.emitProgress({
        type: 'complete',
        message: 'Task completed',
        progress: 100,
        artifacts: this.context.artifacts,
      })

      return {
        taskId: task.id,
        success: true,
        summary: finalResult,
        artifacts: this.context.artifacts,
        plan: this.context.plan || {
          id: `plan_${task.id}`,
          goal: task.goal,
          steps: [],
          createdAt: new Date(),
          status: 'completed',
          currentStepIndex: stepCount,
        },
        messages: this.context.messages,
        tokensUsed,
        creditsUsed,
        duration: Date.now() - startTime,
      }
    } catch (error: any) {
      this.emitProgress({
        type: 'error',
        message: error.message,
      })

      return {
        taskId: task.id,
        success: false,
        summary: '',
        artifacts: this.context.artifacts,
        plan: this.context.plan || {
          id: `plan_${task.id}`,
          goal: task.goal,
          steps: [],
          createdAt: new Date(),
          status: 'failed',
          currentStepIndex: 0,
        },
        messages: this.context.messages,
        tokensUsed,
        creditsUsed,
        duration: Date.now() - startTime,
        error: error.message,
      }
    }
  }

  /**
   * Get the next action from the LLM
   */
  private async getNextAction(): Promise<{
    success: boolean
    action?: any
    error?: string
    tokensUsed?: number
  }> {
    try {
      // Build messages for the API
      const messages = this.context.messages.map(m => ({
        role: m.role === 'tool' ? 'user' : m.role,
        content: m.role === 'tool'
          ? `Tool "${m.toolName}" result:\n${m.content}`
          : m.content,
      }))

      // Call the appropriate AI provider
      const response = await this.callLLM(messages)

      // Parse the response
      const parsed = this.parseAgentResponse(response.content)

      return {
        success: true,
        action: parsed,
        tokensUsed: response.tokensUsed,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Call the LLM API directly using Anthropic
   */
  private async callLLM(messages: any[]): Promise<{ content: string; tokensUsed: number }> {
    // Import Anthropic dynamically since this runs server-side
    const Anthropic = (await import('@anthropic-ai/sdk')).default

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }

    const client = new Anthropic({ apiKey })

    // Extract system message and convert messages for Anthropic format
    const systemMessage = messages.find(m => m.role === 'system')?.content || ''
    const chatMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: (m.role === 'tool' ? 'user' : m.role) as 'user' | 'assistant',
        content: m.role === 'tool'
          ? `Tool result:\n${m.content}`
          : m.content,
      }))

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemMessage,
      messages: chatMessages,
    })

    const content = response.content
      .filter((block) => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text)
      .join('')

    return {
      content,
      tokensUsed: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
    }
  }

  /**
   * Parse the agent's response into a structured action
   */
  private parseAgentResponse(content: string): any {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0])
      } catch {
        // Fall through to text parsing
      }
    }

    // If no JSON, treat as a completion
    return {
      thought: content,
      action: 'complete',
      result: content,
    }
  }

  /**
   * Execute a tool
   */
  private async executeTool(name: string, params: Record<string, any>): Promise<ToolResult> {
    return toolRegistry.execute(name, params, this.context)
  }

  /**
   * Emit a progress update
   */
  private emitProgress(update: AgentProgressUpdate): void {
    this.context.onProgress?.(update)
  }

  /**
   * Set progress callback
   */
  onProgress(callback: (update: AgentProgressUpdate) => void): void {
    this.context.onProgress = callback
  }

  /**
   * Set artifact callback
   */
  onArtifact(callback: (artifact: Artifact) => void): void {
    this.context.onArtifact = callback
  }

  /**
   * Get current context
   */
  getContext(): AgentContext {
    return this.context
  }
}

// Factory function
export function createAgent(config?: Partial<AgentConfig>): Agent {
  return new Agent(config)
}
