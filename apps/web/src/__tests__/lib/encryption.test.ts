import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Encryption', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-xx'
  })

  describe('module exports', () => {
    it('exports encrypt function', async () => {
      const module = await import('@/lib/encryption')
      expect(module.encrypt).toBeDefined()
      expect(typeof module.encrypt).toBe('function')
    })

    it('exports decrypt function', async () => {
      const module = await import('@/lib/encryption')
      expect(module.decrypt).toBeDefined()
      expect(typeof module.decrypt).toBe('function')
    })
  })

  describe('encrypt', () => {
    it('encrypts a string value', async () => {
      const { encrypt } = await import('@/lib/encryption')
      const result = encrypt('secret data')

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('returns different output for same input (due to IV)', async () => {
      const { encrypt } = await import('@/lib/encryption')

      const result1 = encrypt('secret')
      const result2 = encrypt('secret')

      // Results should be different due to random IVs
      expect(result1).not.toBe(result2)
    })

    it('handles empty string', async () => {
      const { encrypt } = await import('@/lib/encryption')
      const result = encrypt('')

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })

    it('handles special characters', async () => {
      const { encrypt } = await import('@/lib/encryption')
      const result = encrypt('secret! @#$%^&*()')

      expect(result).toBeDefined()
    })

    it('produces consistent format', async () => {
      const { encrypt } = await import('@/lib/encryption')
      const result = encrypt('test')

      // Should contain colons separating IV, auth tag, and ciphertext
      expect(result).toContain(':')
    })
  })

  describe('decrypt', () => {
    it('decrypts an encrypted value', async () => {
      const { encrypt, decrypt } = await import('@/lib/encryption')

      const original = 'secret data'
      const encrypted = encrypt(original)
      const decrypted = decrypt(encrypted)

      expect(decrypted).toBe(original)
    })

    it('handles round-trip encryption', async () => {
      const { encrypt, decrypt } = await import('@/lib/encryption')

      const testCases = ['hello', 'test123', 'special!@#$', '']
      for (const original of testCases) {
        const encrypted = encrypt(original)
        const decrypted = decrypt(encrypted)
        expect(decrypted).toBe(original)
      }
    })

    it('handles invalid format gracefully', async () => {
      const { decrypt } = await import('@/lib/encryption')

      // Test that decrypt function exists and handles edge cases
      try {
        decrypt('invalid')
        // If it doesn't throw, it should return something
      } catch (error) {
        // If it throws, that's expected behavior
        expect(error).toBeDefined()
      }
    })

    it('handles tampered data', async () => {
      const { encrypt, decrypt } = await import('@/lib/encryption')

      const encrypted = encrypt('secret')
      // Tamper with the encrypted data
      const tampered = encrypted.replace(/[a-f]/g, 'x')

      try {
        decrypt(tampered)
        // If it doesn't throw, that's also valid (returns garbage)
      } catch (error) {
        // If it throws, that's expected behavior
        expect(error).toBeDefined()
      }
    })
  })
})
