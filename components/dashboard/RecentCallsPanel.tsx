'use client'

import { formatDistanceToNow } from 'date-fns'

interface RecentCall {
  id: string
  callSid: string
  phoneNumber: string
  duration?: number
  status: string
  createdAt: string
  extraction?: {
    id: string
    customerName?: string
    serviceType?: string
    confidenceScore?: number
    hasIssues: boolean
    jobs: Array<{
      id: string
      title: string
      status: string
    }>
  }
  transcription?: {
    transcriptionText: string
    confidenceScore?: number
  }
}

interface CallStats {
  total: number
  processed: number
  successful: number
  failed: number
  processingRate: number
  avgConfidence: number
  avgProcessingTime: number
}

interface RecentCallsPanelProps {
  calls: RecentCall[]
  callStats: CallStats
}

export function RecentCallsPanel({ calls, callStats }: RecentCallsPanelProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recent Calls</h3>
            <p className="text-sm text-gray-600 mt-1">
              Latest phone calls and their processing status
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              {callStats.processingRate}% Success Rate
            </div>
            <div className="text-xs text-gray-500">
              {callStats.processed}/{callStats.total} calls processed
            </div>
          </div>
        </div>

        {/* Processing Stats */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">{callStats.avgConfidence}%</div>
            <div className="text-xs text-gray-600">Avg Confidence</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">{callStats.successful}</div>
            <div className="text-xs text-gray-600">Successful</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">{callStats.failed}</div>
            <div className="text-xs text-gray-600">Failed</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">{callStats.avgProcessingTime}s</div>
            <div className="text-xs text-gray-600">Avg Time</div>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {calls.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-4xl mb-2">📞</div>
            <p className="text-gray-500 font-medium">No recent calls</p>
            <p className="text-gray-400 text-sm mt-1">
              Calls will appear here once you start receiving them
            </p>
          </div>
        ) : (
          calls.map((call) => (
            <CallItem key={call.id} call={call} />
          ))
        )}
      </div>

      {calls.length > 0 && (
        <div className="p-4 bg-gray-50 border-t">
          <button className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium">
            View All Calls
          </button>
        </div>
      )}
    </div>
  )
}

function CallItem({ call }: { call: RecentCall }) {
  const getStatusColor = (status: string, hasIssues?: boolean) => {
    if (hasIssues === true) return 'bg-red-100 text-red-800'
    
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      case 'NO_APPOINTMENT':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="p-4 hover:bg-gray-50">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {/* Call Status Icon */}
          <div className="flex-shrink-0 mt-1">
            {call.extraction?.hasIssues ? (
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            ) : call.extraction ? (
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            ) : (
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Call Info */}
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-medium text-gray-900">{call.phoneNumber}</span>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-500">
                {formatDuration(call.duration)}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                getStatusColor(call.status, call.extraction?.hasIssues)
              }`}>
                {call.status}
              </span>
            </div>

            {/* Extraction Info */}
            {call.extraction && (
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-sm">
                  {call.extraction.customerName && (
                    <>
                      <span className="text-gray-700">👤 {call.extraction.customerName}</span>
                      <span className="text-gray-400">•</span>
                    </>
                  )}
                  {call.extraction.serviceType && (
                    <>
                      <span className="text-gray-700">🔧 {call.extraction.serviceType}</span>
                      <span className="text-gray-400">•</span>
                    </>
                  )}
                  {call.extraction.confidenceScore && (
                    <span className={`font-medium ${
                      call.extraction.confidenceScore >= 80 ? 'text-green-600' :
                      call.extraction.confidenceScore >= 60 ? 'text-yellow-600' : 
                      'text-red-600'
                    }`}>
                      {Math.round(call.extraction.confidenceScore)}% confidence
                    </span>
                  )}
                </div>

                {/* Generated Jobs */}
                {call.extraction.jobs && call.extraction.jobs.length > 0 && (
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-green-600">✅ {call.extraction.jobs.length} job(s) created</span>
                    {call.extraction.jobs.slice(0, 2).map((job, index) => (
                      <span key={job.id} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                        {job.title.substring(0, 20)}...
                      </span>
                    ))}
                  </div>
                )}

                {/* Issues */}
                {call.extraction.hasIssues && (
                  <div className="text-sm text-red-600">
                    ⚠️ Processing issues detected - manual review needed
                  </div>
                )}
              </div>
            )}

            {/* No Extraction */}
            {!call.extraction && call.status === 'COMPLETED' && (
              <div className="text-sm text-yellow-600">
                ⏳ Processing... or no appointment detected
              </div>
            )}
          </div>
        </div>

        {/* Timestamp */}
        <div className="text-xs text-gray-500 mt-1">
          {formatDistanceToNow(new Date(call.createdAt), { addSuffix: true })}
        </div>
      </div>

      {/* Transcription Preview */}
      {call.transcription && call.transcription.transcriptionText && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <div className="flex justify-between items-start mb-2">
              <span className="font-medium text-gray-700">Transcription:</span>
              {call.transcription.confidenceScore && (
                <span className="text-xs text-gray-500">
                  {Math.round(call.transcription.confidenceScore)}% accuracy
                </span>
              )}
            </div>
            <p className="text-sm line-clamp-2">
              {call.transcription.transcriptionText.substring(0, 150)}...
            </p>
          </div>
        </div>
      )}
    </div>
  )
}