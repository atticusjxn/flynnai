import crypto from 'crypto'
import bcrypt from 'bcryptjs'

// Encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 16 // 128 bits
const TAG_LENGTH = 16 // 128 bits
const SALT_ROUNDS = 12

// Environment-based encryption key (should be set via environment variables)
const getEncryptionKey = (): Buffer => {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required')
  }
  
  if (key.length !== 64) { // 32 bytes = 64 hex characters
    throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters) long')
  }
  
  return Buffer.from(key, 'hex')
}

export interface EncryptionResult {
  encrypted: string
  iv: string
  tag: string
}

export interface DecryptionInput {
  encrypted: string
  iv: string
  tag: string
}

export class DataEncryption {
  private static instance: DataEncryption
  private readonly key: Buffer

  constructor() {
    if (DataEncryption.instance) {
      return DataEncryption.instance
    }

    try {
      this.key = getEncryptionKey()
    } catch (error) {
      console.error('❌ Encryption initialization failed:', error)
      throw new Error('Failed to initialize encryption service')
    }

    DataEncryption.instance = this
    console.log('🔒 Data encryption service initialized')
  }

  // Encrypt sensitive data (PII, phone numbers, etc.)
  encryptSensitiveData(data: string): EncryptionResult {
    try {
      const iv = crypto.randomBytes(IV_LENGTH)
      const cipher = crypto.createCipher(ENCRYPTION_ALGORITHM, this.key)
      cipher.setAutoPadding(true)

      let encrypted = cipher.update(data, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      
      const tag = (cipher as any).getAuthTag()

      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex')
      }
    } catch (error) {
      console.error('❌ Encryption failed:', error)
      throw new Error('Data encryption failed')
    }
  }

  // Decrypt sensitive data
  decryptSensitiveData(input: DecryptionInput): string {
    try {
      const iv = Buffer.from(input.iv, 'hex')
      const tag = Buffer.from(input.tag, 'hex')
      
      const decipher = crypto.createDecipher(ENCRYPTION_ALGORITHM, this.key)
      ;(decipher as any).setAuthTag(tag)

      let decrypted = decipher.update(input.encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')

      return decrypted
    } catch (error) {
      console.error('❌ Decryption failed:', error)
      throw new Error('Data decryption failed')
    }
  }

  // Hash passwords securely
  async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, SALT_ROUNDS)
    } catch (error) {
      console.error('❌ Password hashing failed:', error)
      throw new Error('Password hashing failed')
    }
  }

  // Verify password against hash
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash)
    } catch (error) {
      console.error('❌ Password verification failed:', error)
      return false
    }
  }

  // Generate secure tokens for API keys, session tokens, etc.
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }

  // Hash data for integrity checking (SHA-256)
  hashData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex')
  }

  // Create HMAC for message authentication
  createHMAC(data: string, secret?: string): string {
    const hmacSecret = secret || process.env.HMAC_SECRET || this.key.toString('hex')
    return crypto.createHmac('sha256', hmacSecret).update(data).digest('hex')
  }

  // Verify HMAC
  verifyHMAC(data: string, signature: string, secret?: string): boolean {
    const expectedSignature = this.createHMAC(data, secret)
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  }

  // Encrypt file data
  encryptFile(fileBuffer: Buffer): EncryptionResult {
    try {
      const iv = crypto.randomBytes(IV_LENGTH)
      const cipher = crypto.createCipherGCM(ENCRYPTION_ALGORITHM, this.key, iv)

      const encrypted = Buffer.concat([
        cipher.update(fileBuffer),
        cipher.final()
      ])

      const tag = cipher.getAuthTag()

      return {
        encrypted: encrypted.toString('hex'),
        iv: iv.toString('hex'),
        tag: tag.toString('hex')
      }
    } catch (error) {
      console.error('❌ File encryption failed:', error)
      throw new Error('File encryption failed')
    }
  }

  // Decrypt file data
  decryptFile(input: DecryptionInput): Buffer {
    try {
      const iv = Buffer.from(input.iv, 'hex')
      const tag = Buffer.from(input.tag, 'hex')
      const encrypted = Buffer.from(input.encrypted, 'hex')

      const decipher = crypto.createDecipherGCM(ENCRYPTION_ALGORITHM, this.key, iv)
      decipher.setAuthTag(tag)

      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ])

      return decrypted
    } catch (error) {
      console.error('❌ File decryption failed:', error)
      throw new Error('File decryption failed')
    }
  }

  // Mask sensitive data for logging (show first/last few characters)
  maskSensitiveData(data: string, visibleChars: number = 4): string {
    if (data.length <= visibleChars * 2) {
      return '*'.repeat(data.length)
    }

    const start = data.substring(0, visibleChars)
    const end = data.substring(data.length - visibleChars)
    const middle = '*'.repeat(data.length - (visibleChars * 2))

    return `${start}${middle}${end}`
  }

  // Phone number specific encryption
  encryptPhoneNumber(phoneNumber: string): EncryptionResult {
    // Normalize phone number before encryption
    const normalizedPhone = phoneNumber.replace(/\D/g, '')
    return this.encryptSensitiveData(normalizedPhone)
  }

  // Email specific encryption
  encryptEmail(email: string): EncryptionResult {
    // Normalize email before encryption
    const normalizedEmail = email.toLowerCase().trim()
    return this.encryptSensitiveData(normalizedEmail)
  }

  // Credit card number encryption (if needed for payments)
  encryptCreditCard(cardNumber: string): EncryptionResult {
    // Remove spaces and dashes
    const normalizedCard = cardNumber.replace(/[\s-]/g, '')
    return this.encryptSensitiveData(normalizedCard)
  }
}

