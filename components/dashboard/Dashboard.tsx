'use client'

import { useState, useEffect } from 'react'
import { Calendar, Users, FileText, DollarSign } from 'lucide-react'
import { AppointmentsList } from './AppointmentsList'
import { ClientsList } from './ClientsList'
import { InvoicesList } from './InvoicesList'
import { QuickStats } from './QuickStats'

type DashboardView = 'overview' | 'appointments' | 'clients' | 'invoices'

export function Dashboard() {
  const [activeView, setActiveView] = useState<DashboardView>('overview')

  const navigationItems = [
    { key: 'overview', label: 'Overview', icon: DollarSign },
    { key: 'appointments', label: 'Schedule', icon: Calendar },
    { key: 'clients', label: 'Clients', icon: Users },
    { key: 'invoices', label: 'Invoices', icon: FileText },
  ] as const

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex space-x-2 overflow-x-auto">
          {navigationItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveView(key)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                activeView === key
                  ? 'bg-primary-100 text-primary-700 border border-primary-200'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeView === 'overview' && (
          <>
            <QuickStats />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Today's Appointments
                </h3>
                <AppointmentsList limit={3} showDate={false} />
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Recent Invoices
                </h3>
                <InvoicesList limit={3} />
              </div>
            </div>
          </>
        )}

        {activeView === 'appointments' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Appointments & Schedule
            </h2>
            <AppointmentsList />
          </div>
        )}

        {activeView === 'clients' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Client Management
            </h2>
            <ClientsList />
          </div>
        )}

        {activeView === 'invoices' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Invoices & Billing
            </h2>
            <InvoicesList />
          </div>
        )}
      </div>
    </div>
  )
}