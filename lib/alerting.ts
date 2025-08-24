import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { monitoringService } from '@/lib/monitoring'

export interface AlertRule {
  id: string
  name: string
  description: string
  metric: string
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'ne'
  threshold: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  enabled: boolean
  cooldownMinutes: number
  notificationChannels: AlertChannel[]
  conditions?: AlertCondition[]
}

export interface AlertCondition {
  field: string
  operator: 'gt' | 'lt' | 'eq' | 'contains' | 'not_contains'
  value: string | number
}

export interface AlertChannel {
  type: 'notification' | 'email' | 'webhook' | 'console'
  config: Record<string, any>
  enabled: boolean
}

export interface Alert {
  id: string
  ruleId: string
  ruleName: string
  severity: string
  message: string
  currentValue: number
  threshold: number
  triggeredAt: Date
  resolvedAt?: Date
  status: 'active' | 'resolved' | 'acknowledged'
  metadata?: Record<string, any>
}

export class AlertingSystem {
  private static instance: AlertingSystem
  private activeAlerts: Map<string, Alert> = new Map()
  private alertCooldowns: Map<string, Date> = new Map()
  private alertingInterval: NodeJS.Timeout | null = null

  constructor() {
    if (AlertingSystem.instance) {
      return AlertingSystem.instance
    }

    this.initializeDefaultRules()
    this.startAlertingMonitor()
    AlertingSystem.instance = this
  }

  // Default alert rules for common issues
  private getDefaultAlertRules(): Omit<AlertRule, 'id'>[] {
    return [
      {
        name: 'High Error Rate',
        description: 'Alert when call processing error rate exceeds threshold',
        metric: 'errorRate',
        operator: 'gt',
        threshold: 15,
        severity: 'high',
        enabled: true,
        cooldownMinutes: 10,
        notificationChannels: [
          { type: 'notification', config: {}, enabled: true },
          { type: 'console', config: {}, enabled: true }
        ]
      },
      {
        name: 'Critical Error Rate',
        description: 'Critical alert when error rate is extremely high',
        metric: 'errorRate',
        operator: 'gt',
        threshold: 35,
        severity: 'critical',
        enabled: true,
        cooldownMinutes: 5,
        notificationChannels: [
          { type: 'notification', config: {}, enabled: true },
          { type: 'console', config: {}, enabled: true }
        ]
      },
      {
        name: 'Slow Processing Time',
        description: 'Alert when average processing time is too high',
        metric: 'averageProcessingTime',
        operator: 'gt',
        threshold: 45000, // 45 seconds
        severity: 'medium',
        enabled: true,
        cooldownMinutes: 15,
        notificationChannels: [
          { type: 'notification', config: {}, enabled: true }
        ]
      },
      {
        name: 'Very Slow Processing',
        description: 'Critical alert for extremely slow processing',
        metric: 'averageProcessingTime',
        operator: 'gt',
        threshold: 90000, // 90 seconds
        severity: 'critical',
        enabled: true,
        cooldownMinutes: 5,
        notificationChannels: [
          { type: 'notification', config: {}, enabled: true },
          { type: 'console', config: {}, enabled: true }
        ]
      },
      {
        name: 'Low Confidence Score',
        description: 'Alert when AI confidence is consistently low',
        metric: 'confidenceScore',
        operator: 'lt',
        threshold: 0.6,
        severity: 'medium',
        enabled: true,
        cooldownMinutes: 20,
        notificationChannels: [
          { type: 'notification', config: {}, enabled: true }
        ]
      },
      {
        name: 'Very Low Confidence',
        description: 'Critical alert for very low AI confidence',
        metric: 'confidenceScore',
        operator: 'lt',
        threshold: 0.4,
        severity: 'high',
        enabled: true,
        cooldownMinutes: 10,
        notificationChannels: [
          { type: 'notification', config: {}, enabled: true },
          { type: 'console', config: {}, enabled: true }
        ]
      },
      {
        name: 'Queue Backlog',
        description: 'Alert when call processing queue is backed up',
        metric: 'queueDepth',
        operator: 'gt',
        threshold: 25,
        severity: 'medium',
        enabled: true,
        cooldownMinutes: 10,
        notificationChannels: [
          { type: 'notification', config: {}, enabled: true }
        ]
      },
      {
        name: 'Severe Queue Backlog',
        description: 'Critical alert for severe queue backlog',
        metric: 'queueDepth',
        operator: 'gt',
        threshold: 75,
        severity: 'critical',
        enabled: true,
        cooldownMinutes: 5,
        notificationChannels: [
          { type: 'notification', config: {}, enabled: true },
          { type: 'console', config: {}, enabled: true }
        ]
      },
      {
        name: 'Memory Usage High',
        description: 'Alert when memory usage is high',
        metric: 'memoryUsage',
        operator: 'gt',
        threshold: 80,
        severity: 'medium',
        enabled: true,
        cooldownMinutes: 15,
        notificationChannels: [
          { type: 'notification', config: {}, enabled: true }
        ]
      },
      {
        name: 'Memory Usage Critical',
        description: 'Critical alert for very high memory usage',
        metric: 'memoryUsage',
        operator: 'gt',
        threshold: 95,
        severity: 'critical',
        enabled: true,
        cooldownMinutes: 5,
        notificationChannels: [
          { type: 'notification', config: {}, enabled: true },
          { type: 'console', config: {}, enabled: true }
        ]
      }
    ]
  }

