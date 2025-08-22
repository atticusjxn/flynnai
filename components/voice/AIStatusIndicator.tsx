'use client'

import { useState, useEffect } from 'react'
import { Brain, Wifi, WifiOff } from 'lucide-react'

interface AIStatusIndicatorProps {
  className?: string
}

export function AIStatusIndicator({ className = '' }: AIStatusIndicatorProps) {
  const [aiStatus, setAiStatus] = useState<'checking' | 'available' | 'unavailable'>('checking')
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  useEffect(() => {
    checkAIStatus()
    // Check AI status every 5 minutes
    const interval = setInterval(checkAIStatus, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const checkAIStatus = async () => {
    try {
      const response = await fetch('/api/voice/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'test' })
      })
      
      setAiStatus(response.ok ? 'available' : 'unavailable')
    } catch (error) {
      setAiStatus('unavailable')
    }
    
    setLastCheck(new Date())
  }

  const getStatusInfo = () => {
    switch (aiStatus) {
      case 'available':
        return {
          icon: Brain,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          text: 'AI Active',
          description: 'Natural language processing enabled'
        }
      case 'unavailable':
        return {
          icon: WifiOff,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          text: 'Fallback Mode',
          description: 'Using basic pattern matching'
        }
      default:
        return {
          icon: Wifi,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          text: 'Checking...',
          description: 'Testing AI connection'
        }
    }
  }

  const statusInfo = getStatusInfo()
  const Icon = statusInfo.icon

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`p-2 rounded-full ${statusInfo.bgColor}`}>
        <Icon className={`w-4 h-4 ${statusInfo.color}`} />
      </div>
      <div className="text-sm">
        <div className={`font-medium ${statusInfo.color}`}>
          {statusInfo.text}
        </div>
        <div className="text-gray-500 text-xs">
          {statusInfo.description}
        </div>
      </div>
      {lastCheck && (
        <div className="text-xs text-gray-400">
          {lastCheck.toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}