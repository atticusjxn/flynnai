'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

interface ParallaxElementProps {
  children: React.ReactNode
  className?: string
  speed?: number
  direction?: 'up' | 'down'
}

export function ParallaxElement({
  children,
  className = '',
  speed = 0.5,
  direction = 'up'
}: ParallaxElementProps) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  })

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    direction === 'up' 
      ? [100 * speed, -100 * speed]
      : [-100 * speed, 100 * speed]
  )

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ y }}
    >
      {children}
    </motion.div>
  )
}