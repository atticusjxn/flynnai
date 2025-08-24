'use client'

import { useState } from 'react'
import { X, Phone, Loader2 } from 'lucide-react'

interface TestCallModalProps {
  isOpen: boolean
  onClose: () => void
  onCallComplete: () => void
}

interface CountryOption {
  code: string
  name: string
  flag: string
  dialCode: string
  format: string
}

const countryOptions: CountryOption[] = [
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61', format: '(0X) XXXX XXXX' },
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1', format: '(XXX) XXX-XXXX' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44', format: '0XXXX XXXXXX' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1', format: '(XXX) XXX-XXXX' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', dialCode: '+64', format: '(0X) XXX XXXX' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49', format: '0XXX XXXXXXXX' },
  { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33', format: '0X XX XX XX XX' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', dialCode: '+81', format: '0XX-XXXX-XXXX' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', dialCode: '+65', format: 'XXXX XXXX' },
]

export function TestCallModal({ isOpen, onClose, onCallComplete }: TestCallModalProps) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [countryCode, setCountryCode] = useState('AU') // Default to Australia
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'input' | 'calling' | 'success'>('input')
  const [callId, setCallId] = useState<string | null>(null)

  const selectedCountry = countryOptions.find(c => c.code === countryCode) || countryOptions[0]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phoneNumber.trim()) return

    setIsLoading(true)
    setStep('calling')

    try {
      // Combine country code with phone number and format for Twilio
      let cleanedNumber = phoneNumber.replace(/\D/g, '') // Remove non-digits first
      
      let fullPhoneNumber
      if (countryCode === 'AU') {
        // For Australian numbers, remove leading 0 if present
        if (cleanedNumber.startsWith('0')) {
          cleanedNumber = cleanedNumber.substring(1)
        }
        // Format Australian numbers as +61 XXX XXX XXX to match Twilio verification format
        // Your verified number is +61 497 779 071, so we need: +61 497 779 071
        if (cleanedNumber.length === 9) {
          fullPhoneNumber = `+61 ${cleanedNumber.slice(0, 3)} ${cleanedNumber.slice(3, 6)} ${cleanedNumber.slice(6)}`
        } else {
          fullPhoneNumber = `+61 ${cleanedNumber}`
        }
      } else {
        // For other countries, remove leading zeros and use standard format
        cleanedNumber = cleanedNumber.replace(/^0+/, '')
        fullPhoneNumber = selectedCountry.dialCode + cleanedNumber
      }
      
      console.log('Phone formatting debug:', { 
        originalInput: phoneNumber, 
        cleanedNumber, 
        countryCode, 
        finalFormat: fullPhoneNumber 
      })
      
      const response = await fetch('/api/twilio/make-test-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toNumber: fullPhoneNumber,
          countryCode: countryCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate call')
      }

      setCallId(data.callId)
      setStep('success')
      
      // Call the completion callback after a short delay
      setTimeout(() => {
        onCallComplete()
      }, 2000)

    } catch (error) {
      console.error('Error making test call:', error)
      alert(`Failed to make test call: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setStep('input')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setStep('input')
      setPhoneNumber('')
      setCallId(null)
      onClose()
    }
  }

  const formatPhoneNumber = (value: string, format: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '')
    
    // Apply country-specific formatting
    if (countryCode === 'AU') {
      // Australian format: (0X) XXXX XXXX
      if (digits.length >= 9) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)} ${digits.slice(6, 10)}`
      } else if (digits.length >= 6) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)} ${digits.slice(6)}`
      } else if (digits.length >= 2) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
      }
    } else if (countryCode === 'US' || countryCode === 'CA') {
      // North American format: (XXX) XXX-XXXX
      if (digits.length >= 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
      } else if (digits.length >= 6) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
      } else if (digits.length >= 3) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
      }
    } else if (countryCode === 'GB') {
      // UK format: 0XXXX XXXXXX
      if (digits.length >= 10) {
        return `${digits.slice(0, 5)} ${digits.slice(5, 11)}`
      } else if (digits.length >= 5) {
        return `${digits.slice(0, 5)} ${digits.slice(5)}`
      }
    }
    
    return digits
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value, selectedCountry.format)
    setPhoneNumber(formatted)
  }

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCountryCode(e.target.value)
    // Clear phone number when country changes
    setPhoneNumber('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {step === 'input' && '📞 Make Test Call'}
            {step === 'calling' && '📞 Calling...'}
            {step === 'success' && '✅ Call Initiated!'}
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'input' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <select
                  id="country"
                  value={countryCode}
                  onChange={handleCountryChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
                >
                  {countryOptions.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.flag} {country.name} ({country.dialCode})
                    </option>
                  ))}
                </select>

                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Phone Number
                </label>
                <div className="flex">
                  <div className="flex items-center px-3 py-2 bg-gray-50 border border-r-0 border-gray-300 rounded-l-md">
                    <span className="text-gray-500 text-sm">{selectedCountry.dialCode}</span>
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder={selectedCountry.format.replace(/X/g, '0')}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Enter your phone number to receive a test call from Flynn AI
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">What happens next:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• You'll receive a call from your business number</li>
                  <li>• Act like a customer requesting a service</li>
                  <li>• Flynn AI will process the call automatically</li>
                  <li>• Results will appear on your dashboard</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!phoneNumber.trim() || isLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Initiating...
                    </>
                  ) : (
                    <>
                      <Phone className="h-4 w-4 mr-2" />
                      Make Test Call
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 'calling' && (
            <div className="text-center py-8">
              <div className="animate-pulse">
                <Phone className="h-16 w-16 mx-auto text-blue-600 mb-4" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Initiating call to {selectedCountry.dialCode} {phoneNumber}...
              </h3>
              <p className="text-gray-600">
                Your phone should ring shortly. Answer and act like a customer!
              </p>
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Tip:</strong> Mention a specific service, date, and contact information for best results.
                </p>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <div className="h-16 w-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Test call initiated successfully!
              </h3>
              <p className="text-gray-600 mb-4">
                The call has been started. Answer your phone and test the system!
              </p>
              {callId && (
                <p className="text-sm text-gray-500">
                  Call ID: {callId}
                </p>
              )}
              <button
                onClick={handleClose}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}