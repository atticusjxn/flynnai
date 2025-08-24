'use client'

import { useState, useEffect } from 'react'
import { CustomerStatus } from '@prisma/client'
import { format } from 'date-fns'

interface CustomerDetailModalProps {
  customerId: string
  onClose: () => void
  onUpdate: () => void
}

interface CustomerProfile {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  preferredContact?: string
  notes?: string
  tags: string[]
  totalJobs: number
  totalSpent?: number
  averageJobValue?: number
  lastContactDate?: string
  status: CustomerStatus
  isBlacklisted: boolean
  blacklistReason?: string
  createdAt: string
  updatedAt: string
  jobs: any[]
  extractedAppointments: any[]
}

interface CustomerStats {
  totalJobs: number
  completedJobs: number
  totalRevenue: number
  averageJobValue: number
  totalCalls: number
  conversionRate: number
}

const statusOptions = [
  { value: CustomerStatus.ACTIVE, label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: CustomerStatus.INACTIVE, label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
  { value: CustomerStatus.POTENTIAL, label: 'Potential', color: 'bg-blue-100 text-blue-800' },
  { value: CustomerStatus.FORMER, label: 'Former', color: 'bg-red-100 text-red-800' }
]

export function CustomerDetailModal({ customerId, onClose, onUpdate }: CustomerDetailModalProps) {
  const [customer, setCustomer] = useState<CustomerProfile | null>(null)
  const [stats, setStats] = useState<CustomerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    preferredContact: 'phone',
    notes: '',
    tags: [] as string[],
    status: CustomerStatus.ACTIVE,
    isBlacklisted: false,
    blacklistReason: ''
  })

  // Fetch customer profile
  useEffect(() => {
    fetchCustomerProfile()
  }, [customerId])

  const fetchCustomerProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/customers/${customerId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch customer: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch customer')
      }

      setCustomer(data.customer)
      setStats(data.stats)
      
      // Initialize edit form
      setEditForm({
        name: data.customer.name || '',
        phone: data.customer.phone || '',
        email: data.customer.email || '',
        address: data.customer.address || '',
        preferredContact: data.customer.preferredContact || 'phone',
        notes: data.customer.notes || '',
        tags: data.customer.tags || [],
        status: data.customer.status || CustomerStatus.ACTIVE,
        isBlacklisted: data.customer.isBlacklisted || false,
        blacklistReason: data.customer.blacklistReason || ''
      })

    } catch (err) {
      console.error('Error fetching customer profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch customer')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (isSaving) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      })

      if (!response.ok) {
        throw new Error('Failed to update customer')
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update customer')
      }

      setIsEditing(false)
      await fetchCustomerProfile()
      onUpdate()
      
    } catch (error) {
      console.error('Failed to update customer:', error)
      alert('Failed to update customer. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not set'
    try {
      return format(new Date(dateStr), 'MMM d, yyyy h:mm a')
    } catch {
      return dateStr
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={fetchCustomerProfile}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!customer) return null

  const currentStatus = statusOptions.find(s => s.value === customer.status)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edit Customer' : customer.name}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${currentStatus?.color}`}>
                {currentStatus?.label}
              </span>
              {customer.isBlacklisted && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  🚫 Blacklisted
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Edit
              </button>
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

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Customer Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <textarea
                        value={editForm.address}
                        onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Contact</label>
                        <select
                          value={editForm.preferredContact}
                          onChange={(e) => setEditForm(prev => ({ ...prev, preferredContact: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="phone">Phone</option>
                          <option value="email">Email</option>
                          <option value="text">Text</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as CustomerStatus }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {statusOptions.map(option => (
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
                    {customer.phone && (
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 w-20">Phone:</span>
                        <span>{customer.phone}</span>
                      </div>
                    )}
                    
                    {customer.email && (
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 w-20">Email:</span>
                        <span>{customer.email}</span>
                      </div>
                    )}
                    
                    {customer.address && (
                      <div className="flex items-start">
                        <span className="text-sm text-gray-600 w-20">Address:</span>
                        <span>{customer.address}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 w-20">Prefers:</span>
                      <span className="capitalize">{customer.preferredContact}</span>
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
                    placeholder="Add notes about this customer..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {customer.notes || 'No notes added'}
                  </p>
                )}
              </div>

              {/* Job History */}
              {customer.jobs.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Jobs</h3>
                  <div className="space-y-2">
                    {customer.jobs.slice(0, 5).map(job => (
                      <div key={job.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{job.title}</h4>
                            <p className="text-sm text-gray-600">{job.serviceType}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-green-600">
                              {job.actualCost ? formatCurrency(job.actualCost) : job.estimatedCost ? formatCurrency(job.estimatedCost) : '—'}
                            </div>
                            <div className="text-xs text-gray-500">{formatDate(job.createdAt)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Stats & Activity */}
            <div className="space-y-6">
              {/* Statistics */}
              {stats && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Statistics</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded">
                        <div className="text-2xl font-bold text-blue-600">{stats.totalJobs}</div>
                        <div className="text-xs text-gray-600">Total Jobs</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded">
                        <div className="text-2xl font-bold text-green-600">{stats.completedJobs}</div>
                        <div className="text-xs text-gray-600">Completed</div>
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</div>
                      <div className="text-xs text-gray-600">Total Revenue</div>
                    </div>
                    
                    <div className="text-center p-3 bg-yellow-50 rounded">
                      <div className="text-lg font-bold text-yellow-600">{formatCurrency(stats.averageJobValue)}</div>
                      <div className="text-xs text-gray-600">Average Job</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-purple-50 rounded">
                        <div className="text-lg font-bold text-purple-600">{stats.totalCalls}</div>
                        <div className="text-xs text-gray-600">Total Calls</div>
                      </div>
                      <div className="text-center p-3 bg-indigo-50 rounded">
                        <div className="text-lg font-bold text-indigo-600">{Math.round(stats.conversionRate)}%</div>
                        <div className="text-xs text-gray-600">Conversion</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tags */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
                
                {isEditing ? (
                  <div>
                    <input
                      type="text"
                      value={editForm.tags.join(', ')}
                      onChange={(e) => setEditForm(prev => ({ 
                        ...prev, 
                        tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                      }))}
                      placeholder="Enter tags separated by commas"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customer.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {customer.tags.map(tag => (
                          <span 
                            key={tag}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No tags added</p>
                    )}
                  </div>
                )}
              </div>

              {/* Account Details */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Account Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span>{formatDate(customer.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Contact:</span>
                    <span>{formatDate(customer.lastContactDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Updated:</span>
                    <span>{formatDate(customer.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}