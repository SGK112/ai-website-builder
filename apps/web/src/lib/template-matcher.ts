// Template Matcher - Analyzes prompts and matches to best starter template

import { STARTER_TEMPLATES, StarterTemplate } from './starter-templates'

export interface TemplateMatch {
  template: StarterTemplate
  score: number
  matchedKeywords: string[]
  category: string
}

export interface BusinessInfo {
  name?: string
  industry?: string
  style?: 'modern' | 'minimal' | 'bold' | 'elegant' | 'playful' | 'professional'
  features?: string[]
  targetAudience?: string
}

// Keyword mappings for each category
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  saas: [
    'saas', 'software', 'app', 'application', 'platform', 'tool', 'startup',
    'tech', 'technology', 'api', 'dashboard', 'analytics', 'automation',
    'productivity', 'workflow', 'cloud', 'subscription', 'b2b', 'enterprise'
  ],
  agency: [
    'agency', 'marketing', 'digital', 'creative', 'advertising', 'branding',
    'design agency', 'web agency', 'seo', 'social media', 'content',
    'consulting', 'services', 'studio', 'firm'
  ],
  restaurant: [
    'restaurant', 'cafe', 'coffee', 'food', 'menu', 'dining', 'bistro',
    'eatery', 'kitchen', 'bar', 'grill', 'pizzeria', 'bakery', 'catering',
    'chef', 'cuisine', 'takeout', 'delivery', 'reservation'
  ],
  ecommerce: [
    'store', 'shop', 'ecommerce', 'e-commerce', 'products', 'buy', 'sell',
    'fashion', 'clothing', 'retail', 'marketplace', 'cart', 'checkout',
    'jewelry', 'accessories', 'boutique', 'online store', 'merchandise',
    'luxury', 'handbag', 'shoes', 'watches', 'designer', 'brand'
  ],
  portfolio: [
    'portfolio', 'photographer', 'photography', 'designer', 'artist',
    'creative', 'freelancer', 'personal', 'showcase', 'gallery', 'work',
    'projects', 'resume', 'cv', 'developer', 'illustrator', 'videographer'
  ],
  realestate: [
    'real estate', 'property', 'properties', 'homes', 'realtor', 'housing',
    'apartment', 'rental', 'listings', 'broker', 'agent', 'mortgage',
    'commercial', 'residential', 'land', 'investment'
  ],
  fitness: [
    'fitness', 'gym', 'workout', 'health', 'training', 'personal trainer',
    'yoga', 'pilates', 'crossfit', 'exercise', 'wellness', 'sports',
    'nutrition', 'weight loss', 'muscle', 'athletic', 'coaching'
  ],
  medical: [
    'medical', 'doctor', 'clinic', 'healthcare', 'hospital', 'dental',
    'dentist', 'therapy', 'therapist', 'mental health', 'wellness',
    'pharmacy', 'patient', 'health', 'care', 'treatment', 'medicine'
  ],
  legal: [
    'law', 'attorney', 'legal', 'lawyer', 'firm', 'litigation', 'court',
    'justice', 'practice', 'counsel', 'advocate', 'paralegal', 'case',
    'contract', 'criminal', 'family law', 'corporate law'
  ],
  construction: [
    'construction', 'contractor', 'building', 'renovation', 'remodeling',
    'architecture', 'architect', 'engineering', 'builder', 'home improvement',
    'roofing', 'plumbing', 'electrical', 'handyman', 'carpentry',
    'kitchen remodel', 'bathroom remodel', 'flooring', 'painting', 'hvac'
  ]
}

