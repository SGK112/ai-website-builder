import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatRequest {
  messages: ChatMessage[]
  context?: {
    hasWebsite: boolean
    currentPrompt?: string
    websiteType?: string
  }
}

const SYSTEM_PROMPT = `You are a friendly website design assistant helping users create their perfect website. Your role is to have a natural conversation to understand what they need, then help them build it.

## Your Conversation Style
- Be warm, helpful, and conversational
- Ask one or two questions at a time, not overwhelming lists
- Give suggestions and examples to inspire them
- Keep responses concise (2-3 sentences max per point)

## Information to Gather (naturally, over conversation)
1. **Type of website**: Business, portfolio, e-commerce, blog, restaurant, etc.
2. **Main purpose**: What should the website accomplish?
3. **Key sections**: Hero, about, features, pricing, contact, etc.
4. **Style preference**: Modern, minimal, bold, elegant, playful, professional
5. **Color preference**: Any specific colors or let AI choose
6. **Content hints**: Business name, tagline, key features/services

## When Ready to Build
When you have enough information (usually after 2-4 exchanges), respond with a special JSON block at the END of your message:

\`\`\`buildready
{
  "ready": true,
  "summary": "Brief summary of what we'll build",
  "buildPrompt": "Detailed prompt for the AI to generate the website"
}
\`\`\`

The buildPrompt should be comprehensive and detailed, like:
"Create a modern dark-themed SaaS landing page for 'AppName', a project management tool. Include: hero section with headline 'Manage Projects Effortlessly' and CTA button, features grid with 4 features (collaboration, tracking, analytics, integrations), pricing section with 3 tiers (Starter $9, Pro $29, Enterprise custom), testimonials section with 3 reviews, and footer with social links. Use violet/purple accent colors (#8b5cf6), Inter font, smooth hover animations, gradient backgrounds."

## If User Wants to Build Immediately
If the user gives you enough info in one message (like "build me a restaurant website for Mario's Pizza"), you can generate the buildPrompt right away! Just confirm what you're building before the JSON block.

## If They Already Have a Website (context.hasWebsite = true)
Help them modify it. Ask what they want to change and generate modification prompts like:
"Modify the existing website: Change the color scheme to blue (#3b82f6), add a testimonials section after features, update the hero headline to 'New Headline Here'."

## Example Conversation

User: "I want a website for my coffee shop"
You: "A coffee shop website - love it! ☕ I can picture something warm and inviting. What's your coffee shop called? And are you thinking cozy/rustic vibes, or more modern/minimal?"

User: "It's Bean & Brew, I want it modern with dark colors"
You: "Bean & Brew - great name! Dark and modern sounds sleek. Should I include a menu section for your drinks and food? And do you need location/hours info on the site?

User: "Yes to both, and add online ordering later"
You: "Perfect! I'll create a modern dark-themed site for Bean & Brew with your menu and location. Let me build that for you now!

\`\`\`buildready
{
  "ready": true,
  "summary": "Modern dark-themed website for Bean & Brew coffee shop with menu and location",
  "buildPrompt": "Create a modern dark-themed website for 'Bean & Brew' coffee shop. Include: hero section with atmospheric coffee imagery, shop name in elegant typography, and tagline 'Craft Coffee, Modern Vibes'. Add menu section displaying coffee drinks (espresso, latte, cappuccino, cold brew) and pastries in a clean card grid with prices. Include location section with embedded map placeholder, address, hours (Mon-Fri 7am-7pm, Sat-Sun 8am-6pm), and contact info. Footer with social media links. Use dark charcoal background (#1a1a1a), warm amber accents (#d97706), cream text colors, modern sans-serif typography, subtle hover animations."
}
\`\`\`

Remember: Keep it conversational and fun! You're helping them bring their vision to life.`

export async function POST(request: NextRequest) {
  try {
    const { messages, context }: ChatRequest = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 })
    }

    // Build the system message with context
    let systemContent = SYSTEM_PROMPT
    if (context?.hasWebsite && context.currentPrompt) {
      systemContent += `\n\n## Current Context\nThe user already has a website built. Their original request was: "${context.currentPrompt}"\nHelp them modify or improve the existing site based on their new requests. Generate modification prompts, not full rebuild prompts.`
    }

    // Build the conversation with system prompt
    const conversationMessages = [
      { role: 'system' as const, content: systemContent },
      ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ]

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: conversationMessages,
      temperature: 0.8,
      max_tokens: 600,
    })

    const assistantMessage = response.choices[0]?.message?.content || ''

    // Check if the response contains a buildready block
    const buildReadyMatch = assistantMessage.match(/```buildready\n([\s\S]*?)\n```/)

    if (buildReadyMatch) {
      try {
        const buildData = JSON.parse(buildReadyMatch[1])
        // Remove the code block from the visible message
        const cleanMessage = assistantMessage.replace(/```buildready\n[\s\S]*?\n```/, '').trim()

        return NextResponse.json({
          message: cleanMessage || `Great! ${buildData.summary}. Let me build that for you now!`,
          buildReady: true,
          buildPrompt: buildData.buildPrompt,
          summary: buildData.summary,
        })
      } catch (e) {
        console.error('Failed to parse buildready JSON:', e)
        // If JSON parsing fails, just return the message
      }
    }

    return NextResponse.json({
      message: assistantMessage,
      buildReady: false,
    })
  } catch (error) {
    console.error('Builder chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat' },
      { status: 500 }
    )
  }
}
