/**
 * Template Library Index
 * Export all reusable HTML templates for the AI website builder
 */

import { LUXE_ECOMMERCE_TEMPLATE } from './luxe-ecommerce'

// Template interface
export interface WebsiteTemplate {
  id: string
  name: string
  description: string
  category: 'ecommerce' | 'saas' | 'agency' | 'restaurant' | 'portfolio' | 'blog' | 'landing'
  tags: string[]
  preview: string
  variables: Record<string, string | number | object[]>
  html: string
}

// All available templates
export const TEMPLATES: WebsiteTemplate[] = [
  LUXE_ECOMMERCE_TEMPLATE as WebsiteTemplate,
]

// Get template by ID
export function getTemplateById(id: string): WebsiteTemplate | undefined {
  return TEMPLATES.find(t => t.id === id)
}

// Get templates by category
export function getTemplatesByCategory(category: WebsiteTemplate['category']): WebsiteTemplate[] {
  return TEMPLATES.filter(t => t.category === category)
}

// Apply variables to template HTML
export function applyTemplateVariables(html: string, variables: Record<string, string | number | object[]>): string {
  let result = html

  for (const [key, value] of Object.entries(variables)) {
    if (typeof value === 'string' || typeof value === 'number') {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      result = result.replace(regex, String(value))
    }
  }

  return result
}

// Export individual templates
export { LUXE_ECOMMERCE_TEMPLATE }

export default TEMPLATES
