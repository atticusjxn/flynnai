'use client'

import { useState } from 'react'
import { Phone, ArrowRight, ArrowLeft, Settings, CheckCircle } from 'lucide-react'

interface PhoneIntegrationProps {
  onNext: (data: any) => void
  onBack: () => void
}

const phoneProviders = [
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'Direct API integration with your Twilio account',
    logo: '🔵',
    setupTime: '2 minutes',
    popular: true
  },
  {
    id: 'ringcentral',
    name: 'RingCentral',
    description: 'Enterprise phone system integration',
    logo: '🟣',
    setupTime: '5 minutes',
    popular: false
  },
  {
    id: 'forwarding',
    name: 'Call Forwarding',
    description: 'Works with any phone system',
    logo: '📱',
    setupTime: '3 minutes',
    popular: false
  }
]

export function PhoneIntegration({ onNext, onBack }: PhoneIntegrationProps) {
  const [selectedProvider, setSelectedProvider] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    if (!selectedProvider || !phoneNumber) return
    
    setIsConnecting(true)
    
    // Simulate connection process
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    onNext({
      provider: selectedProvider,
      phoneNumber,
      connected: true
    })
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Phone className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Connect Your Business Phone
        </h2>
        <p className="text-gray-600 text-lg">
          Choose how you'd like to integrate your phone system with Flynn.ai
        </p>
      </div>

      <div className="space-y-6">
        {/* Phone Number Input */}
        <div>
          <label htmlFor="business-phone" className="block text-sm font-semibold text-gray-700 mb-3">
            Business Phone Number
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="tel"
              id="business-phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="w-full pl-10 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg"
            />
          </div>
        </div>

        {/* Provider Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Choose Integration Method
          </label>
          <div className="grid gap-4">
            {phoneProviders.map((provider) => (
              <div
                key={provider.id}
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                  selectedProvider === provider.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedProvider(provider.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{provider.logo}</div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                        {provider.popular && (
                          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{provider.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-green-600 font-medium">
                      {provider.setupTime}
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedProvider === provider.id
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedProvider === provider.id && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <Settings className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Don't worry - this is just setup!</p>
              <p>We'll guide you through the actual integration process after you complete onboarding. For now, we're just configuring your preferences.</p>
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
          onClick={handleConnect}
          disabled={!selectedProvider || !phoneNumber || isConnecting}
          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
        >
          {isConnecting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <span>Continue Setup</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}