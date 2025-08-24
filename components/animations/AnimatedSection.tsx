'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { fadeIn, slideUp } from '@/lib/animations'

interface AnimatedSectionProps {
  children: React.ReactNode
  className?: string
  animation?: 'fadeIn' | 'slideUp'
  delay?: number
}

export function AnimatedSection({ 
  children, 
  className = '', 
  animation = 'fadeIn',
  delay = 0 
}: AnimatedSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  
  const variants = animation === 'slideUp' ? slideUp : fadeIn
  
  return (
    <motion.div
      ref={ref}
      className={className}
      variants={variants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  )
}