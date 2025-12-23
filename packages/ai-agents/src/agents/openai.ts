import OpenAI from 'openai'
import type { AIAgent, GenerationResult, ChatMessage } from '../types'
import { SYSTEM_PROMPTS } from '../prompts/templates'

export class OpenAIAgent implements AIAgent {
  name = 'OpenAI'
  provider = 'openai' as const
  private client: OpenAI
  private model = 'gpt-4o'

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  async generate(prompt: string, context?: string): Promise<GenerationResult> {
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: context
          ? `${SYSTEM_PROMPTS.codeGeneration}\n\nContext:\n${context}`
          : SYSTEM_PROMPTS.codeGeneration,
      },
      { role: 'user', content: prompt },
    ]

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      max_tokens: 4096,
      temperature: 0.7,
    })

    return {
      content: response.choices[0].message.content || '',
      tokens: {
        input: response.usage?.prompt_tokens || 0,
        output: response.usage?.completion_tokens || 0,
        total: response.usage?.total_tokens || 0,
      },
      model: response.model,
      finishReason: response.choices[0].finish_reason || 'unknown',
    }
  }

  async *streamGenerate(prompt: string, context?: string): AsyncGenerator<string> {
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: context
          ? `${SYSTEM_PROMPTS.codeGeneration}\n\nContext:\n${context}`
          : SYSTEM_PROMPTS.codeGeneration,
      },
      { role: 'user', content: prompt },
    ]

    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages,
      max_tokens: 4096,
      temperature: 0.7,
      stream: true,
    })

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content
      if (content) {
        yield content
      }
    }
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    const openaiMessages: OpenAI.ChatCompletionMessageParam[] = messages.map(
      (m) => ({
        role: m.role,
        content: m.content,
      })
    )

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: openaiMessages,
      max_tokens: 2048,
      temperature: 0.8,
    })

    return response.choices[0].message.content || ''
  }

  async *streamChat(messages: ChatMessage[]): AsyncGenerator<string> {
    const openaiMessages: OpenAI.ChatCompletionMessageParam[] = messages.map(
      (m) => ({
        role: m.role,
        content: m.content,
      })
    )

    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: openaiMessages,
      max_tokens: 2048,
      temperature: 0.8,
      stream: true,
    })

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content
      if (content) {
        yield content
      }
    }
  }
}
