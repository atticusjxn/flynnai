'use client'

import { useState, useEffect } from 'react'
import { Phone, Zap, Calendar, Mail, CheckCircle } from 'lucide-react'

const demoSteps = [
  {
    id: 1,
    title: "Customer calls",
    description: "John calls about plumbing repair",
    icon: Phone,
    color: "from-blue-500 to-blue-600",
    delay: 0
  },
  {
    id: 2,
    title: "AI processes call",
    description: "Extracts appointment details in real-time",
    icon: Zap,
    color: "from-purple-500 to-purple-600",
    delay: 2000
  },
  {
    id: 3,
    title: "Job appears in scheduler",
    description: "Automatically added to your pipeline",
    icon: Calendar,
    color: "from-green-500 to-green-600",
    delay: 4000
  },
  {
    id: 4,
    title: "Email sent",
    description: "Summary delivered to your inbox",
    icon: Mail,
    color: "from-orange-500 to-orange-600",
    delay: 6000
  }
]

export function AnimatedDemo() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % demoSteps.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [isPlaying])

  const togglePlayback = () => {
    setIsPlaying(!isPlaying)
  }

  return (
    <div className="relative">
      {/* Main demo container */}
      <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-2xl">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-white mb-2">
            See it in action
          </h3>
          <p className="text-blue-200">
            Watch how a customer call becomes a scheduled job
          </p>
        </div>

        {/* Demo visualization */}
        <div className="relative h-80 mb-8">
          {/* Background phone mockup */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-64 bg-gray-900 rounded-2xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-6 bg-gray-800 rounded-t-2xl flex items-center justify-center">
                <div className="w-16 h-1 bg-gray-600 rounded-full"></div>
              </div>
              <div className="p-4 pt-8 h-full flex flex-col justify-center">
                <div className="text-center text-white">
                  <Phone className={`w-12 h-12 mx-auto mb-4 ${currentStep === 0 ? 'animate-bounce text-blue-400' : 'text-gray-500'}`} />
                  <div className="text-sm">
                    {currentStep === 0 && (
                      <div className="space-y-2">
                        <div className="bg-blue-500 text-white p-2 rounded-lg text-xs">
                          "Hi, I need a plumber for Tuesday at 2 PM..."
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-xs">Recording</span>
                        </div>
                      </div>
                    )}
                    {currentStep === 1 && (
                      <div className="space-y-2">
                        <Zap className="w-8 h-8 mx-auto text-purple-400 animate-pulse" />
                        <div className="text-xs text-purple-300">Processing with AI...</div>
                        <div className="bg-purple-500/20 p-2 rounded text-xs">
                          Extracting: Name, Date, Service
                        </div>
                      </div>
                    )}
                    {currentStep >= 2 && (
                      <div className="space-y-2">
                        <CheckCircle className="w-8 h-8 mx-auto text-green-400" />
                        <div className="text-xs text-green-300">Call processed!</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Animated elements */}
          {currentStep >= 2 && (
            <>
              {/* Arrow to scheduler */}
              <div className="absolute top-1/2 left-3/4 transform -translate-y-1/2 animate-pulse">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-0.5 bg-green-400"></div>
                  <div className="w-0 h-0 border-l-4 border-l-green-400 border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
                </div>
              </div>

              {/* Scheduler preview */}
              <div className="absolute top-4 right-0 bg-white rounded-lg shadow-lg p-3 w-48 animate-slide-in">
                <div className="text-xs font-semibold text-gray-700 mb-2">Today's Jobs</div>
                <div className="space-y-2">
                  <div className="bg-yellow-100 border-l-4 border-yellow-500 p-2 rounded text-xs">
                    <div className="font-medium text-gray-800">John Smith</div>
                    <div className="text-gray-600">Plumbing repair • 2:00 PM</div>
                    <div className="text-xs text-yellow-600 font-medium">QUOTING</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Email notification */}
          {currentStep >= 3 && (
            <div className="absolute bottom-4 right-0 bg-white rounded-lg shadow-lg p-3 w-52 animate-slide-in-delay">
              <div className="flex items-start space-x-2">
                <Mail className="w-4 h-4 text-blue-500 mt-0.5" />
                <div className="text-xs">
                  <div className="font-semibold text-gray-800">New Job Alert</div>
                  <div className="text-gray-600">John Smith - Plumbing repair scheduled for Tuesday 2 PM</div>
                  <div className="text-xs text-green-600 mt-1">📎 Calendar file attached</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step indicators */}
        <div className="flex justify-center space-x-4 mb-6">
          {demoSteps.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep >= index
            return (
              <div
                key={step.id}
                className={`flex flex-col items-center transition-all duration-500 ${
                  isActive ? 'opacity-100 scale-100' : 'opacity-50 scale-90'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    isActive 
                      ? `bg-gradient-to-br ${step.color} shadow-lg` 
                      : 'bg-white/20 border border-white/30'
                  }`}
                >
                  <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-white/60'}`} />
                </div>
                <div className={`text-xs text-center max-w-16 ${isActive ? 'text-white' : 'text-white/60'}`}>
                  {step.title}
                </div>
              </div>
            )
          })}
        </div>

        {/* Play/pause control */}
        <div className="text-center">
          <button
            onClick={togglePlayback}
            className="bg-white/20 hover:bg-white/30 border border-white/30 text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
          >
            {isPlaying ? 'Pause Demo' : 'Play Demo'}
          </button>
        </div>
      </div>

      {/* Floating badges */}
      <div className="absolute -top-4 -left-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-bounce">
        2 min setup
      </div>
      <div className="absolute -bottom-4 -right-4 bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
        95% accuracy
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slide-in-delay {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.5s ease-out forwards;
        }
        .animate-slide-in-delay {
          animation: slide-in-delay 0.5s ease-out 0.5s forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  )
}