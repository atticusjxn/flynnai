'use client'

import { format } from 'date-fns'
import { NotificationItem } from './NotificationItem'
import { Notification, NotificationPriority } from '@/lib/notifications'

interface NotificationPanelProps {
  notifications: Notification[]
  unreadCount: number
  onClose: () => void
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onClearAll: () => void
}

export function NotificationPanel({
  notifications,
  unreadCount,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll
}: NotificationPanelProps) {
  const recentNotifications = notifications.slice(0, 50) // Show last 50
  
  const sortedNotifications = recentNotifications.sort((a, b) => {
    // Sort by read status (unread first), then by priority, then by date
    if (a.read !== b.read) {
      return a.read ? 1 : -1
    }
    
    const priorityOrder = {
      [NotificationPriority.URGENT]: 4,
      [NotificationPriority.HIGH]: 3,
      [NotificationPriority.NORMAL]: 2,
      [NotificationPriority.LOW]: 1
    }
    
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    }
    
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <div className="absolute right-0 top-12 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {unreadCount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{unreadCount} unread</span>
            <div className="space-x-2">
              <button
                onClick={onMarkAllAsRead}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Mark all read
              </button>
              {notifications.length > 0 && (
                <>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={onClearAll}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Clear all
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {sortedNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-4xl mb-2">🔔</div>
            <p className="text-gray-500 font-medium">No notifications</p>
            <p className="text-gray-400 text-sm mt-1">
              You're all caught up!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 50 && (
        <div className="p-3 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            Showing {Math.min(50, notifications.length)} of {notifications.length} notifications
          </p>
        </div>
      )}
    </div>
  )
}