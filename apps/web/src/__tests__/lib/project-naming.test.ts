import { describe, it, expect } from 'vitest'
import { isGenericProjectName, deriveNameFromHtml, suggestProjectName } from '@/lib/project-naming'

describe('isGenericProjectName', () => {
  it('treats Untitled defaults and seed template labels as generic', () => {
    for (const n of ['Untitled Project', 'Untitled site', 'My Site', 'E-Commerce', 'Restaurant', 'Portfolio', 'Digital Agency', 'SaaS Platform']) {
      expect(isGenericProjectName(n)).toBe(true)
    }
    expect(isGenericProjectName('')).toBe(true)
    expect(isGenericProjectName('  ')).toBe(true)
  })
  it('treats a user-chosen name as not generic', () => {
    expect(isGenericProjectName('La Cuisine')).toBe(false)
    expect(isGenericProjectName('Scottsdale Handyman')).toBe(false)
  })
})

describe('deriveNameFromHtml', () => {
  it('prefers <title>, splitting off a " | Brand" suffix', () => {
    expect(deriveNameFromHtml('<title>La Cuisine | Fine Dining</title>')).toBe('La Cuisine')
  })
  it('falls back to <h1> when no usable title', () => {
    expect(deriveNameFromHtml('<title>Untitled</title><h1>FlowSync</h1>')).toBe('FlowSync')
  })
  it('title-cases an all-lowercase title without breaking apostrophes', () => {
    expect(deriveNameFromHtml('<title>sneako’s shop</title>')).toBe('Sneako’s Shop')
  })
  it('rejects unreplaced template markers', () => {
    expect(deriveNameFromHtml('<title>{{AgencyName}}</title>')).toBe('')
  })
  it('returns empty for no content', () => {
    expect(deriveNameFromHtml('')).toBe('')
    expect(deriveNameFromHtml('<div>no title</div>')).toBe('')
  })
})

describe('suggestProjectName', () => {
  it('renames a seed-label project from its real content (the E-Commerce -> La Cuisine case)', () => {
    expect(suggestProjectName('E-Commerce', '<title>La Cuisine</title>')).toBe('La Cuisine')
  })
  it('leaves a user-chosen name untouched', () => {
    expect(suggestProjectName('La Cuisine', '<title>Something Else</title>')).toBeNull()
  })
  it('does not rename when content matches the current label', () => {
    expect(suggestProjectName('Luxe Boutique', '<title>LUXE BOUTIQUE</title>')).toBeNull()
  })
  it('returns null when content yields no usable name', () => {
    expect(suggestProjectName('Untitled Project', '<div>no title or h1</div>')).toBeNull()
  })
})
