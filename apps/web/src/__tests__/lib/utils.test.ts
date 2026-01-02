import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('Utils', () => {
  describe('cn (className merger)', () => {
    it('merges multiple class names', () => {
      const result = cn('foo', 'bar', 'baz')
      expect(result).toBe('foo bar baz')
    })

    it('handles undefined values', () => {
      const result = cn('foo', undefined, 'bar')
      expect(result).toBe('foo bar')
    })

    it('handles null values', () => {
      const result = cn('foo', null, 'bar')
      expect(result).toBe('foo bar')
    })

    it('handles false values', () => {
      const result = cn('foo', false, 'bar')
      expect(result).toBe('foo bar')
    })

    it('handles conditional classes', () => {
      const isActive = true
      const result = cn('base', isActive && 'active')
      expect(result).toBe('base active')
    })

    it('handles conditional classes when false', () => {
      const isActive = false
      const result = cn('base', isActive && 'active')
      expect(result).toBe('base')
    })

    it('handles array of classes', () => {
      const result = cn(['foo', 'bar'], 'baz')
      expect(result).toBe('foo bar baz')
    })

    it('handles object notation', () => {
      const result = cn({
        foo: true,
        bar: false,
        baz: true,
      })
      expect(result).toBe('foo baz')
    })

    it('merges tailwind classes correctly', () => {
      const result = cn('p-4', 'p-2')
      expect(result).toBe('p-2')
    })

    it('handles conflicting tailwind classes', () => {
      const result = cn('text-red-500', 'text-blue-500')
      expect(result).toBe('text-blue-500')
    })

    it('preserves non-conflicting classes', () => {
      const result = cn('p-4 m-2', 'text-red-500')
      expect(result).toContain('p-4')
      expect(result).toContain('m-2')
      expect(result).toContain('text-red-500')
    })

    it('handles empty input', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('handles single class', () => {
      const result = cn('single-class')
      expect(result).toBe('single-class')
    })

    it('handles complex nested conditions', () => {
      const state = { isActive: true, isDisabled: false }
      const result = cn(
        'base',
        state.isActive && 'active',
        state.isDisabled && 'disabled',
        [state.isActive ? 'variant-active' : 'variant-inactive']
      )
      expect(result).toContain('base')
      expect(result).toContain('active')
      expect(result).not.toContain('disabled')
      expect(result).toContain('variant-active')
    })
  })
})
