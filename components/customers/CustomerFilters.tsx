'use client'

import { useState } from 'react'
import { CustomerStatus } from '@prisma/client'

interface CustomerFiltersState {
  search?: string
  status?: CustomerStatus
  tags?: string[]
  hasJobs?: boolean
}

interface CustomerFiltersProps {
  filters: CustomerFiltersState
  onFiltersChange: (filters: CustomerFiltersState) => void
  availableTags: string[]
}

export function CustomerFilters({ filters, onFiltersChange, availableTags }: CustomerFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const updateFilter = (key: keyof CustomerFiltersState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined
    })
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && value !== false && 
    (Array.isArray(value) ? value.length > 0 : true)
  )

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search customers by name, phone, email, or notes..."
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
          Filters
          {hasActiveFilters && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {Object.values(filters).filter(v => 
                v !== undefined && v !== '' && v !== false && 
                (Array.isArray(v) ? v.length > 0 : true)
              ).length}
            </span>
          )}
        </button>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => updateFilter('status', e.target.value as CustomerStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All statuses</option>
              <option value={CustomerStatus.ACTIVE}>Active</option>
              <option value={CustomerStatus.INACTIVE}>Inactive</option>
              <option value={CustomerStatus.POTENTIAL}>Potential</option>
              <option value={CustomerStatus.FORMER}>Former</option>
            </select>
          </div>

          {/* Tags Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <select
              multiple
              value={filters.tags || []}
              onChange={(e) => {
                const selectedTags = Array.from(e.target.selectedOptions, option => option.value)
                updateFilter('tags', selectedTags.length > 0 ? selectedTags : undefined)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              size={Math.min(availableTags.length + 1, 4)}
            >
              {availableTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
            {availableTags.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">No tags available</p>
            )}
          </div>

          {/* Jobs Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Jobs</label>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="hasJobs-all"
                  name="hasJobs"
                  checked={filters.hasJobs === undefined}
                  onChange={() => updateFilter('hasJobs', undefined)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="hasJobs-all" className="ml-2 text-sm text-gray-700">
                  All customers
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="hasJobs-yes"
                  name="hasJobs"
                  checked={filters.hasJobs === true}
                  onChange={() => updateFilter('hasJobs', true)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="hasJobs-yes" className="ml-2 text-sm text-gray-700">
                  With jobs
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="hasJobs-no"
                  name="hasJobs"
                  checked={filters.hasJobs === false}
                  onChange={() => updateFilter('hasJobs', false)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="hasJobs-no" className="ml-2 text-sm text-gray-700">
                  No jobs yet
                </label>
              </div>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}