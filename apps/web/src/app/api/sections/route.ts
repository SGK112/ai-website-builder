import { NextRequest, NextResponse } from 'next/server'
import { SECTION_TEMPLATES, getSectionsByCategory, getSectionCategories, SectionTemplate } from '@/lib/section-templates'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') as SectionTemplate['category'] | null

    if (category) {
      const sections = getSectionsByCategory(category)
      return NextResponse.json({ sections, category })
    }

    // Return all sections grouped by category
    const categories = getSectionCategories()
    const grouped: Record<string, SectionTemplate[]> = {}

    for (const cat of categories) {
      grouped[cat] = getSectionsByCategory(cat)
    }

    return NextResponse.json({
      sections: SECTION_TEMPLATES,
      categories,
      grouped,
    })
  } catch (error) {
    console.error('Sections API error:', error)
    return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 })
  }
}
