'use client'

import { useState } from 'react'
import { JobStatus } from '@prisma/client'
import { format } from 'date-fns'

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

interface JobDetailModalProps {
  job: Job
  onClose: () => void
  onUpdate: () => void
}

const statusOptions = [
  { value: 'QUOTING' as JobStatus, label: 'Quote Requested', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'CONFIRMED' as JobStatus, label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
  { value: 'IN_PROGRESS' as JobStatus, label: 'In Progress', color: 'bg-purple-100 text-purple-800' },
  { value: 'COMPLETED' as JobStatus, label: 'Completed', color: 'bg-green-100 text-green-800' }
]

const priorityOptions = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
]

export function JobDetailModal({ job, onClose, onUpdate }: JobDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    title: job.title,
    customerName: job.customerName,
    customerPhone: job.customerPhone || '',
    customerEmail: job.customerEmail || '',
    serviceType: job.serviceType || '',
    description: job.description || '',
    status: job.status,
    priority: job.priority || 'normal',
    estimatedCost: job.estimatedCost || '',
    actualCost: job.actualCost || '',
    scheduledDate: job.scheduledDate ? format(new Date(job.scheduledDate), 'yyyy-MM-dd') : '',
    scheduledTime: job.scheduledTime || '',
    address: job.address || '',
    notes: job.notes || ''
  })

  const handleSave = async () => {
    if (isSaving) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editForm,
          estimatedCost: editForm.estimatedCost ? parseFloat(editForm.estimatedCost.toString()) : undefined,
          actualCost: editForm.actualCost ? parseFloat(editForm.actualCost.toString()) : undefined,
          scheduledDate: editForm.scheduledDate || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update job')
      }

      setIsEditing(false)
      onUpdate()
    } catch (error) {
      console.error('Failed to update job:', error)
      alert('Failed to update job. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete job')
      }

      onUpdate()
      onClose()
    } catch (error) {
      console.error('Failed to delete job:', error)
      alert('Failed to delete job. Please try again.')
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not scheduled'
    try {
      return format(new Date(dateStr), 'MMM d, yyyy')
    } catch {
      return dateStr
    }
  }

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'Not set'
    try {
      return format(new Date(dateStr), 'MMM d, yyyy h:mm a')
    } catch {
      return dateStr
    }
  }

  const currentStatus = statusOptions.find(s => s.value === job.status)
  const currentPriority = priorityOptions.find(p => p.value === job.priority)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edit Job' : 'Job Details'}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${currentStatus?.color}`}>
                {currentStatus?.label}
              </span>
              {job.extractedFromCall && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  📞 From Call
                </span>
              )}
              {job.confidenceScore && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {Math.round(job.confidenceScore)}% confidence
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
                >
                  Delete
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Job Info */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Job Information</h3>
                
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service Type
                      </label>
                      <input
                        type="text"
                        value={editForm.serviceType}
                        onChange={(e) => setEditForm(prev => ({ ...prev, serviceType: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as JobStatus }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Priority
                        </label>
                        <select
                          value={editForm.priority}
                          onChange={(e) => setEditForm(prev => ({ ...prev, priority: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {priorityOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Title:</span>
                      <p className="font-medium">{job.title}</p>
                    </div>
                    
                    {job.serviceType && (
                      <div>
                        <span className="text-sm text-gray-600">Service Type:</span>
                        <p>{job.serviceType}</p>
                      </div>
                    )}
                    
                    {job.description && (
                      <div>
                        <span className="text-sm text-gray-600">Description:</span>
                        <p>{job.description}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Priority:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${currentPriority?.color}`}>
                          {currentPriority?.label}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
                
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Customer Name
                      </label>
                      <input
                        type="text"
                        value={editForm.customerName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, customerName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={editForm.customerPhone}
                          onChange={(e) => setEditForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={editForm.customerEmail}
                          onChange={(e) => setEditForm(prev => ({ ...prev, customerEmail: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Name:</span>
                      <p className="font-medium">{job.customerName}</p>
                    </div>
                    
                    {job.customerPhone && (
                      <div>
                        <span className="text-sm text-gray-600">Phone:</span>
                        <p>{job.customerPhone}</p>
                      </div>
                    )}
                    
                    {job.customerEmail && (
                      <div>
                        <span className="text-sm text-gray-600">Email:</span>
                        <p>{job.customerEmail}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Scheduling & Costs */}
            <div className="space-y-6">
              {/* Scheduling */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Scheduling</h3>
                
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Scheduled Date
                        </label>
                        <input
                          type="date"
                          value={editForm.scheduledDate}
                          onChange={(e) => setEditForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Time
                        </label>
                        <input
                          type="time"
                          value={editForm.scheduledTime}
                          onChange={(e) => setEditForm(prev => ({ ...prev, scheduledTime: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <textarea
                        value={editForm.address}
                        onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Scheduled:</span>
                      <p>{formatDate(job.scheduledDate)} {job.scheduledTime && `at ${job.scheduledTime}`}</p>
                    </div>
                    
                    {job.address && (
                      <div>
                        <span className="text-sm text-gray-600">Address:</span>
                        <p>{job.address}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Costs */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing</h3>
                
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Estimated Cost
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-500">$</span>
                          <input
                            type="number"
                            value={editForm.estimatedCost}
                            onChange={(e) => setEditForm(prev => ({ ...prev, estimatedCost: e.target.value }))}
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Actual Cost
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-500">$</span>
                          <input
                            type="number"
                            value={editForm.actualCost}
                            onChange={(e) => setEditForm(prev => ({ ...prev, actualCost: e.target.value }))}
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Estimated:</span>
                        <p className="font-medium text-green-600">
                          {job.estimatedCost ? `$${job.estimatedCost.toLocaleString()}` : 'Not set'}
                        </p>
                      </div>
                      
                      <div>
                        <span className="text-sm text-gray-600">Actual:</span>
                        <p className="font-medium text-green-600">
                          {job.actualCost ? `$${job.actualCost.toLocaleString()}` : 'Not set'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
                
                {isEditing ? (
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add any additional notes or details..."
                  />
                ) : (
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {job.notes || 'No notes added'}
                  </p>
                )}
              </div>

              {/* Metadata */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span>{formatDateTime(job.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Updated:</span>
                    <span>{formatDateTime(job.updatedAt)}</span>
                  </div>
                  {job.completedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completed:</span>
                      <span>{formatDateTime(job.completedAt)}</span>
                    </div>
                  )}
                  {job.callRecord && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Call Record:</span>
                      <span className="font-mono text-xs">{job.callRecord.callSid}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}