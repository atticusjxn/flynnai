'use client'

import { useState, useEffect } from 'react'
import { FileText, DollarSign, Calendar, User } from 'lucide-react'
import { format } from 'date-fns'

interface Invoice {
  id: string
  invoiceNumber: string
  description: string
  amount: number
  status: string
  dueDate?: string
  createdAt: string
  client: {
    name: string
  }
}

interface InvoicesListProps {
  limit?: number
}

export function InvoicesList({ limit }: InvoicesListProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        // For demo purposes, using mock data
        await new Promise(resolve => setTimeout(resolve, 800))
        
        const mockInvoices: Invoice[] = [
          {
            id: '1',
            invoiceNumber: 'INV-0001',
            description: 'Kitchen Pipe Repair Service',
            amount: 250.00,
            status: 'SENT',
            dueDate: '2024-02-15T00:00:00Z',
            createdAt: '2024-01-15T10:30:00Z',
            client: { name: 'John Smith' }
          },
          {
            id: '2',
            invoiceNumber: 'INV-0002',
            description: 'Bathroom Installation',
            amount: 1200.00,
            status: 'PAID',
            dueDate: '2024-02-10T00:00:00Z',
            createdAt: '2024-01-10T16:00:00Z',
            client: { name: 'Sarah Johnson' }
          },
          {
            id: '3',
            invoiceNumber: 'INV-0003',
            description: 'Drain Cleaning Service',
            amount: 150.00,
            status: 'DRAFT',
            createdAt: '2024-01-16T11:00:00Z',
            client: { name: 'Mike Davis' }
          }
        ]
        
        setInvoices(limit ? mockInvoices.slice(0, limit) : mockInvoices)
      } catch (error) {
        console.error('Error fetching invoices:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvoices()
  }, [limit])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800'
      case 'SENT':
        return 'bg-blue-100 text-blue-800'
      case 'OVERDUE':
        return 'bg-red-100 text-red-800'
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No invoices created</p>
        <p className="text-sm text-gray-400 mt-1">
          Try saying "Create invoice for John Smith for $250"
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {invoices.map((invoice) => (
        <div key={invoice.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-medium text-gray-900">{invoice.invoiceNumber}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                  {invoice.status}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-2">{invoice.description}</p>
              
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>{invoice.client.name}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Created {format(new Date(invoice.createdAt), 'MMM d, yyyy')}</span>
                  {invoice.dueDate && (
                    <span className="ml-2">
                      • Due {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center space-x-1 text-lg font-semibold text-gray-900">
                <DollarSign className="w-4 h-4" />
                <span>{invoice.amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {limit && invoices.length >= limit && (
        <div className="text-center pt-4">
          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View all invoices
          </button>
        </div>
      )}
    </div>
  )
}