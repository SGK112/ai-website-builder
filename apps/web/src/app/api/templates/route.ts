import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TEMPLATES as LOCAL_TEMPLATES, getTemplateById as getLocalTemplateById } from '@/lib/templates'

export const dynamic = 'force-dynamic'

// Local TEMPLATES from lib/templates/index.ts are fully-built HTML — they're
// always valid. Supabase templates are user-managed and frequently have empty
// or stub html_content. The list endpoint merges local FIRST so users always
// see the working ones; single-by-id checks local first before hitting Supabase.
function localToTemplate(t: typeof LOCAL_TEMPLATES[number], withHtml: boolean): Template {
  return {
    id: `local-${t.id}`,
    name: t.name,
    description: t.description,
    category: t.category,
    industry: t.category,
    html_content: withHtml ? t.html : '',
    thumbnail_url: t.preview || `/api/media?q=${encodeURIComponent(t.name)}&w=600&h=400`,
    preview_url: t.preview,
    is_premium: false,
    price_credits: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

// Admin emails that can create templates
const ADMIN_EMAILS = [
  'admin@webstew.net',
  process.env.ADMIN_EMAIL,
].filter(Boolean)

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
//
// Auth posture:
// - Metadata (list view + single-by-id without html/css/js): anon-accessible
//   so the landing page tile grid works without sign-in.
// - Full source content (html_content, css_content, js_content): REQUIRES
//   auth. Without this, any anon caller can hit `?id=<x>&select=*` and pull
//   premium template HTML for free. The metadata fields are kept open
//   (thumbnail, description, name, etc.) so the catalog still renders.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const industry = searchParams.get('industry')
    const id = searchParams.get('id')

    const session = await getServerSession(authOptions).catch(() => null)
    const isAuthed = !!session?.user?.id

    // Single-by-id with a local- prefix bypasses Supabase entirely.
    if (id && id.startsWith('local-')) {
      const local = getLocalTemplateById(id.replace(/^local-/, ''))
      if (!local) {
        return NextResponse.json({ templates: [], count: 0 })
      }
      // Anon callers don't get html_content for parity with Supabase auth posture.
      return NextResponse.json({ templates: [localToTemplate(local, isAuthed)], count: 1 })
    }

    // If Supabase isn't configured, fall back to local-only — better than a 500.
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      if (id) return NextResponse.json({ templates: [], count: 0 })
      const filtered = (category || industry)
        ? LOCAL_TEMPLATES.filter((t) => t.category === (category || industry))
        : LOCAL_TEMPLATES
      const list = filtered.map((t) => localToTemplate(t, false))
      return NextResponse.json({ templates: list, count: list.length })
    }

    // Build query
    let query = `${SUPABASE_URL}/rest/v1/templates?`

    if (id) {
      // Single template by id. Authed callers get the full source; anon
      // gets metadata only — the source is the paid asset.
      if (isAuthed) {
        query += `id=eq.${id}&select=*`
      } else {
        query += `id=eq.${id}&select=id,name,description,category,industry,thumbnail_url,preview_url,is_premium,price_credits,created_at`
      }
    } else {
      // List view — metadata only regardless of auth state. Same fields for
      // anon + authed so the catalog UI is consistent.
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

    // Filter out junk rows on the LIST view (vitest fixtures + stubs that
    // got persisted from local dev runs). Keeps single-by-id reads honest
    // for admins debugging a specific test row.
    const cleanedList: Template[] = id
      ? templates
      : (Array.isArray(templates) ? templates : []).filter((t: Template) => {
          const name = (t?.name || '').trim()
          if (!name) return false
          if (/^(no thumbnail )?test\b/i.test(name)) return false
          if (/^untitled\b/i.test(name)) return false
          // Stubs the user kept hitting — short auto-gen names with epoch suffixes.
          if (/test \d{10,}/i.test(name)) return false
          return true
        })

    // List view: prepend the local TEMPLATES so users ALWAYS see fully-built
    // working tiles, then real Supabase rows after. Single-by-id just returns
    // the Supabase row as before.
    if (id) {
      return NextResponse.json({
        templates,
        count: Array.isArray(templates) ? templates.length : 1,
      })
    }
    const localFiltered = (category || industry)
      ? LOCAL_TEMPLATES.filter((t) => t.category === (category || industry))
      : LOCAL_TEMPLATES
    const merged = [
      ...localFiltered.map((t) => localToTemplate(t, false)),
      ...cleanedList,
    ]
    return NextResponse.json({
      templates: merged,
      count: merged.length,
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
    // SECURITY: Require admin authentication
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

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
