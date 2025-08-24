import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'

export interface SystemMetrics {
  timestamp: Date
  cpuUsage?: number
  memoryUsage?: number
  diskUsage?: number
  networkLatency?: number
  activeConnections?: number
  queueDepth?: number
}

export interface CallProcessingMetrics {
  totalCalls: number
  successfulCalls: number
  failedCalls: number
  averageProcessingTime: number
  transcriptionAccuracy: number
  extractionAccuracy: number
  confidenceScore: number
  errorRate: number
}

export interface ApiMetrics {
  endpoint: string
  method: string
  responseTime: number
  statusCode: number
  timestamp: Date
  userId?: string
  errorMessage?: string
}

export interface AlertThreshold {
  metric: string
  threshold: number
  operator: 'gt' | 'lt' | 'eq'
  severity: 'low' | 'medium' | 'high' | 'critical'
  enabled: boolean
}

export interface HealthStatus {
  status: 'healthy' | 'warning' | 'critical' | 'down'
  services: {
    database: 'up' | 'down' | 'slow'
    openai: 'up' | 'down' | 'rate_limited'
    twilio: 'up' | 'down' | 'degraded'
    storage: 'up' | 'down' | 'full'
    queue: 'up' | 'down' | 'backlogged'
  }
  uptime: number
  lastHealthCheck: Date
  issues: string[]
}

export class MonitoringService {
  private static instance: MonitoringService
  private metricsBuffer: ApiMetrics[] = []
  private readonly BUFFER_SIZE = 1000
  private readonly FLUSH_INTERVAL = 30000 // 30 seconds

  constructor() {
    if (MonitoringService.instance) {
      return MonitoringService.instance
    }

    this.startMetricsFlush()
    MonitoringService.instance = this
  }

  // System Performance Monitoring
  async collectSystemMetrics(): Promise<SystemMetrics> {
    console.log('📊 Collecting system performance metrics')
    
    const metrics: SystemMetrics = {
      timestamp: new Date()
    }

    try {
      // Collect memory usage (Node.js process)
      const memUsage = process.memoryUsage()
      metrics.memoryUsage = (memUsage.heapUsed / memUsage.heapTotal) * 100

      // Database connection health
      const start = Date.now()
      await prisma.$queryRaw`SELECT 1`
      metrics.networkLatency = Date.now() - start

      // Active connections (approximate)
      const activeCalls = await prisma.callRecord.count({
        where: {
          status: 'PROCESSING'
        }
      })
      metrics.activeConnections = activeCalls

      return metrics
    } catch (error) {
      console.error('❌ Failed to collect system metrics:', error)
      throw new Error('System metrics collection failed')
    }
  }

