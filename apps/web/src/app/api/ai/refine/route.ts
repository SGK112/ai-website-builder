import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Lazy initialization to avoid build-time errors
let openaiClient: OpenAI | null = null
function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' })
  }
  return openaiClient
}

interface RefineRequest {
  prompt: string
  currentHtml: string
  theme: 'light' | 'dark'
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[]
}

// Wrap HTML content with Tailwind CSS CDN and proper document structure
function wrapWithTailwind(html: string, theme: 'light' | 'dark' = 'dark'): string {
  // If it's already a complete document, inject Tailwind into the head
  if (html.includes('<!DOCTYPE') || html.includes('<html')) {
    // Check if Tailwind is already included
    if (html.includes('tailwindcss')) {
      return html
    }
    // Try to inject into existing head
    if (html.includes('<head>')) {
      return html.replace(
        '<head>',
        `<head>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            fontFamily: {
              sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'sans-serif']
            }
          }
        }
      }
    </script>`
      )
    }
    return html
  }

  // Wrap content in complete HTML document with Tailwind
  const bgColor = theme === 'dark' ? 'bg-black' : 'bg-white'
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900'

  return `<!DOCTYPE html>
<html lang="en" class="${theme === 'dark' ? 'dark' : ''}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Generated Website</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'sans-serif']
          }
        }
      }
    }
  </script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
  </style>
</head>
<body class="${bgColor} ${textColor} antialiased">
${html}
</body>
</html>`
}

const SYSTEM_PROMPT = `You are an expert web designer and developer. Your job is to refine and improve HTML/Tailwind CSS code based on user requests.

CRITICAL RULES:
1. ONLY modify what the user asks for - don't change unrelated parts
2. Preserve all existing structure, images, and content unless specifically asked to change them
3. Keep using Tailwind CSS classes
4. Maintain responsive design (use md: lg: breakpoints)
5. Keep the same overall layout unless asked to change it
6. Don't add new sections unless specifically requested
7. For color changes, update the theme consistently across the design
8. Keep all existing image URLs - never generate or change image sources unless asked

IMPORTANT FOR IMAGES:
- Keep all existing image src attributes unchanged
- If user asks for image changes, use Unsplash URLs like: https://images.unsplash.com/photo-[ID]?w=800&q=80
- Never use placeholder.com or via.placeholder.com

Response format:
Return ONLY the modified HTML. No explanations, no markdown code blocks, just the raw HTML.`

export async function POST(request: NextRequest) {
  try {
    // Check API key first
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 503 }
      )
    }

    const body: RefineRequest = await request.json()
    const { prompt, currentHtml, theme, conversationHistory = [] } = body

    if (!prompt || !currentHtml) {
      return NextResponse.json(
        { error: 'Missing prompt or currentHtml' },
        { status: 400 }
      )
    }

    // Basic size check to avoid token limit issues
    if (currentHtml.length > 50000) {
      return NextResponse.json(
        { error: 'HTML content too large. Please simplify your design.' },
        { status: 400 }
      )
    }

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: object) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        }

        try {
          // Send thinking status
          send({ type: 'thinking', message: 'Analyzing your request...' })

          // Build conversation messages
          const messages: OpenAI.ChatCompletionMessageParam[] = [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: `Current website HTML (${theme} theme):\n\n${currentHtml}`
            }
          ]

          // Add conversation history for context
          for (const msg of conversationHistory.slice(-6)) { // Keep last 6 messages
            messages.push({
              role: msg.role === 'user' ? 'user' : 'assistant',
              content: msg.content
            })
          }

          // Add current request
          messages.push({
            role: 'user',
            content: `User request: "${prompt}"\n\nApply this change to the HTML. Return ONLY the complete modified HTML, nothing else.`
          })

          send({ type: 'update', message: 'Applying changes...' })

          const completion = await getOpenAI().chat.completions.create({
            model: 'gpt-4o',
            messages,
            temperature: 0.3, // Lower temperature for more consistent output
            max_tokens: 8000,
          })

          const responseContent = completion.choices[0]?.message?.content || ''

          // Clean up the response - remove any markdown code blocks if present
          let cleanHtml = responseContent.trim()
          if (cleanHtml.startsWith('```html')) {
            cleanHtml = cleanHtml.slice(7)
          } else if (cleanHtml.startsWith('```')) {
            cleanHtml = cleanHtml.slice(3)
          }
          if (cleanHtml.endsWith('```')) {
            cleanHtml = cleanHtml.slice(0, -3)
          }
          cleanHtml = cleanHtml.trim()

          // Validate we got HTML back
          if (!cleanHtml.includes('<') || !cleanHtml.includes('>')) {
            throw new Error('Invalid HTML response')
          }

          // Ensure Tailwind CSS is included
          if (!cleanHtml.includes('tailwindcss')) {
            cleanHtml = wrapWithTailwind(cleanHtml, theme)
          }

          // Generate a friendly completion message
          const completionMessages = [
            "Done! I've updated the design.",
            "Changes applied! Take a look.",
            "All set! Here's the updated version.",
            "Updated! Let me know if you want more changes.",
          ]
          const randomMessage = completionMessages[Math.floor(Math.random() * completionMessages.length)]

          send({
            type: 'complete',
            html: cleanHtml,
            message: randomMessage
          })

        } catch (error: any) {
          console.error('Refinement error:', error)

          let errorMessage = 'Failed to apply changes. Please try again.'

          // Provide more specific error messages
          if (error?.code === 'insufficient_quota') {
            errorMessage = 'API quota exceeded. Please try again later.'
          } else if (error?.code === 'rate_limit_exceeded') {
            errorMessage = 'Too many requests. Please wait a moment and try again.'
          } else if (error?.message?.includes('Invalid HTML')) {
            errorMessage = 'Could not generate valid HTML. Try a simpler request.'
          }

          send({
            type: 'error',
            message: errorMessage
          })
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Refine API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
