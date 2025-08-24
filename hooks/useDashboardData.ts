'use client'

import { useState, useEffect, useCallback } from 'react'

interface DashboardData {
  analytics: {
    today: {
      calls: number
      extractions: number
      jobs: number
      customers: number
    }
    calls: {
      total: number
      processed: number
      successful: number
      failed: number
      processingRate: number
      avgConfidence: number
      avgProcessingTime: number
    }
    jobs: {
      totalJobs: number
      completedJobs: number
      completionRate: number
      pipeline: Record<string, { count: number; estimatedValue: number; actualValue: number }>
    }
    revenue: {
      totalRevenue: number
      avgJobValue: number
      estimatedPipelineValue: number
    }
    customers: {
      total: number
      newThisWeek: number
      newThisMonth: number
      repeatRate: number
    }
    ai: {
      totalExtractions: number
      avgConfidence: number
      confidenceDistribution: {
        high: number
        medium: number
        low: number
      }
      autoCreatedJobs: number
      conversionRate: number
    }
  }
  activity: {
    recentCalls: Array<{
      id: string
      callSid: string
      phoneNumber: string
      duration?: number
      status: string
      createdAt: string
      extraction?: {
        id: string
        customerName?: string
        serviceType?: string
        confidenceScore?: number
        hasIssues: boolean
        jobs: Array<{
          id: string
          title: string
          status: string
        }>
      }
      transcription?: {
        transcriptionText: string
        confidenceScore?: number
      }
    }>
    recentJobs: Array<{
      id: string
      title: string
      customerName: string
      status: string
      priority?: string
      estimatedCost?: number
      scheduledDate?: string
      createdAt: string
      updatedAt: string
    }>
  }
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/dashboard/analytics')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.statusText}`)
      }

      const dashboardData = await response.json()
      setData(dashboardData)
    } catch (err) {
      console.error('Dashboard data fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshData = useCallback(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!loading && !error) {
      const interval = setInterval(() => {
        fetchDashboardData()
      }, 30000) // 30 seconds

      return () => clearInterval(interval)
    }
  }, [loading, error, fetchDashboardData])

  return {
    data,
    loading,
    error,
    refreshData
  }
}