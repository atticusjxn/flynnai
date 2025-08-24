'use client'

import { formatDistanceToNow } from 'date-fns'

interface Job {
  id: string
  title: string
  customerName: string
  status: string
  priority?: string
  estimatedCost?: number
  scheduledDate?: string
  createdAt: string
  updatedAt: string
}

interface PipelineStats {
  totalJobs: number
  completedJobs: number
  completionRate: number
  pipeline: Record<string, { count: number; estimatedValue: number; actualValue: number }>
}

interface RecentJobsPanelProps {
  jobs: Job[]
  pipelineStats: PipelineStats
}

export function RecentJobsPanel({ jobs, pipelineStats }: RecentJobsPanelProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'QUOTING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS':
        return 'bg-purple-100 text-purple-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return '🚨'
      case 'high':
        return '⚠️'
      case 'low':
        return '📝'
      default:
        return '📋'
    }
  }

  const formatCurrency = (amount?: number) => {
    return amount ? `$${amount.toLocaleString()}` : 'TBD'
  }

  // Calculate pipeline totals
  const pipelineValue = Object.values(pipelineStats.pipeline)
    .reduce((sum, stage) => sum + stage.estimatedValue, 0)

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recent Jobs</h3>
            <p className="text-sm text-gray-600 mt-1">
              Latest job activity and pipeline status
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              {pipelineStats.completionRate}% Completion
            </div>
            <div className="text-xs text-gray-500">
              {pipelineStats.completedJobs} of {pipelineStats.totalJobs} completed
            </div>
          </div>
        </div>

        {/* Pipeline Summary */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">{pipelineStats.totalJobs}</div>
            <div className="text-xs text-gray-600">Total Jobs</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">${Math.round(pipelineValue).toLocaleString()}</div>
            <div className="text-xs text-gray-600">Pipeline Value</div>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {jobs.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-4xl mb-2">📋</div>
            <p className="text-gray-500 font-medium">No recent jobs</p>
            <p className="text-gray-400 text-sm mt-1">
              Jobs created from calls will appear here
            </p>
          </div>
        ) : (
          jobs.slice(0, 8).map((job) => (
            <JobItem key={job.id} job={job} />
          ))
        )}
      </div>

      {jobs.length > 0 && (
        <div className="p-4 bg-gray-50 border-t">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing {Math.min(jobs.length, 8)} of {jobs.length} jobs
            </div>
            <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
              View All Jobs
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function JobItem({ job }: { job: Job }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'QUOTING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS':
        return 'bg-purple-100 text-purple-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return '🚨'
      case 'high':
        return '⚠️'
      case 'low':
        return '📝'
      default:
        return '📋'
    }
  }

  const formatCurrency = (amount?: number) => {
    return amount ? `$${amount.toLocaleString()}` : 'TBD'
  }

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          {/* Priority Icon */}
          <div className="flex-shrink-0 mt-1">
            <span className="text-lg">{getPriorityIcon(job.priority)}</span>
          </div>

          <div className="flex-1 min-w-0">
            {/* Job Header */}
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-medium text-gray-900 truncate flex-1">
                {job.title}
              </h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                {job.status}
              </span>
            </div>

            {/* Customer */}
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
              <span className="flex items-center">
                <span className="mr-1">👤</span>
                {job.customerName}
              </span>
              
              {job.estimatedCost && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-green-600 font-medium">
                    {formatCurrency(job.estimatedCost)}
                  </span>
                </>
              )}
            </div>

            {/* Scheduled Date */}
            {job.scheduledDate && (
              <div className="text-sm text-blue-600 flex items-center">
                <span className="mr-1">📅</span>
                Scheduled: {new Date(job.scheduledDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </div>
            )}

            {/* No Schedule Warning */}
            {!job.scheduledDate && job.status !== 'COMPLETED' && job.status !== 'CANCELLED' && (
              <div className="text-sm text-amber-600 flex items-center">
                <span className="mr-1">⏰</span>
                No schedule set
              </div>
            )}
          </div>
        </div>

        {/* Timestamp */}
        <div className="text-xs text-gray-500 ml-4 flex-shrink-0">
          <div>Updated</div>
          <div>{formatDistanceToNow(new Date(job.updatedAt), { addSuffix: true })}</div>
        </div>
      </div>

      {/* Progress Indicator for Active Jobs */}
      {job.status === 'IN_PROGRESS' && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Job in progress</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-purple-600 font-medium">Active</span>
            </div>
          </div>
        </div>
      )}

      {/* Completion Indicator */}
      {job.status === 'COMPLETED' && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-600">✅ Completed successfully</span>
            <div className="text-gray-500">
              {formatDistanceToNow(new Date(job.updatedAt), { addSuffix: true })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}