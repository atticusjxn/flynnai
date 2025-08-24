'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { JobStatus } from '@prisma/client'
import { format } from 'date-fns'

interface Job {
  id: string
  title: string
  customerName: string
  customerPhone?: string
  serviceType?: string
  status: JobStatus
  priority?: string
  estimatedCost?: number
  scheduledDate?: string
  extractedFromCall: boolean
  confidenceScore?: number
  createdAt: string
  updatedAt: string
  customer?: {
    name: string
    phone?: string
    email?: string
  }
  extractedAppointment?: {
    confidenceScore?: number
    urgencyLevel?: string
  }
}

interface JobCardProps {
  job: Job
  onJobClick: (job: Job) => void
  isDragging?: boolean
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  normal: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
}

const priorityLabels = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent'
}

export function JobCard({ job, onJobClick, isDragging = false }: JobCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: sortableIsDragging,
  } = useSortable({ id: job.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null
    try {
      return format(new Date(dateStr), 'MMM d, yyyy')
    } catch {
      return dateStr
    }
  }

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return null
    try {
      return format(new Date(dateStr), 'h:mm a')
    } catch {
      return null
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg border-2 border-gray-200 p-4 cursor-pointer transition-all hover:border-blue-300 hover:shadow-md ${
        sortableIsDragging || isDragging ? 'shadow-lg border-blue-400 rotate-3' : ''
      }`}
      onClick={() => onJobClick(job)}
    >
      {/* Job Title */}
      <div className="mb-3">
        <h4 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2">
          {job.title}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-600">{job.customerName}</span>
          {job.extractedFromCall && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-800">
              📞 Auto
            </span>
          )}
        </div>
      </div>

      {/* Service Type & Priority */}
      <div className="flex items-center justify-between mb-3">
        {job.serviceType && (
          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
            {job.serviceType}
          </span>
        )}
        
        {job.priority && job.priority !== 'normal' && (
          <span className={`text-xs px-2 py-1 rounded font-medium ${
            priorityColors[job.priority as keyof typeof priorityColors] || priorityColors.normal
          }`}>
            {priorityLabels[job.priority as keyof typeof priorityLabels] || job.priority}
          </span>
        )}
      </div>

      {/* Scheduling Info */}
      {job.scheduledDate && (
        <div className="mb-3 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <span>📅</span>
            <span>{formatDate(job.scheduledDate)}</span>
            {formatTime(job.scheduledDate) && (
              <span className="text-gray-500">at {formatTime(job.scheduledDate)}</span>
            )}
          </div>
        </div>
      )}

      {/* Bottom Row */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          {/* Estimated Cost */}
          {job.estimatedCost && (
            <span className="text-green-600 font-medium">
              ${job.estimatedCost.toLocaleString()}
            </span>
          )}
          
          {/* Confidence Score */}
          {job.confidenceScore && (
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${
                job.confidenceScore >= 80 ? 'bg-green-400' :
                job.confidenceScore >= 60 ? 'bg-yellow-400' : 'bg-red-400'
              }`}></span>
              <span className="text-gray-500">{Math.round(job.confidenceScore)}%</span>
            </div>
          )}
        </div>

        {/* Created Date */}
        <span className="text-gray-400">
          {formatDate(job.createdAt)}
        </span>
      </div>
    </div>
  )
}