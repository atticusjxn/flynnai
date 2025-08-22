'use client'

import { useState } from 'react'
import { Shield, Phone, AlertTriangle, Check } from 'lucide-react'

interface ConsentManagerProps {
  userState?: string // US state for compliance
  onConsentChange: (consent: any) => void
}

const stateRequirements = {
  'CA': { name: 'California', requiresConsent: true, twoParty: true },
  'FL': { name: 'Florida', requiresConsent: true, twoParty: true },
  'IL': { name: 'Illinois', requiresConsent: true, twoParty: true },
  'MA': { name: 'Massachusetts', requiresConsent: true, twoParty: true },
  'MT': { name: 'Montana', requiresConsent: true, twoParty: true },
  'NV': { name: 'Nevada', requiresConsent: true, twoParty: true },
  'NH': { name: 'New Hampshire', requiresConsent: true, twoParty: true },
  'PA': { name: 'Pennsylvania', requiresConsent: true, twoParty: true },
  'WA': { name: 'Washington', requiresConsent: true, twoParty: true },
  'default': { name: 'One-party state', requiresConsent: true, twoParty: false }
}

export function ConsentManager({ userState = 'default', onConsentChange }: ConsentManagerProps) {
  const [consentMethod, setConsentMethod] = useState('auto-notification')
  const [customMessage, setCustomMessage] = useState('')
  const [dataRetention, setDataRetention] = useState('30')
  const [shareWithThirdParties, setShareWithThirdParties] = useState(false)

  const stateInfo = stateRequirements[userState as keyof typeof stateRequirements] || stateRequirements.default

  const defaultMessage = stateInfo.twoParty 
    ? "This call may be recorded for quality and training purposes. By continuing, you consent to recording."
    : "This call may be recorded for business purposes."

  const handleUpdate = () => {
    onConsentChange({
      method: consentMethod,
      customMessage: customMessage || defaultMessage,
      dataRetention: parseInt(dataRetention),
      shareWithThirdParties,
      state: userState,
      compliance: stateInfo
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Shield className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-semibold text-gray-900">Recording Consent & Compliance</h3>
      </div>

      {/* State compliance info */}
      <div className={`p-4 rounded-lg mb-6 ${
        stateInfo.twoParty ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'
      }`}>
        <div className="flex items-start space-x-3">
          <AlertTriangle className={`w-5 h-5 mt-0.5 ${
            stateInfo.twoParty ? 'text-yellow-600' : 'text-green-600'
          }`} />
          <div className="text-sm">
            <div className="font-medium mb-1">
              {stateInfo.name} Compliance Requirements
            </div>
            <p className={stateInfo.twoParty ? 'text-yellow-700' : 'text-green-700'}>
              {stateInfo.twoParty 
                ? 'Two-party consent required. Both parties must explicitly agree to recording.'
                : 'One-party consent state. You can record calls with proper notification.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Consent method */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Consent Collection Method
        </label>
        <div className="space-y-3">
          <label className="flex items-start space-x-3">
            <input
              type="radio"
              name="consentMethod"
              value="auto-notification"
              checked={consentMethod === 'auto-notification'}
              onChange={(e) => setConsentMethod(e.target.value)}
              className="w-4 h-4 text-blue-600 mt-1"
            />
            <div>
              <div className="font-medium text-gray-900">Automatic Notification</div>
              <div className="text-sm text-gray-600">
                Play brief message at call start informing about recording
              </div>
            </div>
          </label>
          
          <label className="flex items-start space-x-3">
            <input
              type="radio"
              name="consentMethod"
              value="explicit-consent"
              checked={consentMethod === 'explicit-consent'}
              onChange={(e) => setConsentMethod(e.target.value)}
              className="w-4 h-4 text-blue-600 mt-1"
            />
            <div>
              <div className="font-medium text-gray-900">Explicit Consent Required</div>
              <div className="text-sm text-gray-600">
                Caller must verbally agree before recording starts
              </div>
            </div>
          </label>
          
          <label className="flex items-start space-x-3">
            <input
              type="radio"
              name="consentMethod"
              value="manual"
              checked={consentMethod === 'manual'}
              onChange={(e) => setConsentMethod(e.target.value)}
              className="w-4 h-4 text-blue-600 mt-1"
            />
            <div>
              <div className="font-medium text-gray-900">Manual Handling</div>
              <div className="text-sm text-gray-600">
                You handle consent disclosure yourself
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Custom message */}
      {consentMethod !== 'manual' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Consent Message
          </label>
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder={defaultMessage}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave blank to use default message for your state
          </p>
        </div>
      )}

      {/* Data retention */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Data Retention Period
        </label>
        <select
          value={dataRetention}
          onChange={(e) => setDataRetention(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="7">7 days</option>
          <option value="30">30 days</option>
          <option value="90">90 days</option>
          <option value="365">1 year</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          How long to keep recordings and transcriptions
        </p>
      </div>

      {/* Third party sharing */}
      <div className="mb-6">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={shareWithThirdParties}
            onChange={(e) => setShareWithThirdParties(e.target.checked)}
            className="w-4 h-4 text-blue-600"
          />
          <div className="text-sm">
            <div className="font-medium text-gray-900">Share data with third parties</div>
            <div className="text-gray-600">
              Allow sharing anonymized data for service improvements
            </div>
          </div>
        </label>
      </div>

      {/* Privacy features */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Privacy Protection Features</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-green-600" />
            <span>Automatic PII detection and redaction</span>
          </div>
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-green-600" />
            <span>Encrypted storage and transmission</span>
          </div>
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-green-600" />
            <span>Secure deletion after retention period</span>
          </div>
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-green-600" />
            <span>GDPR and CCPA compliance</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleUpdate}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
      >
        Update Compliance Settings
      </button>
    </div>
  )
}