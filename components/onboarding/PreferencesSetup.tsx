'use client'

import { useState } from 'react'
import { Settings, ArrowRight, ArrowLeft, Clock, Shield, Filter } from 'lucide-react'

interface PreferencesSetupProps {
  onNext: (data: any) => void
  onBack: () => void
}

export function PreferencesSetup({ onNext, onBack }: PreferencesSetupProps) {
  const [emailDelivery, setEmailDelivery] = useState('immediate')
  const [callFiltering, setCallFiltering] = useState('smart')
  const [recordingConsent, setRecordingConsent] = useState('automatic')
  const [dataRetention, setDataRetention] = useState('30days')
  const [confidenceThreshold, setConfidenceThreshold] = useState(85)

  const handleNext = () => {
    onNext({
      emailDelivery,
      callFiltering,
      recordingConsent,
      dataRetention,
      confidenceThreshold
    })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Settings className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Configure Your Preferences
        </h2>
        <p className="text-gray-600">
          Customize how AutoCalendar processes and delivers your appointments
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
        
        {/* Email Delivery */}
        <div>
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Email Delivery</h3>
          </div>
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name="emailDelivery"
                value="immediate"
                checked={emailDelivery === 'immediate'}
                onChange={(e) => setEmailDelivery(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <div className="font-medium text-gray-900">Immediate (Recommended)</div>
                <div className="text-sm text-gray-600">Send email within 2 minutes of call ending</div>
              </div>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name="emailDelivery"
                value="batched"
                checked={emailDelivery === 'batched'}
                onChange={(e) => setEmailDelivery(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <div className="font-medium text-gray-900">Batched Daily</div>
                <div className="text-sm text-gray-600">Send daily summary at 6 PM</div>
              </div>
            </label>
          </div>
        </div>

        {/* Call Filtering */}
        <div>
          <div className="flex items-center space-x-3 mb-4">
            <Filter className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Call Filtering</h3>
          </div>
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name="callFiltering"
                value="smart"
                checked={callFiltering === 'smart'}
                onChange={(e) => setCallFiltering(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <div className="font-medium text-gray-900">Smart Filtering (Recommended)</div>
                <div className="text-sm text-gray-600">Only process calls with appointment-related content</div>
              </div>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name="callFiltering"
                value="all"
                checked={callFiltering === 'all'}
                onChange={(e) => setCallFiltering(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <div className="font-medium text-gray-900">Process All Calls</div>
                <div className="text-sm text-gray-600">Attempt to extract appointments from every call</div>
              </div>
            </label>
          </div>
        </div>

        {/* Recording Consent */}
        <div>
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Recording Consent</h3>
          </div>
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name="recordingConsent"
                value="automatic"
                checked={recordingConsent === 'automatic'}
                onChange={(e) => setRecordingConsent(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <div className="font-medium text-gray-900">Automatic Notification (Recommended)</div>
                <div className="text-sm text-gray-600">Play brief consent message at call start</div>
              </div>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name="recordingConsent"
                value="manual"
                checked={recordingConsent === 'manual'}
                onChange={(e) => setRecordingConsent(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <div className="font-medium text-gray-900">Manual Consent</div>
                <div className="text-sm text-gray-600">You handle consent disclosure manually</div>
              </div>
            </label>
          </div>
        </div>

        {/* Confidence Threshold */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Confidence Threshold</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Minimum confidence for appointment extraction</span>
              <span className="font-semibold text-blue-600">{confidenceThreshold}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>More appointments (50%)</span>
              <span>Higher accuracy (95%)</span>
            </div>
          </div>
        </div>

        {/* Data Retention */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Retention</h3>
          <select
            value={dataRetention}
            onChange={(e) => setDataRetention(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7days">7 days</option>
            <option value="30days">30 days (Recommended)</option>
            <option value="90days">90 days</option>
            <option value="1year">1 year</option>
          </select>
          <p className="text-sm text-gray-500 mt-2">
            How long to keep call recordings and transcriptions for quality assurance
          </p>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        
        <button
          onClick={handleNext}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center space-x-2"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}