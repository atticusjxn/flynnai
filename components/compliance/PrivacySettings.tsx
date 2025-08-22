'use client'

import { useState } from 'react'
import { Eye, EyeOff, Trash2, Download, Shield } from 'lucide-react'

interface PrivacySettingsProps {
  onSettingsChange: (settings: any) => void
}

export function PrivacySettings({ onSettingsChange }: PrivacySettingsProps) {
  const [piiRedaction, setPiiRedaction] = useState(true)
  const [sensitiveCallFiltering, setSensitiveCallFiltering] = useState(true)
  const [dataExport, setDataExport] = useState(true)
  const [automaticDeletion, setAutomaticDeletion] = useState(true)
  const [anonymizedAnalytics, setAnonymizedAnalytics] = useState(false)

  const handleSettingsUpdate = () => {
    const settings = {
      piiRedaction,
      sensitiveCallFiltering,
      dataExport,
      automaticDeletion,
      anonymizedAnalytics
    }
    onSettingsChange(settings)
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Shield className="w-6 h-6 text-green-600" />
        <h3 className="text-xl font-semibold text-gray-900">Privacy Settings</h3>
      </div>

      <div className="space-y-6">
        {/* PII Redaction */}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <Eye className="w-5 h-5 text-blue-600 mt-1" />
            <div>
              <div className="font-medium text-gray-900">PII Redaction</div>
              <div className="text-sm text-gray-600">
                Automatically detect and redact personal information in transcriptions
              </div>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={piiRedaction}
              onChange={(e) => setPiiRedaction(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Sensitive Call Filtering */}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <EyeOff className="w-5 h-5 text-purple-600 mt-1" />
            <div>
              <div className="font-medium text-gray-900">Sensitive Call Filtering</div>
              <div className="text-sm text-gray-600">
                Skip processing calls that contain sensitive topics (medical, legal, financial)
              </div>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={sensitiveCallFiltering}
              onChange={(e) => setSensitiveCallFiltering(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Data Export */}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <Download className="w-5 h-5 text-green-600 mt-1" />
            <div>
              <div className="font-medium text-gray-900">Data Export Rights</div>
              <div className="text-sm text-gray-600">
                Allow users to download all their data (GDPR compliance)
              </div>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={dataExport}
              onChange={(e) => setDataExport(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Automatic Deletion */}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <Trash2 className="w-5 h-5 text-red-600 mt-1" />
            <div>
              <div className="font-medium text-gray-900">Automatic Deletion</div>
              <div className="text-sm text-gray-600">
                Automatically delete recordings and data after retention period
              </div>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={automaticDeletion}
              onChange={(e) => setAutomaticDeletion(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Anonymized Analytics */}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-gray-600 mt-1" />
            <div>
              <div className="font-medium text-gray-900">Anonymized Analytics</div>
              <div className="text-sm text-gray-600">
                Share anonymized usage data to improve our AI models
              </div>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={anonymizedAnalytics}
              onChange={(e) => setAnonymizedAnalytics(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* Data Protection Summary */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Your Data Protection Summary</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>✓ All data encrypted in transit and at rest</p>
          <p>✓ Zero-knowledge architecture - we can't access your raw data</p>
          <p>✓ SOC 2 Type II certified infrastructure</p>
          <p>✓ Regular security audits and penetration testing</p>
          <p>✓ GDPR, CCPA, and HIPAA compliance ready</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-6 flex space-x-3">
        <button
          onClick={handleSettingsUpdate}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
        >
          Save Settings
        </button>
        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200">
          Export My Data
        </button>
      </div>
    </div>
  )
}