import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const TAG_LENGTH = 16
const SALT_LENGTH = 64
const KEY_LENGTH = 32
const ITERATIONS = 100000

export class EncryptionService {
  private masterKey: Buffer

  constructor(encryptionKey?: string) {
    const key = encryptionKey || process.env.ENCRYPTION_KEY
    if (!key || key.length < 32) {
      throw new Error('ENCRYPTION_KEY must be at least 32 characters')
    }
    this.masterKey = Buffer.from(key.slice(0, 32))
  }

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(IV_LENGTH)
    const salt = crypto.randomBytes(SALT_LENGTH)

    // Derive key using PBKDF2
    const key = crypto.pbkdf2Sync(
      this.masterKey,
      salt,
      ITERATIONS,
      KEY_LENGTH,
      'sha256'
    )

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ])
    const tag = cipher.getAuthTag()

    // Combine: salt + iv + tag + encrypted
    const combined = Buffer.concat([salt, iv, tag, encrypted])
    return combined.toString('base64')
  }

  decrypt(ciphertext: string): string {
    const combined = Buffer.from(ciphertext, 'base64')

    const salt = combined.subarray(0, SALT_LENGTH)
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const tag = combined.subarray(
      SALT_LENGTH + IV_LENGTH,
      SALT_LENGTH + IV_LENGTH + TAG_LENGTH
    )
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH)

    // Derive same key
    const key = crypto.pbkdf2Sync(
      this.masterKey,
      salt,
      ITERATIONS,
      KEY_LENGTH,
      'sha256'
    )

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
      'utf8'
    )
  }
}