// Template ID preferences for specific keywords (to select premium templates)
const TEMPLATE_PREFERENCES: Record<string, string> = {
  // E-commerce / Luxury
  'fashion': 'ecommerce-luxury',
  'boutique': 'ecommerce-luxury',
  'luxury': 'ecommerce-luxury',
  'handbag': 'ecommerce-luxury',
  'accessories': 'ecommerce-luxury',
  'jewelry': 'ecommerce-luxury',
  'designer': 'ecommerce-luxury',

  // Service / Professional
  'contractor': 'service-professional',
  'remodeling': 'service-professional',
  'renovation': 'service-professional',
  'plumbing': 'service-professional',
  'electrical': 'service-professional',
  'home improvement': 'service-professional',
  'handyman': 'service-professional',

  // SaaS / Tech Premium
  'saas': 'saas-premium',
  'software': 'saas-premium',
  'platform': 'saas-premium',
  'api': 'saas-premium',
  'developer': 'saas-premium',
  'analytics': 'saas-premium',
  'dashboard': 'saas-premium',
  'productivity': 'saas-premium',

  // Startup
  'startup': 'startup-bold',
  'venture': 'startup-bold',
  'disruptive': 'startup-bold',
  'revolutionary': 'startup-bold',
  'backed': 'startup-bold',
  'fundraising': 'startup-bold',
  'seed': 'startup-bold',
  'series': 'startup-bold',

  // Portfolio
  'portfolio': 'portfolio-minimal',
  'photographer': 'portfolio-minimal',
  'videographer': 'portfolio-minimal',
  'freelancer': 'portfolio-minimal',
  'artist': 'portfolio-minimal',
  'creative': 'portfolio-minimal',
  'personal brand': 'portfolio-minimal',
  'showcase': 'portfolio-minimal'
}

// Style indicators from prompts
const STYLE_KEYWORDS: Record<string, string[]> = {
  modern: ['modern', 'contemporary', 'sleek', 'cutting-edge', 'futuristic', 'innovative'],
  minimal: ['minimal', 'minimalist', 'clean', 'simple', 'understated', 'subtle'],
  bold: ['bold', 'striking', 'dramatic', 'powerful', 'impactful', 'vibrant'],
  elegant: ['elegant', 'sophisticated', 'luxury', 'premium', 'refined', 'upscale'],
  playful: ['playful', 'fun', 'colorful', 'creative', 'whimsical', 'friendly'],
  professional: ['professional', 'corporate', 'business', 'formal', 'trustworthy', 'reliable']
}

/**
 * Analyzes a prompt and returns the best matching template
 */
export function analyzePromptForTemplate(prompt: string): TemplateMatch | null {
  const lowerPrompt = prompt.toLowerCase()

  // First, check for specific template preferences based on keywords
  let preferredTemplateId: string | null = null
  for (const [keyword, templateId] of Object.entries(TEMPLATE_PREFERENCES)) {
    if (lowerPrompt.includes(keyword)) {
      preferredTemplateId = templateId
      break
    }
  }

  // If we found a preferred template, use it
  if (preferredTemplateId) {
    const template = STARTER_TEMPLATES.find(t => t.id === preferredTemplateId)
    if (template) {
      // Find all matched keywords for this template
      const matchedKeywords: string[] = []
      for (const [keyword] of Object.entries(TEMPLATE_PREFERENCES)) {
        if (lowerPrompt.includes(keyword)) {
          matchedKeywords.push(keyword)
        }
      }
      return {
        template,
        score: 0.9, // High confidence since we matched specific keywords
        matchedKeywords,
        category: template.category
      }
    }
  }

  // Score each category
  const categoryScores: { category: string; score: number; keywords: string[] }[] = []

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const matchedKeywords: string[] = []
    let score = 0

    for (const keyword of keywords) {
      if (lowerPrompt.includes(keyword)) {
        matchedKeywords.push(keyword)
        // Longer keywords are more specific, give them more weight
        score += keyword.length > 6 ? 2 : 1
      }
    }

    if (score > 0) {
      categoryScores.push({ category, score, keywords: matchedKeywords })
    }
  }

  if (categoryScores.length === 0) {
    // Default to SaaS template for generic prompts
    const defaultTemplate = STARTER_TEMPLATES.find(t => t.id === 'saas-modern')
    if (defaultTemplate) {
      return {
        template: defaultTemplate,
        score: 0.3,
        matchedKeywords: [],
        category: 'saas'
      }
    }
    return null
  }

  // Sort by score descending
  categoryScores.sort((a, b) => b.score - a.score)
  const bestMatch = categoryScores[0]

  // Find the best template for this category (prefer premium templates)
  const templatesForCategory = STARTER_TEMPLATES.filter(t => t.category === bestMatch.category)

  // Sort templates to prefer premium ones (those with more features/sections)
  templatesForCategory.sort((a, b) => b.sections.length - a.sections.length)

  const template = templatesForCategory[0]

  if (!template) {
    return null
  }

  // Normalize score to 0-1 range
  const maxPossibleScore = CATEGORY_KEYWORDS[bestMatch.category].length * 2
  const normalizedScore = Math.min(bestMatch.score / maxPossibleScore * 3, 1)

  return {
    template,
    score: normalizedScore,
    matchedKeywords: bestMatch.keywords,
    category: bestMatch.category
  }
}

