import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { generateTextFree, FreeAIConfig } from '@/lib/free-ai-providers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkApiRateLimit, handleRateLimitError } from '@/lib/rate-limit-middleware'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ConversationRequest {
  message: string
  history: ConversationMessage[]
  currentHtml?: string
  model?: string
  apiKey?: string
  context?: {
    hasWebsite: boolean
    selectedElement?: { tagName: string; textContent?: string; outerHTML?: string }
    siblingPages?: Array<{ name: string; slug: string; isHome?: boolean }>
    currentPage?: { name: string; slug: string; isHome?: boolean }
  }
}

interface CodeEdit {
  type: 'replace' | 'insert' | 'delete' | 'style'
  target?: string // CSS selector or description of what to target
  oldCode?: string // Code to find and replace
  newCode?: string // New code to insert
  description: string // Human-readable description of the change
}

interface ConversationResponse {
  type: 'clarify' | 'ready' | 'answer' | 'edit'
  message: string
  intent?: 'website' | 'image' | 'video' | 'edit' | 'question'
  enhancedPrompt?: string
  suggestedOptions?: string[]
  requirements?: ProjectRequirements
  // Edit-specific fields
  codeEdits?: CodeEdit[]
  updatedHtml?: string
  suggestions?: string[]
  analysis?: WebsiteAnalysis
}

interface ProjectRequirements {
  projectType?: string
  businessName?: string
  industry?: string
  targetAudience?: string
  style?: string
  colorScheme?: string
  features?: string[]
  pages?: string[]
  content?: string
  references?: string[]
  tone?: string
  completeness: number
}

interface WebsiteAnalysis {
  structure: string[]
  colors: string[]
  fonts: string[]
  sections: string[]
  issues: string[]
  strengths: string[]
}

// Analyze HTML to extract key information
function analyzeHtml(html: string): WebsiteAnalysis {
  const analysis: WebsiteAnalysis = {
    structure: [],
    colors: [],
    fonts: [],
    sections: [],
    issues: [],
    strengths: []
  }

  if (!html) return analysis

  // Extract sections
  const sectionMatches = html.match(/<(section|header|footer|nav|main|article|aside)[^>]*>/gi) || []
  analysis.sections = [...new Set(sectionMatches.map(s => s.match(/<(\w+)/)?.[1] || ''))]

  // Extract color classes (Tailwind)
  const colorMatches = html.match(/(?:bg|text|border)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}/g) || []
  analysis.colors = [...new Set(colorMatches)].slice(0, 10)

  // Extract font classes
  const fontMatches = html.match(/font-(?:sans|serif|mono|thin|light|normal|medium|semibold|bold|extrabold|black)/g) || []
  analysis.fonts = [...new Set(fontMatches)]

  // Check for common issues
  if (!html.includes('responsive') && !html.includes('md:') && !html.includes('lg:')) {
    analysis.issues.push('May lack responsive design breakpoints')
  }
  if (!html.includes('<nav') && !html.includes('navigation')) {
    analysis.issues.push('No navigation section detected')
  }
  if (!html.includes('<footer')) {
    analysis.issues.push('No footer section detected')
  }
  if (!html.includes('alt=')) {
    analysis.issues.push('Images may be missing alt text for accessibility')
  }

  // Identify strengths
  if (html.includes('md:') || html.includes('lg:') || html.includes('sm:')) {
    analysis.strengths.push('Has responsive design classes')
  }
  if (html.includes('hover:') || html.includes('transition')) {
    analysis.strengths.push('Has interactive hover effects')
  }
  if (html.includes('flex') || html.includes('grid')) {
    analysis.strengths.push('Uses modern layout (flexbox/grid)')
  }

  return analysis
}

// Summarize HTML for context (truncate intelligently)
function summarizeHtml(html: string, maxLength: number = 2000): string {
  if (!html || html.length <= maxLength) return html

  // Try to keep structure visible
  const headMatch = html.match(/<head>[\s\S]*?<\/head>/i)
  const bodyStart = html.indexOf('<body')
  const bodyEnd = html.lastIndexOf('</body>')

  if (bodyStart === -1) {
    return html.slice(0, maxLength) + '\n<!-- ... truncated ... -->'
  }

  const head = headMatch ? headMatch[0].slice(0, 500) : ''
  const bodyContent = html.slice(bodyStart, bodyEnd + 7)

  // Get first and last parts of body
  const bodyPreview = bodyContent.slice(0, 1200) + '\n\n<!-- ... middle content truncated ... -->\n\n' + bodyContent.slice(-500)

  return head + '\n' + bodyPreview
}

// System prompt with editing capabilities - ACTION ORIENTED
const CONVERSATION_SYSTEM_PROMPT = `You are a fast, decisive web designer. When users ask for edits, JUST DO THEM. Don't ask questions - use smart defaults.

## CORE PRINCIPLE: ACTION OVER QUESTIONS
- For edits: JUST DO IT immediately with smart defaults
- For new builds: Gather ONLY essential info (2-3 questions max)
- Keep messages SHORT (1-2 sentences)
- Offer alternatives AFTER making the change, not before

## SMART DEFAULTS
When user doesn't specify, use these:
- Background images: Use Unsplash (https://images.unsplash.com/photo-[id]?w=1920)
- Colors: Match existing theme or use modern dark theme
- Fonts: Keep existing or use Inter/system fonts
- Sizing: Full-width, responsive by default
- Opacity overlays: 60% dark overlay for text readability

## RESPONSE FORMAT (JSON ONLY)
{
  "type": "edit" | "ready" | "clarify" | "answer",
  "intent": "edit" | "website" | "image" | "video" | "question",
  "message": "Short response (1-2 sentences max)",
  "codeEdits": [{"type": "replace|insert|style", "oldCode": "...", "newCode": "...", "target": "...", "description": "..."}]
}

## EDIT EXAMPLES (JUST DO IT - NO QUESTIONS)

"add background image to hero":
{"type":"edit","intent":"edit","message":"Done! Added a hero background image with overlay.","codeEdits":[{"type":"replace","target":"first section","oldCode":"class=\\"min-h-screen","newCode":"class=\\"min-h-screen bg-cover bg-center relative\\" style=\\"background-image: url('https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920')","description":"Added hero background image"}]}

"make header blue":
{"type":"edit","intent":"edit","message":"Changed header to blue.","codeEdits":[{"type":"style","oldCode":"bg-slate-800","newCode":"bg-blue-600","description":"Header now blue"}]}

"add contact section":
{"type":"edit","intent":"edit","message":"Added contact section.","codeEdits":[{"type":"insert","target":"before </body>","newCode":"<section class=\\"py-16 bg-slate-800\\"><div class=\\"max-w-4xl mx-auto px-6 text-center\\"><h2 class=\\"text-3xl font-bold text-white mb-4\\">Contact Us</h2><p class=\\"text-slate-400 mb-8\\">Get in touch</p><a href=\\"mailto:hello@example.com\\" class=\\"px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-500\\">Email Us</a></div></section>","description":"Added contact section"}]}

## FOR NEW WEBSITES ONLY
Ask max 2-3 quick questions:
1. What type? (business, portfolio, store, etc.)
2. Business name?
3. Style preference? (modern/classic, dark/light)

Then BUILD IT with smart defaults.

## SELECTED ELEMENT CONTEXT
When user has selected an element, you'll receive [SELECTED ELEMENT] context. For these commands:
- "delete this/remove this" = Delete the selected element's outerHTML
- "change this to..." = Replace the selected element's content
- "make this bigger/smaller" = Modify size classes (text-xl -> text-3xl, p-4 -> p-8)
- "change this image" = Replace the selected image src
- "make this blue/red/etc" = Change color classes of the selected element

Use the provided outerHTML as the oldCode in your codeEdits.

## RULES
- EDIT = Just do it, no questions
- NEW BUILD = 2-3 questions max, then build
- Messages = 1-2 sentences only
- Always include codeEdits for edit type
- When user says "this" with a selected element, target THAT specific element's outerHTML
- Use Unsplash for images: https://images.unsplash.com/photo-{id}?w=1920
- Match existing code style
- JSON only, properly escaped`

