// POST /api/builder/ingest-doc
//
// Accepts a PDF upload, sends it to Claude as a document block, and returns
// a structured summary + a ready-to-use generation prompt for the workspace.
// Supports: bids, plans, proposals, pitch decks (as PDFs), reports.
// File limit: 15 MB, 100 pages (Claude's ceiling).

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_BYTES = 15 * 1024 * 1024

const ALLOWED_TYPES = ['application/pdf']

const EXTRACT_PROMPT = `You are analyzing a document to help build a professional website from it.

Carefully read the document and return a JSON object with these fields:

{
  "docType": one of "bid" | "proposal" | "plans" | "deck" | "report" | "other",
  "title": string — best title to use for the resulting website,
  "businessName": string — the company/person name if present, else "",
  "projectName": string — the project/job name if present, else "",
  "industry": string — industry or trade (e.g. "General Contractor", "Granite Countertops", "Architecture", "SaaS"),
  "summary": string — 2-3 sentence plain-English summary of what this document is about,
  "keyDetails": string[] — up to 10 bullet-point facts to feature on the site (scope, pricing, timeline, materials, team, etc.),
  "services": string[] — list of services or deliverables mentioned,
  "contactInfo": { name?: string, phone?: string, email?: string, address?: string },
  "suggestedSiteType": string — what kind of site to build (e.g. "Project proposal page", "Contractor portfolio + bid summary", "Product pitch site", "Client presentation site"),
  "generationPrompt": string — a detailed site-generation prompt (150-300 words) the builder should use to create the website. Include the business name, project name, key details, and requested design style. Ask for a professional, conversion-focused design with the document's key information structured into clear sections.
}

Respond ONLY with the JSON object. No markdown, no commentary.`

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const apiKey = formData.get('apiKey') as string | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (15 MB max)' }, { status: 400 })
  }

  const key = apiKey || process.env.ANTHROPIC_API_KEY
  if (!key) return NextResponse.json({ error: 'No Anthropic API key configured' }, { status: 503 })

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')

  const anthropic = new Anthropic({ apiKey: key })

  let raw: string
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: base64 },
            } as any,
            { type: 'text', text: EXTRACT_PROMPT },
          ],
        },
      ],
    })
    raw = msg.content.find((b) => b.type === 'text')?.text ?? ''
  } catch (e: any) {
    return NextResponse.json({ error: `Claude error: ${e?.message || String(e)}` }, { status: 502 })
  }

  // Strip markdown fences if the model wrapped the JSON anyway
  const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()

  let parsed: any
  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    return NextResponse.json({ error: 'Could not parse Claude response as JSON', raw }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    fileName: file.name,
    fileSize: file.size,
    ...parsed,
  })
}
