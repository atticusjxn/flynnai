'use client'

import { motion } from 'framer-motion'
import { glitchVariants } from '@/lib/animations'
import { useState } from 'react'

interface GlitchTextProps {
  children: React.ReactNode
  className?: string
  trigger?: 'hover' | 'auto'
  intensity?: 'subtle' | 'normal' | 'strong'
}

export function GlitchText({ 
  children, 
  className = '',
  trigger = 'hover',
  intensity = 'normal'
}: GlitchTextProps) {
  const [isGlitching, setIsGlitching] = useState(trigger === 'auto')

  const getGlitchIntensity = () => {
    const baseColors = intensity === 'subtle' 
      ? ['#ff00ff', '#00ffff'] 
      : intensity === 'strong'
      ? ['#ff0000', '#00ff00', '#0000ff']
      : ['#ff00ff', '#00ffff']

    return {
      textShadow: [
        "0 0 0 transparent",
        `2px 0 ${baseColors[0]}, -2px 0 ${baseColors[1]}`,
        "0 0 0 transparent",
        `1px 0 ${baseColors[0]}, -1px 0 ${baseColors[1]}`,
        "0 0 0 transparent"
      ],
      transform: [
        "translate3d(0, 0, 0)",
        "translate3d(2px, 0, 0)",
        "translate3d(-2px, 0, 0)",
        "translate3d(1px, 0, 0)",
        "translate3d(0, 0, 0)"
      ],
      transition: {
        duration: intensity === 'subtle' ? 0.2 : intensity === 'strong' ? 0.4 : 0.3,
        times: [0, 0.25, 0.5, 0.75, 1],
        repeat: trigger === 'auto' ? Infinity : 2,
        repeatDelay: trigger === 'auto' ? 4 : 0
      }
    }
  }

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      setIsGlitching(true)
    }
  }

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      setIsGlitching(false)
    }
  }

  return (
    <motion.div
      className={`inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      animate={isGlitching ? getGlitchIntensity() : { 
        textShadow: "0 0 0 transparent",
        transform: "translate3d(0, 0, 0)"
      }}
    >
      {children}
    </motion.div>
  )
}