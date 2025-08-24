'use client'

import { useState } from 'react'

export function QuickActions() {
  const [isOpen, setIsOpen] = useState(false)
  
  const actions = [
    {
      title: 'Test Phone Connection',
      description: 'Check your Twilio integration',
      icon: '🔧',
      color: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
      action: () => {
        // TODO: Implement phone connection test
        alert('Phone connection test would be implemented here')
      }
    },
    {
      title: 'View Call History',
      description: 'Browse all recorded calls',
      icon: '📞',
      color: 'bg-green-50 text-green-600 hover:bg-green-100',
      action: () => {
        // TODO: Navigate to call history page
        alert('Navigate to call history page')
      }
    },
    {
      title: 'Manage Jobs',
      description: 'Access job pipeline',
      icon: '📋',
      color: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
      action: () => {
        // TODO: Navigate to jobs page
        alert('Navigate to jobs management page')
      }
    },
    {
      title: 'Customer Database',
      description: 'View all customers',
      icon: '👥',
      color: 'bg-orange-50 text-orange-600 hover:bg-orange-100',
      action: () => {
        // TODO: Navigate to customers page
        alert('Navigate to customer database')
      }
    },
    {
      title: 'Settings',
      description: 'Configure system settings',
      icon: '⚙️',
      color: 'bg-gray-50 text-gray-600 hover:bg-gray-100',
      action: () => {
        // TODO: Navigate to settings page
        alert('Navigate to settings page')
      }
    },
    {
      title: 'Export Data',
      description: 'Download reports & data',
      icon: '📊',
      color: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100',
      action: () => {
        // TODO: Implement data export
        alert('Data export would be implemented here')
      }
    }
  ]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Quick Actions
        <svg 
          className={`h-4 w-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          ></div>
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg border border-gray-200 shadow-lg z-50">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              <p className="text-sm text-gray-600 mt-1">
                Common tasks and shortcuts
              </p>
            </div>
            
            <div className="p-2">
              <div className="grid grid-cols-2 gap-2">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      action.action()
                      setIsOpen(false)
                    }}
                    className={`p-3 rounded-lg text-left transition-colors ${action.color}`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-xl">{action.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm">
                          {action.title}
                        </div>
                        <div className="text-xs opacity-75 mt-1">
                          {action.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="text-xs text-gray-500 text-center">
                Need help? Check the <button className="text-blue-600 hover:text-blue-800">documentation</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}