// Builder.io Integration
// https://www.builder.io/c/docs/integrate-cms-data

import { builder } from '@builder.io/react'

// Initialize Builder with your API key
const BUILDER_API_KEY = process.env.NEXT_PUBLIC_BUILDER_API_KEY

if (BUILDER_API_KEY) {
  builder.init(BUILDER_API_KEY)
}

export { builder }

// Check if Builder.io is configured
export function isBuilderConfigured(): boolean {
  return !!BUILDER_API_KEY
}

// Fetch a page from Builder.io
export async function getBuilderPage(urlPath: string) {
  if (!BUILDER_API_KEY) {
    return null
  }

  try {
    const page = await builder
      .get('page', {
        userAttributes: {
          urlPath,
        },
      })
      .toPromise()

    return page
  } catch (error) {
    console.error('Builder.io fetch error:', error)
    return null
  }
}

// Fetch a section/component from Builder.io
export async function getBuilderSection(model: string, id?: string) {
  if (!BUILDER_API_KEY) {
    return null
  }

  try {
    const query = id ? { id } : {}
    const content = await builder.get(model, { query }).toPromise()
    return content
  } catch (error) {
    console.error('Builder.io section fetch error:', error)
    return null
  }
}

// Fetch all entries for a model (e.g., blog posts)
export async function getBuilderEntries(model: string, options?: {
  limit?: number
  offset?: number
  query?: Record<string, any>
}) {
  if (!BUILDER_API_KEY) {
    return []
  }

  try {
    const entries = await builder.getAll(model, {
      limit: options?.limit || 20,
      offset: options?.offset || 0,
      query: options?.query,
      options: {
        noTargeting: true,
      },
    })
    return entries
  } catch (error) {
    console.error('Builder.io entries fetch error:', error)
    return []
  }
}

// Model types available in Builder.io
export type BuilderModel =
  | 'page'           // Full pages
  | 'section'        // Reusable sections
  | 'blog-article'   // Blog posts
  | 'announcement'   // Announcements/banners
  | 'header'         // Header/navigation
  | 'footer'         // Footer

// Helper to register custom components with Builder
export function registerBuilderComponent(
  component: React.ComponentType<any>,
  options: {
    name: string
    inputs?: Array<{
      name: string
      type: 'string' | 'number' | 'boolean' | 'file' | 'color' | 'richText' | 'list' | 'object'
      defaultValue?: any
      required?: boolean
      helperText?: string
    }>
  }
) {
  if (typeof window !== 'undefined' && BUILDER_API_KEY) {
    const { Builder } = require('@builder.io/react')
    Builder.registerComponent(component, options)
  }
}
