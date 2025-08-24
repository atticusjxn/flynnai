import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { securityManager } from './security'
import { auditLogger } from './audit-logging'

export interface AuthConfig {
  requireAuth: boolean
  requiredRoles?: string[]
  requiredPermissions?: string[]
  rateLimitAction?: string
  allowAnonymous?: boolean
  skipCSRFCheck?: boolean
}

export interface Permission {
  id: string
  name: string
  description: string
  resource: string
  actions: string[]
}

export interface Role {
  id: string
  name: string
  description: string
  permissions: Permission[]
  level: number // Higher number = more privileged
}

export interface UserSession {
  userId: string
  email: string
  roles: Role[]
  permissions: Permission[]
  sessionId: string
  lastActivity: Date
  ipAddress: string
  userAgent: string
}

// Default roles and permissions
const DEFAULT_PERMISSIONS: Permission[] = [
  {
    id: 'calls.read',
    name: 'Read Calls',
    description: 'View call records and details',
    resource: 'calls',
    actions: ['read']
  },
  {
    id: 'calls.create',
    name: 'Create Calls',
    description: 'Initiate new calls',
    resource: 'calls',
    actions: ['create']
  },
  {
    id: 'calls.update',
    name: 'Update Calls',
    description: 'Modify call records',
    resource: 'calls',
    actions: ['update']
  },
  {
    id: 'calls.delete',
    name: 'Delete Calls',
    description: 'Delete call records',
    resource: 'calls',
    actions: ['delete']
  },
  {
    id: 'customers.read',
    name: 'Read Customers',
    description: 'View customer information',
    resource: 'customers',
    actions: ['read']
  },
  {
    id: 'customers.create',
    name: 'Create Customers',
    description: 'Add new customers',
    resource: 'customers',
    actions: ['create']
  },
  {
    id: 'customers.update',
    name: 'Update Customers',
    description: 'Modify customer information',
    resource: 'customers',
    actions: ['update']
  },
  {
    id: 'customers.delete',
    name: 'Delete Customers',
    description: 'Remove customers',
    resource: 'customers',
    actions: ['delete']
  },
  {
    id: 'jobs.read',
    name: 'Read Jobs',
    description: 'View job information',
    resource: 'jobs',
    actions: ['read']
  },
  {
    id: 'jobs.create',
    name: 'Create Jobs',
    description: 'Create new jobs',
    resource: 'jobs',
    actions: ['create']
  },
  {
    id: 'jobs.update',
    name: 'Update Jobs',
    description: 'Modify job information',
    resource: 'jobs',
    actions: ['update']
  },
  {
    id: 'jobs.delete',
    name: 'Delete Jobs',
    description: 'Remove jobs',
    resource: 'jobs',
    actions: ['delete']
  },
  {
    id: 'settings.read',
    name: 'Read Settings',
    description: 'View system settings',
    resource: 'settings',
    actions: ['read']
  },
  {
    id: 'settings.update',
    name: 'Update Settings',
    description: 'Modify system settings',
    resource: 'settings',
    actions: ['update']
  },
  {
    id: 'monitoring.read',
    name: 'Read Monitoring',
    description: 'View monitoring and analytics data',
    resource: 'monitoring',
    actions: ['read']
  },
  {
    id: 'audit.read',
    name: 'Read Audit Logs',
    description: 'View audit trail and logs',
    resource: 'audit',
    actions: ['read']
  },
  {
    id: 'admin.all',
    name: 'Admin Access',
    description: 'Full administrative access',
    resource: 'admin',
    actions: ['create', 'read', 'update', 'delete']
  }
]

const DEFAULT_ROLES: Role[] = [
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to basic data',
    level: 1,
    permissions: DEFAULT_PERMISSIONS.filter(p => 
      ['calls.read', 'customers.read', 'jobs.read'].includes(p.id)
    )
  },
  {
    id: 'operator',
    name: 'Operator',
    description: 'Standard operator with call and customer management',
    level: 2,
    permissions: DEFAULT_PERMISSIONS.filter(p => 
      p.resource === 'calls' || 
      p.resource === 'customers' || 
      p.resource === 'jobs' ||
      p.id === 'settings.read'
    )
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Management access with monitoring capabilities',
    level: 3,
    permissions: DEFAULT_PERMISSIONS.filter(p => 
      p.resource === 'calls' || 
      p.resource === 'customers' || 
      p.resource === 'jobs' ||
      p.resource === 'settings' ||
      p.resource === 'monitoring' ||
      p.id === 'audit.read'
    )
  },
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access',
    level: 4,
    permissions: DEFAULT_PERMISSIONS
  }
]

export class AuthorizationManager {
  private static instance: AuthorizationManager
  private activeSessions: Map<string, UserSession> = new Map()
  private sessionTimeout: number = 8 * 60 * 60 * 1000 // 8 hours

