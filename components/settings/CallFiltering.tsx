'use client'

import { useState, useEffect } from 'react'

interface CallFilter {
  id: string
  name: string
  enabled: boolean
  type: 'allow' | 'block' | 'priority'
  rules: {
    phoneNumbers: string[]
    keywordFilters: string[]
    timeRestrictions: {
      enabled: boolean
      startTime: string
      endTime: string
      days: string[]
    }
    minimumDuration: number
    requireHumanSpeech: boolean
  }
  actions: {
    autoProcess: boolean
    skipTranscription: boolean
    customWebhook?: string
    sendNotification: boolean
  }
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function CallFiltering() {
  const [filters, setFilters] = useState<CallFilter[]>([])
  const [editingFilter, setEditingFilter] = useState<CallFilter | null>(null)
  const [showAddFilter, setShowAddFilter] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCallFilters()
  }, [])

  const fetchCallFilters = async () => {
    try {
      const response = await fetch('/api/settings/call-filters')
      if (response.ok) {
        const data = await response.json()
        setFilters(data.filters)
      }
    } catch (error) {
      console.error('Failed to fetch call filters:', error)
    }
  }

  const saveFilters = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings/call-filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters })
      })

      if (response.ok) {
        alert('Call filters saved successfully!')
      } else {
        alert('Failed to save call filters. Please try again.')
      }
    } catch (error) {
      alert('Error saving call filters. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const createNewFilter = (): CallFilter => ({
    id: Date.now().toString(),
    name: '',
    enabled: true,
    type: 'allow',
    rules: {
      phoneNumbers: [],
      keywordFilters: [],
      timeRestrictions: {
        enabled: false,
        startTime: '09:00',
        endTime: '17:00',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      },
      minimumDuration: 10,
      requireHumanSpeech: true
    },
    actions: {
      autoProcess: true,
      skipTranscription: false,
      sendNotification: true
    }
  })

  const addFilter = () => {
    const newFilter = createNewFilter()
    setEditingFilter(newFilter)
    setShowAddFilter(true)
  }

  const saveFilter = () => {
    if (!editingFilter) return

    if (!editingFilter.name.trim()) {
      alert('Please enter a filter name')
      return
    }

    const existingIndex = filters.findIndex(f => f.id === editingFilter.id)
    if (existingIndex >= 0) {
      const updatedFilters = [...filters]
      updatedFilters[existingIndex] = editingFilter
      setFilters(updatedFilters)
    } else {
      setFilters([...filters, editingFilter])
    }

    setEditingFilter(null)
    setShowAddFilter(false)
  }

  const deleteFilter = (id: string) => {
    if (confirm('Are you sure you want to delete this filter?')) {
      setFilters(filters.filter(f => f.id !== id))
    }
  }

  const toggleFilter = (id: string) => {
    setFilters(filters.map(f => 
      f.id === id ? { ...f, enabled: !f.enabled } : f
    ))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Call Filtering Rules</h3>
          <p className="text-sm text-gray-600 mt-1">
            Configure automatic processing rules for incoming calls
          </p>
        </div>
        
        <button
          onClick={addFilter}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
        >
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Filter
        </button>
      </div>

      {/* Default Rules Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <svg className="h-5 w-5 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-blue-700">
            <p><strong>Default Behavior:</strong> All calls are processed unless blocked by a filter. Filters are applied in order of priority.</p>
          </div>
        </div>
      </div>

      {/* Filters List */}
      {filters.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No call filters</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create your first call filter to customize call processing
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filters.map((filter, index) => (
            <FilterCard 
              key={filter.id} 
              filter={filter} 
              index={index}
              onToggle={toggleFilter}
              onEdit={setEditingFilter}
              onDelete={deleteFilter}
            />
          ))}
        </div>
      )}

      {/* Filter Editor Modal */}
      {(showAddFilter || editingFilter) && (
        <FilterEditor
          filter={editingFilter}
          onSave={saveFilter}
          onCancel={() => {
            setEditingFilter(null)
            setShowAddFilter(false)
          }}
          onChange={setEditingFilter}
        />
      )}

      {/* Save Button */}
      <div className="flex justify-end border-t pt-4">
        <button
          onClick={saveFilters}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save All Filters'}
        </button>
      </div>
    </div>
  )
}

