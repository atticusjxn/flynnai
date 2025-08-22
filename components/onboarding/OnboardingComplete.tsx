'use client'

import { CheckCircle, Phone, Mail, Settings, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface OnboardingCompleteProps {
  data: any
}

export function OnboardingComplete({ data }: OnboardingCompleteProps) {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          You're all set!
        </h2>
        <p className="text-xl text-gray-600 leading-relaxed">
          AutoCalendar is now monitoring your business phone and ready to turn 
          every customer call into a perfect appointment.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          Setup Summary
        </h3>
        
        <div className="space-y-4 text-left">
          <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-1">
              <Phone className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Phone Integration</div>
              <div className="text-sm text-gray-600">
                {data.phone?.provider} • {data.phone?.phoneNumber}
              </div>
            </div>
          </div>
          
          <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-1">
              <Mail className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Email Delivery</div>
              <div className="text-sm text-gray-600">
                Appointments will be sent to {data.business?.email}
              </div>
            </div>
          </div>
          
          <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mt-1">
              <Settings className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Processing Settings</div>
              <div className="text-sm text-gray-600">
                {data.preferences?.confidenceThreshold}% confidence threshold • {data.preferences?.callFiltering} filtering
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-8 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          What happens next?
        </h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">
              1
            </div>
            <div className="font-medium text-gray-900">Calls Start Processing</div>
            <div className="text-gray-600">Your next customer call will be automatically processed</div>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">
              2
            </div>
            <div className="font-medium text-gray-900">Email Delivered</div>
            <div className="text-gray-600">Appointment details arrive in your inbox within 2 minutes</div>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">
              3
            </div>
            <div className="font-medium text-gray-900">Calendar Updated</div>
            <div className="text-gray-600">One-click to add the appointment to your calendar</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Link href="/dashboard">
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2">
            <span>Go to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
        
        <div className="text-sm text-gray-600">
          <p>
            Need help? Contact us at{' '}
            <a href="mailto:support@autocalendar.ai" className="text-blue-600 hover:underline">
              support@autocalendar.ai
            </a>
            {' '}or{' '}
            <a href="tel:+1-555-CALENDAR" className="text-blue-600 hover:underline">
              +1 (555) CALENDAR
            </a>
          </p>
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="w-5 h-5 text-yellow-600 mt-0.5">⭐</div>
          <div className="text-sm text-yellow-700">
            <div className="font-medium mb-1">Free Trial Active</div>
            <div>
              Your first 10 appointment calls are completely free. You'll be notified 
              before any charges apply.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}