  private async initializeDefaultRules(): Promise<void> {
    console.log('🚨 Initializing default alert rules...')
    
    const defaultRules = this.getDefaultAlertRules()
    
    for (const rule of defaultRules) {
      const ruleWithId: AlertRule = {
        ...rule,
        id: `default_${rule.name.toLowerCase().replace(/\s+/g, '_')}`
      }
      
      // In a real implementation, these would be stored in database
      console.log(`📋 Alert rule initialized: ${ruleWithId.name}`)
    }
  }

  // Check metrics against alert rules
  async checkAlerts(): Promise<void> {
    try {
      // Get current metrics
      const [systemMetrics, callMetrics] = await Promise.all([
        monitoringService.collectSystemMetrics(),
        monitoringService.getCallProcessingMetrics('hour')
      ])

      // Check queue depth
      const queueDepth = await prisma.callRecord.count({
        where: {
          status: { in: ['PENDING', 'PROCESSING'] }
        }
      })

      const metrics = {
        errorRate: callMetrics.errorRate,
        averageProcessingTime: callMetrics.averageProcessingTime,
        confidenceScore: callMetrics.confidenceScore,
        queueDepth,
        memoryUsage: systemMetrics.memoryUsage || 0
      }

      console.log('🔍 Checking alerts against current metrics:', JSON.stringify(metrics, null, 2))

      const alertRules = this.getDefaultAlertRules().map(rule => ({
        ...rule,
        id: `default_${rule.name.toLowerCase().replace(/\s+/g, '_')}`
      }))

      for (const rule of alertRules) {
        if (!rule.enabled) continue

        await this.evaluateRule(rule, metrics)
      }

      // Check for resolved alerts
      await this.checkResolvedAlerts(metrics)

    } catch (error) {
      console.error('❌ Error checking alerts:', error)
    }
  }

  private async evaluateRule(rule: AlertRule, metrics: Record<string, number>): Promise<void> {
    const metricValue = metrics[rule.metric]
    if (metricValue === undefined) return

    const alertId = rule.id
    const isInCooldown = this.alertCooldowns.has(alertId) && 
                        this.alertCooldowns.get(alertId)! > new Date()

    if (isInCooldown) return

    let shouldAlert = false
    
    switch (rule.operator) {
      case 'gt':
        shouldAlert = metricValue > rule.threshold
        break
      case 'gte':
        shouldAlert = metricValue >= rule.threshold
        break
      case 'lt':
        shouldAlert = metricValue < rule.threshold
        break
      case 'lte':
        shouldAlert = metricValue <= rule.threshold
        break
      case 'eq':
        shouldAlert = metricValue === rule.threshold
        break
      case 'ne':
        shouldAlert = metricValue !== rule.threshold
        break
    }

    if (shouldAlert && !this.activeAlerts.has(alertId)) {
      await this.triggerAlert(rule, metricValue)
    }
  }

