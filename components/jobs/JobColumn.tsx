'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { JobStatus } from '@prisma/client'
import { JobCard } from './JobCard'

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

interface JobColumnProps {
  id: JobStatus
  title: string
  color: string
  badgeColor: string
  jobs: Job[]
  onJobClick: (job: Job) => void
  loading: boolean
}

export function JobColumn({ 
  id, 
  title, 
  color, 
  badgeColor, 
  jobs, 
  onJobClick, 
  loading 
}: JobColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  })

  const totalValue = jobs.reduce((sum, job) => {
    return sum + (job.estimatedCost || 0)
  }, 0)

  return (
    <div className="flex flex-col w-80 h-full">
      {/* Column Header */}
      <div className={`rounded-t-lg border-2 border-b-0 p-4 ${color} ${
        isOver ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
      }`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
              {jobs.length}
            </span>
          </div>
          
          {totalValue > 0 && (
            <div className="text-sm text-gray-600">
              ${totalValue.toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Column Content */}
      <div 
        ref={setNodeRef}
        className={`flex-1 border-2 border-t-0 rounded-b-lg p-3 ${color} ${
          isOver ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
        } overflow-y-auto`}
        style={{ minHeight: '500px' }}
      >
        <SortableContext items={jobs.map(job => job.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {loading && jobs.length === 0 ? (
              // Loading skeleton
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-lg p-4 border animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
                    <div className="flex justify-between">
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              // Empty state
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-sm">No jobs in this stage</p>
                <p className="text-xs mt-1">
                  Drag jobs here to update their status
                </p>
              </div>
            ) : (
              // Jobs list
              jobs.map((job) => (
                <JobCard 
                  key={job.id} 
                  job={job} 
                  onJobClick={onJobClick}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}