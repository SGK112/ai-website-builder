/**
 * Agent API - Execute autonomous tasks
 *
 * POST /api/agent - Execute a task
 * GET /api/agent?sessionId=xxx - Get task status
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAgent, AgentTask, AgentConfig, AgentProgressUpdate } from '@/lib/agent'

// Session data type
interface SessionData {
  agent: ReturnType<typeof createAgent>
  status: 'running' | 'completed' | 'error'
  result?: any
  updates: AgentProgressUpdate[]
}

// Store active agent sessions (in production, use Redis)
const activeSessions = new Map<string, SessionData>()

// POST - Execute a new task
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Allow anonymous users with limited capabilities
    const userId = session?.user?.id

    const body = await req.json()
    const { goal, context, config } = body

    if (!goal || typeof goal !== 'string') {
      return NextResponse.json(
        { error: 'Goal is required' },
        { status: 400 }
      )
    }

    // Create task
    const task: AgentTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      goal,
      context,
      createdAt: new Date(),
    }

    // Create agent with config
    const agentConfig: Partial<AgentConfig> = {
      ...config,
      maxSteps: userId ? 20 : 5, // Limit steps for anonymous users
    }

    const agent = createAgent(agentConfig)

    // Store session
    const sessionData: SessionData = {
      agent,
      status: 'running',
      updates: [],
    }
    activeSessions.set(task.id, sessionData)

    // Set up progress tracking
    agent.onProgress((update) => {
      sessionData.updates.push(update)
    })

    // Check if streaming is requested
    const stream = body.stream !== false

    if (stream) {
      // Streaming response
      const encoder = new TextEncoder()

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            // Set up real-time progress streaming
            agent.onProgress((update) => {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'progress', update })}\n\n`)
              )
            })

            // Execute the task
            const result = await agent.execute(task)

            // Send final result
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'complete', result })}\n\n`)
            )

            // Update session
            sessionData.status = result.success ? 'completed' : 'error'
            sessionData.result = result

            controller.close()
          } catch (error: any) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`)
            )
            sessionData.status = 'error'
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

    // Non-streaming: execute and return result
    const result = await agent.execute(task)

    sessionData.status = result.success ? 'completed' : 'error'
    sessionData.result = result

    return NextResponse.json({
      success: true,
      taskId: task.id,
      result,
    })
  } catch (error: any) {
    console.error('Agent API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to execute task' },
      { status: 500 }
    )
  }
}

// GET - Get task status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      // Return list of capabilities
      return NextResponse.json({
        capabilities: [
          'Autonomous task execution',
          'Web search and research',
          'Code generation',
          'Image generation',
          'Data analysis',
          'File creation',
        ],
        maxSteps: 20,
        availableTools: [
          'think',
          'search_web',
          'fetch_url',
          'generate_code',
          'generate_image',
          'read_file',
          'write_file',
          'store_variable',
          'analyze_data',
        ],
      })
    }

    const sessionData = activeSessions.get(sessionId)

    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      sessionId,
      status: sessionData.status,
      updates: sessionData.updates,
      result: sessionData.result,
    })
  } catch (error: any) {
    console.error('Agent GET error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
