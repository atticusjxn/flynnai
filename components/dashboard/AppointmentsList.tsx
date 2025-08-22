'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, User, Phone } from 'lucide-react'
import { format } from 'date-fns'

interface Appointment {
  id: string
  title: string
  startTime: string
  endTime: string
  status: string
  client: {
    name: string
    phone?: string
  }
}

interface AppointmentsListProps {
  limit?: number
  showDate?: boolean
}

export function AppointmentsList({ limit, showDate = true }: AppointmentsListProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        // For demo purposes, using mock data
        await new Promise(resolve => setTimeout(resolve, 800))
        
        const mockAppointments: Appointment[] = [
          {
            id: '1',
            title: 'Kitchen Pipe Repair',
            startTime: '2024-01-15T09:00:00Z',
            endTime: '2024-01-15T10:30:00Z',
            status: 'SCHEDULED',
            client: {
              name: 'John Smith',
              phone: '(555) 123-4567'
            }
          },
          {
            id: '2',
            title: 'Bathroom Installation',
            startTime: '2024-01-15T14:00:00Z',
            endTime: '2024-01-15T16:00:00Z',
            status: 'CONFIRMED',
            client: {
              name: 'Sarah Johnson',
              phone: '(555) 987-6543'
            }
          },
          {
            id: '3',
            title: 'Drain Cleaning',
            startTime: '2024-01-16T10:00:00Z',
            endTime: '2024-01-16T11:00:00Z',
            status: 'SCHEDULED',
            client: {
              name: 'Mike Davis',
              phone: '(555) 456-7890'
            }
          }
        ]
        
        setAppointments(limit ? mockAppointments.slice(0, limit) : mockAppointments)
      } catch (error) {
        console.error('Error fetching appointments:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAppointments()
  }, [limit])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800'
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
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
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No appointments scheduled</p>
        <p className="text-sm text-gray-400 mt-1">
          Try saying "Schedule an appointment with John for tomorrow at 2pm"
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {appointments.map((appointment) => (
        <div key={appointment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-medium text-gray-900">{appointment.title}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                  {appointment.status.replace('_', ' ')}
                </span>
              </div>
              
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>{appointment.client.name}</span>
                  {appointment.client.phone && (
                    <>
                      <Phone className="w-4 h-4 ml-2" />
                      <span>{appointment.client.phone}</span>
                    </>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>
                    {format(new Date(appointment.startTime), 'h:mm a')} - {format(new Date(appointment.endTime), 'h:mm a')}
                  </span>
                  {showDate && (
                    <>
                      <Calendar className="w-4 h-4 ml-2" />
                      <span>{format(new Date(appointment.startTime), 'MMM d, yyyy')}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {limit && appointments.length >= limit && (
        <div className="text-center pt-4">
          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View all appointments
          </button>
        </div>
      )}
    </div>
  )
}