'use client'

import { useState } from 'react'
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  addWeeks, 
  subWeeks,
  startOfDay 
} from 'date-fns'

interface Job {
  id: string
  title: string
  customerName: string
  status: string
  priority?: string
  estimatedCost?: number
  scheduledDate?: string
  createdAt: string
}

interface JobCalendarViewProps {
  jobs: Job[]
}

export function JobCalendarView({ jobs }: JobCalendarViewProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 }) // Sunday
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  // Filter jobs for current week
  const weekJobs = jobs.filter(job => {
    if (!job.scheduledDate) return false
    const jobDate = new Date(job.scheduledDate)
    return jobDate >= weekStart && jobDate <= weekEnd
  })

  // Group jobs by day
  const jobsByDay = weekDays.map(day => ({
    date: day,
    jobs: weekJobs.filter(job => 
      isSameDay(new Date(job.scheduledDate!), day)
    )
  }))

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => 
      direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1)
    )
  }

  const goToToday = () => {
    setCurrentWeek(new Date())
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'QUOTING':
        return 'border-l-yellow-400 bg-yellow-50'
      case 'CONFIRMED':
        return 'border-l-blue-400 bg-blue-50'
      case 'IN_PROGRESS':
        return 'border-l-purple-400 bg-purple-50'
      case 'COMPLETED':
        return 'border-l-green-400 bg-green-50'
      default:
        return 'border-l-gray-400 bg-gray-50'
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

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Job Calendar</h3>
            <p className="text-sm text-gray-600 mt-1">
              Scheduled appointments for the week
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              Today
            </button>
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="px-4 py-2 text-sm font-medium">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </span>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Week Summary */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-2 bg-blue-50 rounded">
            <div className="text-lg font-bold text-blue-600">{weekJobs.length}</div>
            <div className="text-xs text-gray-600">This Week</div>
          </div>
          <div className="p-2 bg-green-50 rounded">
            <div className="text-lg font-bold text-green-600">
              {weekJobs.filter(j => j.status === 'CONFIRMED').length}
            </div>
            <div className="text-xs text-gray-600">Confirmed</div>
          </div>
          <div className="p-2 bg-purple-50 rounded">
            <div className="text-lg font-bold text-purple-600">
              ${weekJobs.reduce((sum, job) => sum + (job.estimatedCost || 0), 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-600">Est. Revenue</div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {weekJobs.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-2">📅</div>
            <p className="text-gray-500 font-medium">No scheduled jobs this week</p>
            <p className="text-gray-400 text-sm mt-1">
              Jobs with scheduled dates will appear here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {/* Day Headers */}
            {weekDays.map((day) => (
              <div key={day.toString()} className="text-center py-2 border-b border-gray-200">
                <div className="text-sm font-medium text-gray-900">
                  {format(day, 'EEE')}
                </div>
                <div className={`text-lg font-bold mt-1 ${
                  isSameDay(day, new Date()) 
                    ? 'text-blue-600 bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center mx-auto' 
                    : 'text-gray-700'
                }`}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}

            {/* Job Slots */}
            {jobsByDay.map(({ date, jobs: dayJobs }) => (
              <div key={date.toString()} className="min-h-[120px] space-y-1">
                {dayJobs.map((job) => (
                  <div
                    key={job.id}
                    className={`p-2 rounded border-l-4 text-xs cursor-pointer hover:shadow-sm transition-shadow ${
                      getStatusColor(job.status)
                    }`}
                    title={`${job.title} - ${job.customerName} (${job.status})`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-xs">{getPriorityIcon(job.priority)}</span>
                      <span className={`text-xs px-1 rounded ${
                        job.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-600' :
                        job.status === 'COMPLETED' ? 'bg-green-100 text-green-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                    
                    <div className="font-medium text-gray-900 truncate mt-1">
                      {job.title.length > 15 ? `${job.title.substring(0, 15)}...` : job.title}
                    </div>
                    
                    <div className="text-gray-600 truncate">
                      {job.customerName.length > 12 ? `${job.customerName.substring(0, 12)}...` : job.customerName}
                    </div>
                    
                    {job.estimatedCost && (
                      <div className="text-green-600 font-medium mt-1">
                        ${job.estimatedCost}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Calendar Footer */}
      {weekJobs.length > 0 && (
        <div className="p-4 bg-gray-50 border-t">
          <div className="flex justify-between items-center text-sm">
            <div className="flex space-x-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-400 rounded mr-2"></div>
                <span className="text-gray-600">Quoting ({weekJobs.filter(j => j.status === 'QUOTING').length})</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-400 rounded mr-2"></div>
                <span className="text-gray-600">Confirmed ({weekJobs.filter(j => j.status === 'CONFIRMED').length})</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-400 rounded mr-2"></div>
                <span className="text-gray-600">In Progress ({weekJobs.filter(j => j.status === 'IN_PROGRESS').length})</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-400 rounded mr-2"></div>
                <span className="text-gray-600">Completed ({weekJobs.filter(j => j.status === 'COMPLETED').length})</span>
              </div>
            </div>
            
            <button className="text-blue-600 hover:text-blue-800 font-medium">
              View Full Calendar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}