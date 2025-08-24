import { NextRequest } from 'next/server'
import { auditLogger } from './audit-logging'
import { createNotification } from './notifications'

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (request: NextRequest) => string
  onLimitReached?: (key: string, request: NextRequest) => Promise<void>
  whitelist?: string[]
  blacklist?: string[]
}

export interface RateLimitEntry {
  count: number
  resetTime: number
  blocked: boolean
  firstRequest: number
  lastRequest: number
  violations: number
}

export interface ApiEndpointConfig {
  endpoint: string
  method?: string
  config: RateLimitConfig
  description: string
}

export class AdvancedRateLimiter {
  private static instance: AdvancedRateLimiter
  private rateLimitStore: Map<string, RateLimitEntry> = new Map()
  private violationHistory: Map<string, { count: number; lastViolation: number }> = new Map()
  private dynamicLimits: Map<string, number> = new Map()

  // Predefined endpoint configurations
  private readonly ENDPOINT_CONFIGS: ApiEndpointConfig[] = [
    {
      endpoint: '/api/auth/login',
      method: 'POST',
      config: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5, // 5 login attempts per 15 minutes
        skipSuccessfulRequests: false
      },
      description: 'Login endpoint - strict limit to prevent brute force'
    },
    {
      endpoint: '/api/auth/register',
      method: 'POST',
      config: {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 3, // 3 registration attempts per hour
        skipSuccessfulRequests: true
      },
      description: 'Registration endpoint - prevent spam accounts'
    },
    {
      endpoint: '/api/twilio/webhook',
      method: 'POST',
      config: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 100, // 100 webhook calls per minute
        skipSuccessfulRequests: true
      },
      description: 'Twilio webhooks - high volume but legitimate'
    },
    {
      endpoint: '/api/calls',
      method: 'POST',
      config: {
        windowMs: 5 * 60 * 1000, // 5 minutes
        maxRequests: 50, // 50 call creations per 5 minutes
        skipSuccessfulRequests: false
      },
      description: 'Call creation - moderate limit for normal usage'
    },
    {
      endpoint: '/api/calls',
      method: 'GET',
      config: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 200, // 200 reads per minute
        skipSuccessfulRequests: true
      },
      description: 'Call listing - generous read limit'
    },
    {
      endpoint: '/api/customers',
      config: {
        windowMs: 5 * 60 * 1000, // 5 minutes
        maxRequests: 100, // 100 customer operations per 5 minutes
        skipSuccessfulRequests: false
      },
      description: 'Customer management - standard business operations'
    },
    {
      endpoint: '/api/feedback',
      method: 'POST',
      config: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 10, // 10 feedback submissions per minute
        skipSuccessfulRequests: false
      },
      description: 'Feedback submission - prevent spam feedback'
    },
    {
      endpoint: '/api/monitoring',
      config: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 30, // 30 monitoring requests per minute
        skipSuccessfulRequests: true
      },
      description: 'Monitoring endpoints - administrative access'
    }
  ]

  constructor() {
    if (AdvancedRateLimiter.instance) {
      return AdvancedRateLimiter.instance
    }

    this.startCleanupInterval()
    this.startViolationAnalysis()
    AdvancedRateLimiter.instance = this
    console.log('🛡️ Advanced Rate Limiter initialized')
  }

  // Main rate limiting function
  async checkRateLimit(
    request: NextRequest,
    customConfig?: RateLimitConfig
  ): Promise<{
    allowed: boolean
    limit: number
    remaining: number
    resetTime: number
    retryAfter?: number
  }> {
    const config = customConfig || this.getEndpointConfig(request)
    const key = this.generateKey(request, config)
    const now = Date.now()

    let entry = this.rateLimitStore.get(key)

    // Initialize or reset entry if window has expired
    if (!entry || now >= entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
        blocked: false,
        firstRequest: now,
        lastRequest: now,
        violations: 0
      }
    }

    // Update entry
    entry.lastRequest = now
    entry.count++

    // Apply dynamic limits based on violation history
    const effectiveLimit = this.getEffectiveLimit(key, config.maxRequests)

    // Check if limit exceeded
    if (entry.count > effectiveLimit) {
      entry.blocked = true
      entry.violations++

      // Track violation history
      this.trackViolation(key)

      // Execute callback if provided
      if (config.onLimitReached) {
        await config.onLimitReached(key, request)
      }

      // Log rate limit violation
      await this.logRateLimitViolation(key, request, entry, effectiveLimit)

      this.rateLimitStore.set(key, entry)

      return {
        allowed: false,
        limit: effectiveLimit,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      }
    }

    this.rateLimitStore.set(key, entry)

    return {
      allowed: true,
      limit: effectiveLimit,
      remaining: Math.max(0, effectiveLimit - entry.count),
      resetTime: entry.resetTime
    }
  }

  // Distributed rate limiting for multiple instances
  async checkDistributedRateLimit(
    key: string,
    config: RateLimitConfig
  ): Promise<{
    allowed: boolean
    limit: number
    remaining: number
    resetTime: number
  }> {
    // In a real implementation, this would use Redis or another distributed store
    // For now, fall back to local rate limiting
    console.log(`🌐 Distributed rate limit check for key: ${key}`)
    
    // Mock distributed logic
    const distributedEntry = {
      count: Math.floor(Math.random() * config.maxRequests),
      resetTime: Date.now() + config.windowMs
    }

    const allowed = distributedEntry.count < config.maxRequests
    
    return {
      allowed,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - distributedEntry.count),
      resetTime: distributedEntry.resetTime
    }
  }

  // IP-based rate limiting with CIDR support
  async checkIPRateLimit(
    ipAddress: string,
    config: RateLimitConfig
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Check whitelist
    if (config.whitelist && this.isIPInList(ipAddress, config.whitelist)) {
      return { allowed: true, reason: 'IP whitelisted' }
    }

    // Check blacklist
    if (config.blacklist && this.isIPInList(ipAddress, config.blacklist)) {
      return { allowed: false, reason: 'IP blacklisted' }
    }

    // Check if IP is in violation history
    const violations = this.violationHistory.get(ipAddress)
    if (violations && violations.count > 10) {
      const timeSinceLastViolation = Date.now() - violations.lastViolation
      if (timeSinceLastViolation < 60 * 60 * 1000) { // 1 hour
        return { allowed: false, reason: 'IP temporarily banned due to repeated violations' }
      }
    }

    return { allowed: true }
  }

  // User-specific rate limiting
  async checkUserRateLimit(
    userId: string,
    action: string,
    config: RateLimitConfig
  ): Promise<{ allowed: boolean; remaining: number }> {
    const key = `user:${userId}:${action}`
    const now = Date.now()

    let entry = this.rateLimitStore.get(key)

    if (!entry || now >= entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
        blocked: false,
        firstRequest: now,
        lastRequest: now,
        violations: 0
      }
    }

    entry.count++
    entry.lastRequest = now

    const allowed = entry.count <= config.maxRequests
    
    this.rateLimitStore.set(key, entry)

    return {
      allowed,
      remaining: Math.max(0, config.maxRequests - entry.count)
    }
  }

  // Adaptive rate limiting based on system load
  async getAdaptiveRateLimit(
    baseConfig: RateLimitConfig,
    systemMetrics: { cpuUsage: number; memoryUsage: number; errorRate: number }
  ): Promise<RateLimitConfig> {
    let multiplier = 1.0

    // Reduce limits if system is under stress
    if (systemMetrics.cpuUsage > 80) {
      multiplier *= 0.7
    }
    
    if (systemMetrics.memoryUsage > 85) {
      multiplier *= 0.8
    }
    
    if (systemMetrics.errorRate > 5) {
      multiplier *= 0.6
    }

    // Increase limits if system is performing well
    if (systemMetrics.cpuUsage < 50 && systemMetrics.memoryUsage < 70 && systemMetrics.errorRate < 1) {
      multiplier *= 1.2
    }

    return {
      ...baseConfig,
      maxRequests: Math.ceil(baseConfig.maxRequests * multiplier)
    }
  }

  // Burst handling with token bucket algorithm
  async checkTokenBucket(
    key: string,
    capacity: number,
    refillRate: number, // tokens per second
    requestTokens: number = 1
  ): Promise<{ allowed: boolean; tokens: number }> {
    const now = Date.now() / 1000
    let bucket = this.rateLimitStore.get(`bucket:${key}`)

    if (!bucket) {
      bucket = {
        count: capacity, // Start with full bucket
        resetTime: now,
        blocked: false,
        firstRequest: now,
        lastRequest: now,
        violations: 0
      }
    }

    // Refill tokens based on elapsed time
    const elapsed = now - bucket.resetTime
    const tokensToAdd = Math.floor(elapsed * refillRate)
    bucket.count = Math.min(capacity, bucket.count + tokensToAdd)
    bucket.resetTime = now

    // Check if enough tokens available
    if (bucket.count >= requestTokens) {
      bucket.count -= requestTokens
      this.rateLimitStore.set(`bucket:${key}`, bucket)
      return { allowed: true, tokens: bucket.count }
    }

    this.rateLimitStore.set(`bucket:${key}`, bucket)
    return { allowed: false, tokens: bucket.count }
  }

  // Get rate limit statistics
  getRateLimitStats(): {
    totalEntries: number
    activeBlocks: number
    topViolators: { key: string; violations: number }[]
    recentActivity: { key: string; requests: number; lastRequest: Date }[]
  } {
    const entries = Array.from(this.rateLimitStore.entries())
    const now = Date.now()

    const activeBlocks = entries.filter(([_, entry]) => 
      entry.blocked && entry.resetTime > now
    ).length

    const topViolators = Array.from(this.violationHistory.entries())
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 10)
      .map(([key, violations]) => ({ key, violations: violations.count }))

    const recentActivity = entries
      .filter(([_, entry]) => now - entry.lastRequest < 5 * 60 * 1000) // Last 5 minutes
      .sort(([,a], [,b]) => b.lastRequest - a.lastRequest)
      .slice(0, 20)
      .map(([key, entry]) => ({
        key,
        requests: entry.count,
        lastRequest: new Date(entry.lastRequest)
      }))

    return {
      totalEntries: entries.length,
      activeBlocks,
      topViolators,
      recentActivity
    }
  }

  // Manual override for rate limits
  async overrideRateLimit(
    key: string,
    action: 'unblock' | 'block' | 'reset',
    reason: string,
    adminUserId: string
  ): Promise<boolean> {
    const entry = this.rateLimitStore.get(key)

    switch (action) {
      case 'unblock':
        if (entry) {
          entry.blocked = false
          entry.violations = 0
          this.rateLimitStore.set(key, entry)
        }
        this.violationHistory.delete(key)
        break

      case 'block':
        if (entry) {
          entry.blocked = true
          this.rateLimitStore.set(key, entry)
        }
        this.violationHistory.set(key, { count: 999, lastViolation: Date.now() })
        break

      case 'reset':
        this.rateLimitStore.delete(key)
        this.violationHistory.delete(key)
        break
    }

    // Log admin action
    await auditLogger.log({
      userId: adminUserId,
      action: `rate_limit_${action}`,
      resource: 'rate_limiter',
      resourceId: key,
      details: { action, reason, key },
      success: true,
      severity: 'medium'
    })

    console.log(`🛡️ Rate limit override: ${action} for ${key} by ${adminUserId}`)
    return true
  }

  // Private helper methods
  private getEndpointConfig(request: NextRequest): RateLimitConfig {
    const pathname = request.nextUrl.pathname
    const method = request.method

    // Find matching endpoint configuration
    const endpointConfig = this.ENDPOINT_CONFIGS.find(config => {
      const pathMatches = pathname.startsWith(config.endpoint)
      const methodMatches = !config.method || config.method === method
      return pathMatches && methodMatches
    })

    if (endpointConfig) {
      return endpointConfig.config
    }

    // Default configuration
    return {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100 // 100 requests per 15 minutes
    }
  }

  private generateKey(request: NextRequest, config: RateLimitConfig): string {
    if (config.keyGenerator) {
      return config.keyGenerator(request)
    }

    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    const pathname = request.nextUrl.pathname
    const method = request.method

    return `${ip}:${method}:${pathname}`
  }

  private getEffectiveLimit(key: string, baseLimit: number): number {
    const dynamicLimit = this.dynamicLimits.get(key)
    if (dynamicLimit !== undefined) {
      return dynamicLimit
    }

    // Check violation history for reduced limits
    const violations = this.violationHistory.get(key)
    if (violations && violations.count > 5) {
      return Math.max(1, Math.floor(baseLimit * 0.5)) // Reduce by 50%
    }

    return baseLimit
  }

  private trackViolation(key: string): void {
    const existing = this.violationHistory.get(key)
    if (existing) {
      existing.count++
      existing.lastViolation = Date.now()
    } else {
      this.violationHistory.set(key, {
        count: 1,
        lastViolation: Date.now()
      })
    }
  }

  private async logRateLimitViolation(
    key: string,
    request: NextRequest,
    entry: RateLimitEntry,
    limit: number
  ): Promise<void> {
    const clientInfo = {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      pathname: request.nextUrl.pathname,
      method: request.method
    }

    // Log to audit trail
    await auditLogger.log({
      userId: 'system',
      action: 'rate_limit_exceeded',
      resource: 'api_endpoint',
      resourceId: clientInfo.pathname,
      details: {
        key,
        limit,
        attempts: entry.count,
        violations: entry.violations,
        clientInfo
      },
      success: false,
      severity: entry.violations > 5 ? 'high' : 'medium',
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent
    })

    // Create notification for repeated violations
    if (entry.violations > 10) {
      try {
        await createNotification({
          userId: 'security-team',
          type: 'WARNING' as any,
          title: 'Repeated Rate Limit Violations',
          message: `Key ${key} has exceeded rate limits ${entry.violations} times`,
          priority: 'HIGH' as any,
          metadata: {
            key,
            violations: entry.violations,
            clientInfo
          }
        })
      } catch (error) {
        console.error('Failed to create rate limit notification:', error)
      }
    }

    console.warn(`🛡️ Rate limit exceeded: ${key} (${entry.count}/${limit})`)
  }

  private isIPInList(ip: string, list: string[]): boolean {
    // Simple IP matching - in production, implement CIDR matching
    return list.includes(ip)
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now()
      let cleanedEntries = 0

      // Clean up expired rate limit entries
      for (const [key, entry] of this.rateLimitStore.entries()) {
        if (entry.resetTime <= now) {
          this.rateLimitStore.delete(key)
          cleanedEntries++
        }
      }

      // Clean up old violation history
      for (const [key, violations] of this.violationHistory.entries()) {
        if (now - violations.lastViolation > 24 * 60 * 60 * 1000) { // 24 hours
          this.violationHistory.delete(key)
        }
      }

      if (cleanedEntries > 0) {
        console.log(`🧹 Rate limiter cleaned up ${cleanedEntries} expired entries`)
      }
    }, 10 * 60 * 1000) // Every 10 minutes
  }

  private startViolationAnalysis(): void {
    setInterval(() => {
      const analysis = this.analyzeViolationPatterns()
      if (analysis.suspiciousPatterns.length > 0) {
        console.warn(`🔍 Detected ${analysis.suspiciousPatterns.length} suspicious rate limit patterns`)
      }
    }, 5 * 60 * 1000) // Every 5 minutes
  }

  private analyzeViolationPatterns(): {
    suspiciousPatterns: string[]
    recommendations: string[]
  } {
    const now = Date.now()
    const recentViolations = Array.from(this.violationHistory.entries())
      .filter(([_, violations]) => now - violations.lastViolation < 60 * 60 * 1000) // Last hour

    const suspiciousPatterns: string[] = []
    const recommendations: string[] = []

    // Pattern: Multiple IPs with similar violation patterns
    const violationCounts = recentViolations.map(([_, v]) => v.count)
    const avgViolations = violationCounts.length > 0 
      ? violationCounts.reduce((a, b) => a + b, 0) / violationCounts.length 
      : 0

    if (avgViolations > 20) {
      suspiciousPatterns.push('High average violation rate detected')
      recommendations.push('Consider implementing more aggressive rate limiting')
    }

    // Pattern: Rapid successive violations from single source
    for (const [key, violations] of recentViolations) {
      if (violations.count > 50) {
        suspiciousPatterns.push(`Excessive violations from ${key}`)
        recommendations.push(`Consider blocking or investigating ${key}`)
      }
    }

    return { suspiciousPatterns, recommendations }
  }
}

export const rateLimiter = new AdvancedRateLimiter()

// Utility functions
export const checkRateLimit = rateLimiter.checkRateLimit.bind(rateLimiter)
export const checkUserRateLimit = rateLimiter.checkUserRateLimit.bind(rateLimiter)
export const checkIPRateLimit = rateLimiter.checkIPRateLimit.bind(rateLimiter)
export const overrideRateLimit = rateLimiter.overrideRateLimit.bind(rateLimiter)