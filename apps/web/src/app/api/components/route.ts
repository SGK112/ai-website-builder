import { NextResponse } from 'next/server'
import { COMPONENTS, COMPONENT_CATEGORIES } from '@/lib/component-library'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')

  if (category) {
    const components = COMPONENTS.filter(c => c.category === category)
    return NextResponse.json({ components, category })
  }

  // Return all components with categories
  return NextResponse.json({
    components: COMPONENTS,
    categories: COMPONENT_CATEGORIES,
  })
}