// Get AI response using the appropriate provider
async function getAIResponse(
  messages: { role: 'user' | 'assistant'; content: string }[],
  model: string,
  apiKey?: string,
  systemPrompt: string = CONVERSATION_SYSTEM_PROMPT
): Promise<string> {
  let isAnthropicModel = model.startsWith('claude')
  let isOpenAIModel = model.startsWith('gpt') || model.startsWith('o1') || model.startsWith('o3')
  let isFreeModel = model.startsWith('hf-') || model.startsWith('together-') || model.startsWith('cf-')

  // The converse "brain" needs reliable reasoning. Free-tier providers (HF
  // Llama, Together, CF) frequently 400 with model_not_supported errors and
  // cause chat loops. Force-fallback to Anthropic if available, OpenAI if not.
  if (isFreeModel) {
    if (process.env.ANTHROPIC_API_KEY) {
      console.log(`[Converse] Routing ${model} -> Anthropic (free providers unreliable for chat brain)`)
      isFreeModel = false
      isAnthropicModel = true
    } else if (process.env.OPENAI_API_KEY) {
      console.log(`[Converse] Routing ${model} -> OpenAI (no Anthropic key, free providers unreliable)`)
      isFreeModel = false
      isOpenAIModel = true
    }
  }

  if (isFreeModel) {
    const hfKey = apiKey || process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN
    const togetherKey = apiKey || process.env.TOGETHER_API_KEY
    const cfKey = apiKey || process.env.CLOUDFLARE_API_KEY
    const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID

    const config: FreeAIConfig = { provider: 'huggingface' }
    let freeModel = 'llama-3.2-3b'

    if (model.startsWith('hf-')) {
      config.provider = 'huggingface'
      config.apiKey = hfKey
      if (model.includes('mistral')) freeModel = 'mistral-7b'
      else if (model.includes('deepseek')) freeModel = 'deepseek-r1'
      else freeModel = 'llama-3.2-3b'
    } else if (model.startsWith('together-')) {
      config.provider = 'together'
      config.apiKey = togetherKey
      freeModel = 'llama-3.2-3b'
    } else if (model.startsWith('cf-')) {
      config.provider = 'cloudflare'
      config.apiKey = cfKey
      config.accountId = cfAccountId
      freeModel = 'llama-3.2-3b'
    }

    if (!config.apiKey) {
      throw new Error(`${config.provider === 'huggingface' ? 'HuggingFace' : config.provider} API key not configured.`)
    }

    const fullPrompt = `${systemPrompt}\n\nConversation:\n${messages.map(m => `${m.role}: ${m.content}`).join('\n')}\n\nassistant:`

    console.log(`[Converse] Calling ${config.provider} with model ${freeModel}`)
    const result = await generateTextFree(fullPrompt, config, freeModel)

    if (result.error) throw new Error(result.error)
    return result.text || ''
  }

  // Map the UI's selected model name to a real model id. Conversation is
  // short JSON ("clarify"/"ready" + 1-2 sentence message + enhancedPrompt),
  // so we hard-cap max_tokens low to keep latency under Render's 49s proxy
  // timeout — Sonnet at 8192 tokens routinely takes 60-95s and times out.
  const CONVERSE_MAX_TOKENS = 2048
  const lc = (model || '').toLowerCase()

  if (isAnthropicModel) {
    const anthropicKey = apiKey || process.env.ANTHROPIC_API_KEY
    if (!anthropicKey) throw new Error('Anthropic API key not configured')

    const claudeModel = lc.includes('haiku') ? 'claude-haiku-4-5-20251001' :
                         lc.includes('opus')  ? 'claude-opus-4-7' :
                         'claude-sonnet-4-6'

    const client = new Anthropic({ apiKey: anthropicKey })
    const response = await client.messages.create({
      model: claudeModel,
      max_tokens: CONVERSE_MAX_TOKENS,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content }))
    })

    const textBlock = response.content.find(b => b.type === 'text')
    return textBlock?.text || ''
  }

  if (isOpenAIModel) {
    const openaiKey = apiKey || process.env.OPENAI_API_KEY
    if (!openaiKey) throw new Error('OpenAI API key not configured')

    const openaiModel = lc.includes('mini') ? 'gpt-4o-mini' : 'gpt-4o'

    const client = new OpenAI({ apiKey: openaiKey })
    const response = await client.chat.completions.create({
      model: openaiModel,
      max_tokens: CONVERSE_MAX_TOKENS,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
      ]
    })

    return response.choices[0]?.message?.content || ''
  }

  // Default to Anthropic — fastest readily-available model so we stay
  // under the proxy timeout even on cold paths.
  const anthropicKey = apiKey || process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) throw new Error('No API key configured')

  const client = new Anthropic({ apiKey: anthropicKey })
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: CONVERSE_MAX_TOKENS,
    system: systemPrompt,
    messages: messages.map(m => ({ role: m.role, content: m.content }))
  })

  const textBlock = response.content.find(b => b.type === 'text')
  return textBlock?.text || ''
}

// Regenerate a single HTML section with Claude. Used by the iterative-edit
// path so users can say "rewrite the hero" or "redesign this section" and get
// a real new section back, instead of the AI hallucinating codeEdits whose
// oldCode doesn't match the live HTML.
async function regenerateSection(
  currentSectionHtml: string,
  request: string,
  model?: string,
  apiKey?: string
): Promise<string> {
  const anthropicKey = apiKey || process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) throw new Error('No Anthropic API key for section regen')

  const claudeModel = ((model || '').toLowerCase().includes('haiku') ? 'claude-haiku-4-5-20251001' :
                       (model || '').toLowerCase().includes('opus') ? 'claude-opus-4-7' :
                       'claude-sonnet-4-6')

  const client = new Anthropic({ apiKey: anthropicKey })
  const response = await client.messages.create({
    model: claudeModel,
    max_tokens: 4096,
    system: `You are an elite web designer. The user wants to update one HTML section. Output ONLY the new section HTML — no markdown fences, no commentary, no surrounding document. Match the existing Tailwind dark-theme styling of the input. Keep the SAME outer tag (section / nav / footer / header) so the splice fits cleanly. Use real content, not "Lorem ipsum" or placeholder text. Preserve any IDs on the outer tag.`,
    messages: [{
      role: 'user',
      content: `Current section HTML:
\`\`\`html
${currentSectionHtml}
\`\`\`

User's change request: ${request}

Return ONLY the new section HTML — no fences, no explanation.`
    }]
  })

  const textBlock = response.content.find(b => b.type === 'text') as any
  let html: string = textBlock?.text || ''
  html = html.trim()
  if (html.startsWith('```html')) html = html.slice(7).trim()
  else if (html.startsWith('```')) html = html.slice(3).trim()
  if (html.endsWith('```')) html = html.slice(0, -3).trim()
  return html
}

// Locate a section in the current HTML by its semantic name. Returns the
// matched outer-tag-to-outer-tag block, or null if no match.
function findSectionByName(html: string, sectionKey: string): string | null {
  const patterns: Record<string, RegExp[]> = {
    nav:        [/<nav\b[\s\S]*?<\/nav>/i],
    hero:       [/<section[^>]*(?:id=["']hero["']|class=["'][^"']*hero[^"']*["'])[\s\S]*?<\/section>/i,
                 /<section[^>]*min-h-screen[^>]*>[\s\S]*?<\/section>/i],
    features:   [/<section[^>]*(?:id=["']features["']|class=["'][^"']*features?[^"']*["'])[\s\S]*?<\/section>/i],
    pricing:    [/<section[^>]*(?:id=["']pricing["']|class=["'][^"']*pricing[^"']*["'])[\s\S]*?<\/section>/i],
    testimonial:[/<section[^>]*(?:id=["']testimonials?["']|class=["'][^"']*testimonial[^"']*["'])[\s\S]*?<\/section>/i],
    contact:    [/<section[^>]*(?:id=["']contact["']|class=["'][^"']*contact[^"']*["'])[\s\S]*?<\/section>/i],
    faq:        [/<section[^>]*(?:id=["']faq["']|class=["'][^"']*faq[^"']*["'])[\s\S]*?<\/section>/i],
    cta:        [/<section[^>]*(?:id=["']cta["']|class=["'][^"']*cta[^"']*["'])[\s\S]*?<\/section>/i],
    footer:     [/<footer\b[\s\S]*?<\/footer>/i],
    team:       [/<section[^>]*(?:id=["']team["']|class=["'][^"']*team[^"']*["'])[\s\S]*?<\/section>/i],
    gallery:    [/<section[^>]*(?:id=["'](?:gallery|portfolio)["']|class=["'][^"']*(?:gallery|portfolio)[^"']*["'])[\s\S]*?<\/section>/i],
  }
  const list = patterns[sectionKey] || []
  for (const pat of list) {
    const m = html.match(pat)
    if (m) return m[0]
  }
  return null
}

