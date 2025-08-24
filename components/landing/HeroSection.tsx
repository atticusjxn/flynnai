'use client'

import { useState } from 'react'
import { Phone, ArrowRight, Play, CheckCircle, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AnimatedDemo } from './AnimatedDemo'
import { AnimatedSection } from '../animations/AnimatedSection'
import { AnimatedButton } from '../animations/AnimatedButton'
import { ParallaxElement } from '../animations/ParallaxElement'
import { staggerContainer, staggerItem, fadeIn } from '@/lib/animations'

export function HeroSection() {
  const [email, setEmail] = useState('')

  return (
    <section className="relative overflow-hidden">
      {/* Background with animated gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        <div className="absolute top-0 left-0 w-full h-full">
          <ParallaxElement speed={0.3}>
            <motion.div 
              className="absolute top-10 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </ParallaxElement>
          <ParallaxElement speed={0.5}>
            <motion.div 
              className="absolute top-10 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20"
              animate={{
                scale: [1.1, 1, 1.1],
                rotate: [360, 180, 0],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </ParallaxElement>
          <ParallaxElement speed={0.4}>
            <motion.div 
              className="absolute bottom-10 left-20 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 90, 180, 270, 360],
              }}
              transition={{
                duration: 30,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </ParallaxElement>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-20 pb-32">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div 
              className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8"
              variants={staggerItem}
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-4 h-4 text-yellow-300" />
              </motion.div>
              <span className="text-white text-sm font-medium">First month completely FREE</span>
            </motion.div>
            
            <motion.h1 
              className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight"
              variants={staggerItem}
            >
              Never miss an appointment from a{' '}
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                phone call
              </span>{' '}
              again
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-blue-100 mb-12 max-w-4xl mx-auto leading-relaxed"
              variants={staggerItem}
            >
              AI instantly transforms customer calls into organized jobs in your scheduler. 
              Get email summaries, manage your pipeline, and never lose track of opportunities.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12"
              variants={staggerItem}
            >
              <motion.div 
                className="flex items-center space-x-3 text-green-300 font-semibold"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <CheckCircle className="w-5 h-5" />
                </motion.div>
                <span>30-day free trial</span>
              </motion.div>
              <motion.div 
                className="flex items-center space-x-3 text-blue-200 font-semibold"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                >
                  <CheckCircle className="w-5 h-5" />
                </motion.div>
                <span>2-minute setup</span>
              </motion.div>
              <motion.div 
                className="flex items-center space-x-3 text-purple-200 font-semibold"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                >
                  <CheckCircle className="w-5 h-5" />
                </motion.div>
                <span>No credit card required</span>
              </motion.div>
            </motion.div>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Signup Form */}
            <AnimatedSection animation="slideUp" className="order-2 lg:order-1">
              <motion.div 
                className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20"
                whileHover={{ 
                  y: -5,
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)"
                }}
                transition={{ duration: 0.3 }}
              >
                <motion.div 
                  className="text-center mb-8"
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <motion.h3 
                    className="text-3xl font-bold text-gray-900 mb-2"
                    variants={staggerItem}
                  >
                    Start Your Free Trial
                  </motion.h3>
                  <motion.p 
                    className="text-gray-600"
                    variants={staggerItem}
                  >
                    $15/month after trial • Cancel anytime
                  </motion.p>
                </motion.div>
                
                <motion.form 
                  className="space-y-6"
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <motion.div variants={staggerItem}>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3">
                      Work Email Address
                    </label>
                    <motion.input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@business.com"
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg"
                      whileFocus={{
                        scale: 1.02,
                        boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)"
                      }}
                    />
                  </motion.div>
                  
                  <motion.div variants={staggerItem}>
                    <Link href="/onboarding" className="block">
                      <AnimatedButton 
                        variant="primary" 
                        size="lg"
                        className="w-full text-lg"
                      >
                        <span>Start Free Trial</span>
                        <ArrowRight className="w-5 h-5" />
                      </AnimatedButton>
                    </Link>
                  </motion.div>
                </motion.form>
                
                <motion.div 
                  className="mt-6 text-center"
                  variants={staggerItem}
                >
                  <p className="text-sm text-gray-500">
                    Join 2,000+ businesses already using Flynn.ai
                  </p>
                </motion.div>
              </motion.div>
            </AnimatedSection>

            {/* Animated Demo */}
            <AnimatedSection animation="slideUp" className="order-1 lg:order-2">
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <AnimatedDemo />
              </motion.div>
            </AnimatedSection>
          </div>
        </div>
      </div>

      {/* Custom styles */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </section>
  )
}