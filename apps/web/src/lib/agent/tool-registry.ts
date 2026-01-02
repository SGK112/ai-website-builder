/**
 * Tool Registry - Manages available tools for the agent
 * Tools are the "hands" that let the agent interact with the world
 */

import { Tool, ToolResult, AgentContext } from './types'

class ToolRegistry {
  private tools: Map<string, Tool> = new Map()

  /**
   * Register a tool
   */
  register(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      console.warn(`Tool "${tool.name}" is already registered. Overwriting.`)
    }
    this.tools.set(tool.name, tool)
  }

  /**
   * Get a tool by name
   */
  get(name: string): Tool | undefined {
    return this.tools.get(name)
  }

  /**
   * Get all registered tools
   */
  getAll(): Tool[] {
    return Array.from(this.tools.values())
  }

  /**
   * Get tools by names
   */
  getByNames(names: string[]): Tool[] {
    return names
      .map(name => this.tools.get(name))
      .filter((tool): tool is Tool => tool !== undefined)
  }

  /**
   * Check if a tool exists
   */
  has(name: string): boolean {
    return this.tools.has(name)
  }

  /**
   * Execute a tool with parameters
   */
  async execute(
    name: string,
    params: Record<string, any>,
    context: AgentContext
  ): Promise<ToolResult> {
    const tool = this.tools.get(name)

    if (!tool) {
      return {
        success: false,
        output: null,
        error: `Tool "${name}" not found`,
      }
    }

    try {
      // Validate required parameters
      for (const param of tool.parameters) {
        if (param.required && !(param.name in params)) {
          return {
            success: false,
            output: null,
            error: `Missing required parameter: ${param.name}`,
          }
        }
      }

      // Apply defaults
      const paramsWithDefaults = { ...params }
      for (const param of tool.parameters) {
        if (!(param.name in paramsWithDefaults) && param.default !== undefined) {
          paramsWithDefaults[param.name] = param.default
        }
      }

      // Execute the tool
      const result = await tool.execute(paramsWithDefaults, context)
      return result
    } catch (error: any) {
      console.error(`Tool "${name}" execution error:`, error)
      return {
        success: false,
        output: null,
        error: error.message || 'Unknown error occurred',
      }
    }
  }

  /**
   * Get tool schemas for AI (in OpenAI function calling format)
   */
  getToolSchemas(toolNames?: string[]): any[] {
    const tools = toolNames ? this.getByNames(toolNames) : this.getAll()

    return tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: tool.parameters.reduce((acc, param) => {
            acc[param.name] = {
              type: param.type,
              description: param.description,
              ...(param.enum ? { enum: param.enum } : {}),
            }
            return acc
          }, {} as Record<string, any>),
          required: tool.parameters
            .filter(p => p.required)
            .map(p => p.name),
        },
      },
    }))
  }

  /**
   * Get tool descriptions for system prompt
   */
  getToolDescriptions(toolNames?: string[]): string {
    const tools = toolNames ? this.getByNames(toolNames) : this.getAll()

    return tools.map(tool => {
      const params = tool.parameters
        .map(p => `  - ${p.name} (${p.type}${p.required ? ', required' : ''}): ${p.description}`)
        .join('\n')

      return `## ${tool.name}\n${tool.description}\nParameters:\n${params}`
    }).join('\n\n')
  }
}

// Singleton instance
export const toolRegistry = new ToolRegistry()

// Helper to create a tool
export function createTool(
  name: string,
  description: string,
  parameters: Tool['parameters'],
  execute: Tool['execute']
): Tool {
  return { name, description, parameters, execute }
}