/**
 * Extracts business details from a prompt for personalization
 */
export function extractProjectDetails(prompt: string): BusinessInfo {
  const lowerPrompt = prompt.toLowerCase()
  const info: BusinessInfo = {}

  // Try to extract business name (look for patterns like "for [Name]" or "[Name] website")
  const namePatterns = [
    /(?:for|called|named)\s+["']?([A-Z][A-Za-z0-9\s&]+?)["']?(?:\s+(?:website|landing|page|store|shop)|[,.]|$)/i,
    /^["']?([A-Z][A-Za-z0-9\s&]+?)["']?\s+(?:website|landing|page|store|shop)/i,
    /(?:create|build|make|design)\s+(?:a\s+)?(?:website|landing|page)\s+(?:for\s+)?["']?([A-Z][A-Za-z0-9\s&]+?)["']?/i
  ]

  for (const pattern of namePatterns) {
    const match = prompt.match(pattern)
    if (match && match[1]) {
      info.name = match[1].trim()
      break
    }
  }

  // Determine industry from category keywords
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerPrompt.includes(keyword)) {
        info.industry = category
        break
      }
    }
    if (info.industry) break
  }

  // Determine style
  for (const [style, keywords] of Object.entries(STYLE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerPrompt.includes(keyword)) {
        info.style = style as BusinessInfo['style']
        break
      }
    }
    if (info.style) break
  }

  // Default style based on industry
  if (!info.style) {
    const industryStyleMap: Record<string, BusinessInfo['style']> = {
      saas: 'modern',
      agency: 'bold',
      restaurant: 'elegant',
      ecommerce: 'modern',
      portfolio: 'minimal',
      realestate: 'professional',
      fitness: 'bold',
      medical: 'professional',
      legal: 'professional',
      construction: 'professional'
    }
    info.style = industryStyleMap[info.industry || 'saas'] || 'modern'
  }

  // Extract mentioned features
  const featureKeywords = [
    'pricing', 'testimonials', 'contact', 'about', 'gallery', 'portfolio',
    'team', 'services', 'products', 'blog', 'faq', 'newsletter', 'signup',
    'login', 'dashboard', 'checkout', 'cart', 'menu', 'reservation', 'booking'
  ]

  info.features = featureKeywords.filter(f => lowerPrompt.includes(f))

  // Target audience hints
  const audiencePatterns = [
    /(?:for|targeting)\s+([a-z\s]+?)(?:\s+(?:users|customers|clients|audience)|[,.]|$)/i,
    /(?:small|medium|large|enterprise)\s+(?:business|companies)/i,
    /(?:b2b|b2c|consumers|professionals|developers)/i
  ]

  for (const pattern of audiencePatterns) {
    const match = lowerPrompt.match(pattern)
    if (match) {
      info.targetAudience = match[0]
      break
    }
  }

  return info
}

/**
 * Hydrates a template with custom values
 */
export function hydrateTemplate(
  template: StarterTemplate,
  values: Record<string, string>
): string {
  let html = template.html

  // Replace all {{variable}} patterns
  for (const [key, value] of Object.entries(values)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    html = html.replace(regex, value)
  }

  // Replace any remaining placeholders with sensible defaults
  html = html.replace(/\{\{projectName\}\}/g, 'My Website')
  html = html.replace(/\{\{[^}]+\}\}/g, '')

  return html
}

/**
 * Generates a customized template HTML based on prompt analysis
 */
export function generateTemplateFromPrompt(prompt: string): {
  html: string
  template: StarterTemplate | null
  businessInfo: BusinessInfo
} {
  const match = analyzePromptForTemplate(prompt)
  const businessInfo = extractProjectDetails(prompt)

  if (!match) {
    return { html: '', template: null, businessInfo }
  }

  const values: Record<string, string> = {}

  if (businessInfo.name) {
    values.projectName = businessInfo.name
  }

  const html = hydrateTemplate(match.template, values)

  return {
    html,
    template: match.template,
    businessInfo
  }
}
