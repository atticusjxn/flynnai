'use client'

import { Check, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const plans = [
  {
    name: "Free Trial",
    price: "$0",
    period: "first month",
    description: "Try everything risk-free",
    features: [
      "Complete 30-day free trial",
      "Unlimited call processing",
      "Job scheduler & pipeline",
      "Email & in-app notifications",
      "Mobile access",
      "Customer history tracking"
    ],
    cta: "Start Free Trial",
    popular: false,
    highlight: "Most Popular Trial"
  },
  {
    name: "Monthly Plan",
    price: "$15",
    period: "per month",
    description: "Complete job management solution",
    features: [
      "Unlimited call processing",
      "Advanced job scheduler",
      "Drag & drop pipeline management",
      "Email + in-app notifications",
      "Customer history & notes",
      "Mobile app access",
      "Calendar integration",
      "Basic invoicing",
      "Priority support"
    ],
    cta: "Choose Monthly",
    popular: true,
    highlight: "Best Value"
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "for teams",
    description: "Advanced features for growing businesses",
    features: [
      "Everything in Monthly Plan",
      "Multi-user team access",
      "Advanced analytics & reporting",
      "Custom integrations",
      "API access",
      "White-label options",
      "Dedicated account manager",
      "SLA guarantees",
      "Custom training"
    ],
    cta: "Contact Sales",
    popular: false,
    highlight: "Enterprise"
  }
]

export function PricingSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Only pay for successful appointment calls. No monthly fees, 
              no hidden costs, no commitment required.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {plans.map((plan, index) => (
              <div 
                key={index}
                className={`relative bg-white rounded-2xl shadow-lg border-2 p-8 ${
                  plan.popular 
                    ? 'border-blue-500 ring-4 ring-blue-50' 
                    : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-600 ml-2">
                      {plan.period}
                    </span>
                  </div>
                  <p className="text-gray-600">
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/auth/signup" className="block">
                  <button 
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2 ${
                      plan.popular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    }`}
                  >
                    <span>{plan.cta}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Why businesses love our simple pricing
              </h3>
              
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="text-3xl font-bold text-green-600 mb-2">30 days</div>
                    <div className="text-sm text-gray-600">
                      Completely free trial period
                    </div>
                  </div>
                </div>
                <div>
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="text-3xl font-bold text-blue-600 mb-2">Unlimited</div>
                    <div className="text-sm text-gray-600">
                      Process as many calls as you need
                    </div>
                  </div>
                </div>
                <div>
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="text-3xl font-bold text-purple-600 mb-2">$15</div>
                    <div className="text-sm text-gray-600">
                      Simple monthly pricing after trial
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-center text-gray-600 mt-6">
                Start your free trial today and see why 2,000+ businesses trust AutoCalendar 
                to manage their customer calls and job scheduling.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}