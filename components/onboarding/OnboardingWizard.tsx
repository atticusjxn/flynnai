'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EmailSignup } from './EmailSignup'
import { EmailVerification } from './EmailVerification'
import { PhoneIntegration } from './PhoneIntegration'
import { NotificationPreferences } from './NotificationPreferences'
import { JobPipelineSetup } from './JobPipelineSetup'
import { TestCallSetup } from './TestCallSetup'
import { OnboardingComplete } from './OnboardingComplete'
import { ParallaxElement } from '../animations/ParallaxElement'
import { fadeIn, slideRight } from '@/lib/animations'

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
    { name: 'Email Verification', component: EmailVerification },
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Animated background elements */}
      <ParallaxElement speed={0.2} className="absolute top-10 left-10 w-64 h-64 bg-blue-200 rounded-full opacity-20 blur-3xl" />
      <ParallaxElement speed={0.4} className="absolute bottom-10 right-10 w-72 h-72 bg-purple-200 rounded-full opacity-20 blur-3xl" />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Progress bar */}
        <motion.div 
          className="max-w-5xl mx-auto mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="bg-white rounded-2xl shadow-lg p-6"
            whileHover={{ 
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" 
            }}
          >
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <motion.div 
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500
                        ${index < currentStep 
                          ? 'bg-green-500 text-white shadow-lg' 
                          : index === currentStep
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-gray-200 text-gray-500'
                        }
                      `}
                      animate={index === currentStep ? {
                        scale: [1, 1.1, 1],
                        boxShadow: [
                          "0 0 0 0 rgba(59, 130, 246, 0)",
                          "0 0 0 10px rgba(59, 130, 246, 0.2)", 
                          "0 0 0 0 rgba(59, 130, 246, 0)"
                        ]
                      } : {}}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={index < currentStep ? 'check' : 'number'}
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          transition={{ duration: 0.2 }}
                        >
                          {index < currentStep ? '✓' : index + 1}
                        </motion.span>
                      </AnimatePresence>
                    </motion.div>
                    <motion.div 
                      className={`mt-2 text-xs font-medium text-center max-w-20 transition-colors duration-300 ${
                        index <= currentStep ? 'text-blue-600' : 'text-gray-500'
                      }`}
                      animate={index === currentStep ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      {step.name}
                    </motion.div>
                  </div>
                  {index < steps.length - 1 && (
                    <motion.div 
                      className={`
                        w-8 sm:w-16 h-1 mx-2 sm:mx-4 rounded-full transition-all duration-500
                        ${index < currentStep 
                          ? 'bg-green-500' 
                          : 'bg-gray-200'
                        }
                      `}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: index < currentStep ? 1 : 0 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      style={{ originX: 0 }}
                    />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Step content */}
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ 
                duration: 0.4,
                ease: "easeInOut"
              }}
            >
              {currentStep === 0 && (
                <motion.div
                  variants={fadeIn}
                  initial="hidden"
                  animate="visible"
                >
                  <EmailSignup onNext={handleNext} />
                </motion.div>
              )}
              {currentStep === 1 && (
                <motion.div
                  variants={slideRight}
                  initial="hidden"
                  animate="visible"
                >
                  <EmailVerification onNext={handleNext} onBack={handleBack} />
                </motion.div>
              )}
              {currentStep === 2 && (
                <motion.div
                  variants={fadeIn}
                  initial="hidden"
                  animate="visible"
                >
                  <PhoneIntegration onNext={handleNext} onBack={handleBack} />
                </motion.div>
              )}
              {currentStep === 3 && (
                <motion.div
                  variants={slideRight}
                  initial="hidden"
                  animate="visible"
                >
                  <NotificationPreferences onNext={handleNext} onBack={handleBack} />
                </motion.div>
              )}
              {currentStep === 4 && (
                <motion.div
                  variants={fadeIn}
                  initial="hidden"
                  animate="visible"
                >
                  <JobPipelineSetup onNext={handleNext} onBack={handleBack} />
                </motion.div>
              )}
              {currentStep === 5 && (
                <motion.div
                  variants={slideRight}
                  initial="hidden"
                  animate="visible"
                >
                  <TestCallSetup onNext={handleNext} onBack={handleBack} />
                </motion.div>
              )}
              {currentStep === 6 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <OnboardingComplete data={onboardingData} />
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}