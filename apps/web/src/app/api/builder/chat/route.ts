import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const BUILDER_SYSTEM_PROMPT = `You are Claude, an AI coding assistant integrated into a website builder platform. You help users modify and improve their websites through conversation.

Your capabilities:
1. Modify existing code files based on user requests
2. Explain code and suggest improvements
3. Add new features to their website
4. Fix bugs and issues
5. Improve styling and design

When the user asks for code changes, respond with:
1. A brief explanation of what you'll change
2. The modified code in a structured format

For code changes, use this format:
\`\`\`file:path/to/file.tsx
// The complete updated file content goes here
\`\`\`

Always provide the COMPLETE file content, not just snippets. The user's builder will parse your response and extract file updates.

Be conversational and helpful. If the request is unclear, ask clarifying questions.`

export async function POST(req: NextRequest) {
  try {
    const { message, files, projectName, conversationHistory } = await req.json()

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Anthropic API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const client = new Anthropic({ apiKey })

    // Build context with current project files
    const fileContext = files?.length > 0
      ? `\n\nCurrent Project Files:\n${files.map((f: { path: string; content: string }) =>
        `--- ${f.path} ---\n${f.content}\n`
      ).join('\n')}`
      : ''

    const systemPrompt = `${BUILDER_SYSTEM_PROMPT}

Project: ${projectName || 'Untitled Project'}
${fileContext}`

    // Build conversation messages
    const messages: { role: 'user' | 'assistant'; content: string }[] = []

    // Add conversation history
    if (conversationHistory?.length > 0) {
      for (const msg of conversationHistory) {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })
      }
    }

    // Add current message
    messages.push({ role: 'user', content: message })

    // Create streaming response
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: systemPrompt,
      messages,
    })

    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ content: event.delta.text })}\n\n`
                )
              )
            }
          }

          // Send completion signal
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true })}\n\n`
            )
          )
          controller.close()
        } catch (error) {
          console.error('Stream error:', error)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: 'An error occurred during generation' })}\n\n`
            )
          )
          controller.close()
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Builder chat API error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
