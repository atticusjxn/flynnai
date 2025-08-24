'use client'

import { formatDistanceToNow } from 'date-fns'
import { Notification, NotificationType, NotificationPriority } from '@/lib/notifications'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
}

const typeIcons = {
  [NotificationType.CALL_RECEIVED]: '📞',
  [NotificationType.APPOINTMENT_EXTRACTED]: '📅',
  [NotificationType.JOB_CREATED]: '🆕',
  [NotificationType.JOB_STATUS_CHANGED]: '📋',
  [NotificationType.CUSTOMER_CREATED]: '👤',
  [NotificationType.EXTRACTION_FAILED]: '⚠️',
  [NotificationType.SYSTEM_ALERT]: '🔔'
}

const priorityColors = {
  [NotificationPriority.LOW]: 'border-l-gray-300',
  [NotificationPriority.NORMAL]: 'border-l-blue-400',
  [NotificationPriority.HIGH]: 'border-l-orange-400',
  [NotificationPriority.URGENT]: 'border-l-red-500'
}

const priorityBgColors = {
  [NotificationPriority.LOW]: 'bg-gray-50',
  [NotificationPriority.NORMAL]: 'bg-blue-50',
  [NotificationPriority.HIGH]: 'bg-orange-50',
  [NotificationPriority.URGENT]: 'bg-red-50'
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id)
    }
  }

  const isUrgent = notification.priority === NotificationPriority.URGENT || 
                   notification.priority === NotificationPriority.HIGH

  return (
    <div
      className={`p-4 cursor-pointer transition-all duration-200 border-l-4 ${
        priorityColors[notification.priority]
      } ${
        notification.read 
          ? 'bg-white hover:bg-gray-50' 
          : `${priorityBgColors[notification.priority]} hover:bg-opacity-80`
      } ${isUrgent && !notification.read ? 'animate-pulse' : ''}`}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <span className="text-lg">
            {typeIcons[notification.type]}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className={`text-sm font-medium truncate ${
              notification.read ? 'text-gray-700' : 'text-gray-900'
            }`}>
              {notification.title}
            </h4>
            
            {!notification.read && (
              <div className="flex-shrink-0 ml-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
            )}
          </div>

          <p className={`text-sm mb-2 ${
            notification.read ? 'text-gray-500' : 'text-gray-700'
          }`}>
            {notification.message}
          </p>

          {/* Additional Data */}
          {notification.data && (
            <div className="mb-2">
              {notification.type === NotificationType.CALL_RECEIVED && notification.data.phoneNumber && (
                <div className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                  📞 {notification.data.phoneNumber}
                </div>
              )}
              
              {notification.type === NotificationType.APPOINTMENT_EXTRACTED && notification.data.confidence && (
                <div className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-600">
                  🎯 {Math.round(notification.data.confidence)}% confidence
                </div>
              )}
              
              {notification.type === NotificationType.JOB_CREATED && notification.data.estimatedCost && (
                <div className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-600">
                  💰 ${notification.data.estimatedCost}
                </div>
              )}

              {notification.type === NotificationType.JOB_STATUS_CHANGED && (
                <div className="inline-flex items-center space-x-1 text-xs">
                  <span className="px-2 py-1 rounded bg-gray-100 text-gray-600">
                    {notification.data.oldStatus}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="px-2 py-1 rounded bg-blue-100 text-blue-600">
                    {notification.data.newStatus}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Timestamp */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>
            
            {isUrgent && (
              <span className={`text-xs font-medium ${
                notification.priority === NotificationPriority.URGENT ? 'text-red-600' : 'text-orange-600'
              }`}>
                {notification.priority.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}