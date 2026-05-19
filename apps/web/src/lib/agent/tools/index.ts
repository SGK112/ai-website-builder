/**
 * Built-in Tools for the Agent
 * These are the core tools that enable the agent to interact with the world
 */

import { toolRegistry, createTool } from '../tool-registry'
import { ToolResult, AgentContext, Artifact } from '../types'

// =============================================================================
// THINKING TOOL - Let the agent reason through problems
// =============================================================================
const thinkTool = createTool(
  'think',
  'Use this tool to think through a problem step by step. This helps organize your thoughts before taking action.',
  [
    {
      name: 'thought',
      type: 'string',
      description: 'Your reasoning or thought process',
      required: true,
    },
  ],
  async (params): Promise<ToolResult> => {
    return {
      success: true,
      output: `Thought recorded: ${params.thought}`,
    }
  }
)

// =============================================================================
// WEB SEARCH TOOL - Search the internet
// =============================================================================
const searchWebTool = createTool(
  'search_web',
  'Search the web for information. Use this to find current information, documentation, or research topics.',
  [
    {
      name: 'query',
      type: 'string',
      description: 'The search query',
      required: true,
    },
    {
      name: 'num_results',
      type: 'number',
      description: 'Number of results to return (1-10)',
      required: false,
      default: 5,
    },
  ],
  async (params, context): Promise<ToolResult> => {
    try {
      // Use our existing web search capability
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: `Search the web for: ${params.query}` }
          ],
          useWebSearch: true,
        }),
      })

      if (!response.ok) {
        return {
          success: false,
          output: null,
          error: 'Web search failed',
        }
      }

      const data = await response.json()
      return {
        success: true,
        output: data.content || data.results || 'No results found',
      }
    } catch (error: any) {
      return {
        success: false,
        output: null,
        error: error.message,
      }
    }
  }
)

// =============================================================================
// FETCH URL TOOL - Get content from a URL
// =============================================================================
const fetchUrlTool = createTool(
  'fetch_url',
  'Fetch the content of a web page. Useful for reading documentation, articles, or any web content.',
  [
    {
      name: 'url',
      type: 'string',
      description: 'The URL to fetch',
      required: true,
    },
    {
      name: 'extract',
      type: 'string',
      description: 'What to extract: "text", "html", or "links"',
      required: false,
      default: 'text',
      enum: ['text', 'html', 'links'],
    },
  ],
  async (params): Promise<ToolResult> => {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: `Fetch and summarize this URL: ${params.url}` }
          ],
          fetchUrl: params.url,
        }),
      })

      if (!response.ok) {
        return {
          success: false,
          output: null,
          error: 'Failed to fetch URL',
        }
      }

      const data = await response.json()
      return {
        success: true,
        output: data.content || 'No content extracted',
      }
    } catch (error: any) {
      return {
        success: false,
        output: null,
        error: error.message,
      }
    }
  }
)

// =============================================================================
// GENERATE CODE TOOL - Generate code using AI (directly via Anthropic)
// =============================================================================
const generateCodeTool = createTool(
  'generate_code',
  'Generate code based on a description. Can create HTML, CSS, JavaScript, React components, and more.',
  [
    {
      name: 'description',
      type: 'string',
      description: 'Description of what the code should do',
      required: true,
    },
    {
      name: 'language',
      type: 'string',
      description: 'Programming language or framework',
      required: false,
      default: 'html',
      enum: ['html', 'css', 'javascript', 'typescript', 'react', 'python', 'json'],
    },
    {
      name: 'context',
      type: 'string',
      description: 'Additional context or existing code to work with',
      required: false,
    },
  ],
  async (params, context): Promise<ToolResult> => {
    try {
      // Import Anthropic dynamically for server-side use
      const Anthropic = (await import('@anthropic-ai/sdk')).default
      const apiKey = process.env.ANTHROPIC_API_KEY

      if (!apiKey) {
        return {
          success: false,
          output: null,
          error: 'ANTHROPIC_API_KEY not configured',
        }
      }

      const client = new Anthropic({ apiKey })

      const systemPrompt = params.language === 'html'
        ? `You are an expert web developer. Generate a complete, production-ready HTML page with embedded Tailwind CSS.
           Include:
           - <!DOCTYPE html> declaration
           - Proper meta tags and viewport
           - Tailwind CDN: <script src="https://cdn.tailwindcss.com"></script>
           - Modern, responsive design with gradients and shadows
           - Dark theme by default
           - Proper semantic HTML
           - Interactive elements where appropriate

           IMPORTANT: Return ONLY the complete HTML code, no explanations or markdown.`
        : `You are an expert developer. Generate clean, production-ready ${params.language} code.
           Return ONLY the code, no explanations or markdown code blocks.`

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: `Generate ${params.language} code for: ${params.description}${params.context ? `\n\nExisting code/context:\n${params.context}` : ''}`,
        }],
      })

      const code = response.content
        .filter((block) => block.type === 'text')
        .map(block => (block as { type: 'text'; text: string }).text)
        .join('')
        .trim()

      // Clean up code if it has markdown code blocks
      let cleanCode = code
      if (cleanCode.startsWith('```')) {
        cleanCode = cleanCode.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '')
      }

      const artifact: Artifact = {
        id: `code_${Date.now()}`,
        type: 'code',
        name: params.language === 'html' ? 'website.html' : `generated.${params.language === 'react' ? 'tsx' : params.language}`,
        content: cleanCode,
        metadata: { language: params.language },
      }

      return {
        success: true,
        output: cleanCode,
        artifacts: [artifact],
      }
    } catch (error: any) {
      return {
        success: false,
        output: null,
        error: error.message,
      }
    }
  }
)