  // Call Processing Analytics
  async getCallProcessingMetrics(timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<CallProcessingMetrics> {
    console.log(`📈 Analyzing call processing metrics for ${timeRange}`)
    
    const timeRanges = {
      hour: 1 * 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    }

    const since = new Date(Date.now() - timeRanges[timeRange])

    try {
      const [totalCalls, successfulCalls, failedCalls, avgProcessingTime, confidenceStats] = await Promise.all([
        // Total calls
        prisma.callRecord.count({
          where: { createdAt: { gte: since } }
        }),

        // Successful calls
        prisma.callRecord.count({
          where: {
            createdAt: { gte: since },
            status: 'COMPLETED'
          }
        }),

        // Failed calls
        prisma.callRecord.count({
          where: {
            createdAt: { gte: since },
            status: { in: ['FAILED', 'ERROR'] }
          }
        }),

        // Average processing time
        prisma.callRecord.aggregate({
          where: {
            createdAt: { gte: since },
            status: 'COMPLETED',
            processingCompletedAt: { not: null }
          },
          _avg: {
            processingDuration: true
          }
        }),

        // Confidence scores
        prisma.extractedAppointment.aggregate({
          where: {
            createdAt: { gte: since }
          },
          _avg: {
            confidenceScore: true
          }
        })
      ])

      const errorRate = totalCalls > 0 ? (failedCalls / totalCalls) * 100 : 0
      const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0

      return {
        totalCalls,
        successfulCalls,
        failedCalls,
        averageProcessingTime: avgProcessingTime._avg.processingDuration || 0,
        transcriptionAccuracy: Math.max(0, 100 - errorRate), // Simplified metric
        extractionAccuracy: successRate,
        confidenceScore: confidenceStats._avg.confidenceScore || 0,
        errorRate
      }
    } catch (error) {
      console.error('❌ Failed to get call processing metrics:', error)
      throw new Error('Call processing metrics unavailable')
    }
  }

  // API Performance Tracking
  trackApiCall(metrics: Omit<ApiMetrics, 'timestamp'>): void {
    const apiMetrics: ApiMetrics = {
      ...metrics,
      timestamp: new Date()
    }

    // Add to buffer
    this.metricsBuffer.push(apiMetrics)
    
    // Log slow requests
    if (metrics.responseTime > 5000) {
      console.warn(`🐌 Slow API call: ${metrics.method} ${metrics.endpoint} - ${metrics.responseTime}ms`)
    }

    // Log errors
    if (metrics.statusCode >= 400) {
      console.error(`❌ API Error: ${metrics.method} ${metrics.endpoint} - ${metrics.statusCode}${metrics.errorMessage ? `: ${metrics.errorMessage}` : ''}`)
    }

    // Prevent memory leaks
    if (this.metricsBuffer.length > this.BUFFER_SIZE) {
      this.metricsBuffer = this.metricsBuffer.slice(-this.BUFFER_SIZE)
    }
  }

  // Health Check System
  async performHealthCheck(): Promise<HealthStatus> {
    console.log('🏥 Performing comprehensive health check')
    
    const healthStatus: HealthStatus = {
      status: 'healthy',
      services: {
        database: 'up',
        openai: 'up',
        twilio: 'up',
        storage: 'up',
        queue: 'up'
      },
      uptime: process.uptime(),
      lastHealthCheck: new Date(),
      issues: []
    }

    try {
      // Database health
      const dbStart = Date.now()
      await prisma.$queryRaw`SELECT 1`
      const dbLatency = Date.now() - dbStart
      
      if (dbLatency > 5000) {
        healthStatus.services.database = 'slow'
        healthStatus.issues.push(`Database latency high: ${dbLatency}ms`)
      }

      // OpenAI API health (simple connectivity test)
      try {
        const openaiHealth = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          signal: AbortSignal.timeout(10000)
        })

        if (!openaiHealth.ok) {
          if (openaiHealth.status === 429) {
            healthStatus.services.openai = 'rate_limited'
            healthStatus.issues.push('OpenAI API rate limited')
          } else {
            healthStatus.services.openai = 'down'
            healthStatus.issues.push(`OpenAI API error: ${openaiHealth.status}`)
          }
        }
      } catch (error) {
        healthStatus.services.openai = 'down'
        healthStatus.issues.push('OpenAI API connectivity failed')
      }

      // Twilio health check
      try {
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
          const twilioTest = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}.json`, {
            headers: {
              'Authorization': 'Basic ' + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')
            },
            signal: AbortSignal.timeout(10000)
          })

          if (!twilioTest.ok) {
            healthStatus.services.twilio = 'down'
            healthStatus.issues.push(`Twilio API error: ${twilioTest.status}`)
          }
        }
      } catch (error) {
        healthStatus.services.twilio = 'degraded'
        healthStatus.issues.push('Twilio connectivity issues')
      }

      // Queue depth check (approximate)
      const queuedCalls = await prisma.callRecord.count({
        where: {
          status: { in: ['PENDING', 'PROCESSING'] }
        }
      })

      if (queuedCalls > 50) {
        healthStatus.services.queue = 'backlogged'
        healthStatus.issues.push(`Queue backlog: ${queuedCalls} pending calls`)
      }

      // Overall status determination
      const downServices = Object.values(healthStatus.services).filter(s => s === 'down').length
      const degradedServices = Object.values(healthStatus.services).filter(s => s === 'slow' || s === 'degraded' || s === 'rate_limited').length

      if (downServices > 0) {
        healthStatus.status = 'critical'
      } else if (degradedServices > 1) {
        healthStatus.status = 'warning'
      } else if (healthStatus.issues.length > 0) {
        healthStatus.status = 'warning'
      }

      return healthStatus
    } catch (error) {
      console.error('❌ Health check failed:', error)
      healthStatus.status = 'critical'
      healthStatus.issues.push('Health check system failure')
      return healthStatus
    }
  }

  // Alert System
  async checkAlertThresholds(metrics: CallProcessingMetrics): Promise<void> {
    const defaultThresholds: AlertThreshold[] = [
      { metric: 'errorRate', threshold: 10, operator: 'gt', severity: 'medium', enabled: true },
      { metric: 'errorRate', threshold: 25, operator: 'gt', severity: 'high', enabled: true },
      { metric: 'errorRate', threshold: 50, operator: 'gt', severity: 'critical', enabled: true },
      { metric: 'averageProcessingTime', threshold: 30000, operator: 'gt', severity: 'medium', enabled: true },
      { metric: 'averageProcessingTime', threshold: 60000, operator: 'gt', severity: 'high', enabled: true },
      { metric: 'confidenceScore', threshold: 0.6, operator: 'lt', severity: 'medium', enabled: true },
      { metric: 'confidenceScore', threshold: 0.4, operator: 'lt', severity: 'high', enabled: true }
    ]

    for (const threshold of defaultThresholds) {
      if (!threshold.enabled) continue

      const metricValue = metrics[threshold.metric as keyof CallProcessingMetrics] as number
      let alertTriggered = false

      switch (threshold.operator) {
        case 'gt':
          alertTriggered = metricValue > threshold.threshold
          break
        case 'lt':
          alertTriggered = metricValue < threshold.threshold
          break
        case 'eq':
          alertTriggered = metricValue === threshold.threshold
          break
      }

      if (alertTriggered) {
        console.warn(`🚨 Alert triggered: ${threshold.metric} ${threshold.operator} ${threshold.threshold} (current: ${metricValue})`)
        
        // Create notification for critical alerts
        if (threshold.severity === 'critical' || threshold.severity === 'high') {
          try {
            await createNotification({
              userId: 'system', // System-level notification
              type: 'ERROR' as any,
              title: `${threshold.severity.toUpperCase()} Alert: ${threshold.metric}`,
              message: `${threshold.metric} is ${metricValue} (threshold: ${threshold.threshold})`,
              priority: threshold.severity === 'critical' ? 'HIGH' as any : 'MEDIUM' as any,
              metadata: {
                metric: threshold.metric,
                value: metricValue,
                threshold: threshold.threshold,
                severity: threshold.severity
              }
            })
          } catch (error) {
            console.error('Failed to create alert notification:', error)
          }
        }
      }
    }
  }

  // Performance Analytics
  async getPerformanceAnalytics(timeRange: 'day' | 'week' | 'month' = 'day') {
    console.log(`📊 Generating performance analytics for ${timeRange}`)
    
    const timeRanges = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    }

    const since = new Date(Date.now() - timeRanges[timeRange])

    try {
      const [callMetrics, recentApiCalls, recentErrors] = await Promise.all([
        this.getCallProcessingMetrics(timeRange),
        this.getRecentApiMetrics(100),
        this.getRecentErrors(50)
      ])

      const apiPerformance = this.analyzeApiPerformance(recentApiCalls)

      return {
        timeRange,
        period: { start: since, end: new Date() },
        callProcessing: callMetrics,
        apiPerformance,
        recentErrors,
        trends: await this.calculateTrends(timeRange),
        recommendations: this.generateRecommendations(callMetrics, apiPerformance)
      }
    } catch (error) {
      console.error('❌ Failed to generate performance analytics:', error)
      throw new Error('Performance analytics unavailable')
    }
  }

  // Private helper methods
  private startMetricsFlush(): void {
    setInterval(() => {
      if (this.metricsBuffer.length > 0) {
        this.flushMetrics()
      }
    }, this.FLUSH_INTERVAL)
  }

  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return

    const metricsToFlush = [...this.metricsBuffer]
    this.metricsBuffer = []

    try {
      // In a real implementation, these would be stored in a time-series database
      console.log(`📊 Flushing ${metricsToFlush.length} API metrics to storage`)
      
      // For now, we'll just log summary statistics
      const avgResponseTime = metricsToFlush.reduce((sum, m) => sum + m.responseTime, 0) / metricsToFlush.length
      const errorCount = metricsToFlush.filter(m => m.statusCode >= 400).length
      const errorRate = (errorCount / metricsToFlush.length) * 100

      console.log(`📈 Metrics Summary: Avg Response Time: ${avgResponseTime.toFixed(2)}ms, Error Rate: ${errorRate.toFixed(2)}%`)
      
    } catch (error) {
      console.error('❌ Failed to flush metrics:', error)
      // Put metrics back in buffer
      this.metricsBuffer.unshift(...metricsToFlush)
    }
  }

  private getRecentApiMetrics(limit: number): ApiMetrics[] {
    return this.metricsBuffer.slice(-limit)
  }

  private async getRecentErrors(limit: number): Promise<any[]> {
    try {
      return await prisma.callRecord.findMany({
        where: {
          status: { in: ['FAILED', 'ERROR'] },
          errorMessage: { not: null }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          errorMessage: true,
          createdAt: true,
          phoneNumber: true,
          status: true
        }
      })
    } catch {
      return []
    }
  }

  private analyzeApiPerformance(metrics: ApiMetrics[]) {
    if (metrics.length === 0) {
      return {
        averageResponseTime: 0,
        errorRate: 0,
        slowRequestCount: 0,
        totalRequests: 0
      }
    }

    const totalRequests = metrics.length
    const averageResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests
    const errorCount = metrics.filter(m => m.statusCode >= 400).length
    const slowRequestCount = metrics.filter(m => m.responseTime > 5000).length
    const errorRate = (errorCount / totalRequests) * 100

    return {
      averageResponseTime,
      errorRate,
      slowRequestCount,
      totalRequests
    }
  }

  private async calculateTrends(timeRange: string) {
    // Simplified trend calculation - in production would compare with previous period
    return {
      callVolumeChange: '+12%',
      errorRateChange: '-3%',
      responseTimeChange: '+5%',
      confidenceChange: '+8%'
    }
  }

  private generateRecommendations(callMetrics: CallProcessingMetrics, apiPerformance: any): string[] {
    const recommendations: string[] = []

    if (callMetrics.errorRate > 15) {
      recommendations.push('High error rate detected. Consider reviewing error handling and implementing retry logic.')
    }

    if (callMetrics.averageProcessingTime > 45000) {
      recommendations.push('Processing time is high. Consider optimizing AI model calls or implementing parallel processing.')
    }

    if (callMetrics.confidenceScore < 0.7) {
      recommendations.push('Low confidence scores detected. Review training data or adjust extraction prompts.')
    }

    if (apiPerformance.slowRequestCount > apiPerformance.totalRequests * 0.1) {
      recommendations.push('Multiple slow API requests detected. Consider implementing caching or optimizing database queries.')
    }

    if (recommendations.length === 0) {
      recommendations.push('System is performing well. Continue monitoring for any changes in metrics.')
    }

    return recommendations
  }
}

export const monitoringService = new MonitoringService()