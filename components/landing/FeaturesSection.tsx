'use client'

import { Phone, Mic, Mail, Calendar, Shield, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { AnimatedSection } from '../animations/AnimatedSection'
import { TiltCard } from '../animations/TiltCard'
import { staggerContainer, staggerItem } from '@/lib/animations'

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
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need to capture every opportunity
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered system works seamlessly in the background, turning your phone 
              into a powerful appointment booking machine.
            </p>
          </AnimatedSection>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div 
                  key={index}
                  variants={staggerItem}
                >
                  <TiltCard 
                    className="bg-gray-50 rounded-xl p-6 h-full hover:bg-gradient-to-br hover:from-gray-50 hover:to-blue-50 transition-all duration-300 border border-transparent hover:border-blue-100"
                    tiltIntensity="subtle"
                  >
                    <motion.div 
                      className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4"
                      whileHover={{ 
                        scale: 1.1,
                        backgroundColor: "rgb(59 130 246 / 0.2)" 
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Icon className="w-6 h-6 text-blue-600" />
                      </motion.div>
                    </motion.div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </TiltCard>
                </motion.div>
              )
            })}
          </motion.div>

          <AnimatedSection className="mt-16">
            <motion.div 
              className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 text-center"
              whileHover={{ 
                scale: 1.02,
                boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.1)" 
              }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Stop losing customers to missed calls
              </h3>
              <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                Studies show that 27% of potential customers hang up if calls aren't answered. 
                With Flynn.ai, every call becomes an opportunity, even when you're busy.
              </p>
              <motion.div 
                className="flex flex-wrap justify-center gap-8 text-sm text-gray-600"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {[
                  { color: 'bg-green-500', text: 'Zero missed appointments' },
                  { color: 'bg-blue-500', text: 'Automatic follow-up' },
                  { color: 'bg-purple-500', text: 'Professional communication' }
                ].map((item, index) => (
                  <motion.div 
                    key={index}
                    className="flex items-center space-x-2"
                    variants={staggerItem}
                  >
                    <motion.div 
                      className={`w-2 h-2 ${item.color} rounded-full`}
                      animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [1, 0.7, 1] 
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        delay: index * 0.5 
                      }}
                    />
                    <span>{item.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}