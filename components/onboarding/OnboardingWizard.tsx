'use client'

import { useState } from 'react'
import { EmailSignup } from './EmailSignup'
import { PhoneVerification } from './PhoneVerification'
import { PhoneIntegration } from './PhoneIntegration'
import { NotificationPreferences } from './NotificationPreferences'
import { JobPipelineSetup } from './JobPipelineSetup'
import { TestCallSetup } from './TestCallSetup'
import { OnboardingComplete } from './OnboardingComplete'

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const [onboardingData, setOnboardingData] = useState({
    email: {},
    verification: {},
    phone: {},
    notifications: {},
    pipeline: {},
    test: {}
  })

  const steps = [
    { name: 'Email Signup', component: EmailSignup },
    { name: 'Phone Verification', component: PhoneVerification },
    { name: 'Phone Integration', component: PhoneIntegration },
    { name: 'Notifications', component: NotificationPreferences },
    { name: 'Pipeline Setup', component: JobPipelineSetup },
    { name: 'Test Call', component: TestCallSetup },
    { name: 'Complete', component: OnboardingComplete }
  ]

  const handleNext = (stepData: any) => {
    const stepKeys = ['email', 'verification', 'phone', 'notifications', 'pipeline', 'test', 'complete']
    const stepKey = stepKeys[currentStep]
    setOnboardingData(prev => ({
      ...prev,
      [stepKey]: stepData
    }))
    setCurrentStep(prev => prev + 1)
  }

  const handleBack = () => {
    setCurrentStep(prev => prev - 1)
  }

  const CurrentStepComponent = steps[currentStep].component

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Progress bar */}
        <div className="max-w-5xl mx-auto mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300
                      ${index < currentStep 
                        ? 'bg-green-500 text-white shadow-lg' 
                        : index === currentStep
                        ? 'bg-blue-600 text-white shadow-lg animate-pulse'
                        : 'bg-gray-200 text-gray-500'
                      }
                    `}>
                      {index < currentStep ? '✓' : index + 1}
                    </div>
                    <div className={`mt-2 text-xs font-medium text-center max-w-20 ${
                      index <= currentStep ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {step.name}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`
                      w-8 sm:w-16 h-1 mx-2 sm:mx-4 transition-all duration-300
                      ${index < currentStep 
                        ? 'bg-green-500' 
                        : 'bg-gray-200'
                      }
                    `} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step content */}
        <div className="max-w-4xl mx-auto">
          <CurrentStepComponent
            onNext={handleNext}
            onBack={currentStep > 0 ? handleBack : undefined}
            data={onboardingData}
            currentStep={currentStep}
          />
        </div>
      </div>
    </div>
  )
}