// =============================================================================
// GENERATE IMAGE TOOL - Create images using AI
// =============================================================================
const generateImageTool = createTool(
  'generate_image',
  'Generate an image based on a text description using AI.',
  [
    {
      name: 'prompt',
      type: 'string',
      description: 'Description of the image to generate',
      required: true,
    },
    {
      name: 'style',
      type: 'string',
      description: 'Art style',
      required: false,
      default: 'photorealistic',
      enum: ['photorealistic', 'illustration', 'cartoon', 'abstract', '3d-render'],
    },
    {
      name: 'size',
      type: 'string',
      description: 'Image dimensions',
      required: false,
      default: '1024x1024',
      enum: ['512x512', '1024x1024', '1024x768', '768x1024'],
    },
  ],
  async (params): Promise<ToolResult> => {
    try {
      const response = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${params.style}: ${params.prompt}`,
          size: params.size,
        }),
      })

      if (!response.ok) {
        return {
          success: false,
          output: null,
          error: 'Image generation failed',
        }
      }

      const data = await response.json()
      const imageUrl = data.url || data.imageUrl

      const artifact: Artifact = {
        id: `image_${Date.now()}`,
        type: 'image',
        name: 'generated-image.png',
        content: imageUrl,
        mimeType: 'image/png',
        metadata: { prompt: params.prompt, style: params.style },
      }

      return {
        success: true,
        output: imageUrl,
        artifacts: [artifact],
      }
    } catch (error: any) {
      return {
        success: false,
        output: null,
        error: error.message,
      }
    }
  }
)

// =============================================================================
// READ FILE TOOL - Read file contents (from context/artifacts)
// =============================================================================
const readFileTool = createTool(
  'read_file',
  'Read the contents of a file. Can read files from the current project or artifacts.',
  [
    {
      name: 'path',
      type: 'string',
      description: 'Path to the file or artifact name',
      required: true,
    },
  ],
  async (params, context): Promise<ToolResult> => {
    // Check if it's an artifact
    const artifact = context.artifacts.find(
      a => a.name === params.path || a.id === params.path
    )

    if (artifact) {
      return {
        success: true,
        output: typeof artifact.content === 'string'
          ? artifact.content
          : artifact.content.toString(),
      }
    }

    // Check context variables
    if (context.variables[params.path]) {
      return {
        success: true,
        output: context.variables[params.path],
      }
    }

    return {
      success: false,
      output: null,
      error: `File not found: ${params.path}`,
    }
  }
)

// =============================================================================
// WRITE FILE TOOL - Write/create file contents
// =============================================================================
const writeFileTool = createTool(
  'write_file',
  'Write content to a file. Creates a new artifact that can be downloaded or used.',
  [
    {
      name: 'path',
      type: 'string',
      description: 'Name for the file',
      required: true,
    },
    {
      name: 'content',
      type: 'string',
      description: 'Content to write to the file',
      required: true,
    },
  ],
  async (params, context): Promise<ToolResult> => {
    const artifact: Artifact = {
      id: `file_${Date.now()}`,
      type: 'file',
      name: params.path,
      content: params.content,
      metadata: { createdAt: new Date().toISOString() },
    }

    context.artifacts.push(artifact)

    return {
      success: true,
      output: `File created: ${params.path}`,
      artifacts: [artifact],
    }
  }
)

// =============================================================================
// STORE VARIABLE TOOL - Store data for later use
// =============================================================================
const storeVariableTool = createTool(
  'store_variable',
  'Store a value in memory for later use in the task.',
  [
    {
      name: 'name',
      type: 'string',
      description: 'Variable name',
      required: true,
    },
    {
      name: 'value',
      type: 'string',
      description: 'Value to store',
      required: true,
    },
  ],
  async (params, context): Promise<ToolResult> => {
    context.variables[params.name] = params.value
    return {
      success: true,
      output: `Stored "${params.name}" = "${params.value.substring(0, 100)}${params.value.length > 100 ? '...' : ''}"`,
    }
  }
)

// =============================================================================
// ANALYZE DATA TOOL - Analyze structured data
// =============================================================================
const analyzeDataTool = createTool(
  'analyze_data',
  'Analyze structured data (JSON, CSV) and extract insights.',
  [
    {
      name: 'data',
      type: 'string',
      description: 'The data to analyze (JSON string or CSV)',
      required: true,
    },
    {
      name: 'question',
      type: 'string',
      description: 'What to find or analyze in the data',
      required: true,
    },
  ],
  async (params): Promise<ToolResult> => {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Analyze this data and answer: ${params.question}\n\nData:\n${params.data}`,
            },
          ],
        }),
      })

      if (!response.ok) {
        return {
          success: false,
          output: null,
          error: 'Data analysis failed',
        }
      }

      const data = await response.json()
      return {
        success: true,
        output: data.content || 'Analysis complete',
      }
    } catch (error: any) {
      return {
        success: false,
        output: null,
        error: error.message,
      }
    }
  }
)

