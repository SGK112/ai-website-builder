import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

// Analyze images for website building
export async function POST(request: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI API not configured' },
      { status: 500 }
    )
  }

  try {
    const { imageBase64, imageUrl, prompt } = await request.json()

    if (!imageBase64 && !imageUrl) {
      return NextResponse.json({ error: 'Image required' }, { status: 400 })
    }

    // Build the image content
    const imageContent = imageUrl
      ? { type: 'image_url' as const, image_url: { url: imageUrl } }
      : { type: 'image_url' as const, image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a web design expert. Analyze images and describe them for website building.

When analyzing a website screenshot or design mockup:
- Describe the layout structure (header, hero, sections, footer)
- Note the color scheme and typography
- List key UI components (buttons, cards, forms, etc)
- Describe any imagery, icons, or graphics
- Note the overall style (modern, minimal, corporate, playful, etc)

Be concise but thorough. Your description will be used to recreate this design.`
        },
        {
          role: 'user',
          content: [
            imageContent,
            { type: 'text', text: prompt || 'Analyze this image for website building. Describe the design, layout, colors, and components in detail so I can recreate it.' }
          ]
        }
      ],
      max_tokens: 1000,
    })

    const analysis = response.choices[0]?.message?.content || ''

    return NextResponse.json({
      success: true,
      analysis,
    })
  } catch (error: any) {
    console.error('Vision API error:', error)
    return NextResponse.json(
      { error: error.message || 'Image analysis failed' },
      { status: 500 }
    )
  }
}
