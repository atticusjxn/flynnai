'use client'

import { useState, useEffect } from 'react'

interface PhoneNumber {
  id: string
  number: string
  friendlyName: string
  isActive: boolean
  smsEnabled: boolean
  voiceEnabled: boolean
  createdAt: string
  callCount: number
  lastUsed?: string
}

interface TwilioCredentials {
  accountSid: string
  authToken: string
  webhookUrl: string
  isConfigured: boolean
}

export function PhoneManagement() {
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([])
  const [credentials, setCredentials] = useState<TwilioCredentials>({
    accountSid: '',
    authToken: '',
    webhookUrl: '',
    isConfigured: false
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddNumber, setShowAddNumber] = useState(false)
  const [showCredentials, setShowCredentials] = useState(false)

  useEffect(() => {
    fetchPhoneNumbers()
    fetchTwilioCredentials()
  }, [])

  const fetchPhoneNumbers = async () => {
    try {
      const response = await fetch('/api/settings/phone-numbers')
      if (response.ok) {
        const data = await response.json()
        setPhoneNumbers(data.phoneNumbers)
      }
    } catch (error) {
      console.error('Failed to fetch phone numbers:', error)
    }
  }

  const fetchTwilioCredentials = async () => {
    try {
      const response = await fetch('/api/settings/twilio-credentials')
      if (response.ok) {
        const data = await response.json()
        setCredentials(data)
      }
    } catch (error) {
      console.error('Failed to fetch Twilio credentials:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveCredentials = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings/twilio-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })

      if (response.ok) {
        const data = await response.json()
        setCredentials(data)
        alert('Twilio credentials saved successfully!')
      } else {
        alert('Failed to save credentials. Please check your settings.')
      }
    } catch (error) {
      alert('Error saving credentials. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const testConnection = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings/test-twilio-connection', {
        method: 'POST'
      })

      const data = await response.json()
      if (response.ok) {
        alert(`Connection successful! Account: ${data.accountName}`)
      } else {
        alert(`Connection failed: ${data.error}`)
      }
    } catch (error) {
      alert('Failed to test connection. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const togglePhoneNumber = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/settings/phone-numbers/${id}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      })

      if (response.ok) {
        await fetchPhoneNumbers()
      }
    } catch (error) {
      alert('Failed to toggle phone number status')
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="space-y-3">
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Twilio Integration Status */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Twilio Integration</h3>
            <p className="text-sm text-gray-600">
              Configure your Twilio account for call processing
            </p>
          </div>
          
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            credentials.isConfigured 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {credentials.isConfigured ? '✅ Connected' : '❌ Not Configured'}
          </div>
        </div>

        {!credentials.isConfigured && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
            <div className="flex">
              <svg className="h-5 w-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-yellow-700">
                <p>Please configure your Twilio credentials to enable phone integration.</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setShowCredentials(!showCredentials)}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Configure Credentials
          </button>

          <button
            onClick={testConnection}
            disabled={!credentials.isConfigured || saving}
            className={`flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium ${
              credentials.isConfigured && !saving
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {saving ? 'Testing...' : 'Test Connection'}
          </button>
        </div>

        {/* Credentials Form */}
        {showCredentials && (
          <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-white">
            <h4 className="text-md font-medium text-gray-900 mb-4">Twilio Account Details</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account SID
                </label>
                <input
                  type="text"
                  value={credentials.accountSid}
                  onChange={(e) => setCredentials({...credentials, accountSid: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Auth Token
                </label>
                <input
                  type="password"
                  value={credentials.authToken}
                  onChange={(e) => setCredentials({...credentials, authToken: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your Twilio Auth Token"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={credentials.webhookUrl}
                  onChange={(e) => setCredentials({...credentials, webhookUrl: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://your-domain.com/api/twilio/webhook"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCredentials(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCredentials}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Credentials'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Phone Numbers Management */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Phone Numbers</h3>
            <p className="text-sm text-gray-600">
              Manage your Twilio phone numbers for call processing
            </p>
          </div>
          
          <button
            onClick={() => setShowAddNumber(true)}
            disabled={!credentials.isConfigured}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium ${
              credentials.isConfigured
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Number
          </button>
        </div>

        {phoneNumbers.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No phone numbers</h3>
            <p className="mt-1 text-sm text-gray-500">
              {credentials.isConfigured 
                ? 'Get started by adding your first phone number.' 
                : 'Configure Twilio credentials first to add phone numbers.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {phoneNumbers.map((phone) => (
              <PhoneNumberCard 
                key={phone.id} 
                phone={phone} 
                onToggle={togglePhoneNumber}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PhoneNumberCard({ phone, onToggle }: { 
  phone: PhoneNumber
  onToggle: (id: string, isActive: boolean) => void 
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${phone.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">{phone.number}</span>
              <span className="text-sm text-gray-500">({phone.friendlyName})</span>
            </div>
            
            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
              <span>📞 {phone.callCount} calls</span>
              {phone.lastUsed && (
                <span>🕐 Last used: {new Date(phone.lastUsed).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-xs space-y-1">
            <div className={`px-2 py-1 rounded ${phone.voiceEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              Voice {phone.voiceEnabled ? 'ON' : 'OFF'}
            </div>
            <div className={`px-2 py-1 rounded ${phone.smsEnabled ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
              SMS {phone.smsEnabled ? 'ON' : 'OFF'}
            </div>
          </div>

          <button
            onClick={() => onToggle(phone.id, phone.isActive)}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              phone.isActive
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {phone.isActive ? 'Disable' : 'Enable'}
          </button>
        </div>
      </div>
    </div>
  )
}