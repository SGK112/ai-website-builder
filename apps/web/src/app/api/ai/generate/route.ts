import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AIAgentRouter } from '@ai-website-builder/ai-agents'
import { connectDB } from '@/lib/db'

const router = new AIAgentRouter()

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prompt, context, projectType, preferredAgent, stream } =
      await req.json()

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    await connectDB()

    // Execute with the router
    const { decision, result } = await router.execute({
      type: 'code-generation',
      prompt,
      context,
      projectType,
      preferredAgent,
      stream: stream || false,
    })

    if (stream) {
      // Return streaming response
      const encoder = new TextEncoder()
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            const generator = result as AsyncGenerator<string>
            let fullResponse = ''

            for await (const chunk of generator) {
              fullResponse += chunk
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    content: chunk,
                    agent: decision.agent,
                  })}\n\n`
                )
              )
            }

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  done: true,
                  agent: decision.agent,
                  reasoning: decision.reasoning,
                })}\n\n`
              )
            )
            controller.close()
          } catch (error) {
            console.error('Stream error:', error)
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ error: 'Generation failed' })}\n\n`
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
    }

    // Non-streaming response
    const content = await result

    return NextResponse.json({
      success: true,
      content,
      agent: decision.agent,
      reasoning: decision.reasoning,
      confidence: decision.confidence,
    })
  } catch (error) {
    console.error('Generate API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
