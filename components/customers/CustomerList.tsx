'use client'

import { useState, useEffect } from 'react'
import { CustomerStatus } from '@prisma/client'
import { CustomerFilters } from './CustomerFilters'
import { CustomerCard } from './CustomerCard'
import { CustomerDetailModal } from './CustomerDetailModal'
import { useCustomers } from '@/hooks/useCustomers'

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

interface CustomerFiltersState {
  search?: string
  status?: CustomerStatus
  tags?: string[]
  hasJobs?: boolean
}

export function CustomerList() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [filters, setFilters] = useState<CustomerFiltersState>({})
  
  const { customers, loading, error, refreshCustomers, deleteCustomer } = useCustomers({
    filters
  })

  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer)
  }

  const handleCustomerUpdate = () => {
    refreshCustomers()
    setSelectedCustomer(null)
  }

  const handleCustomerDelete = async (customerId: string) => {
    try {
      await deleteCustomer(customerId)
      refreshCustomers()
    } catch (error) {
      console.error('Failed to delete customer:', error)
    }
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error loading customers</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button 
            onClick={refreshCustomers}
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
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600 mt-1">
              Manage your customer database and history
            </p>
          </div>
          
          <div className="text-sm text-gray-500">
            {loading ? 'Loading...' : `${customers.length} customers`}
          </div>
        </div>

        <CustomerFilters 
          filters={filters} 
          onFiltersChange={setFilters}
          availableTags={[...new Set(customers.flatMap(c => c.tags))]}
        />
      </div>

      {/* Customer Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading && customers.length === 0 ? (
          // Loading skeleton
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg border p-4 animate-pulse">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : customers.length === 0 ? (
          // Empty state
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
            <p className="text-gray-500 mb-4">
              {Object.keys(filters).length > 0 
                ? 'Try adjusting your filters to see more customers.'
                : 'Start receiving calls to automatically create customer profiles.'}
            </p>
            {Object.keys(filters).length > 0 && (
              <button
                onClick={() => setFilters({})}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          // Customer cards
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customers.map((customer) => (
              <CustomerCard 
                key={customer.id} 
                customer={customer} 
                onClick={handleCustomerClick}
                onDelete={handleCustomerDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <CustomerDetailModal
          customerId={selectedCustomer.id}
          onClose={() => setSelectedCustomer(null)}
          onUpdate={handleCustomerUpdate}
        />
      )}
    </div>
  )
}