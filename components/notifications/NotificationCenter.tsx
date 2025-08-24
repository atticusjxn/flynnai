'use client'

import { useState, useEffect, useRef } from 'react'
import { NotificationBell } from './NotificationBell'
import { NotificationPanel } from './NotificationPanel'
import { useNotifications } from '@/hooks/useNotifications'

export function NotificationCenter() {
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [hasNewNotifications, setHasNewNotifications] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  
  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    clearAll
  } = useNotifications()

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsPanelOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Flash notification indicator for new notifications
  useEffect(() => {
    if (unreadCount > 0) {
      setHasNewNotifications(true)
      const timer = setTimeout(() => setHasNewNotifications(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [unreadCount])

  return (
    <div className="relative" ref={panelRef}>
      <NotificationBell
        unreadCount={unreadCount}
        isConnected={isConnected}
        hasNewNotifications={hasNewNotifications}
        onClick={() => setIsPanelOpen(!isPanelOpen)}
      />
      
      {isPanelOpen && (
        <NotificationPanel
          notifications={notifications}
          unreadCount={unreadCount}
          onClose={() => setIsPanelOpen(false)}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onClearAll={clearAll}
        />
      )}
    </div>
  )
}