// Apply code edits to HTML
// Tolerant string find — tries progressively looser matchers so the LLM's
// `oldCode` snippet still locates its target even when whitespace, quote
// style, or attribute order differs slightly from the live HTML. Returns
// the SUBSTRING of `haystack` that matched (so the caller can do an
// exact replace), or null if no strategy could find it.
function tolerantFind(haystack: string, needle: string): string | null {
  if (!needle) return null
  // 1. Exact substring — fast path
  if (haystack.includes(needle)) return needle
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // 2. Whitespace-normalized — collapse any whitespace runs to \s+
  try {
    const re = new RegExp(esc(needle).replace(/\\\s|\s+/g, '\\s+'), '')
    const m = haystack.match(re)
    if (m) return m[0]
  } catch {}
  // 3. Quote-flexible — single ↔ double quote interchangeable
  try {
    const re = new RegExp(esc(needle).replace(/\\['"]|['"]/g, `['"]`), '')
    const m = haystack.match(re)
    if (m) return m[0]
  } catch {}
  // 4. Both — whitespace AND quote tolerance
  try {
    const re = new RegExp(
      esc(needle).replace(/\\\s|\s+/g, '\\s+').replace(/\\['"]|['"]/g, `['"]`),
      ''
    )
    const m = haystack.match(re)
    if (m) return m[0]
  } catch {}
  return null
}

function applyCodeEdits(html: string, edits: CodeEdit[]): string {
  let result = html

  for (const edit of edits) {
    try {
      switch (edit.type) {
        case 'replace':
        case 'style':
          if (edit.oldCode && edit.newCode) {
            const found = tolerantFind(result, edit.oldCode)
            if (found) {
              // style edits historically did global replace; preserve that for
              // class-token swaps (e.g., changing every `violet-500` →
              // `amber-500`). For 'replace' do single-occurrence.
              if (edit.type === 'style') result = result.split(found).join(edit.newCode)
              else result = result.replace(found, edit.newCode)
            } else {
              console.warn(`[Converse] tolerantFind missed for ${edit.type}; oldCode head: ${edit.oldCode.slice(0, 80)}`)
            }
          }
          break
        case 'insert':
          if (edit.target && edit.newCode) {
            if (edit.target.includes('</body>')) {
              result = result.replace('</body>', `${edit.newCode}\n</body>`)
            } else if (edit.target.includes('</head>')) {
              result = result.replace('</head>', `${edit.newCode}\n</head>`)
            } else if (edit.target.startsWith('after ')) {
              const afterTarget = edit.target.replace('after ', '')
              const found = tolerantFind(result, afterTarget)
              if (found) result = result.replace(found, `${found}\n${edit.newCode}`)
            } else if (edit.target.startsWith('before ')) {
              const beforeTarget = edit.target.replace('before ', '')
              const found = tolerantFind(result, beforeTarget)
              if (found) result = result.replace(found, `${edit.newCode}\n${found}`)
            }
          }
          break
        case 'delete':
          if (edit.oldCode) {
            const found = tolerantFind(result, edit.oldCode)
            if (found) result = result.replace(found, '')
          }
          break
      }
    } catch (e) {
      console.error(`[Converse] Failed to apply edit:`, edit, e)
    }
  }

  return result
}

// Fix common JSON issues from AI responses
function fixJson(jsonStr: string): string {
  let fixed = jsonStr

  // Remove any text before the first {
  const firstBrace = fixed.indexOf('{')
  if (firstBrace > 0) fixed = fixed.slice(firstBrace)

  // Remove any text after the last }
  const lastBrace = fixed.lastIndexOf('}')
  if (lastBrace > 0 && lastBrace < fixed.length - 1) fixed = fixed.slice(0, lastBrace + 1)

  // Fix unescaped newlines in strings
  fixed = fixed.replace(/"([^"]*?)"/g, (match, content) => {
    const escaped = content
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
    return `"${escaped}"`
  })

  // Fix trailing commas in arrays and objects
  fixed = fixed.replace(/,\s*([}\]])/g, '$1')

  // Fix missing commas between array elements
  fixed = fixed.replace(/}\s*{/g, '},{')
  fixed = fixed.replace(/"\s*{/g, '",{')
  fixed = fixed.replace(/}\s*"/g, '},"')

  // Fix unquoted keys
  fixed = fixed.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')

  // Remove control characters
  fixed = fixed.replace(/[\x00-\x1F\x7F]/g, ' ')

  return fixed
}

// Parse AI response to extract JSON
function parseAIResponse(response: string): ConversationResponse {
  // First try to extract JSON from the response
  const jsonMatch = response.match(/\{[\s\S]*\}/)

  if (jsonMatch) {
    // Try multiple parsing strategies
    const strategies = [
      () => JSON.parse(jsonMatch[0]),
      () => JSON.parse(fixJson(jsonMatch[0])),
      () => {
        // Try to extract just the essential fields
        const typeMatch = response.match(/"type"\s*:\s*"(clarify|ready|answer|edit)"/)
        const messageMatch = response.match(/"message"\s*:\s*"([^"]*)"/)
        const intentMatch = response.match(/"intent"\s*:\s*"(website|image|video|edit|question)"/)

        if (typeMatch) {
          return {
            type: typeMatch[1],
            message: messageMatch?.[1] || 'Processing your request...',
            intent: intentMatch?.[1]
          }
        }
        throw new Error('No valid fields found')
      }
    ]

    for (const strategy of strategies) {
      try {
        const parsed = strategy()
        return {
          type: parsed.type || 'clarify',
          message: parsed.message || response.slice(0, 200),
          intent: parsed.intent,
          enhancedPrompt: parsed.enhancedPrompt,
          suggestedOptions: parsed.suggestedOptions || [],
          requirements: parsed.requirements,
          codeEdits: parsed.codeEdits,
          updatedHtml: parsed.updatedHtml,
          suggestions: parsed.suggestions,
          analysis: parsed.analysis
        }
      } catch {
        continue
      }
    }
  }

  // Last resort: extract what we can from the raw response
  console.log('[Converse] Could not parse JSON, extracting fields manually')

  const typeMatch = response.match(/"type"\s*:\s*"(clarify|ready|answer|edit)"/)
  const messageMatch = response.match(/"message"\s*:\s*"([^"]+)"/)
  const intentMatch = response.match(/"intent"\s*:\s*"(website|image|video|edit|question)"/)

  if (typeMatch) {
    return {
      type: typeMatch[1] as 'clarify' | 'ready' | 'answer' | 'edit',
      message: messageMatch?.[1] || 'I understand. Let me help you with that.',
      intent: intentMatch?.[1] as 'website' | 'image' | 'video' | 'edit' | 'question' | undefined,
      suggestedOptions: []
    }
  }

  // Absolute fallback
  return {
    type: 'clarify',
    message: "I'm here to help! What would you like to create or change?",
    suggestedOptions: []
  }
}

// Detect intent from message
function detectIntent(message: string, hasWebsite: boolean): 'website' | 'image' | 'video' | 'edit' | 'question' {
  const lower = message.toLowerCase()

  // Edit-related keywords (check first if user has a website)
  if (hasWebsite) {
    const editKeywords = ['change', 'edit', 'update', 'modify', 'make the', 'add a', 'remove', 'delete',
                          'replace', 'fix', 'move', 'resize', 'color', 'font', 'text', 'image', 'section',
                          'header', 'footer', 'background', 'button', 'link', 'style', 'bigger', 'smaller',
                          'darker', 'lighter', 'improve', 'redesign']
    if (editKeywords.some(kw => lower.includes(kw))) {
      return 'edit'
    }
  }

  if (lower.includes('video') || lower.includes('animation') || lower.includes('trailer')) {
    return 'video'
  }
  if ((lower.includes('image') || lower.includes('logo') || lower.includes('graphic')) &&
      !lower.includes('website') && !lower.includes('site')) {
    return 'image'
  }
  if (lower.startsWith('how') || lower.startsWith('what') || lower.includes('can you') ||
      lower.includes('analyze') || lower.includes('review') || lower.includes('suggest')) {
    return 'question'
  }
  return 'website'
}

