'use client'

import { useEffect, useRef } from 'react'

interface InertiaScrollOptions {
  friction?: number
  threshold?: number
  enabled?: boolean
}

export function useInertiaScroll({
  friction = 0.92,
  threshold = 1,
  enabled = true
}: InertiaScrollOptions = {}) {
  const isScrolling = useRef(false)
  const velocity = useRef(0)
  const lastY = useRef(0)
  const lastTime = useRef(0)
  const animationId = useRef<number>()

  useEffect(() => {
    if (!enabled) return

    let isScrollingTimeout: NodeJS.Timeout

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      
      const now = Date.now()
      const deltaTime = now - lastTime.current
      const deltaY = e.deltaY
      
      // Calculate velocity
      if (deltaTime > 0) {
        velocity.current = deltaY / deltaTime * 16 // Normalize to 60fps
      }
      
      lastTime.current = now
      
      // Start smooth scrolling
      if (!isScrolling.current) {
        isScrolling.current = true
        smoothScroll()
      }
      
      // Reset scrolling timeout
      clearTimeout(isScrollingTimeout)
      isScrollingTimeout = setTimeout(() => {
        isScrolling.current = false
      }, 100)
    }

    const smoothScroll = () => {
      if (Math.abs(velocity.current) < threshold) {
        isScrolling.current = false
        return
      }

      // Apply momentum scrolling
      window.scrollBy(0, velocity.current)
      velocity.current *= friction

      animationId.current = requestAnimationFrame(smoothScroll)
    }

    // Add passive: false to allow preventDefault
    window.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      window.removeEventListener('wheel', handleWheel)
      if (animationId.current) {
        cancelAnimationFrame(animationId.current)
      }
      clearTimeout(isScrollingTimeout)
    }
  }, [friction, threshold, enabled])

  const scrollTo = (targetY: number, duration = 1000) => {
    const startY = window.scrollY
    const distance = targetY - startY
    const startTime = Date.now()

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

    const animateScroll = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutCubic(progress)

      window.scrollTo(0, startY + distance * easedProgress)

      if (progress < 1) {
        requestAnimationFrame(animateScroll)
      }
    }

    requestAnimationFrame(animateScroll)
  }

  return { scrollTo }
}