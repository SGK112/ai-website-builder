import { streamText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'

type Message = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export const runtime = 'edge'

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
- Break down complex changes into steps`

export async function POST(req: Request) {
  try {
    const { messages, files, projectName, currentFile, selectedElement, provider = 'anthropic' } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages array required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Build context
    let contextInfo = `\n\n## Project Context\n- **Project Name:** ${projectName || 'Untitled Project'}`

    if (currentFile) {
      contextInfo += `\n- **Currently Viewing:** ${currentFile}`
    }

    if (selectedElement) {
      contextInfo += `\n- **Selected Element:** <${selectedElement.tagName?.toLowerCase() || 'unknown'}${
        selectedElement.className ? ` class="${selectedElement.className}"` : ''
      }>`
    }

    // Add file context
    if (files && files.length > 0) {
      const maxFiles = 6
      const relevantFiles = files.slice(0, maxFiles)
      contextInfo += `\n\n## Current Project Files\n\n${relevantFiles.map((f: { path: string; content: string }) =>
        `### ${f.path}\n\`\`\`${f.path.split('.').pop()}\n${f.content.slice(0, 3000)}\n\`\`\``
      ).join('\n\n')}`
    }

    const systemPrompt = `${BUILDER_SYSTEM_PROMPT}${contextInfo}`

    // Choose provider
    if (provider === 'openai') {
      const openai = createOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })

      const result = await streamText({
        model: openai('gpt-4o'),
        system: systemPrompt,
        messages: messages as Message[],
      })

      return result.toTextStreamResponse()
    } else {
      // Default to Anthropic
      const anthropic = createAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      })

      const result = await streamText({
        model: anthropic('claude-sonnet-4-20250514'),
        system: systemPrompt,
        messages: messages as Message[],
      })

      return result.toTextStreamResponse()
    }
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