  constructor() {
    if (AuthorizationManager.instance) {
      return AuthorizationManager.instance
    }

    this.startSessionCleanup()
    AuthorizationManager.instance = this
    console.log('🔐 Authorization Manager initialized')
  }

  // Create user session with role-based permissions
  async createUserSession(
    userId: string,
    email: string,
    userRoles: string[],
    ipAddress: string,
    userAgent: string
  ): Promise<UserSession> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Map role names to role objects
    const roles = DEFAULT_ROLES.filter(role => userRoles.includes(role.name.toLowerCase()))
    
    // Collect all permissions from assigned roles
    const permissions = roles.flatMap(role => role.permissions)
    
    // Remove duplicates
    const uniquePermissions = permissions.filter((permission, index, self) => 
      index === self.findIndex(p => p.id === permission.id)
    )

    const session: UserSession = {
      userId,
      email,
      roles,
      permissions: uniquePermissions,
      sessionId,
      lastActivity: new Date(),
      ipAddress,
      userAgent
    }

    this.activeSessions.set(sessionId, session)

    // Log session creation
    await auditLogger.logAuthEvent(
      userId,
      'login',
      {
        sessionId,
        roles: userRoles,
        permissionCount: uniquePermissions.length,
        ipAddress,
        userAgent
      },
      ipAddress,
      userAgent,
      email
    )

    console.log(`🔐 Created session for user ${userId} with roles: ${userRoles.join(', ')}`)
    return session
  }

  // Validate user session and update last activity
  validateSession(sessionId: string): UserSession | null {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      return null
    }

    // Check if session has expired
    const now = new Date()
    if (now.getTime() - session.lastActivity.getTime() > this.sessionTimeout) {
      this.activeSessions.delete(sessionId)
      console.log(`🕒 Session ${sessionId} expired for user ${session.userId}`)
      return null
    }

    // Update last activity
    session.lastActivity = now
    return session
  }

  // Check if user has required permission
  hasPermission(session: UserSession, requiredPermission: string): boolean {
    return session.permissions.some(permission => permission.id === requiredPermission)
  }

  // Check if user has any of the required roles
  hasRole(session: UserSession, requiredRoles: string[]): boolean {
    return session.roles.some(role => 
      requiredRoles.includes(role.name.toLowerCase())
    )
  }

  // Check if user has required role level (minimum level)
  hasRoleLevel(session: UserSession, minimumLevel: number): boolean {
    return session.roles.some(role => role.level >= minimumLevel)
  }

  // Check resource-specific access
  canAccessResource(
    session: UserSession, 
    resource: string, 
    action: string
  ): boolean {
    return session.permissions.some(permission => 
      permission.resource === resource && 
      permission.actions.includes(action)
    )
  }

  // End user session
  async endSession(sessionId: string): Promise<boolean> {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      return false
    }

    this.activeSessions.delete(sessionId)

    // Log session end
    await auditLogger.logAuthEvent(
      session.userId,
      'logout',
      {
        sessionId,
        duration: Date.now() - session.lastActivity.getTime(),
        ipAddress: session.ipAddress
      },
      session.ipAddress,
      session.userAgent,
      session.email
    )

    console.log(`🔐 Ended session ${sessionId} for user ${session.userId}`)
    return true
  }

  // Get active sessions for a user
  getUserSessions(userId: string): UserSession[] {
    return Array.from(this.activeSessions.values())
      .filter(session => session.userId === userId)
  }

  // End all sessions for a user
  async endAllUserSessions(userId: string): Promise<number> {
    const userSessions = this.getUserSessions(userId)
    
    for (const session of userSessions) {
      await this.endSession(session.sessionId)
    }

    console.log(`🔐 Ended ${userSessions.length} sessions for user ${userId}`)
    return userSessions.length
  }

  // Get session statistics
  getSessionStatistics(): {
    totalActiveSessions: number
    sessionsByRole: Record<string, number>
    averageSessionDuration: number
  } {
    const sessions = Array.from(this.activeSessions.values())
    const now = new Date().getTime()

    const sessionsByRole = sessions.reduce((acc, session) => {
      session.roles.forEach(role => {
        acc[role.name] = (acc[role.name] || 0) + 1
      })
      return acc
    }, {} as Record<string, number>)

    const averageSessionDuration = sessions.length > 0 
      ? sessions.reduce((sum, session) => 
          sum + (now - session.lastActivity.getTime()), 0
        ) / sessions.length 
      : 0

    return {
      totalActiveSessions: sessions.length,
      sessionsByRole,
      averageSessionDuration
    }
  }

  // Clean up expired sessions
  private startSessionCleanup(): void {
    setInterval(() => {
      const now = new Date()
      const expiredSessions: string[] = []

      for (const [sessionId, session] of this.activeSessions.entries()) {
        if (now.getTime() - session.lastActivity.getTime() > this.sessionTimeout) {
          expiredSessions.push(sessionId)
        }
      }

      expiredSessions.forEach(sessionId => {
        const session = this.activeSessions.get(sessionId)
        if (session) {
          console.log(`🕒 Auto-expired session ${sessionId} for user ${session.userId}`)
        }
        this.activeSessions.delete(sessionId)
      })

      if (expiredSessions.length > 0) {
        console.log(`🧹 Cleaned up ${expiredSessions.length} expired sessions`)
      }
    }, 15 * 60 * 1000) // Check every 15 minutes
  }
}

