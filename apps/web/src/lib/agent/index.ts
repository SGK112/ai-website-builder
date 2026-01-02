/**
 * Agent Module - Autonomous AI Agent System
 *
 * This module provides an autonomous AI agent capable of:
 * - Planning multi-step tasks
 * - Executing tools to interact with the world
 * - Observing results and adapting
 * - Producing artifacts (files, code, images)
 *
 * Inspired by Manus.im's architecture
 */

// Export types
export * from './types'

// Export tool registry
export { toolRegistry, createTool } from './tool-registry'

// Export agent core
export { Agent, createAgent } from './agent-core'

// Export and register built-in tools
import { registerBuiltinTools } from './tools'

// Auto-register built-in tools on import
registerBuiltinTools()

export { registerBuiltinTools }
