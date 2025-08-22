'use client'

import { useState, useEffect } from 'react'
import { User, Phone, Mail, MapPin } from 'lucide-react'

interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  _count: {
    appointments: number
    invoices: number
  }
}

export function ClientsList() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchClients = async () => {
      try {
        // For demo purposes, using mock data
        await new Promise(resolve => setTimeout(resolve, 800))
        
        const mockClients: Client[] = [
          {
            id: '1',
            name: 'John Smith',
            email: 'john@example.com',
            phone: '(555) 123-4567',
            address: '123 Main St, Anytown, ST 12345',
            _count: { appointments: 3, invoices: 2 }
          },
          {
            id: '2',
            name: 'Sarah Johnson',
            email: 'sarah@example.com',
            phone: '(555) 987-6543',
            address: '456 Oak Ave, Anytown, ST 12345',
            _count: { appointments: 5, invoices: 4 }
          },
          {
            id: '3',
            name: 'Mike Davis',
            phone: '(555) 456-7890',
            _count: { appointments: 1, invoices: 1 }
          }
        ]
        
        setClients(mockClients)
      } catch (error) {
        console.error('Error fetching clients:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchClients()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-3 bg-gray-200 rounded w-48"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-8">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No clients yet</p>
        <p className="text-sm text-gray-400 mt-1">
          Try saying "Add new client John Smith"
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {clients.map((client) => (
        <div key={client.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary-600" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-2">{client.name}</h3>
              
              <div className="space-y-1 text-sm text-gray-600">
                {client.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>{client.email}</span>
                  </div>
                )}
                
                {client.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4" />
                    <span>{client.phone}</span>
                  </div>
                )}
                
                {client.address && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>{client.address}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                <span>{client._count.appointments} appointments</span>
                <span>{client._count.invoices} invoices</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}