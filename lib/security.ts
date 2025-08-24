import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { dataEncryption } from './encryption'
import { auditLogger } from './audit-logging'
import { createNotification } from './notifications'

export interface SecurityPolicy {
  maxLoginAttempts: number
  lockoutDuration: number // in minutes
  passwordMinLength: number
  passwordRequireSpecial: boolean
  passwordRequireNumbers: boolean
  passwordRequireUppercase: boolean
  sessionTimeout: number // in minutes
  ipWhitelist?: string[]
  rateLimitRequests: number
  rateLimitWindow: number // in minutes
}

export interface SecurityIncident {
  id: string
  type: 'failed_login' | 'rate_limit_exceeded' | 'suspicious_activity' | 'unauthorized_access' | 'data_breach'
  severity: 'low' | 'medium' | 'high' | 'critical'
  userId?: string
  ipAddress: string
  userAgent: string
  details: Record<string, any>
  timestamp: Date
  resolved: boolean
  actions: string[]
}

export interface RateLimitEntry {
  count: number
  firstAttempt: Date
  lastAttempt: Date
  blocked: boolean
  blockedUntil?: Date
}

export class SecurityManager {
  private static instance: SecurityManager
  private rateLimitMap: Map<string, RateLimitEntry> = new Map()
  private loginAttempts: Map<string, { count: number; lastAttempt: Date; lockedUntil?: Date }> = new Map()
  private securityIncidents: Map<string, SecurityIncident> = new Map()
  
  private readonly defaultPolicy: SecurityPolicy = {
    maxLoginAttempts: 5,
    lockoutDuration: 15, // 15 minutes
    passwordMinLength: 8,
    passwordRequireSpecial: true,
    passwordRequireNumbers: true,
    passwordRequireUppercase: true,
    sessionTimeout: 480, // 8 hours
    rateLimitRequests: 100,
    rateLimitWindow: 15 // 15 minutes
  }

  constructor() {
    if (SecurityManager.instance) {
      return SecurityManager.instance
    }

    this.startCleanupIntervals()
    SecurityManager.instance = this
    console.log('🔐 Security Manager initialized')
  }

  // Input validation and sanitization
  sanitizeInput(input: string, options: {
    allowHTML?: boolean
    maxLength?: number
    allowedChars?: RegExp
  } = {}): string {
    let sanitized = input.trim()

    // Length validation
    if (options.maxLength && sanitized.length > options.maxLength) {
      throw new Error(`Input exceeds maximum length of ${options.maxLength} characters`)
    }

    // HTML sanitization (basic - in production use a library like DOMPurify)
    if (!options.allowHTML) {
      sanitized = sanitized
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
    }

    // Character whitelist validation
    if (options.allowedChars && !options.allowedChars.test(sanitized)) {
      throw new Error('Input contains invalid characters')
    }

    return sanitized
  }

