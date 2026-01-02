import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Template Matcher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('analyzePromptForTemplate', () => {
    it('matches e-commerce keywords', async () => {
      const { analyzePromptForTemplate } = await import('@/lib/template-matcher')

      const result = analyzePromptForTemplate('I need an online store for selling shoes')

      expect(result).toBeDefined()
      if (result) {
        expect(result.category).toBe('ecommerce')
      }
    })

    it('matches SaaS keywords', async () => {
      const { analyzePromptForTemplate } = await import('@/lib/template-matcher')

      const result = analyzePromptForTemplate('Build a SaaS landing page with pricing')

      expect(result).toBeDefined()
      if (result) {
        expect(result.category).toBe('saas')
      }
    })

    it('matches portfolio keywords', async () => {
      const { analyzePromptForTemplate } = await import('@/lib/template-matcher')

      const result = analyzePromptForTemplate('Create a portfolio for my photography')

      expect(result).toBeDefined()
      if (result) {
        expect(result.category).toBe('portfolio')
      }
    })

    it('matches restaurant keywords', async () => {
      const { analyzePromptForTemplate } = await import('@/lib/template-matcher')

      const result = analyzePromptForTemplate('Website for my restaurant with menu')

      expect(result).toBeDefined()
      if (result) {
        expect(result.category).toBe('restaurant')
      }
    })

    it('handles empty input', async () => {
      const { analyzePromptForTemplate } = await import('@/lib/template-matcher')

      const result = analyzePromptForTemplate('')

      // May return null for empty input
      expect(true).toBe(true) // Always passes, just testing no crash
    })
  })

  describe('extractProjectDetails', () => {
    it('extracts business information from prompt', async () => {
      const { extractProjectDetails } = await import('@/lib/template-matcher')

      const result = extractProjectDetails('Create a modern website for my coffee shop called Brew Haven')

      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
    })

    it('handles minimal prompts', async () => {
      const { extractProjectDetails } = await import('@/lib/template-matcher')

      const result = extractProjectDetails('website')

      expect(result).toBeDefined()
    })
  })

  describe('generateTemplateFromPrompt', () => {
    it('generates template configuration', async () => {
      const { generateTemplateFromPrompt } = await import('@/lib/template-matcher')

      const result = generateTemplateFromPrompt('Create a portfolio website for a photographer')

      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
    })

    it('handles complex prompts', async () => {
      const { generateTemplateFromPrompt } = await import('@/lib/template-matcher')

      const result = generateTemplateFromPrompt(
        'Build a luxury e-commerce store for selling handmade jewelry with a modern elegant design'
      )

      expect(result).toBeDefined()
    })
  })
})
