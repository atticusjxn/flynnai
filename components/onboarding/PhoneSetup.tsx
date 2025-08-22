'use client'

import { useState } from 'react'
import { Phone, ArrowRight, ArrowLeft, Check, AlertCircle } from 'lucide-react'

interface PhoneSetupProps {
  onNext: (data: any) => void
  onBack: () => void
}

const providers = [
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'Direct API integration for instant setup',
    logo: '📞',
    setupTime: '2 minutes',
    features: ['Real-time webhooks', 'Call recording', 'Number porting']
  },
  {
    id: 'ringcentral',
    name: 'RingCentral',
    description: 'Enterprise phone system integration',
    logo: '🔔',
    setupTime: '5 minutes',
    features: ['Existing number integration', 'Team management', 'Analytics']
  },
  {
    id: 'forwarding',
    name: 'Call Forwarding',
    description: 'Works with any phone system',
    logo: '📱',
    setupTime: '3 minutes',
    features: ['Universal compatibility', 'Easy setup', 'No API required']
  }
]

export function PhoneSetup({ onNext, onBack }: PhoneSetupProps) {
  const [selectedProvider, setSelectedProvider] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [accountSid, setAccountSid] = useState('')
  const [authToken, setAuthToken] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  const handleNext = async () => {
    if (!selectedProvider || !phoneNumber) return

    setIsVerifying(true)
    
    // Simulate verification
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    onNext({
      provider: selectedProvider,
      phoneNumber,
      accountSid,
      authToken
    })
  }

  const renderProviderForm = () => {
    switch (selectedProvider) {
      case 'twilio':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account SID
              </label>
              <input
                type="text"
                value={accountSid}
                onChange={(e) => setAccountSid(e.target.value)}
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auth Token
              </label>
              <input
                type="password"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                placeholder="your_auth_token"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Find your Twilio credentials:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Log into your Twilio Console</li>
                    <li>Navigate to Dashboard → Account Info</li>
                    <li>Copy Account SID and Auth Token</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'forwarding':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="text-sm text-green-700">
                  <p className="font-medium mb-1">Call forwarding setup:</p>
                  <p className="text-xs">
                    We'll provide you with a forwarding number after verification. 
                    Simply set your phone to forward calls to our number when busy or unanswered.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Phone className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Connect Your Phone
        </h2>
        <p className="text-gray-600">
          Choose how you'd like to integrate your business phone system
        </p>
      </div>

      {!selectedProvider ? (
        <div className="space-y-4 mb-8">
          {providers.map((provider) => (
            <button
              key={provider.id}
              onClick={() => setSelectedProvider(provider.id)}
              className="w-full bg-white border-2 border-gray-200 hover:border-blue-300 rounded-xl p-6 text-left transition-colors duration-200 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="text-2xl">{provider.logo}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                      {provider.name}
                    </h3>
                    <p className="text-gray-600 mb-2">{provider.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {provider.features.map((feature, index) => (
                        <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-green-600 font-medium">
                    {provider.setupTime}
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 mt-2" />
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {providers.find(p => p.id === selectedProvider)?.name} Setup
            </h3>
            <button
              onClick={() => setSelectedProvider('')}
              className="text-gray-500 hover:text-gray-700"
            >
              Change provider
            </button>
          </div>
          
          {renderProviderForm()}
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        
        <button
          onClick={handleNext}
          disabled={!selectedProvider || !phoneNumber || isVerifying}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center space-x-2"
        >
          {isVerifying ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}