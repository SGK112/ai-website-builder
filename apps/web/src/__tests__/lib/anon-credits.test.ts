import { describe, it, expect } from 'vitest'
import { anonCreditsSpent, startingCreditsFor, NEW_ACCOUNT_CREDITS } from '@/lib/anon-credits'

describe('anon credit claim', () => {
  it('grants the full allowance to a browser that never built anonymously', () => {
    expect(startingCreditsFor(undefined)).toBe(NEW_ACCOUNT_CREDITS)
    expect(startingCreditsFor('0')).toBe(NEW_ACCOUNT_CREDITS)
  })

  it('deducts what was already spent as an anon', () => {
    expect(anonCreditsSpent('3')).toBe(30)
    expect(startingCreditsFor('3')).toBe(70)
  })

  it('leaves nothing when the whole anon allowance was used', () => {
    expect(startingCreditsFor('10')).toBe(0)
  })

  it('never goes negative when the cookie exceeds the anon limit', () => {
    expect(startingCreditsFor('999')).toBe(0)
    expect(anonCreditsSpent('999')).toBe(NEW_ACCOUNT_CREDITS)
  })

  it('ignores a junk or hand-edited cookie instead of minting credits', () => {
    for (const junk of ['-5', 'abc', '', 'NaN']) {
      const start = startingCreditsFor(junk)
      expect(start).toBeGreaterThanOrEqual(0)
      expect(start).toBeLessThanOrEqual(NEW_ACCOUNT_CREDITS)
    }
    expect(startingCreditsFor('-5')).toBe(NEW_ACCOUNT_CREDITS)
  })
})
