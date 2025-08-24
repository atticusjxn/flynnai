'use client'

import { useState, useEffect, useCallback } from 'react'
import { CustomerStatus } from '@prisma/client'

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
  updatedAt: string
  recentJobs: any[]
  recentCalls: any[]
  jobCount: number
  callCount: number
}

interface UseCustomersOptions {
  filters?: {
    search?: string
    status?: CustomerStatus
    tags?: string[]
    hasJobs?: boolean
    lastContactFrom?: Date
    lastContactTo?: Date
  }
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

interface UseCustomersReturn {
  customers: Customer[]
  loading: boolean
  error: string | null
  refreshCustomers: () => Promise<void>
  createCustomer: (customerData: any) => Promise<Customer>
  updateCustomer: (customerId: string, updates: any) => Promise<Customer>
  deleteCustomer: (customerId: string) => Promise<void>
}

export function useCustomers(options: UseCustomersOptions = {}): UseCustomersReturn {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      
      if (options.filters?.search) {
        searchParams.append('search', options.filters.search)
      }
      if (options.filters?.status) {
        searchParams.append('status', options.filters.status)
      }
      if (options.filters?.tags && options.filters.tags.length > 0) {
        searchParams.append('tags', options.filters.tags.join(','))
      }
      if (options.filters?.hasJobs !== undefined) {
        searchParams.append('hasJobs', options.filters.hasJobs.toString())
      }
      if (options.filters?.lastContactFrom) {
        searchParams.append('lastContactFrom', options.filters.lastContactFrom.toISOString())
      }
      if (options.filters?.lastContactTo) {
        searchParams.append('lastContactTo', options.filters.lastContactTo.toISOString())
      }
      if (options.limit) {
        searchParams.append('limit', options.limit.toString())
      }
      if (options.offset) {
        searchParams.append('offset', options.offset.toString())
      }
      if (options.sortBy) {
        searchParams.append('sortBy', options.sortBy)
      }
      if (options.sortOrder) {
        searchParams.append('sortOrder', options.sortOrder)
      }

      const response = await fetch(`/api/customers?${searchParams.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch customers')
      }

      setCustomers(data.customers || [])

    } catch (err) {
      console.error('Error fetching customers:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch customers')
    } finally {
      setLoading(false)
    }
  }, [
    options.filters?.search,
    options.filters?.status,
    options.filters?.tags,
    options.filters?.hasJobs,
    options.filters?.lastContactFrom,
    options.filters?.lastContactTo,
    options.limit,
    options.offset,
    options.sortBy,
    options.sortOrder
  ])

  const createCustomer = useCallback(async (customerData: any): Promise<Customer> => {
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      })

      if (!response.ok) {
        throw new Error(`Failed to create customer: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create customer')
      }

      // Refresh customers list
      await fetchCustomers()

      return data.customer
    } catch (err) {
      console.error('Error creating customer:', err)
      throw err
    }
  }, [fetchCustomers])

  const updateCustomer = useCallback(async (customerId: string, updates: any): Promise<Customer> => {
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error(`Failed to update customer: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update customer')
      }

      // Update local state
      setCustomers(prevCustomers => 
        prevCustomers.map(customer => 
          customer.id === customerId 
            ? { ...customer, ...data.customer }
            : customer
        )
      )

      return data.customer
    } catch (err) {
      console.error('Error updating customer:', err)
      throw err
    }
  }, [])

  const deleteCustomer = useCallback(async (customerId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`Failed to delete customer: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete customer')
      }

      // Remove from local state (soft delete - actually just updates status)
      setCustomers(prevCustomers => 
        prevCustomers.map(customer => 
          customer.id === customerId 
            ? { ...customer, status: CustomerStatus.FORMER }
            : customer
        )
      )
    } catch (err) {
      console.error('Error deleting customer:', err)
      throw err
    }
  }, [])

  const refreshCustomers = useCallback(async () => {
    await fetchCustomers()
  }, [fetchCustomers])

  // Initial fetch
  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  return {
    customers,
    loading,
    error,
    refreshCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer
  }
}