  private async triggerAlert(rule: AlertRule, currentValue: number): Promise<void> {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      message: this.generateAlertMessage(rule, currentValue),
      currentValue,
      threshold: rule.threshold,
      triggeredAt: new Date(),
      status: 'active',
      metadata: {
        metric: rule.metric,
        operator: rule.operator,
        description: rule.description
      }
    }

    // Store active alert
    this.activeAlerts.set(rule.id, alert)

    // Set cooldown
    const cooldownUntil = new Date(Date.now() + (rule.cooldownMinutes * 60 * 1000))
    this.alertCooldowns.set(rule.id, cooldownUntil)

    console.log(`🚨 ALERT TRIGGERED: ${alert.severity.toUpperCase()} - ${alert.message}`)

    // Send notifications through configured channels
    await this.sendAlertNotifications(alert, rule.notificationChannels)

    // Log alert for audit purposes
    console.log(`📝 Alert logged: ${alert.id} - ${rule.name}`)
  }

  private async sendAlertNotifications(alert: Alert, channels: AlertChannel[]): Promise<void> {
    for (const channel of channels) {
      if (!channel.enabled) continue

      try {
        switch (channel.type) {
          case 'notification':
            await this.sendNotificationAlert(alert)
            break
          case 'console':
            this.sendConsoleAlert(alert)
            break
          case 'email':
            await this.sendEmailAlert(alert, channel.config)
            break
          case 'webhook':
            await this.sendWebhookAlert(alert, channel.config)
            break
        }
      } catch (error) {
        console.error(`❌ Failed to send alert via ${channel.type}:`, error)
      }
    }
  }

  private async sendNotificationAlert(alert: Alert): Promise<void> {
    try {
      await createNotification({
        userId: 'system',
        type: alert.severity === 'critical' ? 'ERROR' as any : 'WARNING' as any,
        title: `${alert.severity.toUpperCase()} Alert: ${alert.ruleName}`,
        message: alert.message,
        priority: alert.severity === 'critical' || alert.severity === 'high' ? 'HIGH' as any : 'MEDIUM' as any,
        metadata: {
          alertId: alert.id,
          metric: alert.metadata?.metric,
          currentValue: alert.currentValue,
          threshold: alert.threshold,
          triggeredAt: alert.triggeredAt.toISOString()
        }
      })
    } catch (error) {
      console.error('Failed to send notification alert:', error)
    }
  }

  private sendConsoleAlert(alert: Alert): void {
    const icon = {
      'low': '🔵',
      'medium': '🟡',
      'high': '🟠',
      'critical': '🔴'
    }[alert.severity] || '⚠️'

    console.log(`${icon} ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`)
    console.log(`   Rule: ${alert.ruleName}`)
    console.log(`   Current Value: ${alert.currentValue}`)
    console.log(`   Threshold: ${alert.threshold}`)
    console.log(`   Triggered At: ${alert.triggeredAt.toISOString()}`)
  }

  private async sendEmailAlert(alert: Alert, config: Record<string, any>): Promise<void> {
    // In a real implementation, this would integrate with an email service
    console.log(`📧 Email alert would be sent: ${alert.message}`)
  }

  private async sendWebhookAlert(alert: Alert, config: Record<string, any>): Promise<void> {
    // In a real implementation, this would send HTTP POST to webhook URL
    console.log(`🔗 Webhook alert would be sent: ${JSON.stringify(alert)}`)
  }

  private generateAlertMessage(rule: AlertRule, currentValue: number): string {
    const formatValue = (value: number, metric: string): string => {
      switch (metric) {
        case 'errorRate':
          return `${value.toFixed(1)}%`
        case 'averageProcessingTime':
          return `${(value / 1000).toFixed(1)}s`
        case 'confidenceScore':
          return `${(value * 100).toFixed(1)}%`
        case 'memoryUsage':
          return `${value.toFixed(1)}%`
        case 'queueDepth':
          return `${value} calls`
        default:
          return value.toString()
      }
    }

    const currentFormatted = formatValue(currentValue, rule.metric)
    const thresholdFormatted = formatValue(rule.threshold, rule.metric)

    return `${rule.metric} is ${currentFormatted} (threshold: ${thresholdFormatted})`
  }

  private async checkResolvedAlerts(metrics: Record<string, number>): Promise<void> {
    for (const [ruleId, alert] of this.activeAlerts.entries()) {
      const currentValue = metrics[alert.metadata?.metric as string]
      if (currentValue === undefined) continue

      // Find the corresponding rule
      const rule = this.getDefaultAlertRules()
        .map(r => ({ ...r, id: `default_${r.name.toLowerCase().replace(/\s+/g, '_')}` }))
        .find(r => r.id === ruleId)
      
      if (!rule) continue

      // Check if alert condition is no longer met
      let isResolved = false
      
      switch (rule.operator) {
        case 'gt':
          isResolved = currentValue <= rule.threshold
          break
        case 'gte':
          isResolved = currentValue < rule.threshold
          break
        case 'lt':
          isResolved = currentValue >= rule.threshold
          break
        case 'lte':
          isResolved = currentValue > rule.threshold
          break
        case 'eq':
          isResolved = currentValue !== rule.threshold
          break
        case 'ne':
          isResolved = currentValue === rule.threshold
          break
      }

      if (isResolved) {
        await this.resolveAlert(ruleId, currentValue)
      }
    }
  }

  private async resolveAlert(ruleId: string, currentValue: number): Promise<void> {
    const alert = this.activeAlerts.get(ruleId)
    if (!alert) return

    alert.status = 'resolved'
    alert.resolvedAt = new Date()
    this.activeAlerts.delete(ruleId)

    console.log(`✅ Alert resolved: ${alert.ruleName} - Current value: ${currentValue}`)

    // Send resolution notification
    try {
      await createNotification({
        userId: 'system',
        type: 'INFO' as any,
        title: `Alert Resolved: ${alert.ruleName}`,
        message: `${alert.metadata?.metric} has returned to normal levels (${currentValue})`,
        priority: 'LOW' as any,
        metadata: {
          alertId: alert.id,
          resolvedAt: alert.resolvedAt.toISOString(),
          finalValue: currentValue
        }
      })
    } catch (error) {
      console.error('Failed to send resolution notification:', error)
    }
  }

  // Get active alerts
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values())
  }

  // Get alert statistics
  getAlertStatistics(): {
    totalActiveAlerts: number
    alertsBySeverity: Record<string, number>
    recentAlerts: Alert[]
  } {
    const activeAlerts = this.getActiveAlerts()
    
    const alertsBySeverity = activeAlerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalActiveAlerts: activeAlerts.length,
      alertsBySeverity,
      recentAlerts: activeAlerts.sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime()).slice(0, 10)
    }
  }

  // Start alert monitoring
  private startAlertingMonitor(): void {
    console.log('🚨 Starting alerting monitor...')
    
    // Initial check
    this.checkAlerts().catch(error => {
      console.error('Initial alert check failed:', error)
    })

    // Check alerts every 2 minutes
    this.alertingInterval = setInterval(async () => {
      try {
        await this.checkAlerts()
      } catch (error) {
        console.error('Scheduled alert check failed:', error)
      }
    }, 2 * 60 * 1000)
  }

  // Stop alert monitoring
  stopMonitoring(): void {
    if (this.alertingInterval) {
      clearInterval(this.alertingInterval)
      this.alertingInterval = null
      console.log('🚨 Stopped alerting monitor')
    }
  }

  // Acknowledge alert
  async acknowledgeAlert(alertId: string, userId: string): Promise<boolean> {
    for (const [ruleId, alert] of this.activeAlerts.entries()) {
      if (alert.id === alertId) {
        alert.status = 'acknowledged'
        console.log(`✅ Alert acknowledged by ${userId}: ${alert.ruleName}`)
        return true
      }
    }
    return false
  }
}

export const alertingSystem = new AlertingSystem()