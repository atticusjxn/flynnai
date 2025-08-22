'use client'

import { Phone, Mic, Mail, Calendar, Shield, Zap } from 'lucide-react'

const features = [
  {
    icon: Phone,
    title: "Universal Phone Integration",
    description: "Works with any phone system - Twilio, RingCentral, or simple call forwarding. No complex setup required."
  },
  {
    icon: Mic,
    title: "Real-time Call Processing", 
    description: "Advanced AI listens and transcribes your calls live, extracting appointment details as conversations happen."
  },
  {
    icon: Mail,
    title: "Instant Email Delivery",
    description: "Get comprehensive appointment summaries, contact cards, and calendar files in your inbox within 2 minutes."
  },
  {
    icon: Calendar,
    title: "Perfect Calendar Integration",
    description: "Pre-formatted .ics files work with any calendar app. One-click to add appointments to your schedule."
  },
  {
    icon: Shield,
    title: "Privacy & Compliance",
    description: "Bank-level security with automatic consent handling and state-by-state recording compliance."
  },
  {
    icon: Zap,
    title: "Smart Call Detection",
    description: "Only processes appointment-related calls. Filters out spam, wrong numbers, and non-business conversations."
  }
]

export function FeaturesSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need to capture every opportunity
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered system works seamlessly in the background, turning your phone 
              into a powerful appointment booking machine.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div 
                  key={index}
                  className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="mt-16 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Stop losing customers to missed calls
            </h3>
            <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
              Studies show that 27% of potential customers hang up if calls aren't answered. 
              With AutoCalendar, every call becomes an opportunity, even when you're busy.
            </p>
            <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Zero missed appointments</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Automatic follow-up</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Professional communication</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}