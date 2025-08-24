import { Variants } from 'framer-motion'

// Animation variants for consistent motion design
export const fadeIn: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
}

export const slideUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 60 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.645, 0.045, 0.355, 1]
    }
  }
}

export const slideRight: Variants = {
  hidden: { 
    opacity: 0, 
    x: -60 
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.7,
      ease: "easeOut"
    }
  }
}

export const scaleIn: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8 
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
}

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

export const staggerItem: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
}

// Hover effects
export const buttonHover = {
  scale: 1.02,
  transition: {
    duration: 0.2,
    ease: "easeInOut"
  }
}

export const cardHover = {
  y: -8,
  scale: 1.02,
  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  transition: {
    duration: 0.3,
    ease: "easeOut"
  }
}

// Tilt effect
export const tiltHover = {
  rotateX: 5,
  rotateY: 5,
  scale: 1.02,
  transition: {
    duration: 0.3,
    ease: "easeOut"
  }
}

// Glitch effect keyframes
export const glitchVariants: Variants = {
  normal: {
    textShadow: "0 0 0 transparent",
    transform: "translate3d(0, 0, 0)"
  },
  glitch: {
    textShadow: [
      "0 0 0 transparent",
      "2px 0 #ff00ff, -2px 0 #00ffff",
      "0 0 0 transparent",
      "1px 0 #ff00ff, -1px 0 #00ffff",
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
      duration: 0.3,
      times: [0, 0.25, 0.5, 0.75, 1],
      repeat: Infinity,
      repeatDelay: 3
    }
  }
}

// Loading animations
export const spinnerVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      ease: "linear",
      repeat: Infinity
    }
  }
}

export const pulseVariants: Variants = {
  animate: {
    scale: [1, 1.1, 1],
    opacity: [1, 0.7, 1],
    transition: {
      duration: 2,
      ease: "easeInOut",
      repeat: Infinity
    }
  }
}

// Page transitions
export const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.5
}

export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    x: "-100vw"
  },
  in: {
    opacity: 1,
    x: 0
  },
  out: {
    opacity: 0,
    x: "100vw"
  }
}