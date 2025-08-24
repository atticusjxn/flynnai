'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Notification } from '@/lib/notifications'

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  isConnected: boolean
  error: string | null
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearAll: () => void
  playNotificationSound: (priority: string) => void
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize notification sound
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/sounds/notification.mp3')
      audioRef.current.volume = 0.6
    }
  }, [])

  const playNotificationSound = useCallback((priority: string) => {
    if (audioRef.current && 'permissions' in navigator) {
      // Only play sound if user has granted permission
      navigator.permissions.query({ name: 'notifications' as any }).then(result => {
        if (result.state === 'granted') {
          audioRef.current?.play().catch(error => {
            console.log('Could not play notification sound:', error)
          })
        }
      }).catch(() => {
        // Fallback: just try to play
        audioRef.current?.play().catch(() => {})
      })
    }
  }, [])

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    )

    // Mark as read on server
    fetch(`/api/notifications/${id}/read`, {
      method: 'POST'
    }).catch(error => {
      console.error('Failed to mark notification as read:', error)
    })
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )

    // Mark all as read on server
    fetch('/api/notifications/read-all', {
      method: 'POST'
    }).catch(error => {
      console.error('Failed to mark all notifications as read:', error)
    })
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])

    // Clear all on server
    fetch('/api/notifications/clear', {
      method: 'DELETE'
    }).catch(error => {
      console.error('Failed to clear all notifications:', error)
    })
  }, [])

  // Set up Server-Sent Events connection
  useEffect(() => {
    let reconnectTimer: NodeJS.Timeout

    const connect = () => {
      try {
        console.log('🔌 Connecting to notification stream...')
        
        eventSourceRef.current = new EventSource('/api/notifications/stream')
        
        eventSourceRef.current.onopen = () => {
          console.log('✅ Notification stream connected')
          setIsConnected(true)
          setError(null)
        }

        eventSourceRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            
            switch (data.type) {
              case 'connected':
                console.log('📢 Notification system ready')
                break
                
              case 'backlog':
                console.log(`📦 Received ${data.count} pending notifications`)
                if (data.notifications && Array.isArray(data.notifications)) {
                  setNotifications(prev => [...data.notifications, ...prev])
                }
                break
                
              case 'notification':
                console.log('🔔 New notification:', data.notification.title)
                const notification = data.notification as Notification
                
                setNotifications(prev => [notification, ...prev])
                
                // Play sound for new notifications
                playNotificationSound(notification.priority)
                
                // Show browser notification if permitted
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification(notification.title, {
                    body: notification.message,
                    icon: '/icon-192.png',
                    badge: '/icon-192.png',
                    tag: notification.id,
                    renotify: false,
                    requireInteraction: notification.priority === 'URGENT'
                  })
                }
                break
                
              case 'ping':
                // Keep-alive ping, no action needed
                break
                
              default:
                console.log('Unknown notification type:', data.type)
            }
            
          } catch (error) {
            console.error('Failed to parse notification data:', error)
          }
        }

        eventSourceRef.current.onerror = (event) => {
          console.error('❌ Notification stream error:', event)
          setIsConnected(false)
          setError('Connection lost. Attempting to reconnect...')
          
          eventSourceRef.current?.close()
          
          // Reconnect after 5 seconds
          reconnectTimer = setTimeout(connect, 5000)
        }

      } catch (error) {
        console.error('Failed to establish notification connection:', error)
        setError('Failed to connect to notifications')
        setIsConnected(false)
        
        // Retry connection after 10 seconds
        reconnectTimer = setTimeout(connect, 10000)
      }
    }

    // Initial connection
    connect()

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission)
      })
    }

    // Cleanup
    return () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
      }
      
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      
      setIsConnected(false)
    }
  }, [playNotificationSound])

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isConnected && !eventSourceRef.current) {
        // Reconnect when page becomes visible again
        console.log('🔄 Page visible, reconnecting notifications...')
        // The effect above will handle reconnection
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isConnected])

  const unreadCount = notifications.filter(n => !n.read).length

  return {
    notifications,
    unreadCount,
    isConnected,
    error,
    markAsRead,
    markAllAsRead,
    clearAll,
    playNotificationSound
  }
}