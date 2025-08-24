import { prisma } from '@/lib/prisma'

export interface AuditLogEntry {
  id?: string
  userId: string
  userEmail?: string
  action: string
  resource: string
  resourceId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  success: boolean
  errorMessage?: string
  timestamp: Date
  sessionId?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface AuditFilter {
  userId?: string
  action?: string
  resource?: string
  success?: boolean
  severity?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

export interface AuditAnalytics {
  totalEvents: number
  successRate: number
  topUsers: { userId: string; count: number; userEmail?: string }[]
  topActions: { action: string; count: number }[]
  topResources: { resource: string; count: number }[]
  errorsByType: { error: string; count: number }[]
  activityByHour: { hour: number; count: number }[]
  securityEvents: AuditLogEntry[]
}

export class AuditLogger {
  private static instance: AuditLogger
  private logBuffer: AuditLogEntry[] = []
  private readonly BUFFER_SIZE = 100
  private readonly FLUSH_INTERVAL = 30000 // 30 seconds
  private flushInterval: NodeJS.Timeout | null = null

  constructor() {
    if (AuditLogger.instance) {
      return AuditLogger.instance
    }

    this.startLogFlushing()
    AuditLogger.instance = this
  }

  // Core logging method
  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const logEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date()
    }

    // Add to buffer for batch processing
    this.logBuffer.push(logEntry)

    // Log critical events immediately
    if (entry.severity === 'critical' || !entry.success) {
      await this.flushSingleLog(logEntry)
    }

    // Console logging for development/debugging
    this.consoleLog(logEntry)

    // Prevent memory issues
    if (this.logBuffer.length > this.BUFFER_SIZE) {
      await this.flushLogs()
    }
  }

