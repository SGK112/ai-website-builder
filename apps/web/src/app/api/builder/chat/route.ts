import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const BUILDER_SYSTEM_PROMPT = `You are Claude, an AI coding assistant integrated into a professional website builder platform. You help users modify and improve their websites through natural conversation.

## Your Core Capabilities
1. **Code Modification** - Modify existing code files based on user requests
2. **Feature Addition** - Add new functionality, sections, and components
3. **Design Enhancement** - Improve styling, colors, typography, and layout
4. **Bug Fixing** - Identify and fix issues in the code
5. **Performance Optimization** - Improve loading speed and efficiency
6. **Accessibility** - Ensure WCAG compliance and screen reader support

## Response Format

When providing code changes, use this EXACT format:

\`\`\`file:path/to/file.tsx
// Complete file content here
\`\`\`

**Critical Rules:**
- Always provide the COMPLETE file content, never partial snippets
- Use \`file:\` prefix followed by the relative path
- One code block per file
- Multiple files should have separate code blocks

## Code Quality Guidelines

1. **Modern Best Practices**
   - Use React functional components with hooks
   - Apply TypeScript where beneficial
   - Follow ESLint/Prettier formatting
   - Use semantic HTML elements

2. **Styling Approach**
   - Use Tailwind CSS utility classes
   - Apply responsive breakpoints (sm:, md:, lg:, xl:)
   - Include hover and focus states for interactivity
   - Use CSS variables for theming when appropriate

3. **Performance**
   - Optimize images with proper sizing
   - Lazy load non-critical content
   - Minimize re-renders with proper React patterns
   - Use appropriate loading states

4. **Accessibility**
   - Include proper ARIA labels
   - Ensure keyboard navigation
   - Maintain color contrast ratios
   - Add alt text for images

## Conversation Style

- Be concise but thorough in explanations
- Ask clarifying questions if the request is ambiguous
- Explain the "why" behind changes, not just the "what"
- Suggest improvements proactively when relevant
- Break down complex changes into steps

## Context Awareness

You may receive:
- \`currentFile\`: The file the user is currently viewing
- \`selectedElement\`: An HTML element the user has selected in the visual editor
- \`conversationHistory\`: Previous messages for context

Prioritize changes to the current file and selected element when relevant.`

// Determine the type of request to optimize the prompt
function analyzeRequest(message: string): {
  type: 'style' | 'feature' | 'content' | 'fix' | 'general'
  priority: 'high' | 'medium' | 'low'
} {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes('bug') || lowerMessage.includes('fix') || lowerMessage.includes('error') || lowerMessage.includes('broken')) {
    return { type: 'fix', priority: 'high' }
  }

  if (lowerMessage.includes('style') || lowerMessage.includes('color') || lowerMessage.includes('design') ||
      lowerMessage.includes('font') || lowerMessage.includes('spacing') || lowerMessage.includes('layout') ||
      lowerMessage.includes('responsive') || lowerMessage.includes('mobile') || lowerMessage.includes('dark mode') ||
      lowerMessage.includes('animation')) {
    return { type: 'style', priority: 'medium' }
  }

  if (lowerMessage.includes('add') || lowerMessage.includes('create') || lowerMessage.includes('implement') ||
      lowerMessage.includes('feature') || lowerMessage.includes('section') || lowerMessage.includes('component')) {
    return { type: 'feature', priority: 'medium' }
  }

  if (lowerMessage.includes('text') || lowerMessage.includes('content') || lowerMessage.includes('copy') ||
      lowerMessage.includes('headline') || lowerMessage.includes('description')) {
    return { type: 'content', priority: 'low' }
  }

  return { type: 'general', priority: 'medium' }
}

// Build optimized file context based on request type
function buildFileContext(
  files: Array<{ path: string; content: string }>,
  requestType: string,
  currentFile?: string
): string {
  if (!files || files.length === 0) return ''

  // Sort files by relevance
  const sortedFiles = [...files].sort((a, b) => {
    // Current file always first
    if (currentFile) {
      if (a.path === currentFile) return -1
      if (b.path === currentFile) return 1
    }

    // Page files are important
    const aIsPage = a.path.includes('page.tsx') || a.path.includes('page.jsx')
    const bIsPage = b.path.includes('page.tsx') || b.path.includes('page.jsx')
    if (aIsPage && !bIsPage) return -1
    if (!aIsPage && bIsPage) return 1

    // For style requests, prioritize CSS files
    if (requestType === 'style') {
      const aIsCSS = a.path.endsWith('.css')
      const bIsCSS = b.path.endsWith('.css')
      if (aIsCSS && !bIsCSS) return -1
      if (!aIsCSS && bIsCSS) return 1
    }

    return 0
  })

  // Limit context size
  const maxFiles = 6
  const relevantFiles = sortedFiles.slice(0, maxFiles)

  return `\n\n## Current Project Files\n\n${relevantFiles.map((f) =>
    `### ${f.path}\n\`\`\`${getFileExtension(f.path)}\n${truncateContent(f.content, 3000)}\n\`\`\``
  ).join('\n\n')}`
}

function getFileExtension(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || ''
  const langMap: Record<string, string> = {
    'tsx': 'tsx',
    'ts': 'typescript',
    'jsx': 'jsx',
    'js': 'javascript',
    'css': 'css',
    'html': 'html',
    'json': 'json',
  }
  return langMap[ext] || ext
}

function truncateContent(content: string, maxLength: number): string {
  if (content.length <= maxLength) return content
  return content.slice(0, maxLength) + '\n\n// ... (truncated for brevity)'
}

export async function POST(req: NextRequest) {
  try {
    const { message, files, projectName, conversationHistory, currentFile, selectedElement } = await req.json()

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

    // Analyze the request type
    const { type: requestType } = analyzeRequest(message)

    // Build optimized file context
    const fileContext = buildFileContext(files || [], requestType, currentFile)

    // Build context info
    let contextInfo = `\n\n## Project Context\n- **Project Name:** ${projectName || 'Untitled Project'}`

    if (currentFile) {
      contextInfo += `\n- **Currently Viewing:** ${currentFile}`
    }

    if (selectedElement) {
      contextInfo += `\n- **Selected Element:** <${selectedElement.tagName?.toLowerCase() || 'unknown'}${
        selectedElement.className ? ` class="${selectedElement.className}"` : ''
      }>${selectedElement.textContent ? ` (contains: "${selectedElement.textContent.slice(0, 50)}...")` : ''}`
    }

    const systemPrompt = `${BUILDER_SYSTEM_PROMPT}${contextInfo}${fileContext}`

    // Build conversation messages
    const messages: { role: 'user' | 'assistant'; content: string }[] = []

    // Add conversation history (limit to last 10 messages to save tokens)
    if (conversationHistory?.length > 0) {
      const recentHistory = conversationHistory.slice(-10)
      for (const msg of recentHistory) {
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
