import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AIAgent, GenerationResult, ChatMessage } from '../types'
import { SYSTEM_PROMPTS } from '../prompts/templates'

export class GeminiAgent implements AIAgent {
  name = 'Gemini'
  provider = 'google' as const
  private client: GoogleGenerativeAI | null = null
  private modelName = 'gemini-1.5-pro'

  constructor() {
    // Lazy initialization - don't create client in constructor
  }

  private getClient(): GoogleGenerativeAI {
    if (!this.client) {
      if (!process.env.GOOGLE_AI_API_KEY) {
        throw new Error('GOOGLE_AI_API_KEY is not configured. AI generation is disabled.')
      }
      this.client = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
    }
    return this.client
  }

  async generate(prompt: string, context?: string): Promise<GenerationResult> {
    const model = this.getClient().getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.7,
      },
    })

    const fullPrompt = context
      ? `${SYSTEM_PROMPTS.codeGeneration}\n\nContext:\n${context}\n\nTask:\n${prompt}`
      : `${SYSTEM_PROMPTS.codeGeneration}\n\nTask:\n${prompt}`

    const result = await model.generateContent(fullPrompt)
    const response = result.response

    return {
      content: response.text(),
      tokens: {
        input: response.usageMetadata?.promptTokenCount || 0,
        output: response.usageMetadata?.candidatesTokenCount || 0,
        total: response.usageMetadata?.totalTokenCount || 0,
      },
      model: this.modelName,
      finishReason: response.candidates?.[0]?.finishReason || 'unknown',
    }
  }

  async *streamGenerate(prompt: string, context?: string): AsyncGenerator<string> {
    const model = this.getClient().getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.7,
      },
    })

    const fullPrompt = context
      ? `${SYSTEM_PROMPTS.codeGeneration}\n\nContext:\n${context}\n\nTask:\n${prompt}`
      : `${SYSTEM_PROMPTS.codeGeneration}\n\nTask:\n${prompt}`

    const result = await model.generateContentStream(fullPrompt)

    for await (const chunk of result.stream) {
      yield chunk.text()
    }
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    const model = this.getClient().getGenerativeModel({ model: this.modelName })

    const history = messages.slice(0, -1).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : ('user' as const),
      parts: [{ text: msg.content }],
    }))

    const chat = model.startChat({ history })
    const lastMessage = messages[messages.length - 1]
    const result = await chat.sendMessage(lastMessage.content)

    return result.response.text()
  }

  async *streamChat(messages: ChatMessage[]): AsyncGenerator<string> {
    const model = this.getClient().getGenerativeModel({ model: this.modelName })

    const history = messages.slice(0, -1).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : ('user' as const),
      parts: [{ text: msg.content }],
    }))

    const chat = model.startChat({ history })
    const lastMessage = messages[messages.length - 1]
    const result = await chat.sendMessageStream(lastMessage.content)

    for await (const chunk of result.stream) {
      yield chunk.text()
    }
  }
}
