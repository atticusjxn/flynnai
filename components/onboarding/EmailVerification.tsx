'use client'

import { useState } from 'react'
import { Mail, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'

interface EmailVerificationProps {
  onNext: (data: any) => void
  onBack: () => void
}

export function EmailVerification({ onNext, onBack }: EmailVerificationProps) {
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(false)

  const sendVerificationCode = async () => {
    if (!email) return
    
    setIsVerifying(true)
    
    try {
      const response = await fetch('/api/auth/send-email-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code')
      }
      
      // Show dev code in development
      if (data.devCode && process.env.NODE_ENV === 'development') {
        alert(`Development Mode: Use verification code ${data.devCode}`)
      }
      
      setIsCodeSent(true)
    } catch (error) {
      console.error('Error sending verification code:', error)
      alert(error instanceof Error ? error.message : 'Failed to send verification code. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  const verifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) return
    
    setIsVerifying(true)
    
    try {
      const response = await fetch('/api/auth/verify-email-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          code: verificationCode,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Invalid verification code')
      }
      
      setIsVerified(true)
      
      // Auto-advance after successful verification
      setTimeout(() => {
        onNext({ email: email.toLowerCase().trim(), verified: true })
      }, 1000)
    } catch (error) {
      console.error('Error verifying code:', error)
      alert(error instanceof Error ? error.message : 'Invalid verification code. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          {isVerified ? (
            <CheckCircle className="w-8 h-8 text-white" />
          ) : (
            <Mail className="w-8 h-8 text-white" />
          )}
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {isVerified ? 'Email Verified!' : 'Verify Your Email Address'}
        </h2>
        <p className="text-gray-600 text-lg">
          {isVerified 
            ? 'Great! Your email address has been verified successfully.'
            : 'We\'ll send you a verification code to confirm your email'
          }
        </p>
      </div>

      {!isVerified && (
        <div className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                disabled={isCodeSent}
                className="w-full pl-10 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Enter the email address you'd like to verify
            </p>
          </div>

          {!isCodeSent ? (
            <button
              onClick={sendVerificationCode}
              disabled={!email || !isValidEmail(email) || isVerifying}
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
            >
              {isVerifying ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sending code...</span>
                </>
              ) : (
                <>
                  <span>Send Verification Code</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          ) : (
            <>
              <div>
                <label htmlFor="code" className="block text-sm font-semibold text-gray-700 mb-3">
                  Verification Code
                </label>
                <input
                  type="text"
                  id="code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg text-center font-mono tracking-wider"
                  maxLength={6}
                />
                <p className="text-sm text-gray-500 mt-2">
                  We sent a 6-digit code to {email}
                </p>
              </div>

              <button
                onClick={verifyCode}
                disabled={verificationCode.length !== 6 || isVerifying}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
              >
                {isVerifying ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Email Address</span>
                    <CheckCircle className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  onClick={() => setIsCodeSent(false)}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Change email address
                </button>
                <span className="text-gray-400 mx-2">•</span>
                <button
                  onClick={sendVerificationCode}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Resend code
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {isVerified && (
        <div className="text-center">
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <p className="text-green-800 font-medium">
              Email address verified successfully!
            </p>
            <p className="text-green-600 text-sm mt-1">
              Continuing to account setup...
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        
        {isVerified && (
          <button
            onClick={() => onNext({ email: email.toLowerCase().trim(), verified: true })}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200 flex items-center space-x-2"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}