// Authentication middleware function
export async function createAuthMiddleware(config: AuthConfig = { requireAuth: true }) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now()

    try {
      // Extract client information
      const clientInfo = securityManager.extractClientInfo(request)

      // Validate API request
      const validation = await securityManager.validateAPIRequest(
        request,
        config.requireAuth,
        config.rateLimitAction
      )

      if (!validation.valid) {
        // Log failed authentication attempt
        await auditLogger.logAPICall(
          'anonymous',
          request.nextUrl.pathname,
          request.method,
          401,
          Date.now() - startTime,
          {
            errors: validation.errors,
            rejected: true
          },
          clientInfo.ipAddress,
          clientInfo.userAgent
        )

        return NextResponse.json(
          { error: 'Access denied', details: validation.errors },
          { status: 401 }
        )
      }

      // For authenticated requests, check authorization
      if (validation.userId && (config.requiredRoles || config.requiredPermissions)) {
        const authManager = new AuthorizationManager()
        
        // In a real implementation, you would get session from a secure store
        // For now, we'll create a mock session based on user data
        const userSessions = authManager.getUserSessions(validation.userId)
        const session = userSessions[0] // Get most recent session

        if (session) {
          // Check role requirements
          if (config.requiredRoles && !authManager.hasRole(session, config.requiredRoles)) {
            await auditLogger.logAPICall(
              validation.userId,
              request.nextUrl.pathname,
              request.method,
              403,
              Date.now() - startTime,
              {
                error: 'Insufficient role privileges',
                requiredRoles: config.requiredRoles,
                userRoles: session.roles.map(r => r.name)
              },
              clientInfo.ipAddress,
              clientInfo.userAgent
            )

            return NextResponse.json(
              { error: 'Insufficient privileges' },
              { status: 403 }
            )
          }

          // Check permission requirements
          if (config.requiredPermissions) {
            const hasAllPermissions = config.requiredPermissions.every(permission =>
              authManager.hasPermission(session, permission)
            )

            if (!hasAllPermissions) {
              await auditLogger.logAPICall(
                validation.userId,
                request.nextUrl.pathname,
                request.method,
                403,
                Date.now() - startTime,
                {
                  error: 'Insufficient permissions',
                  requiredPermissions: config.requiredPermissions,
                  userPermissions: session.permissions.map(p => p.id)
                },
                clientInfo.ipAddress,
                clientInfo.userAgent
              )

              return NextResponse.json(
                { error: 'Insufficient permissions' },
                { status: 403 }
              )
            }
          }
        }
      }

      // Log successful API call
      await auditLogger.logAPICall(
        validation.userId || 'anonymous',
        request.nextUrl.pathname,
        request.method,
        200,
        Date.now() - startTime,
        {
          authenticated: !!validation.userId,
          clientFingerprint: clientInfo.fingerprint
        },
        clientInfo.ipAddress,
        clientInfo.userAgent
      )

      // Add security headers to response
      const response = NextResponse.next()
      
      // Security headers
      response.headers.set('X-Frame-Options', 'DENY')
      response.headers.set('X-Content-Type-Options', 'nosniff')
      response.headers.set('X-XSS-Protection', '1; mode=block')
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
      response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
      
      // Content Security Policy
      const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "object-src 'none'"
      ].join('; ')
      
      response.headers.set('Content-Security-Policy', csp)

      return response

    } catch (error) {
      console.error('❌ Authentication middleware error:', error)

      await auditLogger.logAPICall(
        'unknown',
        request.nextUrl.pathname,
        request.method,
        500,
        Date.now() - startTime,
        {
          error: 'Authentication middleware error',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        'unknown',
        'unknown'
      )

      return NextResponse.json(
        { error: 'Authentication service error' },
        { status: 500 }
      )
    }
  }
}

// Role and permission utilities
export const authManager = new AuthorizationManager()

// Export permission and role constants for use in API routes
export { DEFAULT_PERMISSIONS, DEFAULT_ROLES }

// Utility functions
export const requireRole = (roles: string[]) => ({ requiredRoles: roles })
export const requirePermission = (permissions: string[]) => ({ requiredPermissions: permissions })
export const requireAuth = () => ({ requireAuth: true })
export const allowAnonymous = () => ({ requireAuth: false, allowAnonymous: true })