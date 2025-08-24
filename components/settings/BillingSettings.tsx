'use client'

import { useState, useEffect } from 'react'

interface UsageData {
  currentPeriod: {
    calls: number
    minutes: number
    transcriptionHours: number
    storage: number
    aiRequests: number
  }
  limits: {
    calls: number
    minutes: number
    transcriptionHours: number
    storage: number
    aiRequests: number
  }
  costs: {
    calls: number
    minutes: number
    transcription: number
    storage: number
    aiRequests: number
    total: number
  }
}

interface BillingInfo {
  plan: 'starter' | 'professional' | 'enterprise'
  status: 'active' | 'canceled' | 'past_due'
  nextBillDate: string
  amount: number
  paymentMethod?: {
    type: 'card' | 'bank'
    last4: string
    brand: string
  }
}

const PLAN_FEATURES = {
  starter: {
    name: 'Starter',
    price: 29,
    limits: {
      calls: 100,
      minutes: 500,
      transcriptionHours: 10,
      storage: 5,
      aiRequests: 200
    },
    features: [
      'Up to 100 calls/month',
      '500 minutes of call time',
      '10 hours of transcription',
      '5GB storage',
      '200 AI requests',
      'Email support'
    ]
  },
  professional: {
    name: 'Professional',
    price: 99,
    limits: {
      calls: 500,
      minutes: 2500,
      transcriptionHours: 50,
      storage: 25,
      aiRequests: 1000
    },
    features: [
      'Up to 500 calls/month',
      '2,500 minutes of call time',
      '50 hours of transcription',
      '25GB storage',
      '1,000 AI requests',
      'Priority support',
      'Advanced filtering',
      'Calendar integration'
    ]
  },
  enterprise: {
    name: 'Enterprise',
    price: 299,
    limits: {
      calls: -1,
      minutes: -1,
      transcriptionHours: -1,
      storage: 100,
      aiRequests: -1
    },
    features: [
      'Unlimited calls',
      'Unlimited minutes',
      'Unlimited transcription',
      '100GB storage',
      'Unlimited AI requests',
      '24/7 phone support',
      'Custom integrations',
      'White-label options',
      'SLA guarantee'
    ]
  }
}