function FilterCard({ filter, index, onToggle, onEdit, onDelete }: {
  filter: CallFilter
  index: number
  onToggle: (id: string) => void
  onEdit: (filter: CallFilter) => void
  onDelete: (id: string) => void
}) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'allow': return 'bg-green-100 text-green-800'
      case 'block': return 'bg-red-100 text-red-800'
      case 'priority': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'allow': return '✅'
      case 'block': return '❌'
      case 'priority': return '⭐'
      default: return '❓'
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${filter.enabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">{filter.name}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(filter.type)}`}>
                {getTypeIcon(filter.type)} {filter.type.toUpperCase()}
              </span>
              <span className="text-xs text-gray-500">#{index + 1}</span>
            </div>
            
            <div className="text-sm text-gray-600 mt-1">
              {filter.rules.phoneNumbers.length > 0 && (
                <span className="mr-3">📱 {filter.rules.phoneNumbers.length} numbers</span>
              )}
              {filter.rules.keywordFilters.length > 0 && (
                <span className="mr-3">🔍 {filter.rules.keywordFilters.length} keywords</span>
              )}
              {filter.rules.timeRestrictions.enabled && (
                <span className="mr-3">⏰ Time restricted</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onToggle(filter.id)}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              filter.enabled
                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {filter.enabled ? 'Disable' : 'Enable'}
          </button>

          <button
            onClick={() => onEdit(filter)}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200"
          >
            Edit
          </button>

          <button
            onClick={() => onDelete(filter.id)}
            className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

function FilterEditor({ filter, onSave, onCancel, onChange }: {
  filter: CallFilter | null
  onSave: () => void
  onCancel: () => void
  onChange: (filter: CallFilter) => void
}) {
  if (!filter) return null

  const updateFilter = (updates: Partial<CallFilter>) => {
    onChange({ ...filter, ...updates })
  }

  const updateRules = (updates: Partial<CallFilter['rules']>) => {
    onChange({ 
      ...filter, 
      rules: { ...filter.rules, ...updates }
    })
  }

  const updateActions = (updates: Partial<CallFilter['actions']>) => {
    onChange({ 
      ...filter, 
      actions: { ...filter.actions, ...updates }
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {filter.id ? 'Edit Filter' : 'Add New Filter'}
          </h3>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter Name
                </label>
                <input
                  type="text"
                  value={filter.name}
                  onChange={(e) => updateFilter({ name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Business Hours Only"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter Type
                </label>
                <select
                  value={filter.type}
                  onChange={(e) => updateFilter({ type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="allow">Allow (Process these calls)</option>
                  <option value="block">Block (Skip these calls)</option>
                  <option value="priority">Priority (Fast-track processing)</option>
                </select>
              </div>
            </div>

            {/* Phone Numbers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Numbers
              </label>
              <textarea
                value={filter.rules.phoneNumbers.join('\n')}
                onChange={(e) => updateRules({
                  phoneNumbers: e.target.value.split('\n').filter(n => n.trim())
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter phone numbers, one per line&#10;+1 555-123-4567&#10;+1 555-987-6543"
              />
            </div>

            {/* Keywords */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Keyword Filters
              </label>
              <textarea
                value={filter.rules.keywordFilters.join('\n')}
                onChange={(e) => updateRules({
                  keywordFilters: e.target.value.split('\n').filter(k => k.trim())
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter keywords to match in call content, one per line&#10;appointment&#10;service call&#10;emergency"
              />
            </div>

            {/* Time Restrictions */}
            <div>
              <label className="flex items-center mb-3">
                <input
                  type="checkbox"
                  checked={filter.rules.timeRestrictions.enabled}
                  onChange={(e) => updateRules({
                    timeRestrictions: {
                      ...filter.rules.timeRestrictions,
                      enabled: e.target.checked
                    }
                  })}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Enable time restrictions
                </span>
              </label>

              {filter.rules.timeRestrictions.enabled && (
                <div className="ml-6 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600">Start Time</label>
                      <input
                        type="time"
                        value={filter.rules.timeRestrictions.startTime}
                        onChange={(e) => updateRules({
                          timeRestrictions: {
                            ...filter.rules.timeRestrictions,
                            startTime: e.target.value
                          }
                        })}
                        className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">End Time</label>
                      <input
                        type="time"
                        value={filter.rules.timeRestrictions.endTime}
                        onChange={(e) => updateRules({
                          timeRestrictions: {
                            ...filter.rules.timeRestrictions,
                            endTime: e.target.value
                          }
                        })}
                        className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Active Days</label>
                    <div className="flex flex-wrap gap-2">
                      {WEEKDAYS.map(day => (
                        <label key={day} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filter.rules.timeRestrictions.days.includes(day)}
                            onChange={(e) => {
                              const days = e.target.checked
                                ? [...filter.rules.timeRestrictions.days, day]
                                : filter.rules.timeRestrictions.days.filter(d => d !== day)
                              updateRules({
                                timeRestrictions: {
                                  ...filter.rules.timeRestrictions,
                                  days
                                }
                              })
                            }}
                            className="h-3 w-3 text-blue-600 border-gray-300 rounded"
                          />
                          <span className="ml-1 text-xs text-gray-700">{day.slice(0, 3)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Actions</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filter.actions.autoProcess}
                    onChange={(e) => updateActions({ autoProcess: e.target.checked })}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Auto-process matching calls</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filter.actions.sendNotification}
                    onChange={(e) => updateActions({ sendNotification: e.target.checked })}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Send notifications for matches</span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Save Filter
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}