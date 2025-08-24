import { prisma } from '@/lib/prisma'
import { monitoringService } from '@/lib/monitoring'
import { createNotification } from '@/lib/notifications'

export interface HealthCheckResult {
  service: string
  status: 'healthy' | 'warning' | 'critical' | 'down'
  responseTime: number
  message?: string
  metadata?: Record<string, any>
}

export interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical' | 'down'
  checks: HealthCheckResult[]
  timestamp: Date
  uptime: number
}

export class HealthMonitor {
  private static instance: HealthMonitor
  private healthHistory: SystemHealth[] = []
  private readonly MAX_HISTORY = 100
  private monitoringInterval: NodeJS.Timeout | null = null

  constructor() {
    if (HealthMonitor.instance) {
      return HealthMonitor.instance
    }

    this.startContinuousMonitoring()
    HealthMonitor.instance = this
  }

  // Individual health checks
  async checkDatabaseHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    
    try {
      // Test basic connectivity
      await prisma.$queryRaw`SELECT 1`
      
      // Test write capability
      const testWrite = Date.now()
      await prisma.$queryRaw`SELECT ${testWrite}`
      
      // Check active connections (approximate)
      const activeConnections = await prisma.$queryRaw`
        SELECT count(*) as connections 
        FROM pg_stat_activity 
        WHERE state = 'active'
      ` as any[]
      
      const responseTime = Date.now() - startTime
      const connectionCount = activeConnections[0]?.connections || 0
      
      let status: 'healthy' | 'warning' | 'critical' = 'healthy'
      let message = 'Database is responsive'
      
      if (responseTime > 5000) {
        status = 'critical'
        message = `Database response very slow: ${responseTime}ms`
      } else if (responseTime > 1000) {
        status = 'warning'
        message = `Database response slow: ${responseTime}ms`
      }
      
      if (connectionCount > 80) {
        status = 'warning'
        message += `, High connection count: ${connectionCount}`
      }

      return {
        service: 'database',
        status,
        responseTime,
        message,
        metadata: {
          activeConnections: connectionCount,
          queryTime: responseTime
        }
      }
    } catch (error) {
      return {
        service: 'database',
        status: 'down',
        responseTime: Date.now() - startTime,
        message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  async checkOpenAIHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    
    try {
      if (!process.env.OPENAI_API_KEY) {
        return {
          service: 'openai',
          status: 'down',
          responseTime: 0,
          message: 'OpenAI API key not configured',
          metadata: { error: 'Missing API key' }
        }
      }

      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        signal: AbortSignal.timeout(15000) // 15 second timeout
      })

      const responseTime = Date.now() - startTime
      
      if (response.ok) {
        const data = await response.json()
        const modelCount = data.data?.length || 0
        
        return {
          service: 'openai',
          status: 'healthy',
          responseTime,
          message: `OpenAI API responding normally (${modelCount} models available)`,
          metadata: {
            modelCount,
            rateLimitRemaining: response.headers.get('x-ratelimit-remaining')
          }
        }
      } else if (response.status === 429) {
        return {
          service: 'openai',
          status: 'warning',
          responseTime,
          message: 'OpenAI API rate limited',
          metadata: {
            statusCode: response.status,
            rateLimitReset: response.headers.get('x-ratelimit-reset-time')
          }
        }
      } else {
        return {
          service: 'openai',
          status: 'critical',
          responseTime,
          message: `OpenAI API error: ${response.status}`,
          metadata: { statusCode: response.status }
        }
      }
    } catch (error) {
      return {
        service: 'openai',
        status: 'down',
        responseTime: Date.now() - startTime,
        message: `OpenAI API connection failed: ${error instanceof Error ? error.message : 'Network error'}`,
        metadata: { error: error instanceof Error ? error.message : 'Network error' }
      }
    }
  }

  async checkTwilioHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    
    try {
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        return {
          service: 'twilio',
          status: 'down',
          responseTime: 0,
          message: 'Twilio credentials not configured',
          metadata: { error: 'Missing credentials' }
        }
      }

      const credentials = Buffer.from(
        `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
      ).toString('base64')

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}.json`,
        {
          headers: {
            'Authorization': `Basic ${credentials}`
          },
          signal: AbortSignal.timeout(15000)
        }
      )

      const responseTime = Date.now() - startTime
      
      if (response.ok) {
        const accountData = await response.json()
        
        return {
          service: 'twilio',
          status: 'healthy',
          responseTime,
          message: `Twilio API responding normally (${accountData.status})`,
          metadata: {
            accountStatus: accountData.status,
            accountType: accountData.type
          }
        }
      } else {
        return {
          service: 'twilio',
          status: response.status === 401 ? 'critical' : 'warning',
          responseTime,
          message: `Twilio API error: ${response.status}`,
          metadata: { statusCode: response.status }
        }
      }
    } catch (error) {
      return {
        service: 'twilio',
        status: 'down',
        responseTime: Date.now() - startTime,
        message: `Twilio API connection failed: ${error instanceof Error ? error.message : 'Network error'}`,
        metadata: { error: error instanceof Error ? error.message : 'Network error' }
      }
    }
  }

  async checkQueueHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    
    try {
      // Check pending calls queue
      const [pendingCalls, processingCalls, recentFailures] = await Promise.all([
        prisma.callRecord.count({
          where: { status: 'PENDING' }
        }),
        prisma.callRecord.count({
          where: { status: 'PROCESSING' }
        }),
        prisma.callRecord.count({
          where: {
            status: 'FAILED',
            createdAt: {
              gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
            }
          }
        })
      ])

      const responseTime = Date.now() - startTime
      const totalQueue = pendingCalls + processingCalls
      
      let status: 'healthy' | 'warning' | 'critical' = 'healthy'
      let message = `Queue status normal (${totalQueue} calls)`
      
      if (totalQueue > 100) {
        status = 'critical'
        message = `Queue severely backlogged: ${totalQueue} calls`
      } else if (totalQueue > 50) {
        status = 'warning'
        message = `Queue moderately backlogged: ${totalQueue} calls`
      }
      
      if (recentFailures > 10) {
        status = 'warning'
        message += `, High recent failures: ${recentFailures}`
      }

      return {
        service: 'queue',
        status,
        responseTime,
        message,
        metadata: {
          pendingCalls,
          processingCalls,
          recentFailures,
          totalQueue
        }
      }
    } catch (error) {
      return {
        service: 'queue',
        status: 'down',
        responseTime: Date.now() - startTime,
        message: `Queue check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  async checkSystemResources(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    
    try {
      const memUsage = process.memoryUsage()
      const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024)
      const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024)
      const memoryUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100
      
      const responseTime = Date.now() - startTime
      
      let status: 'healthy' | 'warning' | 'critical' = 'healthy'
      let message = `System resources normal (${heapUsedMB}MB / ${heapTotalMB}MB)`
      
      if (memoryUsagePercent > 90) {
        status = 'critical'
        message = `Critical memory usage: ${memoryUsagePercent.toFixed(1)}%`
      } else if (memoryUsagePercent > 75) {
        status = 'warning'
        message = `High memory usage: ${memoryUsagePercent.toFixed(1)}%`
      }

      return {
        service: 'system',
        status,
        responseTime,
        message,
        metadata: {
          memoryUsage: {
            heapUsed: heapUsedMB,
            heapTotal: heapTotalMB,
            percentage: memoryUsagePercent
          },
          uptime: process.uptime(),
          nodeVersion: process.version
        }
      }
    } catch (error) {
      return {
        service: 'system',
        status: 'down',
        responseTime: Date.now() - startTime,
        message: `System check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  // Comprehensive health check
  async performComprehensiveHealthCheck(): Promise<SystemHealth> {
    console.log('🏥 Performing comprehensive health check...')
    
    const checks = await Promise.allSettled([
      this.checkDatabaseHealth(),
      this.checkOpenAIHealth(),
      this.checkTwilioHealth(),
      this.checkQueueHealth(),
      this.checkSystemResources()
    ])

    const healthChecks: HealthCheckResult[] = checks.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        const services = ['database', 'openai', 'twilio', 'queue', 'system']
        return {
          service: services[index],
          status: 'down' as const,
          responseTime: 0,
          message: `Health check failed: ${result.reason}`,
          metadata: { error: result.reason }
        }
      }
    })

    // Determine overall health
    const criticalCount = healthChecks.filter(c => c.status === 'critical' || c.status === 'down').length
    const warningCount = healthChecks.filter(c => c.status === 'warning').length
    
    let overall: 'healthy' | 'warning' | 'critical' | 'down'
    if (criticalCount >= 2) {
      overall = 'down'
    } else if (criticalCount >= 1) {
      overall = 'critical'
    } else if (warningCount >= 2) {
      overall = 'warning'
    } else {
      overall = 'healthy'
    }

    const systemHealth: SystemHealth = {
      overall,
      checks: healthChecks,
      timestamp: new Date(),
      uptime: process.uptime()
    }

    // Store in history
    this.healthHistory.push(systemHealth)
    if (this.healthHistory.length > this.MAX_HISTORY) {
      this.healthHistory = this.healthHistory.slice(-this.MAX_HISTORY)
    }

    // Alert on critical issues
    if (overall === 'critical' || overall === 'down') {
      await this.createHealthAlert(systemHealth)
    }

    console.log(`🏥 Health check completed: ${overall.toUpperCase()}`)
    
    return systemHealth
  }

  // Get health history
  getHealthHistory(limit: number = 10): SystemHealth[] {
    return this.healthHistory.slice(-limit)
  }

  // Get health trends
  getHealthTrends(): {
    uptimePercent: number
    avgResponseTimes: Record<string, number>
    recentIssues: string[]
  } {
    if (this.healthHistory.length < 2) {
      return {
        uptimePercent: 100,
        avgResponseTimes: {},
        recentIssues: []
      }
    }

    const recentChecks = this.healthHistory.slice(-20) // Last 20 checks
    const healthyChecks = recentChecks.filter(h => h.overall === 'healthy').length
    const uptimePercent = (healthyChecks / recentChecks.length) * 100

    // Calculate average response times by service
    const avgResponseTimes: Record<string, number> = {}
    const services = ['database', 'openai', 'twilio', 'queue', 'system']
    
    for (const service of services) {
      const serviceTimes = recentChecks
        .flatMap(h => h.checks)
        .filter(c => c.service === service)
        .map(c => c.responseTime)
      
      if (serviceTimes.length > 0) {
        avgResponseTimes[service] = serviceTimes.reduce((sum, time) => sum + time, 0) / serviceTimes.length
      }
    }

    // Collect recent issues
    const recentIssues = recentChecks
      .slice(-5) // Last 5 checks
      .flatMap(h => h.checks)
      .filter(c => c.status !== 'healthy')
      .map(c => `${c.service}: ${c.message}`)
      .slice(0, 10) // Limit to 10 most recent issues

    return {
      uptimePercent,
      avgResponseTimes,
      recentIssues
    }
  }

  // Start continuous monitoring
  private startContinuousMonitoring(): void {
    console.log('🏥 Starting continuous health monitoring...')
    
    // Perform initial health check
    this.performComprehensiveHealthCheck().catch(error => {
      console.error('Initial health check failed:', error)
    })

    // Schedule regular health checks every 5 minutes
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performComprehensiveHealthCheck()
      } catch (error) {
        console.error('Scheduled health check failed:', error)
      }
    }, 5 * 60 * 1000)
  }

  // Stop continuous monitoring
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
      console.log('🏥 Stopped continuous health monitoring')
    }
  }

  // Create health alert
  private async createHealthAlert(health: SystemHealth): Promise<void> {
    const criticalServices = health.checks.filter(c => c.status === 'critical' || c.status === 'down')
    
    if (criticalServices.length === 0) return

    const alertMessage = criticalServices.map(s => `${s.service}: ${s.message}`).join('; ')
    
    try {
      await createNotification({
        userId: 'system',
        type: 'ERROR' as any,
        title: `System Health Alert: ${health.overall.toUpperCase()}`,
        message: alertMessage,
        priority: 'HIGH' as any,
        metadata: {
          healthStatus: health.overall,
          affectedServices: criticalServices.map(s => s.service),
          timestamp: health.timestamp.toISOString()
        }
      })

      console.log(`🚨 Health alert created: ${health.overall} - ${alertMessage}`)
    } catch (error) {
      console.error('Failed to create health alert:', error)
    }
  }
}

export const healthMonitor = new HealthMonitor()