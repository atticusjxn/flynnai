'use client'

import { CustomerStatus } from '@prisma/client'
import { format } from 'date-fns'

interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  preferredContact?: string
  tags: string[]
  totalJobs: number
  totalSpent?: number
  averageJobValue?: number
  lastContactDate?: string
  status: CustomerStatus
  isBlacklisted: boolean
  createdAt: string
  recentJobs: any[]
  recentCalls: any[]
  jobCount: number
  callCount: number
}

interface CustomerCardProps {
  customer: Customer
  onClick: (customer: Customer) => void
  onDelete: (customerId: string) => void
}

const statusColors = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  POTENTIAL: 'bg-blue-100 text-blue-800',
  FORMER: 'bg-red-100 text-red-800'
}

const statusLabels = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  POTENTIAL: 'Potential',
  FORMER: 'Former'
}

export function CustomerCard({ customer, onClick, onDelete }: CustomerCardProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Never'
    try {
      return format(new Date(dateStr), 'MMM d, yyyy')
    } catch {
      return dateStr
    }
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
      <div onClick={() => onClick(customer)}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">
                {customer.name}
              </h3>
              {customer.isBlacklisted && (
                <span className="text-red-500 text-xs">🚫</span>
              )}
            </div>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              statusColors[customer.status]
            }`}>
              {statusLabels[customer.status]}
            </span>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-1 mb-3">
          {customer.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-4">📞</span>
              <span className="ml-2">{customer.phone}</span>
            </div>
          )}
          {customer.email && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-4">✉️</span>
              <span className="ml-2 truncate">{customer.email}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {customer.tags.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {customer.tags.slice(0, 3).map(tag => (
                <span 
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-50 text-blue-700"
                >
                  {tag}
                </span>
              ))}
              {customer.tags.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{customer.tags.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
          <div>
            <div className="text-gray-500">Jobs</div>
            <div className="font-medium">{customer.jobCount}</div>
          </div>
          <div>
            <div className="text-gray-500">Calls</div>
            <div className="font-medium">{customer.callCount}</div>
          </div>
          <div>
            <div className="text-gray-500">Total Spent</div>
            <div className="font-medium text-green-600">
              {formatCurrency(customer.totalSpent)}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Avg Job</div>
            <div className="font-medium text-green-600">
              {formatCurrency(customer.averageJobValue)}
            </div>
          </div>
        </div>

        {/* Last Contact */}
        <div className="text-xs text-gray-500">
          Last contact: {formatDate(customer.lastContactDate)}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClick(customer)
          }}
          className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
        >
          View
        </button>
        {customer.status !== CustomerStatus.FORMER && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (confirm(`Are you sure you want to delete ${customer.name}?`)) {
                onDelete(customer.id)
              }
            }}
            className="px-3 py-1 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  )
}