  // Validate phone number format
  validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    const sanitized = phone.replace(/[\s\-\(\)]/g, '')
    return phoneRegex.test(sanitized)
  }

  // Validate email format
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email.toLowerCase())
  }

  // Password strength validation
  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (password.length < this.defaultPolicy.passwordMinLength) {
      errors.push(`Password must be at least ${this.defaultPolicy.passwordMinLength} characters long`)
    }

    if (this.defaultPolicy.passwordRequireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (this.defaultPolicy.passwordRequireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    if (this.defaultPolicy.passwordRequireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }

    // Check for common weak passwords
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ]
    
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common and easily guessable')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // Rate limiting
  checkRateLimit(identifier: string, action: string = 'default'): boolean {
    const key = `${identifier}:${action}`
    const now = new Date()
    const windowMs = this.defaultPolicy.rateLimitWindow * 60 * 1000

    const entry = this.rateLimitMap.get(key)

    if (!entry) {
      // First request
      this.rateLimitMap.set(key, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
        blocked: false
      })
      return true
    }

    // Check if window has expired
    if (now.getTime() - entry.firstAttempt.getTime() > windowMs) {
      // Reset window
      this.rateLimitMap.set(key, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
        blocked: false
      })
      return true
    }

    // Check if currently blocked
    if (entry.blocked && entry.blockedUntil && now < entry.blockedUntil) {
      return false
    }

    // Increment counter
    entry.count++
    entry.lastAttempt = now

    // Check if limit exceeded
    if (entry.count > this.defaultPolicy.rateLimitRequests) {
      entry.blocked = true
      entry.blockedUntil = new Date(now.getTime() + windowMs)
      
      // Log security incident
      this.logSecurityIncident({
        type: 'rate_limit_exceeded',
        severity: 'medium',
        ipAddress: identifier,
        userAgent: 'unknown',
        details: {
          action,
          attempts: entry.count,
          windowMinutes: this.defaultPolicy.rateLimitWindow
        }
      })

      return false
    }

    return true
  }

  // Login attempt tracking
  async trackLoginAttempt(
    identifier: string, 
    success: boolean, 
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    const now = new Date()
    const lockoutMs = this.defaultPolicy.lockoutDuration * 60 * 1000

    if (success) {
      // Clear failed attempts on successful login
      this.loginAttempts.delete(identifier)
      
      await auditLogger.logAuthEvent(
        userId || identifier,
        'login',
        { ipAddress, userAgent },
        ipAddress,
        userAgent
      )

      return true
    }

    // Handle failed login
    const attempts = this.loginAttempts.get(identifier)

    if (attempts?.lockedUntil && now < attempts.lockedUntil) {
      // Still locked out
      await auditLogger.logAuthEvent(
        identifier,
        'failed_login',
        { reason: 'account_locked', ipAddress, userAgent },
        ipAddress,
        userAgent
      )

      return false
    }

    // Increment or initialize failed attempts
    const newAttempts = {
      count: attempts ? attempts.count + 1 : 1,
      lastAttempt: now,
      lockedUntil: undefined as Date | undefined
    }

    if (newAttempts.count >= this.defaultPolicy.maxLoginAttempts) {
      // Lock account
      newAttempts.lockedUntil = new Date(now.getTime() + lockoutMs)
      
      await auditLogger.logAuthEvent(
        identifier,
        'account_locked',
        { 
          attempts: newAttempts.count,
          lockoutMinutes: this.defaultPolicy.lockoutDuration,
          ipAddress,
          userAgent 
        },
        ipAddress,
        userAgent
      )

      // Log security incident
      this.logSecurityIncident({
        type: 'failed_login',
        severity: 'high',
        userId: identifier,
        ipAddress: ipAddress || 'unknown',
        userAgent: userAgent || 'unknown',
        details: {
          attempts: newAttempts.count,
          lockoutDuration: this.defaultPolicy.lockoutDuration
        }
      })
    } else {
      await auditLogger.logAuthEvent(
        identifier,
        'failed_login',
        { attempts: newAttempts.count, ipAddress, userAgent },
        ipAddress,
        userAgent
      )
    }

    this.loginAttempts.set(identifier, newAttempts)
    return newAttempts.lockedUntil === undefined
  }

  // Security incident logging
  async logSecurityIncident(incident: Omit<SecurityIncident, 'id' | 'timestamp' | 'resolved' | 'actions'>): Promise<string> {
    const incidentId = dataEncryption.generateSecureToken(16)
    
    const securityIncident: SecurityIncident = {
      id: incidentId,
      timestamp: new Date(),
      resolved: false,
      actions: [],
      ...incident
    }

    this.securityIncidents.set(incidentId, securityIncident)

    // Log to audit trail
    await auditLogger.logSecurityEvent(
      incident.userId || 'unknown',
      `security_${incident.type}`,
      'security_incident',
      incident.details,
      incident.ipAddress,
      incident.userAgent,
      incident.severity
    )

    // Create notification for high/critical incidents
    if (incident.severity === 'high' || incident.severity === 'critical') {
      try {
        await createNotification({
          userId: 'system',
          type: 'ERROR' as any,
          title: `Security Incident: ${incident.type}`,
          message: `${incident.severity.toUpperCase()} security incident detected from ${incident.ipAddress}`,
          priority: incident.severity === 'critical' ? 'HIGH' as any : 'MEDIUM' as any,
          metadata: {
            incidentId,
            type: incident.type,
            severity: incident.severity,
            ipAddress: incident.ipAddress
          }
        })
      } catch (error) {
        console.error('Failed to create security incident notification:', error)
      }
    }

    console.warn(`🚨 SECURITY INCIDENT [${incident.severity.toUpperCase()}]: ${incident.type} from ${incident.ipAddress}`)
    
    return incidentId
  }

  // Detect suspicious activity patterns
  detectSuspiciousActivity(
    userId: string,
    ipAddress: string,
    userAgent: string,
    activity: string,
    metadata: Record<string, any> = {}
  ): boolean {
    let suspicious = false
    const reasons: string[] = []

    // Multiple failed login attempts from different IPs
    const userAttempts = Array.from(this.loginAttempts.entries())
      .filter(([key]) => key.startsWith(userId))
    
    if (userAttempts.length > 3) {
      suspicious = true
      reasons.push('Multiple failed login attempts from different locations')
    }

    // Unusual time-based access patterns
    const hour = new Date().getHours()
    if (hour < 6 || hour > 22) { // Outside business hours
      suspicious = true
      reasons.push('Access attempt outside normal business hours')
    }

    // Rapid successive requests (potential bot behavior)
    const recentRequests = Array.from(this.rateLimitMap.values())
      .filter(entry => entry.lastAttempt.getTime() > Date.now() - 60000) // Last minute
      .filter(entry => entry.count > 20)

    if (recentRequests.length > 0) {
      suspicious = true
      reasons.push('Rapid successive requests detected')
    }

    if (suspicious) {
      this.logSecurityIncident({
        type: 'suspicious_activity',
        severity: 'medium',
        userId,
        ipAddress,
        userAgent,
        details: {
          activity,
          reasons,
          ...metadata
        }
      })
    }

    return suspicious
  }

  // Extract client information from request
  extractClientInfo(request: NextRequest): {
    ipAddress: string
    userAgent: string
    fingerprint: string
  } {
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'

    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Create basic fingerprint (in production, use more sophisticated fingerprinting)
    const fingerprint = dataEncryption.hashData(`${ipAddress}:${userAgent}`)

    return { ipAddress, userAgent, fingerprint }
  }

  // Validate API request
  async validateAPIRequest(
    request: NextRequest,
    requireAuth: boolean = true,
    rateLimitAction?: string
  ): Promise<{
    valid: boolean
    errors: string[]
    userId?: string
    clientInfo: { ipAddress: string; userAgent: string; fingerprint: string }
  }> {
    const errors: string[] = []
    const clientInfo = this.extractClientInfo(request)

    // Rate limiting check
    if (rateLimitAction) {
      if (!this.checkRateLimit(clientInfo.ipAddress, rateLimitAction)) {
        errors.push('Rate limit exceeded')
      }
    }

    // Authentication check
    let userId: string | undefined
    if (requireAuth) {
      try {
        const session = await getServerSession()
        if (!session?.user?.id) {
          errors.push('Authentication required')
        } else {
          userId = session.user.id

          // Check for suspicious activity
          this.detectSuspiciousActivity(
            userId,
            clientInfo.ipAddress,
            clientInfo.userAgent,
            `API:${request.method}:${request.nextUrl.pathname}`
          )
        }
      } catch (error) {
        errors.push('Authentication validation failed')
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      userId,
      clientInfo
    }
  }

  // Get security incidents
  getSecurityIncidents(filters?: {
    type?: SecurityIncident['type']
    severity?: SecurityIncident['severity']
    resolved?: boolean
    limit?: number
  }): SecurityIncident[] {
    let incidents = Array.from(this.securityIncidents.values())

    if (filters?.type) {
      incidents = incidents.filter(i => i.type === filters.type)
    }

    if (filters?.severity) {
      incidents = incidents.filter(i => i.severity === filters.severity)
    }

    if (filters?.resolved !== undefined) {
      incidents = incidents.filter(i => i.resolved === filters.resolved)
    }

    // Sort by timestamp (newest first)
    incidents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    if (filters?.limit) {
      incidents = incidents.slice(0, filters.limit)
    }

    return incidents
  }

  // Resolve security incident
  async resolveSecurityIncident(incidentId: string, resolution: string): Promise<boolean> {
    const incident = this.securityIncidents.get(incidentId)
    if (!incident) {
      return false
    }

    incident.resolved = true
    incident.actions.push(`Resolved: ${resolution}`)

    await auditLogger.logSystemEvent(
      'security_incident_resolved',
      'security_incident',
      {
        incidentId,
        type: incident.type,
        resolution
      },
      true,
      'low'
    )

    return true
  }

  // Cleanup expired entries
  private startCleanupIntervals(): void {
    // Clean up rate limit entries every 5 minutes
    setInterval(() => {
      const now = new Date()
      const expiredEntries: string[] = []

      for (const [key, entry] of this.rateLimitMap.entries()) {
        const windowMs = this.defaultPolicy.rateLimitWindow * 60 * 1000
        if (now.getTime() - entry.lastAttempt.getTime() > windowMs) {
          expiredEntries.push(key)
        }
      }

      expiredEntries.forEach(key => this.rateLimitMap.delete(key))
      
      if (expiredEntries.length > 0) {
        console.log(`🧹 Cleaned up ${expiredEntries.length} expired rate limit entries`)
      }
    }, 5 * 60 * 1000)

    // Clean up login attempts every 10 minutes
    setInterval(() => {
      const now = new Date()
      const expiredAttempts: string[] = []

      for (const [key, attempts] of this.loginAttempts.entries()) {
        const lockoutMs = this.defaultPolicy.lockoutDuration * 60 * 1000
        if (attempts.lockedUntil && now.getTime() > attempts.lockedUntil.getTime() + lockoutMs) {
          expiredAttempts.push(key)
        }
      }

      expiredAttempts.forEach(key => this.loginAttempts.delete(key))
      
      if (expiredAttempts.length > 0) {
        console.log(`🧹 Cleaned up ${expiredAttempts.length} expired login attempt records`)
      }
    }, 10 * 60 * 1000)
  }
}

export const securityManager = new SecurityManager()

// Utility functions for common security operations
export const sanitizeInput = securityManager.sanitizeInput.bind(securityManager)
export const validateEmail = securityManager.validateEmail.bind(securityManager)
export const validatePhone = securityManager.validatePhoneNumber.bind(securityManager)
export const validatePassword = securityManager.validatePassword.bind(securityManager)
export const checkRateLimit = securityManager.checkRateLimit.bind(securityManager)
export const trackLoginAttempt = securityManager.trackLoginAttempt.bind(securityManager)
export const validateAPIRequest = securityManager.validateAPIRequest.bind(securityManager)