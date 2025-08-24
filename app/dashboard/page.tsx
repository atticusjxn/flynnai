'use client'

import React, { useState, useEffect } from 'react'
import { TestCallModal } from '@/components/dashboard/TestCallModal'

// This prevents static generation
export const runtime = 'edge'

export default function DashboardPage() {
  const [isTestCallModalOpen, setIsTestCallModalOpen] = useState(false)
  const [dashboardData, setDashboardData] = useState({
    totalCalls: 0,
    processedCalls: 0,
    appointmentsExtracted: 0,
    successRate: 0,
    recentCalls: [] as any[]
  })

  const refreshDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard/analytics')
      if (response.ok) {
        const data = await response.json()
        setDashboardData({
          totalCalls: data.totalCalls || 0,
          processedCalls: data.processedCalls || 0,
          appointmentsExtracted: data.appointmentsExtracted || 0,
          successRate: data.successRate || 0,
          recentCalls: data.recentCalls || []
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }

  useEffect(() => {
    refreshDashboardData()
  }, [])

  const handleTestCallComplete = () => {
    setIsTestCallModalOpen(false)
    // Refresh dashboard data after a delay to allow processing
    setTimeout(() => {
      refreshDashboardData()
    }, 5000)
  }
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Flynn AI Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Your phone integration system overview
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Message */}
        <div className="bg-green-50 border border-green-200 rounded-md p-6 mb-8">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-green-800">
                🎉 Setup Complete!
              </h3>
              <p className="mt-1 text-green-700">
                Your Flynn AI phone integration is now active and ready to process customer calls. 
                Make a test call to see it in action!
              </p>
            </div>
          </div>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-4">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Calls</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.totalCalls}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg mr-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Processed</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.processedCalls}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg mr-4">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h.01a1 1 0 011 1l-.01 4a5 5 0 01-10 0V8a1 1 0 011-1H8z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.appointmentsExtracted}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg mr-4">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.totalCalls > 0 ? `${dashboardData.successRate}%` : '--%'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => setIsTestCallModalOpen(true)}
              className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-blue-300 rounded-lg text-sm font-medium text-blue-600 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50 transition-colors"
            >
              📞 Make Test Call
            </button>
            <button className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors">
              📋 View Jobs
            </button>
            <button className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors">
              ⚙️ Settings
            </button>
            <button className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors">
              📊 Analytics
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Calls */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Calls</h3>
              <button 
                onClick={refreshDashboardData}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Refresh
              </button>
            </div>
            
            {dashboardData.recentCalls.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <h4 className="text-lg font-medium text-gray-900 mt-4">No calls yet</h4>
                <p className="text-gray-500 mt-2">
                  Make a test call to your business number to see Flynn AI process it automatically!
                </p>
                <button 
                  onClick={() => setIsTestCallModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Make Test Call
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardData.recentCalls.slice(0, 5).map((call: any, index: number) => (
                  <div key={call.id || index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Call from {call.phoneNumber || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {call.createdAt ? new Date(call.createdAt).toLocaleDateString() : 'Recent'}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          call.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          call.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                          call.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {call.status || 'Processing'}
                        </span>
                        {call.confidenceScore && (
                          <span className="ml-2 text-xs text-gray-500">
                            {Math.round(call.confidenceScore * 100)}% confidence
                          </span>
                        )}
                      </div>
                    </div>
                    {call.transcription && (
                      <div className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {call.transcription.substring(0, 150)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Getting Started */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Getting Started
            </h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                <span>Email verification complete</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                <span>Phone integration connected</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                <span>AI processing enabled</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                <span>Ready to process calls</span>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>🎯 Next step:</strong> Call your business number to test Flynn AI's automatic call processing and appointment extraction!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Test Call Modal */}
      <TestCallModal
        isOpen={isTestCallModalOpen}
        onClose={() => setIsTestCallModalOpen(false)}
        onCallComplete={handleTestCallComplete}
      />
    </div>
  )
}