// Utility functions for common encryption operations
export class SecureStorage {
  private encryption: DataEncryption

  constructor() {
    this.encryption = new DataEncryption()
  }

  // Store encrypted data with metadata
  async storeEncryptedData(
    key: string, 
    data: string, 
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      const encrypted = this.encryption.encryptSensitiveData(data)
      
      const payload = {
        ...encrypted,
        metadata: metadata || {},
        timestamp: new Date().toISOString(),
        version: '1.0'
      }

      // In a real implementation, this would store in a secure database
      console.log(`🔒 Stored encrypted data for key: ${key}`)
      return JSON.stringify(payload)
    } catch (error) {
      console.error(`❌ Failed to store encrypted data for key ${key}:`, error)
      throw new Error('Secure storage operation failed')
    }
  }

  // Retrieve and decrypt data
  async retrieveEncryptedData(key: string, encryptedPayload: string): Promise<string> {
    try {
      const payload = JSON.parse(encryptedPayload)
      
      const decrypted = this.encryption.decryptSensitiveData({
        encrypted: payload.encrypted,
        iv: payload.iv,
        tag: payload.tag
      })

      console.log(`🔓 Retrieved encrypted data for key: ${key}`)
      return decrypted
    } catch (error) {
      console.error(`❌ Failed to retrieve encrypted data for key ${key}:`, error)
      throw new Error('Secure retrieval operation failed')
    }
  }
}

// JWT Token utilities with enhanced security
export class SecureTokenManager {
  private encryption: DataEncryption

  constructor() {
    this.encryption = new DataEncryption()
  }

  // Create secure session token
  createSessionToken(userId: string, sessionData: Record<string, any>): string {
    const payload = {
      userId,
      ...sessionData,
      issued: Date.now(),
      expires: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      nonce: this.encryption.generateSecureToken(16)
    }

    const tokenData = JSON.stringify(payload)
    const encrypted = this.encryption.encryptSensitiveData(tokenData)
    
    // Create signature
    const signature = this.encryption.createHMAC(tokenData)

    return `${encrypted.encrypted}.${encrypted.iv}.${encrypted.tag}.${signature}`
  }

  // Validate and decode session token
  validateSessionToken(token: string): { valid: boolean; userId?: string; data?: any } {
    try {
      const parts = token.split('.')
      if (parts.length !== 4) {
        return { valid: false }
      }

      const [encrypted, iv, tag, signature] = parts
      
      const decrypted = this.encryption.decryptSensitiveData({ encrypted, iv, tag })
      
      // Verify signature
      if (!this.encryption.verifyHMAC(decrypted, signature)) {
        console.warn('🔒 Token signature verification failed')
        return { valid: false }
      }

      const payload = JSON.parse(decrypted)

      // Check expiration
      if (Date.now() > payload.expires) {
        console.warn('🔒 Token expired')
        return { valid: false }
      }

      return {
        valid: true,
        userId: payload.userId,
        data: payload
      }
    } catch (error) {
      console.error('❌ Token validation failed:', error)
      return { valid: false }
    }
  }
}

// Initialize singleton instances
export const dataEncryption = new DataEncryption()
export const secureStorage = new SecureStorage()
export const tokenManager = new SecureTokenManager()

// Utility functions for common use cases
export const encryptPII = (data: string) => dataEncryption.encryptSensitiveData(data)
export const decryptPII = (input: DecryptionInput) => dataEncryption.decryptSensitiveData(input)
export const hashPassword = (password: string) => dataEncryption.hashPassword(password)
export const verifyPassword = (password: string, hash: string) => dataEncryption.verifyPassword(password, hash)
export const generateApiKey = () => dataEncryption.generateSecureToken(32)
export const maskPhone = (phone: string) => dataEncryption.maskSensitiveData(phone, 3)
export const maskEmail = (email: string) => {
  const [local, domain] = email.split('@')
  return `${dataEncryption.maskSensitiveData(local, 2)}@${domain}`
}