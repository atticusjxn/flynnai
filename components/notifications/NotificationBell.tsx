'use client'

interface NotificationBellProps {
  unreadCount: number
  isConnected: boolean
  hasNewNotifications: boolean
  onClick: () => void
}

export function NotificationBell({
  unreadCount,
  isConnected,
  hasNewNotifications,
  onClick
}: NotificationBellProps) {
  return (
    <button
      onClick={onClick}
      className={`relative p-2 rounded-full transition-all duration-200 ${
        hasNewNotifications
          ? 'bg-blue-100 text-blue-600 animate-pulse'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
      title="Notifications"
    >
      {/* Bell Icon */}
      <svg
        className={`h-6 w-6 ${hasNewNotifications ? 'animate-bounce' : ''}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      {/* Unread Count Badge */}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}

      {/* Connection Status Indicator */}
      <span
        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
          isConnected ? 'bg-green-400' : 'bg-red-400'
        }`}
        title={isConnected ? 'Real-time notifications connected' : 'Real-time notifications disconnected'}
      />
    </button>
  )
}