'use client'

import { useState, useEffect, useCallback } from 'react'
import { JobStatus } from '@prisma/client'

interface Job {
  id: string
  title: string
  customerName: string
  customerPhone?: string
  customerEmail?: string
  serviceType?: string
  description?: string
  status: JobStatus
  priority?: string
  estimatedCost?: number
  actualCost?: number
  scheduledDate?: string
  scheduledTime?: string
  address?: string
  notes?: string
  extractedFromCall: boolean
  confidenceScore?: number
  createdAt: string
  updatedAt: string
  completedAt?: string
  customer?: {
    id: string
    name: string
    phone?: string
    email?: string
  }
  callRecord?: {
    callSid: string
    phoneNumber: string
    createdAt: string
  }
  extractedAppointment?: {
    id: string
    confidenceScore?: number
    urgencyLevel?: string
    hasIssues?: boolean
  }
}

interface JobStats {
  totalJobs: number
  extractedFromCalls: number
  manuallyCreated: number
  statusBreakdown: Record<string, number>
  priorityBreakdown: Record<string, number>
}

interface UseJobsOptions {
  filters?: {
    status?: JobStatus
    priority?: string
    serviceType?: string
    extractedOnly?: boolean
    search?: string
  }
  includeStats?: boolean
  limit?: number
  offset?: number
}

interface UseJobsReturn {
  jobs: Job[]
  stats?: JobStats
  loading: boolean
  error: string | null
  refreshJobs: () => Promise<void>
  updateJobStatus: (jobId: string, status: JobStatus) => Promise<void>
}

export function useJobs(options: UseJobsOptions = {}): UseJobsReturn {
  const [jobs, setJobs] = useState<Job[]>([])
  const [stats, setStats] = useState<JobStats | undefined>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      
      if (options.filters?.status) {
        searchParams.append('status', options.filters.status)
      }
      if (options.filters?.priority) {
        searchParams.append('priority', options.filters.priority)
      }
      if (options.filters?.serviceType) {
        searchParams.append('serviceType', options.filters.serviceType)
      }
      if (options.filters?.extractedOnly) {
        searchParams.append('extractedOnly', 'true')
      }
      if (options.filters?.search) {
        searchParams.append('search', options.filters.search)
      }
      if (options.includeStats) {
        searchParams.append('stats', 'true')
      }
      if (options.limit) {
        searchParams.append('limit', options.limit.toString())
      }
      if (options.offset) {
        searchParams.append('offset', options.offset.toString())
      }

      const response = await fetch(`/api/jobs?${searchParams.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch jobs')
      }

      setJobs(data.jobs || [])
      if (data.stats) {
        setStats(data.stats)
      }

    } catch (err) {
      console.error('Error fetching jobs:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs')
    } finally {
      setLoading(false)
    }
  }, [
    options.filters?.status,
    options.filters?.priority, 
    options.filters?.serviceType,
    options.filters?.extractedOnly,
    options.filters?.search,
    options.includeStats,
    options.limit,
    options.offset
  ])

  const updateJobStatus = useCallback(async (jobId: string, status: JobStatus) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update job status: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update job status')
      }

      // Update local state optimistically
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job.id === jobId 
            ? { 
                ...job, 
                status,
                completedAt: status === 'COMPLETED' ? new Date().toISOString() : job.completedAt,
                updatedAt: new Date().toISOString()
              }
            : job
        )
      )

    } catch (err) {
      console.error('Error updating job status:', err)
      throw err
    }
  }, [])

  const refreshJobs = useCallback(async () => {
    await fetchJobs()
  }, [fetchJobs])

  // Initial fetch
  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  return {
    jobs,
    stats,
    loading,
    error,
    refreshJobs,
    updateJobStatus
  }
}