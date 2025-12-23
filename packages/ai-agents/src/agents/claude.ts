import Anthropic from '@anthropic-ai/sdk'
import type { AIAgent, GenerationResult, ChatMessage } from '../types'
import { SYSTEM_PROMPTS } from '../prompts/templates'

export class ClaudeAgent implements AIAgent {
  name = 'Claude'
  provider = 'anthropic' as const
  private client: Anthropic
  private model = 'claude-sonnet-4-20250514'

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }

  async generate(prompt: string, context?: string): Promise<GenerationResult> {
    const systemPrompt = context
      ? `${SYSTEM_PROMPTS.codeGeneration}\n\nContext:\n${context}`
      : SYSTEM_PROMPTS.codeGeneration

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    })

    const textContent = response.content.find((c) => c.type === 'text')

    return {
      content: textContent?.type === 'text' ? textContent.text : '',
      tokens: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
        total: response.usage.input_tokens + response.usage.output_tokens,
      },
      model: response.model,
      finishReason: response.stop_reason || 'unknown',
    }
  }

  async *streamGenerate(prompt: string, context?: string): AsyncGenerator<string> {
    const systemPrompt = context
      ? `${SYSTEM_PROMPTS.codeGeneration}\n\nContext:\n${context}`
      : SYSTEM_PROMPTS.codeGeneration

    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    })

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield event.delta.text
      }
    }
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    const systemMessage = messages.find((m) => m.role === 'system')
    const conversationMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: systemMessage?.content,
      messages: conversationMessages,
    })

    const textContent = response.content.find((c) => c.type === 'text')
    return textContent?.type === 'text' ? textContent.text : ''
  }

  async *streamChat(messages: ChatMessage[]): AsyncGenerator<string> {
    const systemMessage = messages.find((m) => m.role === 'system')
    const conversationMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: 4096,
      system: systemMessage?.content,
      messages: conversationMessages,
    })

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield event.delta.text
      }
    }
  }
}