// =============================================================================
// ASK USER TOOL - Request more information from the user
// =============================================================================
const askUserTool = createTool(
  'ask_user',
  'Ask the user a question when you need more information, clarification, or want to confirm before taking an action. Use this for multi-turn conversations.',
  [
    {
      name: 'question',
      type: 'string',
      description: 'The question to ask the user',
      required: true,
    },
    {
      name: 'options',
      type: 'array',
      description: 'Optional list of suggested answers/options',
      required: false,
    },
  ],
  async (params, context): Promise<ToolResult> => {
    // Emit a waiting_input progress update
    context.onProgress?.({
      type: 'waiting_input',
      message: 'Waiting for user input...',
      question: params.question,
    })

    // The actual waiting is handled by the UI and agent loop
    // This just signals that we need input
    return {
      success: true,
      output: `Asked user: ${params.question}`,
      metadata: {
        waitingForInput: true,
        question: params.question,
        options: params.options,
      },
    }
  }
)

// =============================================================================
// MODIFY HTML TOOL - Modify existing HTML content
// =============================================================================
const modifyHtmlTool = createTool(
  'modify_html',
  'Modify or enhance existing HTML content. Use this to update sections, add new elements, or improve the design.',
  [
    {
      name: 'modification',
      type: 'string',
      description: 'Description of what to modify or add',
      required: true,
    },
    {
      name: 'target',
      type: 'string',
      description: 'CSS selector or description of the target element',
      required: false,
    },
  ],
  async (params, context): Promise<ToolResult> => {
    try {
      const response = await fetch('/api/builder/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: params.modification,
          currentHtml: context.variables.currentHtml || '',
          skillLevel: 'expert',
        }),
      })

      if (!response.ok) {
        return {
          success: false,
          output: null,
          error: 'HTML modification failed',
        }
      }

      // Handle streaming response with proper SSE buffering. Chunks from
      // the network can split mid-JSON; we accumulate until we see a `\n\n`
      // frame delimiter and only parse complete frames. The previous loop
      // split each read on `\n` and silently dropped the half-frames as
      // "parse noise" — agent's modify_html would lose any HTML that fell
      // on a chunk boundary. Same class of bug as the workspace
      // handleGenerate fix in a4f872e.
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let html = ''
      let sseBuffer = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          sseBuffer += decoder.decode(value, { stream: true })
          const frames = sseBuffer.split('\n\n')
          sseBuffer = frames.pop() || ''
          for (const frame of frames) {
            let dataStr = ''
            for (const line of frame.split('\n')) {
              if (line.startsWith('data: ')) dataStr += line.slice(6)
            }
            if (!dataStr || dataStr === '[DONE]') continue
            try {
              const parsed = JSON.parse(dataStr)
              if (typeof parsed.html === 'string') html = parsed.html
              else if (typeof parsed.delta === 'string') html += parsed.delta
            } catch { /* incomplete frame, will fill in next read */ }
          }
        }
      }

      const artifact: Artifact = {
        id: `html_${Date.now()}`,
        type: 'code',
        name: 'modified.html',
        content: html,
        metadata: { language: 'html', modification: params.modification },
      }

      return {
        success: true,
        output: html,
        artifacts: [artifact],
      }
    } catch (error: any) {
      return {
        success: false,
        output: null,
        error: error.message,
      }
    }
  }
)

// =============================================================================
// REGISTER ALL TOOLS
// =============================================================================
export function registerBuiltinTools(): void {
  toolRegistry.register(thinkTool)
  toolRegistry.register(searchWebTool)
  toolRegistry.register(fetchUrlTool)
  toolRegistry.register(generateCodeTool)
  toolRegistry.register(generateImageTool)
  toolRegistry.register(readFileTool)
  toolRegistry.register(writeFileTool)
  toolRegistry.register(storeVariableTool)
  toolRegistry.register(analyzeDataTool)
  toolRegistry.register(askUserTool)
  toolRegistry.register(modifyHtmlTool)
}

// Export individual tools for testing
export {
  thinkTool,
  searchWebTool,
  fetchUrlTool,
  generateCodeTool,
  generateImageTool,
  readFileTool,
  writeFileTool,
  storeVariableTool,
  analyzeDataTool,
  askUserTool,
  modifyHtmlTool,
}
