'use client'

import { useState } from 'react'

export default function SetupPhonePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSetup = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/setup-phone-integration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Setup failed')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            📞 Setup Phone Integration
          </h1>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              This will set up the phone integration so that test calls appear in your dashboard.
              You only need to run this once.
            </p>
            
            <button
              onClick={handleSetup}
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Setting up...' : 'Setup Phone Integration'}
            </button>
          </div>

          {result && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-lg font-medium text-green-800 mb-2">
                ✅ Setup Successful!
              </h3>
              <p className="text-green-700 mb-2">{result.message}</p>
              <div className="text-sm text-green-600">
                <p>Phone: {result.phoneIntegration?.phoneNumber}</p>
                <p>Webhook: {result.phoneIntegration?.webhookUrl}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-lg font-medium text-red-800 mb-2">
                ❌ Setup Failed
              </h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-medium text-blue-800 mb-2">
              📋 What this does:
            </h3>
            <ul className="text-blue-700 space-y-1">
              <li>• Creates a PhoneIntegration record in your database</li>
              <li>• Links your Twilio phone number to your user account</li>
              <li>• Enables the webhook to find your user when calls come in</li>
              <li>• Allows test calls to be logged to your dashboard</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}