import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AIAgentRouter, SYSTEM_PROMPTS } from '@ai-website-builder/ai-agents'
import { connectDB } from '@/lib/db'

// Initialize the AI router
const router = new AIAgentRouter()

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { message, sessionId, projectId, wizardStep, preferredAgent } =
      await req.json()

    if (!message || typeof message !== 'string') {
      return new Response('Message is required', { status: 400 })
    }

    await connectDB()

    // Build messages array for AI
    const messages = [
      {
        role: 'system' as const,
        content: SYSTEM_PROMPTS.tourGuide,
      },
      {
        role: 'user' as const,
        content: message,
      },
    ]

    // Get streaming response from the appropriate agent
    const { agent, result } = await router.executeChat({
      messages,
      preferredAgent: preferredAgent || 'openai',
      stream: true,
    })

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = result as AsyncGenerator<string>
          let fullResponse = ''

          for await (const chunk of generator) {
            fullResponse += chunk
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ content: chunk, agent })}\n\n`
              )
            )
          }

          // Send completion signal
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                done: true,
                agent,
                sessionId: sessionId || 'new',
              })}\n\n`
            )
          )
          controller.close()
        } catch (error) {
          console.error('Stream error:', error)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error: 'An error occurred during generation',
              })}\n\n`
            )
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
