'use client'

import { HeroSection } from '@/components/landing/HeroSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { HowItWorksSection } from '@/components/landing/HowItWorksSection'
import { PricingSection } from '@/components/landing/PricingSection'
import { TrustSection } from '@/components/landing/TrustSection'
import { CTASection } from '@/components/landing/CTASection'
import { ScrollProgress } from '@/components/animations/ScrollProgress'
import { useInertiaScroll } from '@/hooks/useInertiaScroll'

export default function Home() {
  // Enable smooth inertia scrolling
  useInertiaScroll({
    friction: 0.92,
    threshold: 0.5,
    enabled: true
  })

  return (
    <main>
      <ScrollProgress />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <TrustSection />
      <CTASection />
    </main>
  )
}