'use client'

import { useState } from 'react'
import { PhoneManagement } from '@/components/settings/PhoneManagement'
import { NotificationPreferences } from '@/components/settings/NotificationPreferences'
import { CallFiltering } from '@/components/settings/CallFiltering'
import { BillingSettings } from '@/components/settings/BillingSettings'
import { AccountSettings } from '@/components/settings/AccountSettings'

type SettingsTab = 'phone' | 'notifications' | 'filtering' | 'billing' | 'account'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('phone')

  const tabs = [
    {
      id: 'phone' as SettingsTab,
      name: 'Phone Management',
      icon: '📞',
      description: 'Manage your phone numbers and Twilio integration'
    },
    {
      id: 'notifications' as SettingsTab,
      name: 'Notifications',
      icon: '🔔',
      description: 'Configure notification preferences and channels'
    },
    {
      id: 'filtering' as SettingsTab,
      name: 'Call Filtering',
      icon: '🎯',
      description: 'Set up call processing filters and rules'
    },
    {
      id: 'billing' as SettingsTab,
      name: 'Billing & Usage',
      icon: '💳',
      description: 'View usage, billing, and subscription settings'
    },
    {
      id: 'account' as SettingsTab,
      name: 'Account',
      icon: '👤',
      description: 'Account information and security settings'
    }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'phone':
        return <PhoneManagement />
      case 'notifications':
        return <NotificationPreferences />
      case 'filtering':
        return <CallFiltering />
      case 'billing':
        return <BillingSettings />
      case 'account':
        return <AccountSettings />
      default:
        return <PhoneManagement />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage your phone integration and account preferences
                </p>
              </div>
              
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset All Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-8">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-3">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left group rounded-md px-3 py-2 flex items-center text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg mr-3">{tab.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{tab.name}</div>
                    <div className={`text-xs mt-1 ${
                      activeTab === tab.id ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {tab.description}
                    </div>
                  </div>
                  {activeTab === tab.id && (
                    <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </nav>

            {/* Quick Stats */}
            <div className="mt-8 bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone Numbers</span>
                  <span className="font-medium">2 active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Calls</span>
                  <span className="font-medium">156</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Storage Used</span>
                  <span className="font-medium">2.3 GB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan</span>
                  <span className="font-medium text-blue-600">Professional</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-9 mt-8 lg:mt-0">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <span className="text-xl mr-2">
                    {tabs.find(tab => tab.id === activeTab)?.icon}
                  </span>
                  {tabs.find(tab => tab.id === activeTab)?.name}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {tabs.find(tab => tab.id === activeTab)?.description}
                </p>
              </div>

              <div className="p-6">
                {renderTabContent()}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}