export async function POST(request: NextRequest) {
  console.log('[Converse] POST request received')
  try {
    // Auth optional — anon users can refine generations. Save/deploy still gated.
    const session = await getServerSession(authOptions)

    // Rate limit: 20 AI generations per minute
    try {
      checkApiRateLimit(request, 'aiGeneration')
    } catch (error) {
      const rateLimitResponse = handleRateLimitError(error)
      if (rateLimitResponse) return rateLimitResponse
      throw error
    }

    const body: ConversationRequest = await request.json()
    const { message, history, currentHtml, model = 'hf-llama-3.2-3b', apiKey, context } = body

    // Auth is enforced by middleware for browser requests. Defensive check
    // here for direct API hits — accept session OR BYOK.
    if (!session?.user?.id && !apiKey) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          requireAuth: true,
          message: 'Sign up to keep iterating, or include your own API key in the request.',
        },
        { status: 401 }
      )
    }

    // No-op response wrapper kept for API stability with existing callers.
    const wrap = (res: NextResponse): NextResponse => res

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    // Detect intent early
    const hasWebsite = !!(currentHtml && currentHtml.length > 100)
    const detectedIntent = detectIntent(message, hasWebsite)

    // EARLY HANDLER: Direct selected element operations (bypass AI for simple CRUD)
    if (context?.selectedElement && currentHtml) {
      const lower = message.toLowerCase()
      const selectedEl = context.selectedElement
      let directResponse: ConversationResponse | null = null

      // Delete this element
      if ((lower.includes('delete') || lower.includes('remove')) &&
          (lower.includes('this') || lower.includes('element') || lower.includes('it'))) {
        if (selectedEl.outerHTML) {
          let updatedHtml = currentHtml
          // Try exact match first
          if (currentHtml.includes(selectedEl.outerHTML)) {
            updatedHtml = currentHtml.replace(selectedEl.outerHTML, '')
          } else {
            // Try normalized whitespace match
            const normalizeWs = (s: string) => s.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()
            const normalizedOuter = normalizeWs(selectedEl.outerHTML)
            const lines = currentHtml.split('\n')
            for (let i = 0; i < lines.length; i++) {
              for (let j = i; j < Math.min(i + 20, lines.length); j++) {
                const chunk = lines.slice(i, j + 1).join('\n')
                if (normalizeWs(chunk) === normalizedOuter) {
                  const before = lines.slice(0, i).join('\n')
                  const after = lines.slice(j + 1).join('\n')
                  updatedHtml = before + (before && after ? '\n' : '') + after
                  break
                }
              }
              if (updatedHtml !== currentHtml) break
            }
          }
          if (updatedHtml !== currentHtml) {
            directResponse = {
              type: 'edit',
              message: `Done! Deleted the ${selectedEl.tagName.toLowerCase()} element.`,
              codeEdits: [{ type: 'delete', oldCode: selectedEl.outerHTML, description: `Deleted ${selectedEl.tagName.toLowerCase()} element` }],
              updatedHtml
            }
          }
        }
      }
      // Duplicate this element
      else if (lower.includes('duplicate') || (lower.includes('copy') && lower.includes('this'))) {
        if (selectedEl.outerHTML && currentHtml.includes(selectedEl.outerHTML)) {
          const duplicated = selectedEl.outerHTML + '\n' + selectedEl.outerHTML
          const updatedHtml = currentHtml.replace(selectedEl.outerHTML, duplicated)
          directResponse = {
            type: 'edit',
            message: `Done! Duplicated the ${selectedEl.tagName.toLowerCase()} element.`,
            codeEdits: [{ type: 'replace', oldCode: selectedEl.outerHTML, newCode: duplicated, description: `Duplicated ${selectedEl.tagName.toLowerCase()} element` }],
            updatedHtml
          }
        }
      }
      // Make text bigger/smaller
      else if ((lower.includes('bigger') || lower.includes('larger') || lower.includes('smaller')) &&
               (lower.includes('this') || lower.includes('text'))) {
        if (selectedEl.outerHTML && currentHtml.includes(selectedEl.outerHTML)) {
          let newOuterHtml = selectedEl.outerHTML
          if (lower.includes('bigger') || lower.includes('larger')) {
            newOuterHtml = newOuterHtml
              .replace(/text-sm/g, 'text-base')
              .replace(/text-base(?!-)/g, 'text-lg')
              .replace(/text-lg/g, 'text-xl')
              .replace(/text-xl/g, 'text-2xl')
              .replace(/text-2xl/g, 'text-3xl')
              .replace(/text-3xl/g, 'text-4xl')
          } else {
            newOuterHtml = newOuterHtml
              .replace(/text-4xl/g, 'text-3xl')
              .replace(/text-3xl/g, 'text-2xl')
              .replace(/text-2xl/g, 'text-xl')
              .replace(/text-xl/g, 'text-lg')
              .replace(/text-lg/g, 'text-base')
              .replace(/text-base(?!-)/g, 'text-sm')
          }
          if (newOuterHtml !== selectedEl.outerHTML) {
            const updatedHtml = currentHtml.replace(selectedEl.outerHTML, newOuterHtml)
            directResponse = {
              type: 'edit',
              message: lower.includes('bigger') || lower.includes('larger') ? 'Done! Made the text bigger.' : 'Done! Made the text smaller.',
              codeEdits: [{ type: 'style', oldCode: selectedEl.outerHTML, newCode: newOuterHtml, description: lower.includes('bigger') ? 'Made text bigger' : 'Made text smaller' }],
              updatedHtml
            }
          }
        }
      }

      // If we handled it directly, return immediately
      if (directResponse) {
        console.log('[Converse] Handled selected element command directly:', lower.slice(0, 50))
        return wrap(NextResponse.json(directResponse))
      }
    }

    // EARLY HANDLER: Section regeneration. When the user says "rewrite the hero",
    // "redesign this section", "make pricing more aggressive", etc. — find the target
    // section, ask Claude to produce a new version, splice it in. This is the
    // Lovable-style iterative path. Runs BEFORE the section-add handler because
    // "redo the hero" should regenerate, not append a new hero.
    if (currentHtml && hasWebsite) {
      const lower = message.toLowerCase()
      const regenVerbs = /\b(rewrite|redesign|redo|regenerate|remake|reimagine|improve|polish|refresh|overhaul|update|change|replace|modernize|tighten|simplify)\b/
      const addVerb = /\b(add|insert|append|create a new|include a)\b/
      const wantsRegen = regenVerbs.test(lower) && !addVerb.test(lower)

      if (wantsRegen) {
        let targetHtml: string | null = null
        let targetLabel = ''

        // 1. Selected element wins if present and matches
        if (context?.selectedElement?.outerHTML && currentHtml.includes(context.selectedElement.outerHTML)) {
          targetHtml = context.selectedElement.outerHTML
          targetLabel = `the selected ${context.selectedElement.tagName.toLowerCase()}`
        } else {
          // 2. Look for a section name in the message
          const nameMap: Array<[string, string[]]> = [
            ['nav',         ['nav', 'navigation', 'navbar', 'header menu']],
            ['hero',        ['hero', 'banner', 'top section']],
            ['features',    ['features', 'feature section', 'feature grid']],
            ['pricing',     ['pricing', 'plans', 'price section']],
            ['testimonial', ['testimonial', 'reviews', 'social proof']],
            ['contact',     ['contact', 'contact section', 'contact form']],
            ['faq',         ['faq', 'questions', 'q&a']],
            ['cta',         ['cta', 'call to action']],
            ['team',        ['team section', 'meet the team', 'about the team']],
            ['gallery',     ['gallery', 'portfolio', 'showcase']],
            ['footer',      ['footer']],
          ]
          for (const [key, words] of nameMap) {
            if (words.some(w => lower.includes(w))) {
              const found = findSectionByName(currentHtml, key)
              if (found) {
                targetHtml = found
                targetLabel = `the ${key} section`
                break
              }
            }
          }
        }

        if (targetHtml) {
          try {
            console.log(`[Converse] Regenerating ${targetLabel} (${targetHtml.length} chars)`)
            const newSection = await regenerateSection(targetHtml, message, model, apiKey)
            if (newSection && newSection.length > 50) {
              const updatedHtml = currentHtml.replace(targetHtml, newSection)
              if (updatedHtml !== currentHtml && updatedHtml.length > 100) {
                return wrap(NextResponse.json({
                  type: 'edit',
                  message: `Done — rewrote ${targetLabel}.`,
                  codeEdits: [{
                    type: 'replace',
                    description: `Rewrote ${targetLabel}`,
                  }],
                  updatedHtml,
                } as ConversationResponse))
              }
            }
            console.warn('[Converse] Section regen produced unusable output — falling through to AI path')
          } catch (e: any) {
            console.warn('[Converse] Section regen error:', e?.message || e)
            // Fall through to existing AI path
          }
        }
      }
    }

    // EARLY HANDLER: Direct section additions (bypass AI for common requests)
    if (currentHtml && context?.hasWebsite) {
      const lower = message.toLowerCase()
      let directResponse: ConversationResponse | null = null
      let updatedHtml = currentHtml

      // Add hero section
      if (lower.includes('hero') && (lower.includes('section') || lower.includes('add'))) {
        const heroSection = `<section class="min-h-screen bg-gradient-to-br from-slate-900 via-violet-900/20 to-slate-900 flex items-center justify-center relative overflow-hidden">
  <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_50%)]"></div>
  <div class="max-w-4xl mx-auto px-6 text-center relative z-10">
    <h1 class="text-5xl md:text-7xl font-bold text-white mb-6">Build Something Amazing</h1>
    <p class="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">Create beautiful, responsive websites in minutes with our AI-powered website builder.</p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <a href="#features" class="px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-violet-500/25">Get Started</a>
      <a href="#demo" class="px-8 py-4 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/5 transition-colors">Watch Demo</a>
    </div>
  </div>
</section>`
        const headerMatch = updatedHtml.match(/<\/(header|nav)>/)
        if (headerMatch) {
          updatedHtml = updatedHtml.replace(headerMatch[0], headerMatch[0] + '\n' + heroSection)
        } else if (updatedHtml.includes('<body')) {
          updatedHtml = updatedHtml.replace(/<body[^>]*>/, (match) => match + '\n' + heroSection)
        }
        directResponse = {
          type: 'edit',
          message: 'Done! Added a stunning hero section with gradient background and CTA buttons.',
          codeEdits: [{ type: 'insert', target: 'after header', newCode: heroSection, description: 'Added hero section' }],
          updatedHtml
        }
      }
      // Add contact section
      else if (lower.includes('contact') && (lower.includes('section') || lower.includes('add'))) {
        const contactSection = `<section class="py-20 bg-slate-800">
  <div class="max-w-4xl mx-auto px-6 text-center">
    <h2 class="text-3xl font-bold text-white mb-4">Contact Us</h2>
    <p class="text-slate-400 mb-8">Get in touch with our team</p>
    <form class="max-w-md mx-auto space-y-4">
      <input type="text" placeholder="Your Name" class="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-violet-500">
      <input type="email" placeholder="Email Address" class="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-violet-500">
      <textarea placeholder="Your Message" rows="4" class="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 resize-none"></textarea>
      <button type="submit" class="w-full px-6 py-3 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-500 transition-colors">Send Message</button>
    </form>
  </div>
</section>`
        const footerMatch = updatedHtml.match(/<footer[^>]*>/)
        if (footerMatch) {
          updatedHtml = updatedHtml.replace(footerMatch[0], contactSection + '\n' + footerMatch[0])
        } else if (updatedHtml.includes('</body>')) {
          updatedHtml = updatedHtml.replace('</body>', contactSection + '\n</body>')
        }
        directResponse = {
          type: 'edit',
          message: 'Done! Added a contact section with a form.',
          codeEdits: [{ type: 'insert', target: 'before footer', newCode: contactSection, description: 'Added contact section' }],
          updatedHtml
        }
      }
      // Add features section
      else if (lower.includes('feature') && (lower.includes('section') || lower.includes('add'))) {
        const featuresSection = `<section class="py-20 bg-slate-900">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="text-3xl font-bold text-white text-center mb-12">Features</h2>
    <div class="grid md:grid-cols-3 gap-8">
      <div class="p-6 rounded-xl bg-slate-800 border border-slate-700">
        <div class="w-12 h-12 bg-violet-600/20 rounded-lg flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        </div>
        <h3 class="text-xl font-semibold text-white mb-2">Lightning Fast</h3>
        <p class="text-slate-400">Built for speed and performance with modern technologies.</p>
      </div>
      <div class="p-6 rounded-xl bg-slate-800 border border-slate-700">
        <div class="w-12 h-12 bg-violet-600/20 rounded-lg flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
        </div>
        <h3 class="text-xl font-semibold text-white mb-2">Secure</h3>
        <p class="text-slate-400">Enterprise-grade security to protect your data.</p>
      </div>
      <div class="p-6 rounded-xl bg-slate-800 border border-slate-700">
        <div class="w-12 h-12 bg-violet-600/20 rounded-lg flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
        </div>
        <h3 class="text-xl font-semibold text-white mb-2">Team Collaboration</h3>
        <p class="text-slate-400">Work together seamlessly with your team.</p>
      </div>
    </div>
  </div>
</section>`
        const footerMatch = updatedHtml.match(/<footer[^>]*>/)
        if (footerMatch) {
          updatedHtml = updatedHtml.replace(footerMatch[0], featuresSection + '\n' + footerMatch[0])
        } else if (updatedHtml.includes('</body>')) {
          updatedHtml = updatedHtml.replace('</body>', featuresSection + '\n</body>')
        }
        directResponse = {
          type: 'edit',
          message: 'Done! Added a features section with 3 feature cards.',
          codeEdits: [{ type: 'insert', target: 'before footer', newCode: featuresSection, description: 'Added features section' }],
          updatedHtml
        }
      }
      // Add pricing section
      else if (lower.includes('pricing') && (lower.includes('section') || lower.includes('add'))) {
        const pricingSection = `<section class="py-20 bg-slate-900">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="text-3xl font-bold text-white text-center mb-4">Pricing</h2>
    <p class="text-slate-400 text-center mb-12">Choose the perfect plan for your needs</p>
    <div class="grid md:grid-cols-3 gap-8">
      <div class="p-8 rounded-xl bg-slate-800 border border-slate-700">
        <h3 class="text-xl font-semibold text-white mb-2">Starter</h3>
        <div class="flex items-baseline gap-1 mb-6"><span class="text-4xl font-bold text-white">$9</span><span class="text-slate-400">/month</span></div>
        <ul class="space-y-3 mb-8 text-slate-300"><li>✓ 5 Projects</li><li>✓ Basic Analytics</li><li>✓ Email Support</li></ul>
        <button class="w-full py-3 border border-violet-500 text-violet-400 font-semibold rounded-lg hover:bg-violet-500/10 transition-colors">Get Started</button>
      </div>
      <div class="p-8 rounded-xl bg-violet-600 border border-violet-500 relative">
        <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-violet-400 text-violet-900 text-xs font-semibold rounded-full">POPULAR</div>
        <h3 class="text-xl font-semibold text-white mb-2">Pro</h3>
        <div class="flex items-baseline gap-1 mb-6"><span class="text-4xl font-bold text-white">$29</span><span class="text-violet-200">/month</span></div>
        <ul class="space-y-3 mb-8 text-white"><li>✓ Unlimited Projects</li><li>✓ Advanced Analytics</li><li>✓ Priority Support</li><li>✓ Custom Domain</li></ul>
        <button class="w-full py-3 bg-white text-violet-600 font-semibold rounded-lg hover:bg-violet-50 transition-colors">Get Started</button>
      </div>
      <div class="p-8 rounded-xl bg-slate-800 border border-slate-700">
        <h3 class="text-xl font-semibold text-white mb-2">Enterprise</h3>
        <div class="flex items-baseline gap-1 mb-6"><span class="text-4xl font-bold text-white">$99</span><span class="text-slate-400">/month</span></div>
        <ul class="space-y-3 mb-8 text-slate-300"><li>✓ Everything in Pro</li><li>✓ Dedicated Support</li><li>✓ SLA Guarantee</li><li>✓ Custom Integrations</li></ul>
        <button class="w-full py-3 border border-violet-500 text-violet-400 font-semibold rounded-lg hover:bg-violet-500/10 transition-colors">Contact Sales</button>
      </div>
    </div>
  </div>
</section>`
        const footerMatch = updatedHtml.match(/<footer[^>]*>/)
        if (footerMatch) {
          updatedHtml = updatedHtml.replace(footerMatch[0], pricingSection + '\n' + footerMatch[0])
        } else if (updatedHtml.includes('</body>')) {
          updatedHtml = updatedHtml.replace('</body>', pricingSection + '\n</body>')
        }
        directResponse = {
          type: 'edit',
          message: 'Done! Added a pricing section with 3 tiers.',
          codeEdits: [{ type: 'insert', target: 'before footer', newCode: pricingSection, description: 'Added pricing section' }],
          updatedHtml
        }
      }

      // If we handled it directly, return immediately
      if (directResponse) {
        console.log('[Converse] Handled section addition directly:', lower.slice(0, 50))
        return wrap(NextResponse.json(directResponse))
      }
    }

    // Build conversation messages
    const messages: { role: 'user' | 'assistant'; content: string }[] = []

    // Add website context if available
    if (hasWebsite && currentHtml) {
      const analysis = analyzeHtml(currentHtml)
      const summary = summarizeHtml(currentHtml, 1500)

      messages.push({
        role: 'user',
        content: `[CURRENT WEBSITE CONTEXT]
The user has an existing website. Here's the analysis:

**Sections:** ${analysis.sections.join(', ') || 'None detected'}
**Colors used:** ${analysis.colors.slice(0, 5).join(', ') || 'Various'}
**Fonts:** ${analysis.fonts.join(', ') || 'Default'}
**Strengths:** ${analysis.strengths.join(', ') || 'N/A'}
**Issues:** ${analysis.issues.join(', ') || 'None'}

**Current HTML (summarized):**
\`\`\`html
${summary}
\`\`\`

When the user asks to edit, provide specific codeEdits with exact code to find and replace.`
      })
    }

    // Add selected element context if available
    if (context?.selectedElement) {
      messages.push({
        role: 'user',
        content: `[SELECTED ELEMENT]
User has selected: <${context.selectedElement.tagName}>
Text: "${context.selectedElement.textContent?.slice(0, 100) || ''}"
${context.selectedElement.outerHTML ? `HTML: ${context.selectedElement.outerHTML.slice(0, 300)}` : ''}`
      })
    }

    // Add multi-page context so nav/footer edits link to all sibling pages
    if (context?.siblingPages && context.siblingPages.length > 1) {
      const pageList = context.siblingPages
        .map(p => `- ${p.name} → href="${p.isHome ? '/' : `/${p.slug}`}"`)
        .join('\n')
      const cur = context.currentPage
      messages.push({
        role: 'user',
        content: `[MULTI-PAGE SITE]
This site has ${context.siblingPages.length} pages:
${pageList}

${cur ? `The user is currently editing the "${cur.name}" page (slug: ${cur.slug}).` : ''}
When the user asks to edit nav, header, or footer, link to each sibling page using its real /slug href above — not anchor links like #about. Style the link for the current page (${cur?.slug || 'this page'}) as active.`
      })
    }

    // Add history
    for (const msg of history.slice(-8)) {
      messages.push({ role: msg.role, content: msg.content })
    }

    // Add current message
    messages.push({ role: 'user', content: message })

    // Check if user wants to force build
    const lowerMessage = message.toLowerCase()
    const wantsToBuild = lowerMessage.includes('build it') ||
                         lowerMessage.includes('create it') ||
                         lowerMessage.includes('go ahead') ||
                         lowerMessage.includes('proceed') ||
                         lowerMessage.includes('just build') ||
                         lowerMessage.includes('generate it')

    // Get AI response
    const aiResponse = await getAIResponse(messages, model, apiKey)
    let parsed = parseAIResponse(aiResponse)

    // Ensure intent is set
    if (!parsed.intent) {
      parsed.intent = detectedIntent
    }

    // Apply code edits if present and we have HTML
    let codeEditsMissed = false
    if (parsed.type === 'edit' && parsed.codeEdits && parsed.codeEdits.length > 0 && currentHtml) {
      const updatedHtml = applyCodeEdits(currentHtml, parsed.codeEdits)
      if (updatedHtml !== currentHtml) {
        parsed.updatedHtml = updatedHtml
      } else {
        // applyCodeEdits already tries tolerant matching (whitespace + quote
        // flexible). If we STILL didn't change anything, the model's snippets
        // genuinely don't appear in the HTML. Don't bail yet — let the
        // intent-based fallback below take a shot first.
        console.warn('[Converse] codeEdits did not match even with tolerant matcher; trying intent fallback')
        codeEditsMissed = true
      }
    }

    // FALLBACK: Direct edit handling when AI doesn't return proper codeEdits,
    // OR when applyCodeEdits couldn't locate the oldCode in the live HTML.
    if (parsed.type === 'edit' && (!parsed.codeEdits || parsed.codeEdits.length === 0 || codeEditsMissed) && currentHtml) {
      const lower = message.toLowerCase()
      let fallbackHtml = currentHtml
      let fallbackEdit: CodeEdit | null = null

      // Background image to hero/header
      if ((lower.includes('background') || lower.includes('hero')) && (lower.includes('image') || lower.includes('photo'))) {
        const imageUrl = 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&q=80'

        // Find hero section or first section
        const heroMatch = currentHtml.match(/<section[^>]*class="([^"]*)"[^>]*>/) ||
                          currentHtml.match(/<header[^>]*class="([^"]*)"[^>]*>/)
        if (heroMatch) {
          const fullMatch = heroMatch[0]
          const oldClass = heroMatch[1]

          if (fullMatch.includes('style="')) {
            const updated = fullMatch.replace(/style="([^"]*)"/, `style="$1; background-image: url('${imageUrl}'); background-size: cover; background-position: center;"`)
            fallbackHtml = currentHtml.replace(fullMatch, updated)
          } else {
            const newClass = oldClass + ' bg-cover bg-center relative min-h-[60vh]'
            const updated = fullMatch.replace(`class="${oldClass}"`, `class="${newClass}" style="background-image: url('${imageUrl}')"`)
            fallbackHtml = currentHtml.replace(fullMatch, updated)
          }
          fallbackEdit = { type: 'style', description: 'Added background image to hero section', newCode: imageUrl }
          parsed.message = 'Done! Added a background image to the hero section. You can change it by dragging a new image or asking me to use a different one.'
        }
      }
      // Change color requests
      else if (lower.includes('change') && (lower.includes('color') || lower.includes('blue') || lower.includes('red') || lower.includes('green') || lower.includes('purple'))) {
        let targetColor = 'violet'
        if (lower.includes('blue')) targetColor = 'blue'
        else if (lower.includes('red')) targetColor = 'red'
        else if (lower.includes('green')) targetColor = 'green'
        else if (lower.includes('purple') || lower.includes('violet')) targetColor = 'violet'
        else if (lower.includes('orange')) targetColor = 'orange'
        else if (lower.includes('pink')) targetColor = 'pink'

        // Replace common color classes
        fallbackHtml = currentHtml
          .replace(/bg-violet-/g, `bg-${targetColor}-`)
          .replace(/bg-blue-/g, `bg-${targetColor}-`)
          .replace(/bg-emerald-/g, `bg-${targetColor}-`)
          .replace(/text-violet-/g, `text-${targetColor}-`)
          .replace(/text-blue-/g, `text-${targetColor}-`)
          .replace(/border-violet-/g, `border-${targetColor}-`)
          .replace(/border-blue-/g, `border-${targetColor}-`)

        if (fallbackHtml !== currentHtml) {
          fallbackEdit = { type: 'style', description: `Changed accent color to ${targetColor}` }
          parsed.message = `Done! Changed the accent colors to ${targetColor}.`
        }
      }
      // Make section larger/full screen
      else if (lower.includes('larger') || lower.includes('bigger') || lower.includes('full') && lower.includes('screen')) {
        const sectionMatch = currentHtml.match(/<section[^>]*class="([^"]*)"/)
        if (sectionMatch) {
          const oldClass = sectionMatch[1]
          let newClass = oldClass
          if (!oldClass.includes('min-h-screen')) {
            newClass = oldClass.replace(/min-h-\[[^\]]+\]|py-\d+/, '') + ' min-h-screen flex items-center'
          }
          if (newClass !== oldClass) {
            fallbackHtml = currentHtml.replace(sectionMatch[0], sectionMatch[0].replace(oldClass, newClass))
            fallbackEdit = { type: 'style', description: 'Made section full screen' }
            parsed.message = 'Done! Made the section full screen height.'
          }
        }
      }

      // Apply fallback if generated
      if (fallbackEdit && fallbackHtml !== currentHtml) {
        parsed.codeEdits = [fallbackEdit]
        parsed.updatedHtml = fallbackHtml
        console.log('[Converse] Applied direct fallback edit:', fallbackEdit.description)
      }
    }

    // Fallback: Generate edits for common requests when AI doesn't provide them
    if (parsed.type === 'edit' && (!parsed.codeEdits || parsed.codeEdits.length === 0) && currentHtml) {
      const lower = message.toLowerCase()
      let fallbackEdit: CodeEdit | null = null
      let fallbackHtml = currentHtml

      // Contact section
      if (lower.includes('contact') && lower.includes('section')) {
        const contactSection = `<section class="py-20 bg-slate-800">
  <div class="max-w-4xl mx-auto px-6 text-center">
    <h2 class="text-3xl font-bold text-white mb-4">Get In Touch</h2>
    <p class="text-slate-400 mb-8">Have a question or want to work together? We'd love to hear from you.</p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <a href="mailto:hello@example.com" class="px-8 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition-colors font-medium">Email Us</a>
      <a href="tel:+1234567890" class="px-8 py-3 border border-slate-600 text-white rounded-lg hover:border-slate-500 transition-colors font-medium">Call Us</a>
    </div>
  </div>
</section>`
        fallbackEdit = { type: 'insert', target: 'before <footer', newCode: contactSection, description: 'Added contact section' }
        // Insert before footer tag (not inside it)
        const footerMatch = fallbackHtml.match(/<footer[^>]*>/)
        if (footerMatch) {
          fallbackHtml = fallbackHtml.replace(footerMatch[0], contactSection + '\n' + footerMatch[0])
        } else if (fallbackHtml.includes('</body>')) {
          fallbackHtml = fallbackHtml.replace('</body>', contactSection + '\n</body>')
        }
        parsed.message = 'Done! Added a contact section with email and phone links.'
      }
      // Testimonials section
      else if (lower.includes('testimonial')) {
        const testimonialSection = `<section class="py-20 bg-slate-900">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="text-3xl font-bold text-white text-center mb-12">What Our Clients Say</h2>
    <div class="grid md:grid-cols-3 gap-8">
      <div class="bg-slate-800 p-6 rounded-xl">
        <p class="text-slate-300 mb-4">"Exceptional service and results. Highly recommended!"</p>
        <p class="text-white font-medium">- Sarah J.</p>
      </div>
      <div class="bg-slate-800 p-6 rounded-xl">
        <p class="text-slate-300 mb-4">"They exceeded our expectations in every way."</p>
        <p class="text-white font-medium">- Mike R.</p>
      </div>
      <div class="bg-slate-800 p-6 rounded-xl">
        <p class="text-slate-300 mb-4">"Professional, efficient, and great communication."</p>
        <p class="text-white font-medium">- Emily T.</p>
      </div>
    </div>
  </div>
</section>`
        fallbackEdit = { type: 'insert', target: 'before <footer', newCode: testimonialSection, description: 'Added testimonials section' }
        const footerMatch = fallbackHtml.match(/<footer[^>]*>/)
        if (footerMatch) {
          fallbackHtml = fallbackHtml.replace(footerMatch[0], testimonialSection + '\n' + footerMatch[0])
        } else if (fallbackHtml.includes('</body>')) {
          fallbackHtml = fallbackHtml.replace('</body>', testimonialSection + '\n</body>')
        }
        parsed.message = 'Done! Added a testimonials section with 3 client quotes.'
      }
      // Pricing section
      else if (lower.includes('pricing')) {
        const pricingSection = `<section class="py-20 bg-slate-800">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="text-3xl font-bold text-white text-center mb-12">Simple Pricing</h2>
    <div class="grid md:grid-cols-3 gap-8">
      <div class="bg-slate-900 p-8 rounded-xl text-center">
        <h3 class="text-xl font-bold text-white mb-2">Starter</h3>
        <p class="text-4xl font-bold text-violet-400 mb-4">$29<span class="text-lg text-slate-400">/mo</span></p>
        <ul class="text-slate-400 space-y-2 mb-6"><li>5 Projects</li><li>Basic Support</li><li>1 User</li></ul>
        <a href="#" class="block px-6 py-3 border border-violet-600 text-violet-400 rounded-lg hover:bg-violet-600 hover:text-white transition-colors">Get Started</a>
      </div>
      <div class="bg-violet-600 p-8 rounded-xl text-center transform scale-105">
        <h3 class="text-xl font-bold text-white mb-2">Pro</h3>
        <p class="text-4xl font-bold text-white mb-4">$79<span class="text-lg text-violet-200">/mo</span></p>
        <ul class="text-violet-100 space-y-2 mb-6"><li>Unlimited Projects</li><li>Priority Support</li><li>5 Users</li></ul>
        <a href="#" class="block px-6 py-3 bg-white text-violet-600 rounded-lg hover:bg-violet-100 transition-colors font-medium">Get Started</a>
      </div>
      <div class="bg-slate-900 p-8 rounded-xl text-center">
        <h3 class="text-xl font-bold text-white mb-2">Enterprise</h3>
        <p class="text-4xl font-bold text-violet-400 mb-4">$199<span class="text-lg text-slate-400">/mo</span></p>
        <ul class="text-slate-400 space-y-2 mb-6"><li>Everything in Pro</li><li>24/7 Support</li><li>Unlimited Users</li></ul>
        <a href="#" class="block px-6 py-3 border border-violet-600 text-violet-400 rounded-lg hover:bg-violet-600 hover:text-white transition-colors">Contact Us</a>
      </div>
    </div>
  </div>
</section>`
        fallbackEdit = { type: 'insert', target: 'before <footer', newCode: pricingSection, description: 'Added pricing section' }
        const footerMatch = fallbackHtml.match(/<footer[^>]*>/)
        if (footerMatch) {
          fallbackHtml = fallbackHtml.replace(footerMatch[0], pricingSection + '\n' + footerMatch[0])
        } else if (fallbackHtml.includes('</body>')) {
          fallbackHtml = fallbackHtml.replace('</body>', pricingSection + '\n</body>')
        }
        parsed.message = 'Done! Added a pricing section with 3 tiers.'
      }
      // FAQ section
      else if (lower.includes('faq') || lower.includes('question')) {
        const faqSection = `<section class="py-20 bg-slate-900">
  <div class="max-w-3xl mx-auto px-6">
    <h2 class="text-3xl font-bold text-white text-center mb-12">Frequently Asked Questions</h2>
    <div class="space-y-4">
      <details class="bg-slate-800 rounded-lg p-4 group">
        <summary class="font-medium text-white cursor-pointer">How do I get started?</summary>
        <p class="text-slate-400 mt-3">Simply sign up for an account and follow our quick setup guide. We'll have you up and running in minutes.</p>
      </details>
      <details class="bg-slate-800 rounded-lg p-4">
        <summary class="font-medium text-white cursor-pointer">What payment methods do you accept?</summary>
        <p class="text-slate-400 mt-3">We accept all major credit cards, PayPal, and bank transfers for enterprise customers.</p>
      </details>
      <details class="bg-slate-800 rounded-lg p-4">
        <summary class="font-medium text-white cursor-pointer">Can I cancel anytime?</summary>
        <p class="text-slate-400 mt-3">Yes! You can cancel your subscription at any time with no hidden fees or penalties.</p>
      </details>
    </div>
  </div>
</section>`
        fallbackEdit = { type: 'insert', target: 'before <footer', newCode: faqSection, description: 'Added FAQ section' }
        const footerMatch = fallbackHtml.match(/<footer[^>]*>/)
        if (footerMatch) {
          fallbackHtml = fallbackHtml.replace(footerMatch[0], faqSection + '\n' + footerMatch[0])
        } else if (fallbackHtml.includes('</body>')) {
          fallbackHtml = fallbackHtml.replace('</body>', faqSection + '\n</body>')
        }
        parsed.message = 'Done! Added an FAQ section with expandable questions.'
      }
      // Team section
      else if (lower.includes('team') && (lower.includes('section') || lower.includes('add'))) {
        const teamSection = `<section class="py-20 bg-slate-900">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="text-3xl font-bold text-white text-center mb-4">Meet Our Team</h2>
    <p class="text-slate-400 text-center mb-12 max-w-2xl mx-auto">The talented people behind our success</p>
    <div class="grid md:grid-cols-4 gap-8">
      <div class="text-center">
        <img src="https://i.pravatar.cc/150?img=1" alt="Team member" class="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-violet-500">
        <h3 class="text-white font-semibold">John Smith</h3>
        <p class="text-slate-400 text-sm">CEO & Founder</p>
      </div>
      <div class="text-center">
        <img src="https://i.pravatar.cc/150?img=5" alt="Team member" class="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-violet-500">
        <h3 class="text-white font-semibold">Sarah Johnson</h3>
        <p class="text-slate-400 text-sm">Lead Designer</p>
      </div>
      <div class="text-center">
        <img src="https://i.pravatar.cc/150?img=3" alt="Team member" class="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-violet-500">
        <h3 class="text-white font-semibold">Mike Chen</h3>
        <p class="text-slate-400 text-sm">Tech Lead</p>
      </div>
      <div class="text-center">
        <img src="https://i.pravatar.cc/150?img=9" alt="Team member" class="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-violet-500">
        <h3 class="text-white font-semibold">Emily Davis</h3>
        <p class="text-slate-400 text-sm">Marketing Director</p>
      </div>
    </div>
  </div>
</section>`
        fallbackEdit = { type: 'insert', target: 'before <footer', newCode: teamSection, description: 'Added team section' }
        const footerMatch = fallbackHtml.match(/<footer[^>]*>/)
        if (footerMatch) {
          fallbackHtml = fallbackHtml.replace(footerMatch[0], teamSection + '\n' + footerMatch[0])
        } else if (fallbackHtml.includes('</body>')) {
          fallbackHtml = fallbackHtml.replace('</body>', teamSection + '\n</body>')
        }
        parsed.message = 'Done! Added a team section with 4 team members.'
      }
      // Gallery/portfolio section
      else if (lower.includes('gallery') || lower.includes('portfolio') || lower.includes('showcase')) {
        const gallerySection = `<section class="py-20 bg-slate-800">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="text-3xl font-bold text-white text-center mb-12">Our Work</h2>
    <div class="grid md:grid-cols-3 gap-6">
      <img src="https://picsum.photos/seed/work1/400/300" alt="Project 1" class="w-full h-64 object-cover rounded-xl hover:scale-105 transition-transform duration-300 cursor-pointer">
      <img src="https://picsum.photos/seed/work2/400/300" alt="Project 2" class="w-full h-64 object-cover rounded-xl hover:scale-105 transition-transform duration-300 cursor-pointer">
      <img src="https://picsum.photos/seed/work3/400/300" alt="Project 3" class="w-full h-64 object-cover rounded-xl hover:scale-105 transition-transform duration-300 cursor-pointer">
      <img src="https://picsum.photos/seed/work4/400/300" alt="Project 4" class="w-full h-64 object-cover rounded-xl hover:scale-105 transition-transform duration-300 cursor-pointer">
      <img src="https://picsum.photos/seed/work5/400/300" alt="Project 5" class="w-full h-64 object-cover rounded-xl hover:scale-105 transition-transform duration-300 cursor-pointer">
      <img src="https://picsum.photos/seed/work6/400/300" alt="Project 6" class="w-full h-64 object-cover rounded-xl hover:scale-105 transition-transform duration-300 cursor-pointer">
    </div>
  </div>
</section>`
        fallbackEdit = { type: 'insert', target: 'before <footer', newCode: gallerySection, description: 'Added gallery section' }
        const footerMatch = fallbackHtml.match(/<footer[^>]*>/)
        if (footerMatch) {
          fallbackHtml = fallbackHtml.replace(footerMatch[0], gallerySection + '\n' + footerMatch[0])
        } else if (fallbackHtml.includes('</body>')) {
          fallbackHtml = fallbackHtml.replace('</body>', gallerySection + '\n</body>')
        }
        parsed.message = 'Done! Added a gallery section with 6 images.'
      }
      // Add a CTA/button
      else if ((lower.includes('cta') || lower.includes('call to action')) && lower.includes('add')) {
        const ctaSection = `<section class="py-20 bg-gradient-to-r from-violet-600 to-indigo-600">
  <div class="max-w-4xl mx-auto px-6 text-center">
    <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
    <p class="text-violet-100 mb-8 text-lg">Join thousands of satisfied customers today.</p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <a href="#contact" class="px-8 py-4 bg-white text-violet-600 font-semibold rounded-xl hover:bg-violet-50 transition-colors shadow-lg">Get Started Free</a>
      <a href="#features" class="px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-colors">Learn More</a>
    </div>
  </div>
</section>`
        fallbackEdit = { type: 'insert', target: 'before <footer', newCode: ctaSection, description: 'Added CTA section' }
        const footerMatch = fallbackHtml.match(/<footer[^>]*>/)
        if (footerMatch) {
          fallbackHtml = fallbackHtml.replace(footerMatch[0], ctaSection + '\n' + footerMatch[0])
        } else if (fallbackHtml.includes('</body>')) {
          fallbackHtml = fallbackHtml.replace('</body>', ctaSection + '\n</body>')
        }
        parsed.message = 'Done! Added a call-to-action section with gradient background.'
      }
      // Make header sticky
      else if (lower.includes('sticky') && (lower.includes('header') || lower.includes('nav'))) {
        const headerMatch = fallbackHtml.match(/<(header|nav)[^>]*class="([^"]*)"/)
        if (headerMatch) {
          const tag = headerMatch[1]
          const oldClass = headerMatch[2]
          if (!oldClass.includes('fixed') && !oldClass.includes('sticky')) {
            const newClass = oldClass + ' fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-slate-900/80'
            fallbackHtml = fallbackHtml.replace(headerMatch[0], headerMatch[0].replace(oldClass, newClass))
            fallbackEdit = { type: 'style', description: 'Made header sticky' }
            parsed.message = 'Done! Made the header sticky with a blur effect.'
          }
        }
      }
      // Add hero section
      else if (lower.includes('hero') && (lower.includes('section') || lower.includes('add'))) {
        const heroSection = `<section class="min-h-screen bg-gradient-to-br from-slate-900 via-violet-900/20 to-slate-900 flex items-center justify-center relative overflow-hidden">
  <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_50%)]"></div>
  <div class="max-w-4xl mx-auto px-6 text-center relative z-10">
    <h1 class="text-5xl md:text-7xl font-bold text-white mb-6">Build Something Amazing</h1>
    <p class="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">Create beautiful, responsive websites in minutes with our AI-powered website builder.</p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <a href="#features" class="px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-violet-500/25">Get Started</a>
      <a href="#demo" class="px-8 py-4 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/5 transition-colors">Watch Demo</a>
    </div>
  </div>
</section>`
        // Insert after header or at start of body
        const headerMatch = fallbackHtml.match(/<\/(header|nav)>/)
        if (headerMatch) {
          fallbackHtml = fallbackHtml.replace(headerMatch[0], headerMatch[0] + '\n' + heroSection)
        } else if (fallbackHtml.includes('<body')) {
          fallbackHtml = fallbackHtml.replace(/<body[^>]*>/, (match) => match + '\n' + heroSection)
        }
        fallbackEdit = { type: 'insert', target: 'after header', newCode: heroSection, description: 'Added hero section' }
        parsed.message = 'Done! Added a stunning hero section with gradient background and CTA buttons.'
      }
      // Add social media links
      else if (lower.includes('social') && (lower.includes('add') || lower.includes('link'))) {
        const socialHtml = `<div class="flex gap-4 justify-center mt-6">
  <a href="#" class="w-10 h-10 bg-slate-700 hover:bg-violet-600 rounded-full flex items-center justify-center transition-colors">
    <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
  </a>
  <a href="#" class="w-10 h-10 bg-slate-700 hover:bg-violet-600 rounded-full flex items-center justify-center transition-colors">
    <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
  </a>
  <a href="#" class="w-10 h-10 bg-slate-700 hover:bg-violet-600 rounded-full flex items-center justify-center transition-colors">
    <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
  </a>
</div>`
        // Add to footer
        const footerMatch = fallbackHtml.match(/<footer[^>]*>[\s\S]*?<\/footer>/)
        if (footerMatch) {
          const oldFooter = footerMatch[0]
          const closingDiv = oldFooter.lastIndexOf('</div>')
          if (closingDiv > -1) {
            const newFooter = oldFooter.slice(0, closingDiv) + socialHtml + oldFooter.slice(closingDiv)
            fallbackHtml = fallbackHtml.replace(oldFooter, newFooter)
            fallbackEdit = { type: 'replace', description: 'Added social media links to footer' }
            parsed.message = 'Done! Added social media links (Twitter, Instagram, LinkedIn) to the footer.'
          }
        }
      }

      // Apply fallback if we generated one
      if (fallbackEdit && fallbackHtml !== currentHtml) {
        parsed.codeEdits = [fallbackEdit]
        parsed.updatedHtml = fallbackHtml
      }
    }

    // Fallback: Handle selected element operations when AI doesn't return proper edits
    if (parsed.type === 'edit' && (!parsed.codeEdits || parsed.codeEdits.length === 0) && currentHtml && context?.selectedElement) {
      const lower = message.toLowerCase()
      const selectedEl = context.selectedElement
      let fallbackEdit: CodeEdit | null = null
      let fallbackHtml = currentHtml

      // Delete this element
      if ((lower.includes('delete') || lower.includes('remove')) && (lower.includes('this') || lower.includes('element') || lower.includes('it'))) {
        if (selectedEl.outerHTML && fallbackHtml.includes(selectedEl.outerHTML)) {
          fallbackHtml = fallbackHtml.replace(selectedEl.outerHTML, '')
          fallbackEdit = { type: 'delete', oldCode: selectedEl.outerHTML, description: `Deleted ${selectedEl.tagName.toLowerCase()} element` }
          parsed.message = `Done! Deleted the ${selectedEl.tagName.toLowerCase()} element.`
        }
      }
      // Duplicate this element
      else if (lower.includes('duplicate') || lower.includes('copy') && lower.includes('this')) {
        if (selectedEl.outerHTML && fallbackHtml.includes(selectedEl.outerHTML)) {
          fallbackHtml = fallbackHtml.replace(selectedEl.outerHTML, selectedEl.outerHTML + '\n' + selectedEl.outerHTML)
          fallbackEdit = { type: 'replace', oldCode: selectedEl.outerHTML, newCode: selectedEl.outerHTML + '\n' + selectedEl.outerHTML, description: `Duplicated ${selectedEl.tagName.toLowerCase()} element` }
          parsed.message = `Done! Duplicated the ${selectedEl.tagName.toLowerCase()} element.`
        }
      }
      // Change this image
      else if (selectedEl.tagName === 'IMG' && (lower.includes('change') || lower.includes('replace')) && (lower.includes('image') || lower.includes('this'))) {
        const newImageUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800'
        if (selectedEl.outerHTML && fallbackHtml.includes(selectedEl.outerHTML)) {
          const srcMatch = selectedEl.outerHTML.match(/src=["']([^"']+)["']/)
          if (srcMatch) {
            const newOuterHtml = selectedEl.outerHTML.replace(srcMatch[1], newImageUrl)
            fallbackHtml = fallbackHtml.replace(selectedEl.outerHTML, newOuterHtml)
            fallbackEdit = { type: 'replace', oldCode: selectedEl.outerHTML, newCode: newOuterHtml, description: 'Changed image' }
            parsed.message = 'Done! Changed the image. You can drag a new image to replace it.'
          }
        }
      }
      // Make text bigger/smaller
      else if ((lower.includes('bigger') || lower.includes('larger') || lower.includes('smaller') || lower.includes('size')) && lower.includes('this')) {
        if (selectedEl.outerHTML && fallbackHtml.includes(selectedEl.outerHTML)) {
          let newOuterHtml = selectedEl.outerHTML
          if (lower.includes('bigger') || lower.includes('larger')) {
            // Increase text size
            newOuterHtml = newOuterHtml
              .replace(/text-sm/g, 'text-base')
              .replace(/text-base(?!-)/g, 'text-lg')
              .replace(/text-lg/g, 'text-xl')
              .replace(/text-xl/g, 'text-2xl')
              .replace(/text-2xl/g, 'text-3xl')
              .replace(/text-3xl/g, 'text-4xl')
          } else {
            // Decrease text size
            newOuterHtml = newOuterHtml
              .replace(/text-4xl/g, 'text-3xl')
              .replace(/text-3xl/g, 'text-2xl')
              .replace(/text-2xl/g, 'text-xl')
              .replace(/text-xl/g, 'text-lg')
              .replace(/text-lg/g, 'text-base')
              .replace(/text-base(?!-)/g, 'text-sm')
          }
          if (newOuterHtml !== selectedEl.outerHTML) {
            fallbackHtml = fallbackHtml.replace(selectedEl.outerHTML, newOuterHtml)
            fallbackEdit = { type: 'style', oldCode: selectedEl.outerHTML, newCode: newOuterHtml, description: lower.includes('bigger') ? 'Made text bigger' : 'Made text smaller' }
            parsed.message = lower.includes('bigger') ? 'Done! Made the text bigger.' : 'Done! Made the text smaller.'
          }
        }
      }

      // Apply selected element fallback
      if (fallbackEdit && fallbackHtml !== currentHtml) {
        parsed.codeEdits = [fallbackEdit]
        parsed.updatedHtml = fallbackHtml
      }
    }

    // FINAL CHECK — if the user's request was an edit but NEITHER the LLM's
    // code edits matched (via tolerant matcher) NOR any fallback handler
    // produced an update, ONLY NOW downgrade to "couldn't find" with a
    // helpful clarifying message. Before this final check, every cheaper
    // path has had a shot.
    if (
      parsed.type === 'edit' &&
      currentHtml &&
      !parsed.updatedHtml &&
      (codeEditsMissed || !parsed.codeEdits || parsed.codeEdits.length === 0)
    ) {
      console.warn('[Converse] all edit strategies missed — downgrading to clarify')
      parsed.type = 'clarify'
      parsed.message =
        "I couldn't find the exact element to change. Try one of: " +
        "click the element in the preview first (selection mode), " +
        "name a specific section ('the menu cards', 'the chef bio'), " +
        "or paste a fragment of the current text/class you want changed."
    }

    // Force ready if user explicitly requests and we have context
    if (wantsToBuild && history.length >= 2 && parsed.type === 'clarify') {
      const userContext = history
        .filter(m => m.role === 'user')
        .map(m => m.content)
        .join('. ')
      const fullContext = `${userContext}. ${message}`

      const enhancedPrompt = `Create a modern, professional website based on these requirements: ${fullContext}. Include: responsive design, mobile-friendly layout, clean typography, modern UI components, semantic HTML structure, accessibility features.`

      parsed = {
        type: 'ready',
        intent: parsed.intent || 'website',
        message: parsed.message || "Let's build it! I've gathered your requirements.",
        enhancedPrompt,
        requirements: { ...parsed.requirements, completeness: 75 }
      }
    }

    // Final honesty guard: if we're about to return an "edit" response but
    // nothing actually changed (no updatedHtml AND no codeEdits, OR updatedHtml
    // is identical to currentHtml), downgrade to clarify so the UI doesn't
    // display a "Done!" bubble for work we didn't do.
    if (parsed.type === 'edit') {
      const htmlChanged = !!parsed.updatedHtml && parsed.updatedHtml !== currentHtml
      const hasUsableEdits = !!parsed.codeEdits && parsed.codeEdits.length > 0
      if (!htmlChanged && !hasUsableEdits) {
        console.warn('[Converse] edit response had no effect — downgrading to clarify')
        parsed.type = 'clarify'
        parsed.message = "I wasn't able to make that change automatically. Could you select the element you want to edit, or be more specific about what to change?"
      }
    }

    console.log('[Converse] Response:', {
      type: parsed.type,
      intent: parsed.intent,
      hasEdits: !!(parsed.codeEdits?.length),
      hasUpdatedHtml: !!parsed.updatedHtml
    })

    return wrap(NextResponse.json(parsed))

  } catch (error) {
    console.error('Conversation API error:', error)

    return NextResponse.json({
      type: 'clarify',
      message: "I'm here to help! What would you like to create or change?",
      intent: 'question',
      suggestedOptions: ['Build a new website', 'Edit current design', 'Get suggestions'],
      requirements: { completeness: 0 }
    } as ConversationResponse)
  }
}
