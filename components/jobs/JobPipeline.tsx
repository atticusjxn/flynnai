'use client'

import { useState, useEffect } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { JobStatus } from '@prisma/client'
import { JobCard } from './JobCard'
import { JobColumn } from './JobColumn'
import { JobFilters } from './JobFilters'
import { JobDetailModal } from './JobDetailModal'
import { useJobs } from '@/hooks/useJobs'

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

const statusColumns = [
  {
    id: 'QUOTING' as JobStatus,
    title: 'Quote Requested',
    color: 'bg-yellow-50 border-yellow-200',
    badgeColor: 'bg-yellow-100 text-yellow-800'
  },
  {
    id: 'CONFIRMED' as JobStatus,
    title: 'Confirmed',
    color: 'bg-blue-50 border-blue-200',
    badgeColor: 'bg-blue-100 text-blue-800'
  },
  {
    id: 'IN_PROGRESS' as JobStatus,
    title: 'In Progress',
    color: 'bg-purple-50 border-purple-200',
    badgeColor: 'bg-purple-100 text-purple-800'
  },
  {
    id: 'COMPLETED' as JobStatus,
    title: 'Completed',
    color: 'bg-green-50 border-green-200',
    badgeColor: 'bg-green-100 text-green-800'
  }
]

interface JobFiltersState {
  priority?: string
  serviceType?: string
  extractedOnly?: boolean
  search?: string
}

export function JobPipeline() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [filters, setFilters] = useState<JobFiltersState>({})
  
  const { jobs, loading, error, updateJobStatus, refreshJobs } = useJobs({
    filters,
    includeStats: false
  })

  // Group jobs by status
  const jobsByStatus = statusColumns.reduce((acc, column) => {
    acc[column.id] = jobs.filter(job => job.status === column.id)
    return acc
  }, {} as Record<JobStatus, Job[]>)

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) {
      setActiveId(null)
      return
    }

    const jobId = active.id as string
    const newStatus = over.id as JobStatus
    
    // Find the job being moved
    const job = jobs.find(j => j.id === jobId)
    if (!job || job.status === newStatus) {
      setActiveId(null)
      return
    }

    // Update job status
    try {
      await updateJobStatus(jobId, newStatus)
      console.log(`✅ Job ${jobId} moved to ${newStatus}`)
    } catch (error) {
      console.error('❌ Failed to update job status:', error)
    }

    setActiveId(null)
  }

  const handleJobClick = (job: Job) => {
    setSelectedJob(job)
  }

  const handleJobUpdate = () => {
    refreshJobs()
    setSelectedJob(null)
  }

  // Get active job for drag overlay
  const activeJob = activeId ? jobs.find(job => job.id === activeId) : null

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error loading jobs</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button 
            onClick={refreshJobs}
            className="mt-2 px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header and Filters */}
      <div className="p-6 border-b bg-white">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Job Pipeline</h1>
            <p className="text-gray-600 mt-1">
              Manage your jobs through each stage of completion
            </p>
          </div>
          
          <div className="text-sm text-gray-500">
            {loading ? 'Loading...' : `${jobs.length} total jobs`}
          </div>
        </div>

        <JobFilters 
          filters={filters} 
          onFiltersChange={setFilters}
          availableServiceTypes={Array.from(new Set(jobs.map(j => j.serviceType).filter((type): type is string => Boolean(type))))}
        />
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-6 h-full min-w-max">
            {statusColumns.map((column) => (
              <JobColumn
                key={column.id}
                id={column.id}
                title={column.title}
                color={column.color}
                badgeColor={column.badgeColor}
                jobs={jobsByStatus[column.id] || []}
                onJobClick={handleJobClick}
                loading={loading}
              />
            ))}
          </div>

          <DragOverlay>
            {activeJob ? (
              <JobCard 
                job={activeJob} 
                onJobClick={() => {}} 
                isDragging={true}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onUpdate={handleJobUpdate}
        />
      )}
    </div>
  )
}