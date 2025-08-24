'use client'

import { useState, useEffect } from 'react'
import { FeedbackType } from '@/lib/feedback'

interface FeedbackSummary {
  totalFeedbacks: number
  averageRating: number
  improvementRate: number
  commonIssues: { type: FeedbackType; count: number }[]
  confidenceImpact: number
}

export function FeedbackDashboard() {
  const [summary, setSummary] = useState<FeedbackSummary | null>(null)
  const [period, setPeriod] = useState(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeedbackSummary()
  }, [period])

  const fetchFeedbackSummary = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/feedback/summary?days=${period}`)
      if (response.ok) {
        const data = await response.json()
        setSummary(data.summary)
      }
    } catch (error) {
      console.error('Failed to fetch feedback summary:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFeedbackTypeLabel = (type: FeedbackType): string => {
    const labels: Record<FeedbackType, string> = {
      [FeedbackType.CUSTOMER_NAME_CORRECTION]: 'Customer Name',
      [FeedbackType.SERVICE_TYPE_CORRECTION]: 'Service Type',
      [FeedbackType.ADDRESS_CORRECTION]: 'Address',
      [FeedbackType.DATE_TIME_CORRECTION]: 'Date/Time',
      [FeedbackType.PHONE_EMAIL_CORRECTION]: 'Contact Info',
      [FeedbackType.URGENCY_CORRECTION]: 'Urgency',
      [FeedbackType.PRICE_CORRECTION]: 'Pricing',
      [FeedbackType.DESCRIPTION_CORRECTION]: 'Description',
      [FeedbackType.APPOINTMENT_EXISTS]: 'Appointment Exists',
      [FeedbackType.NO_APPOINTMENT]: 'No Appointment',
      [FeedbackType.TRANSCRIPTION_ERROR]: 'Transcription Error',
      [FeedbackType.MULTIPLE_APPOINTMENTS]: 'Multiple Appointments',
      [FeedbackType.MANUAL_OVERRIDE]: 'Manual Override'
    }
    return labels[type] || type
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600'
    if (rating >= 3) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getImprovementColor = (rate: number) => {
    if (rate >= 0.8) return 'text-green-600 bg-green-100'
    if (rate >= 0.6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Feedback Analytics</h2>
          <p className="text-gray-600">Track extraction accuracy and user corrections</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Period:</label>
          <select
            value={period}
            onChange={(e) => setPeriod(parseInt(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg mr-4">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1.586l-4 4z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Feedback</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalFeedbacks}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg mr-4">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Rating</p>
                  <p className={`text-2xl font-bold ${getRatingColor(summary.averageRating)}`}>
                    {summary.averageRating.toFixed(1)}/5
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg mr-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Improvement Rate</p>
                  <p className={`text-2xl font-bold ${getRatingColor(summary.improvementRate * 5)}`}>
                    {Math.round(summary.improvementRate * 100)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg mr-4">
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Confidence Impact</p>
                  <p className={`text-2xl font-bold ${summary.confidenceImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {summary.confidenceImpact >= 0 ? '+' : ''}{Math.round(summary.confidenceImpact * 100)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Common Issues */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Common Issues</h3>
            
            {summary.commonIssues.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-medium">No feedback issues found</p>
                <p className="text-sm">Great job! Your extractions are performing well.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {summary.commonIssues.slice(0, 8).map((issue, index) => (
                  <div key={issue.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-900">
                        {getFeedbackTypeLabel(issue.type)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{issue.count} corrections</span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full"
                          style={{ 
                            width: `${Math.min(100, (issue.count / Math.max(...summary.commonIssues.map(i => i.count))) * 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommendations */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start">
              <svg className="h-6 w-6 text-blue-600 mt-1 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-blue-900 mb-2">Recommendations</h3>
                <div className="space-y-2 text-sm text-blue-800">
                  {summary.averageRating < 3 && (
                    <p>• Consider reviewing extraction prompts to improve accuracy</p>
                  )}
                  {summary.commonIssues.length > 0 && summary.commonIssues[0].count > 5 && (
                    <p>• Focus on improving {getFeedbackTypeLabel(summary.commonIssues[0].type)} extraction accuracy</p>
                  )}
                  {summary.improvementRate < 0.5 && (
                    <p>• Review feedback patterns to identify systematic issues</p>
                  )}
                  {summary.totalFeedbacks < 10 && (
                    <p>• Encourage more user feedback to better understand system performance</p>
                  )}
                  {summary.averageRating >= 4 && summary.improvementRate >= 0.8 && (
                    <p>• Excellent performance! Consider gradual confidence threshold increases</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}