export function BillingSettings() {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [billing, setBilling] = useState<BillingInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => {
    fetchUsageData()
    fetchBillingInfo()
  }, [])

  const fetchUsageData = async () => {
    try {
      const response = await fetch('/api/settings/usage')
      if (response.ok) {
        const data = await response.json()
        setUsage(data.usage)
      }
    } catch (error) {
      console.error('Failed to fetch usage data:', error)
    }
  }

  const fetchBillingInfo = async () => {
    try {
      const response = await fetch('/api/settings/billing')
      if (response.ok) {
        const data = await response.json()
        setBilling(data.billing)
      }
    } catch (error) {
      console.error('Failed to fetch billing info:', error)
    } finally {
      setLoading(false)
    }
  }

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0 // Unlimited
    return Math.min((current / limit) * 100, 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const formatStorage = (gb: number) => {
    if (gb < 1) return `${Math.round(gb * 1000)} MB`
    return `${gb.toFixed(1)} GB`
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  const currentPlan = billing ? PLAN_FEATURES[billing.plan] : null

  return (
    <div className="space-y-8">
      {/* Current Plan */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="text-xl mr-2">💳</span>
              Current Plan
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Your subscription and billing information
            </p>
          </div>
          
          {billing && (
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              billing.status === 'active' ? 'bg-green-100 text-green-800' :
              billing.status === 'past_due' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {billing.status.toUpperCase()}
            </div>
          )}
        </div>

        {billing && currentPlan && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {currentPlan.name} Plan
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                ${billing.amount}/month
              </div>
              <div className="text-sm text-gray-600">
                Next billing: {new Date(billing.nextBillDate).toLocaleDateString()}
              </div>
              
              {billing.paymentMethod && (
                <div className="mt-4 p-3 bg-white rounded border">
                  <div className="text-sm font-medium text-gray-900">Payment Method</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {billing.paymentMethod.brand} ending in {billing.paymentMethod.last4}
                  </div>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Plan Features</h4>
              <div className="space-y-2">
                {currentPlan.features.slice(0, 4).map((feature, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-600">
                    <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </div>
                ))}
              </div>
              
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => setShowUpgrade(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Upgrade Plan
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Update Payment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Usage Statistics */}
      {usage && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Usage This Month</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Calls Usage */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-center mb-3">
                <div className="text-sm font-medium text-gray-900">Calls Processed</div>
                <div className="text-sm text-gray-600">
                  {usage.currentPeriod.calls} / {usage.limits.calls === -1 ? '∞' : usage.limits.calls.toLocaleString()}
                </div>
              </div>
              
              {usage.limits.calls !== -1 && (
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full ${getUsageColor(getUsagePercentage(usage.currentPeriod.calls, usage.limits.calls))}`}
                    style={{ width: `${getUsagePercentage(usage.currentPeriod.calls, usage.limits.calls)}%` }}
                  ></div>
                </div>
              )}
              
              <div className="text-2xl font-bold text-gray-900">
                {usage.currentPeriod.calls.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">
                ${usage.costs.calls.toFixed(2)} this month
              </div>
            </div>

            {/* Minutes Usage */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-center mb-3">
                <div className="text-sm font-medium text-gray-900">Call Minutes</div>
                <div className="text-sm text-gray-600">
                  {usage.currentPeriod.minutes} / {usage.limits.minutes === -1 ? '∞' : usage.limits.minutes.toLocaleString()}
                </div>
              </div>
              
              {usage.limits.minutes !== -1 && (
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full ${getUsageColor(getUsagePercentage(usage.currentPeriod.minutes, usage.limits.minutes))}`}
                    style={{ width: `${getUsagePercentage(usage.currentPeriod.minutes, usage.limits.minutes)}%` }}
                  ></div>
                </div>
              )}
              
              <div className="text-2xl font-bold text-gray-900">
                {usage.currentPeriod.minutes.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">
                ${usage.costs.minutes.toFixed(2)} this month
              </div>
            </div>

            {/* Transcription Usage */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-center mb-3">
                <div className="text-sm font-medium text-gray-900">Transcription Hours</div>
                <div className="text-sm text-gray-600">
                  {usage.currentPeriod.transcriptionHours} / {usage.limits.transcriptionHours === -1 ? '∞' : usage.limits.transcriptionHours}
                </div>
              </div>
              
              {usage.limits.transcriptionHours !== -1 && (
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full ${getUsageColor(getUsagePercentage(usage.currentPeriod.transcriptionHours, usage.limits.transcriptionHours))}`}
                    style={{ width: `${getUsagePercentage(usage.currentPeriod.transcriptionHours, usage.limits.transcriptionHours)}%` }}
                  ></div>
                </div>
              )}
              
              <div className="text-2xl font-bold text-gray-900">
                {usage.currentPeriod.transcriptionHours.toFixed(1)}h
              </div>
              <div className="text-sm text-gray-500">
                ${usage.costs.transcription.toFixed(2)} this month
              </div>
            </div>

            {/* Storage Usage */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-center mb-3">
                <div className="text-sm font-medium text-gray-900">Storage Used</div>
                <div className="text-sm text-gray-600">
                  {formatStorage(usage.currentPeriod.storage)} / {formatStorage(usage.limits.storage)}
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full ${getUsageColor(getUsagePercentage(usage.currentPeriod.storage, usage.limits.storage))}`}
                  style={{ width: `${getUsagePercentage(usage.currentPeriod.storage, usage.limits.storage)}%` }}
                ></div>
              </div>
              
              <div className="text-2xl font-bold text-gray-900">
                {formatStorage(usage.currentPeriod.storage)}
              </div>
              <div className="text-sm text-gray-500">
                ${usage.costs.storage.toFixed(2)} this month
              </div>
            </div>
          </div>

          {/* Total Cost */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-lg font-medium text-gray-900">Total Usage Cost</div>
                <div className="text-sm text-gray-600">Additional charges beyond base plan</div>
              </div>
              <div className="text-3xl font-bold text-blue-600">
                ${usage.costs.total.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan Upgrade Modal */}
      {showUpgrade && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Choose Your Plan</h3>
                <button
                  onClick={() => setShowUpgrade(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(PLAN_FEATURES).map(([key, plan]) => (
                  <div
                    key={key}
                    className={`border-2 rounded-lg p-6 ${
                      billing?.plan === key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <h4 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h4>
                      <div className="text-3xl font-bold text-blue-600 mb-4">
                        ${plan.price}<span className="text-sm text-gray-600">/month</span>
                      </div>
                      
                      <div className="space-y-2 mb-6">
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-center text-sm text-gray-600">
                            <svg className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {feature}
                          </div>
                        ))}
                      </div>

                      <button
                        disabled={billing?.plan === key}
                        className={`w-full py-2 px-4 rounded-md font-medium ${
                          billing?.plan === key
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {billing?.plan === key ? 'Current Plan' : 'Upgrade'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}