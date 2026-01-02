/**
 * Template Library Index
 * Export all reusable HTML templates for the AI website builder
 */

import { LUXE_ECOMMERCE_TEMPLATE } from './luxe-ecommerce'
import { AGENCY_PORTFOLIO_TEMPLATE } from './agency-portfolio'
import { SAAS_LANDING_TEMPLATE } from './saas-landing'
import { FASHION_STORE_TEMPLATE } from './fashion-store'
import { RESTAURANT_MENU_TEMPLATE } from './restaurant-menu'
import { SAAS_MULTIPAGE_TEMPLATE } from './saas-multipage'

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
  AGENCY_PORTFOLIO_TEMPLATE as WebsiteTemplate,
  SAAS_LANDING_TEMPLATE as WebsiteTemplate,
  FASHION_STORE_TEMPLATE as WebsiteTemplate,
  RESTAURANT_MENU_TEMPLATE as WebsiteTemplate,
  SAAS_MULTIPAGE_TEMPLATE as WebsiteTemplate,
]

// Get template by ID
export function getTemplateById(id: string): WebsiteTemplate | undefined {
  return TEMPLATES.find(t => t.id === id)
}

// Get templates by category
export function getTemplatesByCategory(category: WebsiteTemplate['category']): WebsiteTemplate[] {
  return TEMPLATES.filter(t => t.category === category)
}

// Get all categories with template counts
export function getTemplateCategories(): { category: WebsiteTemplate['category']; count: number }[] {
  const categories = new Map<WebsiteTemplate['category'], number>()
  TEMPLATES.forEach(t => {
    categories.set(t.category, (categories.get(t.category) || 0) + 1)
  })
  return Array.from(categories.entries()).map(([category, count]) => ({ category, count }))
}

// Search templates by query
export function searchTemplates(query: string): WebsiteTemplate[] {
  const q = query.toLowerCase()
  return TEMPLATES.filter(t =>
    t.name.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q) ||
    t.tags.some(tag => tag.toLowerCase().includes(q))
  )
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
export { AGENCY_PORTFOLIO_TEMPLATE }
export { SAAS_LANDING_TEMPLATE }
export { FASHION_STORE_TEMPLATE }
export { RESTAURANT_MENU_TEMPLATE }
export { SAAS_MULTIPAGE_TEMPLATE }

export default TEMPLATES
