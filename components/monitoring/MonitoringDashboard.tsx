'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, CheckCircle, Clock, TrendingUp, TrendingDown, Activity, Zap, Database, Phone, AlertTriangle } from 'lucide-react'

interface HealthStatus {
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

interface SystemMetrics {
  timestamp: Date
  memoryUsage?: number
  networkLatency?: number
  activeConnections?: number
}

interface CallMetrics {
  totalCalls: number
  successfulCalls: number
  failedCalls: number
  averageProcessingTime: number
  transcriptionAccuracy: number
  extractionAccuracy: number
  confidenceScore: number
  errorRate: number
}

interface PerformanceAnalytics {
  timeRange: string
  callProcessing: CallMetrics
  apiPerformance: {
    averageResponseTime: number
    errorRate: number
    slowRequestCount: number
    totalRequests: number
  }
  trends: {
    callVolumeChange: string
    errorRateChange: string
    responseTimeChange: string
    confidenceChange: string
  }
  recommendations: string[]
}

export default function MonitoringDashboard() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [analytics, setAnalytics] = useState<PerformanceAnalytics | null>(null)
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day')
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchHealthStatus = async () => {
    try {
      const response = await fetch('/api/monitoring/health')
      if (response.ok) {
        const data = await response.json()
        setHealthStatus(data.health)
      }
    } catch (error) {
      console.error('Failed to fetch health status:', error)
    }
  }

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const [metricsResponse, analyticsResponse] = await Promise.all([
        fetch(`/api/monitoring/metrics?type=system`),
        fetch(`/api/monitoring/analytics?timeRange=${timeRange}&recommendations=true`)
      ])

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json()
        setSystemMetrics(metricsData.systemMetrics)
      }

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json()
        setAnalytics(analyticsData.analytics)
      }

      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealthStatus()
    fetchMetrics()

    // Set up real-time updates
    const healthInterval = setInterval(fetchHealthStatus, 30000) // Every 30 seconds
    const metricsInterval = setInterval(fetchMetrics, 60000) // Every minute

    return () => {
      clearInterval(healthInterval)
      clearInterval(metricsInterval)
    }
  }, [timeRange])

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
        return 'text-green-600 bg-green-100'
      case 'warning':
      case 'slow':
      case 'degraded':
      case 'rate_limited':
      case 'backlogged':
        return 'text-yellow-600 bg-yellow-100'
      case 'critical':
      case 'down':
      case 'full':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
        return <CheckCircle className="h-4 w-4" />
      case 'warning':
      case 'slow':
      case 'degraded':
      case 'rate_limited':
      case 'backlogged':
        return <AlertTriangle className="h-4 w-4" />
      case 'critical':
      case 'down':
      case 'full':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getTrendIcon = (trend: string) => {
    if (trend.startsWith('+')) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (trend.startsWith('-')) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Activity className="h-4 w-4 text-gray-600" />
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-gray-600">Real-time system health and performance analytics</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={fetchMetrics} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
          {lastUpdate && (
            <p className="text-sm text-gray-500">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      <Tabs value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
        <TabsList>
          <TabsTrigger value="day">Last 24 Hours</TabsTrigger>
          <TabsTrigger value="week">Last Week</TabsTrigger>
          <TabsTrigger value="month">Last Month</TabsTrigger>
        </TabsList>

        <TabsContent value={timeRange} className="space-y-6">
          {/* System Health Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {healthStatus ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Overall Status</span>
                      <Badge className={getStatusColor(healthStatus.status)}>
                        {getStatusIcon(healthStatus.status)}
                        {healthStatus.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Uptime</span>
                      <span className="font-mono">{formatUptime(healthStatus.uptime)}</span>
                    </div>
                    {healthStatus.issues.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold text-sm mb-2">Current Issues:</h4>
                        <ul className="text-sm space-y-1">
                          {healthStatus.issues.map((issue, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">Loading health status...</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  System Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {systemMetrics ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Memory Usage</span>
                      <span className={`font-mono ${systemMetrics.memoryUsage && systemMetrics.memoryUsage > 80 ? 'text-red-600' : 'text-green-600'}`}>
                        {systemMetrics.memoryUsage ? `${systemMetrics.memoryUsage.toFixed(1)}%` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>DB Latency</span>
                      <span className={`font-mono ${systemMetrics.networkLatency && systemMetrics.networkLatency > 1000 ? 'text-red-600' : 'text-green-600'}`}>
                        {systemMetrics.networkLatency ? `${systemMetrics.networkLatency}ms` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Active Calls</span>
                      <span className="font-mono">{systemMetrics.activeConnections || 0}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">Loading system metrics...</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Service Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {healthStatus ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Database</span>
                      <Badge className={getStatusColor(healthStatus.services.database)}>
                        {getStatusIcon(healthStatus.services.database)}
                        {healthStatus.services.database}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>OpenAI API</span>
                      <Badge className={getStatusColor(healthStatus.services.openai)}>
                        {getStatusIcon(healthStatus.services.openai)}
                        {healthStatus.services.openai}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Twilio</span>
                      <Badge className={getStatusColor(healthStatus.services.twilio)}>
                        {getStatusIcon(healthStatus.services.twilio)}
                        {healthStatus.services.twilio}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Queue</span>
                      <Badge className={getStatusColor(healthStatus.services.queue)}>
                        {getStatusIcon(healthStatus.services.queue)}
                        {healthStatus.services.queue}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">Loading service status...</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Performance Analytics */}
          {analytics && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Call Volume
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.callProcessing.totalCalls}</div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      {getTrendIcon(analytics.trends.callVolumeChange)}
                      {analytics.trends.callVolumeChange}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Success Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {analytics.callProcessing.totalCalls > 0 
                        ? ((analytics.callProcessing.successfulCalls / analytics.callProcessing.totalCalls) * 100).toFixed(1)
                        : 0}%
                    </div>
                    <div className="text-sm text-gray-600">
                      {analytics.callProcessing.successfulCalls} / {analytics.callProcessing.totalCalls} calls
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Error Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${analytics.callProcessing.errorRate > 10 ? 'text-red-600' : 'text-green-600'}`}>
                      {analytics.callProcessing.errorRate.toFixed(1)}%
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      {getTrendIcon(analytics.trends.errorRateChange)}
                      {analytics.trends.errorRateChange}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Avg Processing Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(analytics.callProcessing.averageProcessingTime / 1000).toFixed(1)}s
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      {getTrendIcon(analytics.trends.responseTimeChange)}
                      {analytics.trends.responseTimeChange}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>API Performance</CardTitle>
                    <CardDescription>Current API response metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>Average Response Time</span>
                        <span className="font-mono">{analytics.apiPerformance.averageResponseTime.toFixed(0)}ms</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Total Requests</span>
                        <span className="font-mono">{analytics.apiPerformance.totalRequests}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Slow Requests</span>
                        <span className="font-mono">{analytics.apiPerformance.slowRequestCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>API Error Rate</span>
                        <span className={`font-mono ${analytics.apiPerformance.errorRate > 5 ? 'text-red-600' : 'text-green-600'}`}>
                          {analytics.apiPerformance.errorRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>AI Performance</CardTitle>
                    <CardDescription>Machine learning accuracy metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>Extraction Accuracy</span>
                        <span className={`font-mono ${analytics.callProcessing.extractionAccuracy < 80 ? 'text-red-600' : 'text-green-600'}`}>
                          {analytics.callProcessing.extractionAccuracy.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Confidence Score</span>
                        <span className={`font-mono ${analytics.callProcessing.confidenceScore < 0.7 ? 'text-red-600' : 'text-green-600'}`}>
                          {(analytics.callProcessing.confidenceScore * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Transcription Quality</span>
                        <span className={`font-mono ${analytics.callProcessing.transcriptionAccuracy < 85 ? 'text-red-600' : 'text-green-600'}`}>
                          {analytics.callProcessing.transcriptionAccuracy.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        {getTrendIcon(analytics.trends.confidenceChange)}
                        Confidence trend: {analytics.trends.confidenceChange}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {analytics.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Recommendations
                    </CardTitle>
                    <CardDescription>System optimization suggestions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analytics.recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                          {recommendation}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}