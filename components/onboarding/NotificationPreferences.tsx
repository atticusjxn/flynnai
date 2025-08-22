'use client'

import { useState } from 'react'
import { Mail, Smartphone, ArrowRight, ArrowLeft, Bell, Calendar } from 'lucide-react'

interface NotificationPreferencesProps {
  onNext: (data: any) => void
  onBack: () => void
}

export function NotificationPreferences({ onNext, onBack }: NotificationPreferencesProps) {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [inAppNotifications, setInAppNotifications] = useState(true)
  const [emailTiming, setEmailTiming] = useState('immediate')

  const handleNext = () => {
    onNext({
      emailNotifications,
      inAppNotifications,
      emailTiming
    })
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bell className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Choose Your Notification Preferences
        </h2>
        <p className="text-gray-600 text-lg">
          How would you like to receive your processed call information?
        </p>
      </div>

      <div className="space-y-8">
        {/* Email Notifications */}
        <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-colors duration-200">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Email Summaries
                </h3>
                <p className="text-gray-600 mb-3">
                  Get detailed call summaries with customer info, job details, and calendar files sent to your inbox
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">📧 Call transcription</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">📅 Calendar file (.ics)</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">👤 Customer contact card</span>
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {emailNotifications && (
            <div className="ml-16 bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Email Timing
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="emailTiming"
                    value="immediate"
                    checked={emailTiming === 'immediate'}
                    onChange={(e) => setEmailTiming(e.target.value)}
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
                    name="emailTiming"
                    value="daily"
                    checked={emailTiming === 'daily'}
                    onChange={(e) => setEmailTiming(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Daily Summary</div>
                    <div className="text-sm text-gray-600">Send all processed calls in one email at 6 PM</div>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* In-App Notifications */}
        <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-green-300 transition-colors duration-200">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  In-App Job Management
                </h3>
                <p className="text-gray-600 mb-3">
                  Automatically add jobs to your scheduler with drag-and-drop pipeline management
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">📋 Job scheduler</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">🔄 Pipeline stages</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">📱 Mobile access</span>
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={inAppNotifications}
                onChange={(e) => setInAppNotifications(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
        </div>

        {/* Recommendation */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-start space-x-3">
            <Smartphone className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">💡 Recommended Setup</h4>
              <p className="text-blue-800 text-sm">
                Most users enable both options for maximum coverage: get immediate email notifications 
                while you're away from your computer, plus organized job management when you're back at your desk.
              </p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h4 className="font-semibold text-gray-900 mb-3">Your Setup:</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className={`w-2 h-2 rounded-full ${emailNotifications ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className={emailNotifications ? 'text-gray-900' : 'text-gray-500'}>
                Email summaries {emailNotifications ? `(${emailTiming})` : '(disabled)'}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`w-2 h-2 rounded-full ${inAppNotifications ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className={inAppNotifications ? 'text-gray-900' : 'text-gray-500'}>
                In-app job scheduler {inAppNotifications ? '(enabled)' : '(disabled)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        
        <button
          onClick={handleNext}
          disabled={!emailNotifications && !inAppNotifications}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
        >
          <span>Continue Setup</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}