  // Convenience methods for common actions
  async logUserAction(
    userId: string,
    action: string,
    resource: string,
    details?: Record<string, any>,
    success: boolean = true,
    resourceId?: string,
    userEmail?: string
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      action,
      resource,
      resourceId,
      details,
      success,
      severity: success ? 'low' : 'medium'
    })
  }

  async logAuthEvent(
    userId: string,
    action: 'login' | 'logout' | 'password_change' | 'failed_login' | 'account_locked',
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
    userEmail?: string
  ): Promise<void> {
    const success = !['failed_login', 'account_locked'].includes(action)
    const severity = action === 'failed_login' ? 'medium' : action === 'account_locked' ? 'high' : 'low'

    await this.log({
      userId,
      userEmail,
      action,
      resource: 'authentication',
      details,
      ipAddress,
      userAgent,
      success,
      severity
    })
  }

  async logSystemEvent(
    action: string,
    resource: string,
    details?: Record<string, any>,
    success: boolean = true,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
  ): Promise<void> {
    await this.log({
      userId: 'system',
      action,
      resource,
      details,
      success,
      severity
    })
  }

  async logSecurityEvent(
    userId: string,
    action: string,
    resource: string,
    details: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
    severity: 'medium' | 'high' | 'critical' = 'high'
  ): Promise<void> {
    await this.log({
      userId,
      action,
      resource,
      details: {
        ...details,
        securityEvent: true,
        detectedAt: new Date().toISOString()
      },
      ipAddress,
      userAgent,
      success: false,
      severity
    })

    console.warn(`🔒 SECURITY EVENT: ${action} on ${resource} by user ${userId}`)
  }

  async logDataAccess(
    userId: string,
    resource: string,
    resourceId: string,
    action: 'create' | 'read' | 'update' | 'delete',
    details?: Record<string, any>,
    success: boolean = true,
    userEmail?: string
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      action: `data_${action}`,
      resource,
      resourceId,
      details,
      success,
      severity: action === 'delete' ? 'medium' : 'low'
    })
  }

  async logCallProcessing(
    userId: string,
    callId: string,
    action: string,
    details: Record<string, any>,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    await this.log({
      userId,
      action,
      resource: 'call_processing',
      resourceId: callId,
      details: {
        ...details,
        processingStep: action,
        timestamp: new Date().toISOString()
      },
      success,
      errorMessage,
      severity: success ? 'low' : 'medium'
    })
  }

  async logAPICall(
    userId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const success = statusCode < 400
    const severity = statusCode >= 500 ? 'high' : statusCode >= 400 ? 'medium' : 'low'

    await this.log({
      userId,
      action: `api_${method.toLowerCase()}`,
      resource: 'api_endpoint',
      resourceId: endpoint,
      details: {
        ...details,
        statusCode,
        responseTime,
        endpoint,
        method
      },
      ipAddress,
      userAgent,
      success,
      severity
    })
  }

  // Query audit logs
  async getLogs(filter: AuditFilter = {}): Promise<AuditLogEntry[]> {
    try {
      // In a real implementation, this would query from database
      // For now, return recent logs from buffer and simulated historical data
      
      let filteredLogs = [...this.logBuffer]

      if (filter.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filter.userId)
      }

      if (filter.action) {
        filteredLogs = filteredLogs.filter(log => log.action === filter.action)
      }

      if (filter.resource) {
        filteredLogs = filteredLogs.filter(log => log.resource === filter.resource)
      }

      if (filter.success !== undefined) {
        filteredLogs = filteredLogs.filter(log => log.success === filter.success)
      }

      if (filter.severity) {
        filteredLogs = filteredLogs.filter(log => log.severity === filter.severity)
      }

      if (filter.startDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filter.startDate!)
      }

      if (filter.endDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filter.endDate!)
      }

      // Sort by timestamp (newest first)
      filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

      // Apply pagination
      const offset = filter.offset || 0
      const limit = filter.limit || 50

      return filteredLogs.slice(offset, offset + limit)

    } catch (error) {
      console.error('Failed to retrieve audit logs:', error)
      throw new Error('Audit log retrieval failed')
    }
  }

  // Generate audit analytics
  async getAnalytics(timeRange: 'day' | 'week' | 'month' = 'day'): Promise<AuditAnalytics> {
    try {
      const timeRanges = {
        day: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000
      }

      const since = new Date(Date.now() - timeRanges[timeRange])
      
      const logs = await this.getLogs({
        startDate: since,
        limit: 1000
      })

      const totalEvents = logs.length
      const successfulEvents = logs.filter(log => log.success).length
      const successRate = totalEvents > 0 ? (successfulEvents / totalEvents) * 100 : 0

      // Top users
      const userCounts = logs.reduce((acc, log) => {
        if (log.userId !== 'system') {
          const existing = acc.find(u => u.userId === log.userId)
          if (existing) {
            existing.count++
          } else {
            acc.push({
              userId: log.userId,
              userEmail: log.userEmail,
              count: 1
            })
          }
        }
        return acc
      }, [] as { userId: string; userEmail?: string; count: number }[])

      const topUsers = userCounts
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Top actions
      const actionCounts = logs.reduce((acc, log) => {
        const existing = acc.find(a => a.action === log.action)
        if (existing) {
          existing.count++
        } else {
          acc.push({ action: log.action, count: 1 })
        }
        return acc
      }, [] as { action: string; count: number }[])

      const topActions = actionCounts
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Top resources
      const resourceCounts = logs.reduce((acc, log) => {
        const existing = acc.find(r => r.resource === log.resource)
        if (existing) {
          existing.count++
        } else {
          acc.push({ resource: log.resource, count: 1 })
        }
        return acc
      }, [] as { resource: string; count: number }[])

      const topResources = resourceCounts
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Errors by type
      const errorLogs = logs.filter(log => !log.success && log.errorMessage)
      const errorCounts = errorLogs.reduce((acc, log) => {
        const error = log.errorMessage || 'Unknown error'
        const existing = acc.find(e => e.error === error)
        if (existing) {
          existing.count++
        } else {
          acc.push({ error, count: 1 })
        }
        return acc
      }, [] as { error: string; count: number }[])

      const errorsByType = errorCounts
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Activity by hour
      const activityByHour = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        count: logs.filter(log => log.timestamp.getHours() === hour).length
      }))

      // Security events
      const securityEvents = logs
        .filter(log => log.severity === 'high' || log.severity === 'critical' || 
                      log.details?.securityEvent === true)
        .slice(0, 20)

      return {
        totalEvents,
        successRate,
        topUsers,
        topActions,
        topResources,
        errorsByType,
        activityByHour,
        securityEvents
      }

    } catch (error) {
      console.error('Failed to generate audit analytics:', error)
      throw new Error('Audit analytics generation failed')
    }
  }

  // Export audit logs
  async exportLogs(filter: AuditFilter = {}, format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const logs = await this.getLogs({ ...filter, limit: 10000 }) // Large export limit

      if (format === 'csv') {
        return this.convertToCSV(logs)
      } else {
        return JSON.stringify(logs, null, 2)
      }

    } catch (error) {
      console.error('Failed to export audit logs:', error)
      throw new Error('Audit log export failed')
    }
  }

  // Private methods
  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return

    const logsToFlush = [...this.logBuffer]
    this.logBuffer = []

    try {
      // In a real implementation, batch insert to database
      console.log(`📝 Flushing ${logsToFlush.length} audit log entries`)
      
      // For now, just log summary
      const actions = logsToFlush.map(l => l.action).join(', ')
      console.log(`📊 Audit actions: ${actions}`)

    } catch (error) {
      console.error('Failed to flush audit logs:', error)
      // Put logs back in buffer
      this.logBuffer.unshift(...logsToFlush)
    }
  }

  private async flushSingleLog(entry: AuditLogEntry): Promise<void> {
    try {
      // In a real implementation, immediately insert to database
      console.log(`📝 Immediate audit log: ${entry.action} on ${entry.resource} by ${entry.userId}`)
    } catch (error) {
      console.error('Failed to flush single audit log:', error)
    }
  }

  private consoleLog(entry: AuditLogEntry): void {
    const icons = {
      low: '📝',
      medium: '📋',
      high: '🔍',
      critical: '🚨'
    }

    const icon = icons[entry.severity]
    const status = entry.success ? '✅' : '❌'
    
    console.log(`${icon} AUDIT [${entry.severity.toUpperCase()}]: ${status} ${entry.action} on ${entry.resource} by ${entry.userId}`)
    
    if (entry.details) {
      console.log(`   Details: ${JSON.stringify(entry.details)}`)
    }
    
    if (entry.errorMessage) {
      console.log(`   Error: ${entry.errorMessage}`)
    }
  }

  private startLogFlushing(): void {
    this.flushInterval = setInterval(async () => {
      await this.flushLogs()
    }, this.FLUSH_INTERVAL)
  }

  private convertToCSV(logs: AuditLogEntry[]): string {
    const headers = [
      'Timestamp',
      'User ID',
      'User Email',
      'Action',
      'Resource',
      'Resource ID',
      'Success',
      'Severity',
      'IP Address',
      'User Agent',
      'Error Message',
      'Details'
    ]

    const csvRows = [headers.join(',')]

    for (const log of logs) {
      const row = [
        log.timestamp.toISOString(),
        log.userId,
        log.userEmail || '',
        log.action,
        log.resource,
        log.resourceId || '',
        log.success.toString(),
        log.severity,
        log.ipAddress || '',
        log.userAgent || '',
        log.errorMessage || '',
        log.details ? JSON.stringify(log.details).replace(/"/g, '""') : ''
      ]

      csvRows.push(row.map(field => `"${field}"`).join(','))
    }

    return csvRows.join('\n')
  }

  // Cleanup method
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }

    // Final flush
    this.flushLogs().catch(error => {
      console.error('Final audit log flush failed:', error)
    })
  }
}

// Singleton instance
export const auditLogger = new AuditLogger()

// Convenience functions
export const logUserAction = auditLogger.logUserAction.bind(auditLogger)
export const logAuthEvent = auditLogger.logAuthEvent.bind(auditLogger)
export const logSystemEvent = auditLogger.logSystemEvent.bind(auditLogger)
export const logSecurityEvent = auditLogger.logSecurityEvent.bind(auditLogger)
export const logDataAccess = auditLogger.logDataAccess.bind(auditLogger)
export const logCallProcessing = auditLogger.logCallProcessing.bind(auditLogger)
export const logAPICall = auditLogger.logAPICall.bind(auditLogger)