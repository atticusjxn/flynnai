'use client'

import { motion } from 'framer-motion'
import { cardHover, tiltHover } from '@/lib/animations'

interface TiltCardProps {
  children: React.ReactNode
  className?: string
  tiltIntensity?: 'subtle' | 'normal' | 'strong'
}

export function TiltCard({ 
  children, 
  className = '',
  tiltIntensity = 'normal'
}: TiltCardProps) {
  const getTiltVariant = () => {
    switch (tiltIntensity) {
      case 'subtle':
        return {
          rotateX: 2,
          rotateY: 2,
          scale: 1.01,
          transition: { duration: 0.3, ease: "easeOut" }
        }
      case 'strong':
        return {
          rotateX: 8,
          rotateY: 8,
          scale: 1.03,
          transition: { duration: 0.3, ease: "easeOut" }
        }
      default:
        return tiltHover
    }
  }

  return (
    <motion.div
      className={`transform-gpu ${className}`}
      whileHover={getTiltVariant()}
      style={{
        perspective: 1000,
        transformStyle: 'preserve-3d'
      }}
    >
      {children}
    </motion.div>
  )
}