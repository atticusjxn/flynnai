'use client'

import { Phone, Headphones, Brain, Mail } from 'lucide-react'

const steps = [
  {
    icon: Phone,
    number: "01",
    title: "Connect Your Phone",
    description: "Link your business phone number in under 2 minutes. Works with any provider or phone system.",
    details: ["Twilio integration", "RingCentral support", "Call forwarding setup", "Number verification"]
  },
  {
    icon: Headphones,
    number: "02", 
    title: "AI Listens Live",
    description: "Our advanced AI transcribes calls in real-time, understanding context and conversation flow.",
    details: ["Real-time transcription", "Natural language processing", "Privacy-first approach", "Consent handling"]
  },
  {
    icon: Brain,
    number: "03",
    title: "Smart Extraction",
    description: "GPT-4 identifies appointment details with 95%+ accuracy, even from casual conversations.",
    details: ["Date & time parsing", "Contact information", "Service details", "Location extraction"]
  },
  {
    icon: Mail,
    number: "04",
    title: "Instant Delivery",
    description: "Complete appointment package delivered to your email within 2 minutes of call ending.",
    details: ["Call transcription", "Appointment summary", "Calendar file (.ics)", "Contact card"]
  }
]

export function HowItWorksSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How it works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Four simple steps to never miss another appointment. 
              Our AI handles everything automatically in the background.
            </p>
          </div>

          <div className="space-y-12">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isEven = index % 2 === 1
              
              return (
                <div 
                  key={index}
                  className={`flex flex-col ${isEven ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-8 lg:gap-16`}
                >
                  <div className="lg:w-1/2">
                    <div className="bg-white rounded-2xl p-8 shadow-lg">
                      <div className="flex items-center mb-6">
                        <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mr-4">
                          <Icon className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-blue-600 mb-1">
                            STEP {step.number}
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900">
                            {step.title}
                          </h3>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                        {step.description}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {step.details.map((detail, detailIndex) => (
                          <div key={detailIndex} className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-gray-600">{detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="lg:w-1/2">
                    <div className="relative">
                      <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl aspect-video flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <Icon className="w-8 h-8" />
                          </div>
                          <p className="text-sm">Demo visualization</p>
                        </div>
                      </div>
                      
                      {index < steps.length - 1 && (
                        <div className="hidden lg:block absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                          <div className="w-px h-16 bg-gradient-to-b from-blue-300 to-transparent"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-16 text-center">
            <div className="bg-white rounded-xl p-8 shadow-lg max-w-2xl mx-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                The result?
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Every customer call automatically becomes a perfectly formatted appointment 
                in your calendar. No manual entry, no missed details, no lost opportunities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}