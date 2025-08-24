'use client'

import { motion } from 'framer-motion'
import { buttonHover } from '@/lib/animations'

interface AnimatedButtonProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  type?: 'button' | 'submit'
}

export function AnimatedButton({
  children,
  className = '',
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button'
}: AnimatedButtonProps) {
  const baseClasses = 'relative overflow-hidden font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center'
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white focus:ring-blue-500 shadow-lg',
    secondary: 'bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 focus:ring-gray-500',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-600 hover:text-gray-800 focus:ring-gray-500'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }

  const disabledClasses = 'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'

  return (
    <motion.button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : buttonHover}
      whileTap={disabled ? {} : { scale: 0.98 }}
      transition={{
        duration: 0.2,
        ease: "easeInOut"
      }}
    >
      <motion.span
        className="relative z-10 flex items-center justify-center space-x-2"
        initial={false}
      >
        {children}
      </motion.span>
      
      {/* Animated background glow for primary variant */}
      {variant === 'primary' && !disabled && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0"
          whileHover={{ opacity: 0.2 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.button>
  )
}