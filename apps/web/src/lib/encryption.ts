import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-32-char-encryption-key!!'
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

/**
 * Encrypt a string using AES-256-GCM
 */
export function encrypt(text: string): string {
  if (!text) return ''

  try {
    // Ensure key is exactly 32 bytes
    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest()

    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH)

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    // Encrypt
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    // Get auth tag
    const authTag = cipher.getAuthTag()

    // Combine IV + auth tag + encrypted data
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
  } catch (error) {
    console.error('Encryption error:', error)
    return ''
  }
}

/**
 * Decrypt a string encrypted with encrypt()
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return ''

  try {
    // Split the encrypted text
    const parts = encryptedText.split(':')
    if (parts.length !== 3) {
      console.error('Invalid encrypted text format')
      return ''
    }

    const [ivHex, authTagHex, encrypted] = parts

    // Ensure key is exactly 32 bytes
    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest()

    // Convert hex strings back to buffers
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    // Decrypt
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    return ''
  }
}

/**
 * Hash a string (one-way, for comparison)
 */
export function hash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex')
}
