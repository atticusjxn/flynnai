'use client'

import { useState, useEffect } from 'react'

interface NotificationSettings {
  email: {
    enabled: boolean
    address: string
    frequency: 'immediate' | 'hourly' | 'daily'
    types: {
      newCall: boolean
      jobCreated: boolean
      jobCompleted: boolean
      processingErrors: boolean
      systemUpdates: boolean
    }
  }
  inApp: {
    enabled: boolean
    sound: boolean
    types: {
      newCall: boolean
      jobCreated: boolean
      jobCompleted: boolean
      processingErrors: boolean
    }
  }
  sms: {
    enabled: boolean
    phoneNumber: string
    types: {
      criticalErrors: boolean
      jobReminders: boolean
    }
  }
  calendar: {
    enabled: boolean
    provider: 'google' | 'outlook' | 'ics'
    autoCreateEvents: boolean
    reminderMinutes: number
  }
}

export function NotificationPreferences() {
  const [settings, setSettings] = useState<NotificationSettings>({
    email: {
      enabled: true,
      address: '',
      frequency: 'immediate',
      types: {
        newCall: true,
        jobCreated: true,
        jobCompleted: false,
        processingErrors: true,
        systemUpdates: false
      }
    },
    inApp: {
      enabled: true,
      sound: true,
      types: {
        newCall: true,
        jobCreated: true,
        jobCompleted: true,
        processingErrors: true
      }
    },
    sms: {
      enabled: false,
      phoneNumber: '',
      types: {
        criticalErrors: true,
        jobReminders: false
      }
    },
    calendar: {
      enabled: false,
      provider: 'google',
      autoCreateEvents: true,
      reminderMinutes: 15
    }
  })

  const [saving, setSaving] = useState(false)
  const [testingSms, setTestingSms] = useState(false)

  useEffect(() => {
    fetchNotificationSettings()
  }, [])

  const fetchNotificationSettings = async () => {
    try {
      const response = await fetch('/api/settings/notifications')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Failed to fetch notification settings:', error)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      })

      if (response.ok) {
        alert('Notification settings saved successfully!')
      } else {
        alert('Failed to save settings. Please try again.')
      }
    } catch (error) {
      alert('Error saving settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const testSmsNotification = async () => {
    if (!settings.sms.phoneNumber) {
      alert('Please enter a phone number first')
      return
    }

    setTestingSms(true)
    try {
      const response = await fetch('/api/settings/test-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: settings.sms.phoneNumber })
      })

      const data = await response.json()
      if (response.ok) {
        alert('Test SMS sent successfully!')
      } else {
        alert(`Failed to send test SMS: ${data.error}`)
      }
    } catch (error) {
      alert('Error sending test SMS. Please try again.')
    } finally {
      setTestingSms(false)
    }
  }

  const updateEmailSettings = (updates: Partial<NotificationSettings['email']>) => {
    setSettings(prev => ({
      ...prev,
      email: { ...prev.email, ...updates }
    }))
  }

  const updateInAppSettings = (updates: Partial<NotificationSettings['inApp']>) => {
    setSettings(prev => ({
      ...prev,
      inApp: { ...prev.inApp, ...updates }
    }))
  }

  const updateSmsSettings = (updates: Partial<NotificationSettings['sms']>) => {
    setSettings(prev => ({
      ...prev,
      sms: { ...prev.sms, ...updates }
    }))
  }

  const updateCalendarSettings = (updates: Partial<NotificationSettings['calendar']>) => {
    setSettings(prev => ({
      ...prev,
      calendar: { ...prev.calendar, ...updates }
    }))
  }

  return (
    <div className="space-y-8">
      {/* Email Notifications */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="text-xl mr-2">📧</span>
              Email Notifications
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Receive updates and alerts via email
            </p>
          </div>
          
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.email.enabled}
              onChange={(e) => updateEmailSettings({ enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {settings.email.enabled && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={settings.email.address}
                onChange={(e) => updateEmailSettings({ address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Frequency
              </label>
              <select
                value={settings.email.frequency}
                onChange={(e) => updateEmailSettings({ frequency: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="immediate">Immediate</option>
                <option value="hourly">Hourly Digest</option>
                <option value="daily">Daily Summary</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Email Types
              </label>
              <div className="space-y-2">
                {Object.entries(settings.email.types).map(([key, enabled]) => (
                  <label key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => updateEmailSettings({
                        types: { ...settings.email.types, [key]: e.target.checked }
                      })}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* In-App Notifications */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="text-xl mr-2">🔔</span>
              In-App Notifications
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Real-time notifications within the application
            </p>
          </div>
          
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.inApp.enabled}
              onChange={(e) => updateInAppSettings({ enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {settings.inApp.enabled && (
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.inApp.sound}
                onChange={(e) => updateInAppSettings({ sound: e.target.checked })}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Play notification sounds
              </span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Notification Types
              </label>
              <div className="space-y-2">
                {Object.entries(settings.inApp.types).map(([key, enabled]) => (
                  <label key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => updateInAppSettings({
                        types: { ...settings.inApp.types, [key]: e.target.checked }
                      })}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SMS Notifications */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="text-xl mr-2">📱</span>
              SMS Notifications
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Critical alerts sent via text message
            </p>
          </div>
          
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.sms.enabled}
              onChange={(e) => updateSmsSettings({ enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {settings.sms.enabled && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="flex space-x-2">
                <input
                  type="tel"
                  value={settings.sms.phoneNumber}
                  onChange={(e) => updateSmsSettings({ phoneNumber: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+1 (555) 123-4567"
                />
                <button
                  onClick={testSmsNotification}
                  disabled={testingSms || !settings.sms.phoneNumber}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {testingSms ? 'Sending...' : 'Test'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                SMS Types
              </label>
              <div className="space-y-2">
                {Object.entries(settings.sms.types).map(([key, enabled]) => (
                  <label key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => updateSmsSettings({
                        types: { ...settings.sms.types, [key]: e.target.checked }
                      })}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Calendar Integration */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="text-xl mr-2">📅</span>
              Calendar Integration
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Automatically create calendar events for appointments
            </p>
          </div>
          
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.calendar.enabled}
              onChange={(e) => updateCalendarSettings({ enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {settings.calendar.enabled && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Calendar Provider
              </label>
              <select
                value={settings.calendar.provider}
                onChange={(e) => updateCalendarSettings({ provider: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="google">Google Calendar</option>
                <option value="outlook">Outlook Calendar</option>
                <option value="ics">ICS File Export</option>
              </select>
            </div>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.calendar.autoCreateEvents}
                onChange={(e) => updateCalendarSettings({ autoCreateEvents: e.target.checked })}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Automatically create calendar events for new appointments
              </span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reminder Time (minutes before appointment)
              </label>
              <select
                value={settings.calendar.reminderMinutes}
                onChange={(e) => updateCalendarSettings({ reminderMinutes: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>No reminder</option>
                <option value={5}>5 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
                <option value={1440}>1 day</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}