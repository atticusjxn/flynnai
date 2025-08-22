'use client'

import { ArrowRight, Phone } from 'lucide-react'
import Link from 'next/link'

export function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Ready to never miss another appointment?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            Join hundreds of service professionals who've eliminated missed appointments 
            and boosted their revenue with Flynn.ai.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link href="/auth/signup">
              <button className="bg-white text-blue-600 hover:bg-gray-50 font-semibold py-4 px-8 rounded-lg transition-colors duration-200 flex items-center space-x-2 shadow-lg">
                <Phone className="w-5 h-5" />
                <span>Start Free Trial</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <button className="text-white border-2 border-white hover:bg-white hover:text-blue-600 font-semibold py-4 px-8 rounded-lg transition-colors duration-200">
              Schedule Demo
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto text-center">
            <div className="text-blue-100">
              <div className="text-2xl font-bold text-white">✓</div>
              <div className="text-sm">10 free appointment calls</div>
            </div>
            <div className="text-blue-100">
              <div className="text-2xl font-bold text-white">✓</div>
              <div className="text-sm">5-minute setup</div>
            </div>
            <div className="text-blue-100">
              <div className="text-2xl font-bold text-white">✓</div>
              <div className="text-sm">Cancel anytime</div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-blue-500">
            <p className="text-blue-200 text-sm">
              Questions? Contact us at{' '}
              <a href="mailto:support@flynn.ai" className="text-white underline hover:no-underline">
                support@flynn.ai
              </a>
              {' '}or call{' '}
              <a href="tel:+1-555-FLYNN" className="text-white underline hover:no-underline">
                +1 (555) FLYNN
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}