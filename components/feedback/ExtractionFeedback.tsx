'use client'

import { useState } from 'react'
import { FeedbackType, FeedbackRating, feedbackManager } from '@/lib/feedback'

interface ExtractedData {
  id?: string
  callRecordId: string
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  serviceType?: string
  jobDescription?: string
  urgencyLevel?: string
  preferredDate?: string
  preferredTime?: string
  timeFlexibility?: string
  serviceAddress?: string
  quotedPrice?: number
  budgetMentioned?: number
  confidence: number
  hasIssues?: boolean
}

interface ExtractionFeedbackProps {
  extractedData: ExtractedData
  transcription: string
  onFeedbackSubmitted?: () => void
}

export function ExtractionFeedback({ extractedData, transcription, onFeedbackSubmitted }: ExtractionFeedbackProps) {
  const [feedbackMode, setFeedbackMode] = useState<'rating' | 'correction' | null>(null)
  const [selectedField, setSelectedField] = useState<string | null>(null)
  const [rating, setRating] = useState<FeedbackRating | null>(null)
  const [corrections, setCorrections] = useState<Record<string, any>>({})
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showManualOverride, setShowManualOverride] = useState(false)

  const fields = [
    { key: 'customerName', label: 'Customer Name', value: extractedData.customerName, type: FeedbackType.CUSTOMER_NAME_CORRECTION },
    { key: 'customerPhone', label: 'Phone Number', value: extractedData.customerPhone, type: FeedbackType.PHONE_EMAIL_CORRECTION },
    { key: 'customerEmail', label: 'Email', value: extractedData.customerEmail, type: FeedbackType.PHONE_EMAIL_CORRECTION },
    { key: 'serviceType', label: 'Service Type', value: extractedData.serviceType, type: FeedbackType.SERVICE_TYPE_CORRECTION },
    { key: 'serviceAddress', label: 'Service Address', value: extractedData.serviceAddress, type: FeedbackType.ADDRESS_CORRECTION },
    { key: 'jobDescription', label: 'Job Description', value: extractedData.jobDescription, type: FeedbackType.DESCRIPTION_CORRECTION },
    { key: 'urgencyLevel', label: 'Urgency', value: extractedData.urgencyLevel, type: FeedbackType.URGENCY_CORRECTION },
    { key: 'preferredDate', label: 'Preferred Date', value: extractedData.preferredDate, type: FeedbackType.DATE_TIME_CORRECTION },
    { key: 'preferredTime', label: 'Preferred Time', value: extractedData.preferredTime, type: FeedbackType.DATE_TIME_CORRECTION },
    { key: 'quotedPrice', label: 'Quoted Price', value: extractedData.quotedPrice ? `$${extractedData.quotedPrice}` : undefined, type: FeedbackType.PRICE_CORRECTION }
  ]

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100'
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const submitFeedback = async (feedbackType: FeedbackType, originalValue: any, correctedValue?: any) => {
    if (!rating) return

    setSubmitting(true)
    try {
      await feedbackManager.submitFeedback({
        callRecordId: extractedData.callRecordId,
        extractedAppointmentId: extractedData.id,
        userId: 'current-user', // Would get from session
        feedbackType,
        originalValue,
        correctedValue,
        rating,
        comment: comment || undefined
      })

      setFeedbackMode(null)
      setSelectedField(null)
      setRating(null)
      setComment('')
      onFeedbackSubmitted?.()
      
      alert('Feedback submitted successfully!')
    } catch (error) {
      alert('Failed to submit feedback. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const submitCorrection = async (field: string, feedbackType: FeedbackType) => {
    const correctedValue = corrections[field]
    const originalValue = (extractedData as any)[field]
    
    await submitFeedback(feedbackType, originalValue, correctedValue)
  }

  const renderRatingButtons = () => (
    <div className="flex space-x-2 mb-4">
      <span className="text-sm font-medium text-gray-700">Rate accuracy:</span>
      {([1, 2, 3, 4, 5] as FeedbackRating[]).map((value) => (
        <button
          key={value}
          onClick={() => setRating(value)}
          className={`w-8 h-8 rounded-full border-2 text-sm font-medium ${
            rating === value
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
          }`}
        >
          {value}
        </button>
      ))}
    </div>
  )

  const renderFieldCorrection = (field: typeof fields[0]) => (
    <div className="border rounded-lg p-4 mb-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-medium text-gray-900">{field.label}</h4>
          <p className="text-sm text-gray-600">
            Current: <span className="font-medium">{field.value || 'Not extracted'}</span>
          </p>
        </div>
        <button
          onClick={() => setSelectedField(selectedField === field.key ? null : field.key)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          {selectedField === field.key ? 'Cancel' : 'Correct'}
        </button>
      </div>

      {selectedField === field.key && (
        <div className="space-y-3">
          {field.key === 'urgencyLevel' ? (
            <select
              value={corrections[field.key] || ''}
              onChange={(e) => setCorrections({ ...corrections, [field.key]: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select urgency level</option>
              <option value="emergency">Emergency</option>
              <option value="urgent">Urgent</option>
              <option value="normal">Normal</option>
              <option value="routine">Routine</option>
            </select>
          ) : field.key === 'quotedPrice' ? (
            <input
              type="number"
              value={corrections[field.key] || ''}
              onChange={(e) => setCorrections({ ...corrections, [field.key]: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter price amount"
            />
          ) : field.key === 'preferredDate' ? (
            <input
              type="date"
              value={corrections[field.key] || ''}
              onChange={(e) => setCorrections({ ...corrections, [field.key]: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : field.key === 'preferredTime' ? (
            <input
              type="time"
              value={corrections[field.key] || ''}
              onChange={(e) => setCorrections({ ...corrections, [field.key]: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <textarea
              value={corrections[field.key] || ''}
              onChange={(e) => setCorrections({ ...corrections, [field.key]: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={field.key === 'jobDescription' ? 3 : 1}
              placeholder={`Enter correct ${field.label.toLowerCase()}`}
            />
          )}

          {renderRatingButtons()}

          <div className="flex space-x-2">
            <button
              onClick={() => submitCorrection(field.key, field.type)}
              disabled={submitting || !corrections[field.key] || !rating}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Correction'}
            </button>
            <button
              onClick={() => setSelectedField(null)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Extraction Feedback</h3>
          <p className="text-sm text-gray-600 mt-1">
            Help us improve by reviewing the extracted information
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(extractedData.confidence)}`}>
            {Math.round(extractedData.confidence * 100)}% confidence
          </span>
          {extractedData.hasIssues && (
            <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
              Has Issues
            </span>
          )}
        </div>
      </div>

      {/* Quick Feedback Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <button
          onClick={async () => {
            await submitFeedback(FeedbackType.APPOINTMENT_EXISTS, null, null)
          }}
          className="p-3 border border-green-300 rounded-lg text-green-700 hover:bg-green-50 text-sm font-medium"
        >
          ✅ Looks Good
        </button>
        
        <button
          onClick={() => setFeedbackMode('correction')}
          className="p-3 border border-yellow-300 rounded-lg text-yellow-700 hover:bg-yellow-50 text-sm font-medium"
        >
          ✏️ Needs Correction
        </button>
        
        <button
          onClick={async () => {
            await submitFeedback(FeedbackType.NO_APPOINTMENT, extractedData, null)
          }}
          className="p-3 border border-red-300 rounded-lg text-red-700 hover:bg-red-50 text-sm font-medium"
        >
          ❌ No Appointment
        </button>
        
        <button
          onClick={() => setShowManualOverride(true)}
          className="p-3 border border-blue-300 rounded-lg text-blue-700 hover:bg-blue-50 text-sm font-medium"
        >
          🖐️ Manual Override
        </button>
      </div>

      {/* Correction Interface */}
      {feedbackMode === 'correction' && (
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-4">Select fields to correct:</h4>
          <div className="space-y-2">
            {fields.map((field) => renderFieldCorrection(field))}
          </div>
        </div>
      )}

      {/* Manual Override Modal */}
      {showManualOverride && (
        <ManualOverrideModal
          callRecordId={extractedData.callRecordId}
          currentData={extractedData}
          transcription={transcription}
          onClose={() => setShowManualOverride(false)}
          onSubmitted={onFeedbackSubmitted}
        />
      )}
    </div>
  )
}

interface ManualOverrideModalProps {
  callRecordId: string
  currentData: ExtractedData
  transcription: string
  onClose: () => void
  onSubmitted?: () => void
}

function ManualOverrideModal({ callRecordId, currentData, transcription, onClose, onSubmitted }: ManualOverrideModalProps) {
  const [overrideData, setOverrideData] = useState({
    hasAppointment: true,
    customerName: currentData.customerName || '',
    customerPhone: currentData.customerPhone || '',
    customerEmail: currentData.customerEmail || '',
    serviceType: currentData.serviceType || '',
    jobDescription: currentData.jobDescription || '',
    urgencyLevel: currentData.urgencyLevel || 'normal',
    preferredDate: currentData.preferredDate || '',
    preferredTime: currentData.preferredTime || '',
    timeFlexibility: currentData.timeFlexibility || 'flexible',
    serviceAddress: currentData.serviceAddress || '',
    quotedPrice: currentData.quotedPrice || 0,
    budgetMentioned: currentData.budgetMentioned || 0
  })
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submitOverride = async () => {
    if (!reason.trim()) {
      alert('Please provide a reason for the manual override')
      return
    }

    setSubmitting(true)
    try {
      await feedbackManager.createManualOverride({
        callRecordId,
        userId: 'current-user', // Would get from session
        overrideData,
        reason
      })

      onClose()
      onSubmitted?.()
      alert('Manual override applied successfully!')
    } catch (error) {
      alert('Failed to apply manual override. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Manual Override</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Transcription Reference */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Original Transcription:</h4>
            <p className="text-sm text-gray-600 max-h-20 overflow-y-auto">
              {transcription}
            </p>
          </div>

          {/* Override Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Has Appointment
                </label>
                <select
                  value={overrideData.hasAppointment ? 'true' : 'false'}
                  onChange={(e) => setOverrideData({ ...overrideData, hasAppointment: e.target.value === 'true' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="true">Yes - This is an appointment request</option>
                  <option value="false">No - This is not an appointment</option>
                </select>
              </div>

              {overrideData.hasAppointment && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      value={overrideData.customerName}
                      onChange={(e) => setOverrideData({ ...overrideData, customerName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={overrideData.customerPhone}
                      onChange={(e) => setOverrideData({ ...overrideData, customerPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service Type
                    </label>
                    <input
                      type="text"
                      value={overrideData.serviceType}
                      onChange={(e) => setOverrideData({ ...overrideData, serviceType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Plumbing, Electrical, HVAC"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service Address
                    </label>
                    <input
                      type="text"
                      value={overrideData.serviceAddress}
                      onChange={(e) => setOverrideData({ ...overrideData, serviceAddress: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      value={overrideData.preferredDate}
                      onChange={(e) => setOverrideData({ ...overrideData, preferredDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preferred Time
                    </label>
                    <input
                      type="time"
                      value={overrideData.preferredTime}
                      onChange={(e) => setOverrideData({ ...overrideData, preferredTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
            </div>

            {overrideData.hasAppointment && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Description
                </label>
                <textarea
                  value={overrideData.jobDescription}
                  onChange={(e) => setOverrideData({ ...overrideData, jobDescription: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Manual Override
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Explain why manual override is needed..."
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={submitOverride}
              disabled={submitting || !reason.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Applying...' : 'Apply Override'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}