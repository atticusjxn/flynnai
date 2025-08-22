'use client'

import { Shield, Lock, Award, Users, Zap, HeadphonesIcon } from 'lucide-react'

const trustIndicators = [
  {
    icon: Shield,
    title: "Bank-Level Security",
    description: "SOC 2 Type II compliant with end-to-end encryption"
  },
  {
    icon: Lock,
    title: "Privacy First",
    description: "Your calls and data are never stored longer than necessary"
  },
  {
    icon: Award,
    title: "95%+ Accuracy",
    description: "Industry-leading appointment extraction accuracy"
  }
]

const stats = [
  { number: "10,000+", label: "Appointments Processed" },
  { number: "500+", label: "Happy Businesses" },
  { number: "99.9%", label: "Uptime Guarantee" },
  { number: "2 min", label: "Average Processing Time" }
]

const testimonials = [
  {
    quote: "Since using Flynn.ai, I've captured 40% more jobs from phone calls. The scheduler keeps my whole team organized and we never double-book anymore.",
    author: "Mike Rodriguez",
    role: "Rodriguez Plumbing Services",
    location: "Austin, TX",
    business: "Plumbing",
    metric: "+40% more jobs captured"
  },
  {
    quote: "Game changer for our cleaning business. Customers call while I'm working, and by the time I check my phone, the job is already in my scheduler with all the details.",
    author: "Sarah Johnson",
    role: "Spotless Cleaning Co.",
    location: "Denver, CO", 
    business: "Cleaning",
    metric: "Zero missed opportunities"
  },
  {
    quote: "The job pipeline feature alone is worth the subscription. I can see exactly where each project stands and my crew knows what's coming up. Total game changer.",
    author: "Tom Anderson",
    role: "Anderson Contracting",
    location: "Phoenix, AZ",
    business: "Contracting",
    metric: "20% faster project completion"
  },
  {
    quote: "I was spending 2 hours a day manually entering appointment details. Now it's all automatic and I can focus on actual patient care instead of paperwork.",
    author: "Dr. Jennifer Walsh",
    role: "Walsh Family Dentistry",
    location: "Miami, FL",
    business: "Healthcare",
    metric: "Saves 2 hours daily"
  },
  {
    quote: "The email summaries are perfect - I get all the details within minutes and can prepare for each job. My customers are impressed by how organized we are.",
    author: "Carlos Mendez",
    role: "Elite Landscaping",
    location: "San Diego, CA",
    business: "Landscaping",
    metric: "95% customer satisfaction"
  },
  {
    quote: "Best ROI of any business tool I've used. Paid for itself in the first week by capturing jobs I would have missed. The mobile access is perfect for field work.",
    author: "David Kim",
    role: "Kim's Auto Repair",
    location: "Seattle, WA",
    business: "Auto Repair",
    metric: "ROI in first week"
  }
]

export function TrustSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          
          {/* Trust Indicators */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {trustIndicators.map((indicator, index) => {
              const Icon = indicator.icon
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {indicator.title}
                  </h3>
                  <p className="text-gray-600">
                    {indicator.description}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Stats */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {stats.map((stat, index) => (
                <div key={index}>
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {stat.number}
                  </div>
                  <div className="text-gray-600">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonials */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Trusted by 2,000+ service professionals
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.slice(0, 6).map((testimonial, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                          </svg>
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
                        {testimonial.business}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed mb-3">
                      "{testimonial.quote}"
                    </p>
                    <div className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">
                      📈 {testimonial.metric}
                    </div>
                  </div>
                  <div className="border-t pt-3">
                    <div className="font-semibold text-gray-900 text-sm">
                      {testimonial.author}
                    </div>
                    <div className="text-xs text-gray-600">
                      {testimonial.role}
                    </div>
                    <div className="text-xs text-gray-500">
                      {testimonial.location}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Business type badges */}
            <div className="mt-12 text-center">
              <p className="text-gray-600 mb-6">Trusted by businesses across industries:</p>
              <div className="flex flex-wrap justify-center gap-3">
                {['Plumbing', 'HVAC', 'Cleaning', 'Contracting', 'Healthcare', 'Auto Repair', 'Landscaping', 'Legal', 'Consulting'].map((industry) => (
                  <span key={industry} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                    {industry}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Compliance badges */}
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              Compliance & Certifications
            </h3>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="flex items-center space-x-2">
                <Shield className="w-6 h-6" />
                <span className="font-medium">SOC 2 Type II</span>
              </div>
              <div className="flex items-center space-x-2">
                <Lock className="w-6 h-6" />
                <span className="font-medium">GDPR Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-6 h-6" />
                <span className="font-medium">HIPAA Ready</span>
              </div>
              <div className="flex items-center space-x-2">
                <HeadphonesIcon className="w-6 h-6" />
                <span className="font-medium">Call Recording Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}