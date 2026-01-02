import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export interface Template {
  id: string
  name: string
  description: string
  category: string
  industry: string
  html_content: string
  css_content?: string
  js_content?: string
  thumbnail_url: string
  preview_url?: string
  is_premium: boolean
  price_credits: number
  created_at: string
  updated_at: string
}

// GET /api/templates - Fetch all templates or filter by category
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const industry = searchParams.get('industry')
    const id = searchParams.get('id')

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      )
    }

    // Build query
    let query = `${SUPABASE_URL}/rest/v1/templates?`

    if (id) {
      // Fetch single template with full HTML
      query += `id=eq.${id}&select=*`
    } else {
      // Fetch list (without full HTML to reduce payload)
      query += `select=id,name,description,category,industry,thumbnail_url,preview_url,is_premium,price_credits,created_at`

      if (category) {
        query += `&category=eq.${category}`
      }
      if (industry) {
        query += `&industry=eq.${industry}`
      }

      query += `&order=created_at.desc`
    }

    const response = await fetch(query, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      next: { revalidate: 60 } // Cache for 60 seconds
    })

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status}`)
    }

    const templates = await response.json()

    return NextResponse.json({
      templates: id ? templates : templates,
      count: Array.isArray(templates) ? templates.length : 1
    })
  } catch (error) {
    console.error('[Templates API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

// POST /api/templates - Create a new template (admin only)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      )
    }

    // Validate required fields
    const { name, category, html_content } = body
    if (!name || !category || !html_content) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category, html_content' },
        { status: 400 }
      )
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/templates`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        name,
        description: body.description || '',
        category,
        industry: body.industry || '',
        html_content,
        css_content: body.css_content || '',
        js_content: body.js_content || '',
        thumbnail_url: body.thumbnail_url || `https://picsum.photos/seed/${name.toLowerCase().replace(/\s/g, '')}/800/600`,
        preview_url: body.preview_url || '',
        is_premium: body.is_premium || false,
        price_credits: body.price_credits || 0
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Supabase error: ${error}`)
    }

    const template = await response.json()

    return NextResponse.json({
      success: true,
      template: template[0]
    }, { status: 201 })
  } catch (error) {
    console.error('[Templates API] Error creating template:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}
