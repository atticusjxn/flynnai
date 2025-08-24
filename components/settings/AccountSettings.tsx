'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface UserProfile {
  name: string
  email: string
  phone?: string
  company?: string
  timezone: string
  language: string
  avatar?: string
}

interface SecuritySettings {
  twoFactorEnabled: boolean
  sessionTimeout: number
  apiAccess: boolean
  webhookSecret: string
}

export function AccountSettings() {
  const { data: session, update } = useSession()
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    company: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: 'en',
    avatar: ''
  })
  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    apiAccess: false,
    webhookSecret: ''
  })
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)

  useEffect(() => {
    if (session?.user) {
      setProfile({
        name: session.user.name || '',
        email: session.user.email || '',
        phone: '',
        company: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: 'en',
        avatar: session.user.image || ''
      })
    }
    fetchSecuritySettings()
  }, [session])

  const fetchSecuritySettings = async () => {
    try {
      const response = await fetch('/api/settings/security')
      if (response.ok) {
        const data = await response.json()
        setSecurity(data.security)
      }
    } catch (error) {
      console.error('Failed to fetch security settings:', error)
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile })
      })

      if (response.ok) {
        // Update the session if name changed
        if (profile.name !== session?.user?.name) {
          await update({ name: profile.name })
        }
        alert('Profile updated successfully!')
      } else {
        alert('Failed to update profile. Please try again.')
      }
    } catch (error) {
      alert('Error updating profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const saveSecuritySettings = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ security })
      })

      if (response.ok) {
        alert('Security settings updated successfully!')
      } else {
        alert('Failed to update security settings. Please try again.')
      }
    } catch (error) {
      alert('Error updating security settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const generateApiKey = async () => {
    try {
      const response = await fetch('/api/settings/generate-api-key', {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setSecurity(prev => ({ ...prev, webhookSecret: data.apiKey }))
        alert('New API key generated successfully!')
      } else {
        alert('Failed to generate API key. Please try again.')
      }
    } catch (error) {
      alert('Error generating API key. Please try again.')
    }
  }

  const exportData = async () => {
    try {
      const response = await fetch('/api/settings/export-data', {
        method: 'POST'
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `flynn-data-export-${new Date().toISOString().split('T')[0]}.zip`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        alert('Data export started. Download will begin shortly.')
      } else {
        alert('Failed to export data. Please try again.')
      }
    } catch (error) {
      alert('Error exporting data. Please try again.')
    }
  }

  const deleteAccount = async () => {
    try {
      const response = await fetch('/api/settings/delete-account', {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Account deletion initiated. You will receive a confirmation email.')
        setShowDeleteConfirm(false)
      } else {
        const data = await response.json()
        alert(`Failed to delete account: ${data.error}`)
      }
    } catch (error) {
      alert('Error deleting account. Please try again.')
    }
  }

  return (
    <div className="space-y-8">
      {/* Profile Settings */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="text-xl mr-2">👤</span>
              Profile Information
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Update your personal information and preferences
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
              placeholder="your@email.com"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed after account creation</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company
            </label>
            <input
              type="text"
              value={profile.company}
              onChange={(e) => setProfile({ ...profile, company: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your company name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timezone
            </label>
            <select
              value={profile.timezone}
              onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="UTC">UTC</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Europe/Paris">Paris (CET)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Language
            </label>
            <select
              value={profile.language}
              onChange={(e) => setProfile({ ...profile, language: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={saveProfile}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="text-xl mr-2">🔐</span>
              Security Settings
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Manage your account security and access controls
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Two-Factor Authentication */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">Two-Factor Authentication</div>
              <div className="text-sm text-gray-600">Add an extra layer of security to your account</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={security.twoFactorEnabled}
                onChange={(e) => setSecurity({ ...security, twoFactorEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Session Timeout */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Session Timeout (days)
            </label>
            <select
              value={security.sessionTimeout}
              onChange={(e) => setSecurity({ ...security, sessionTimeout: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>1 day</option>
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">How long to keep you logged in</p>
          </div>

          {/* API Access */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">API Access</div>
              <div className="text-sm text-gray-600">Enable programmatic access to your data</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={security.apiAccess}
                onChange={(e) => setSecurity({ ...security, apiAccess: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* API Key */}
          {security.apiAccess && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key
              </label>
              <div className="flex space-x-2">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={security.webhookSecret}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-100 font-mono text-sm"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                >
                  {showApiKey ? 'Hide' : 'Show'}
                </button>
                <button
                  onClick={generateApiKey}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                >
                  Regenerate
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Keep your API key secret and secure</p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={saveSecuritySettings}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Security Settings'}
            </button>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="text-xl mr-2">💾</span>
              Data Management
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Export your data or delete your account
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Export Data */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <div className="text-sm font-medium text-gray-900">Export Your Data</div>
              <div className="text-sm text-gray-600">Download all your calls, transcriptions, and jobs</div>
            </div>
            <button
              onClick={exportData}
              className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
            >
              Export Data
            </button>
          </div>

          {/* Delete Account */}
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
            <div>
              <div className="text-sm font-medium text-red-900">Delete Account</div>
              <div className="text-sm text-red-600">Permanently delete your account and all data</div>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-red-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Account</h3>
              <p className="text-sm text-gray-600 mb-6">
                This action cannot be undone. All your data including calls, transcriptions, and jobs will be permanently deleted.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteAccount}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                >
                  Delete Forever
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}