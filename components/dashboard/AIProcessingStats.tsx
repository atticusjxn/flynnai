'use client'

interface AIStats {
  totalExtractions: number
  avgConfidence: number
  confidenceDistribution: {
    high: number
    medium: number
    low: number
  }
  autoCreatedJobs: number
  conversionRate: number
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

interface AIProcessingStatsProps {
  aiStats: AIStats
  callStats: CallStats
}

export function AIProcessingStats({ aiStats, callStats }: AIProcessingStatsProps) {
  const confidenceTotal = aiStats.confidenceDistribution.high + 
                         aiStats.confidenceDistribution.medium + 
                         aiStats.confidenceDistribution.low

  const getConfidencePercentage = (count: number) => {
    return confidenceTotal > 0 ? Math.round((count / confidenceTotal) * 100) : 0
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Processing Performance</h3>
            <p className="text-sm text-gray-600 mt-1">
              Appointment extraction and job creation analytics
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {aiStats.avgConfidence}%
            </div>
            <div className="text-sm text-gray-500">
              Average Confidence
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{aiStats.totalExtractions}</div>
            <div className="text-sm text-gray-600">Total Extractions</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{callStats.successful}</div>
            <div className="text-sm text-gray-600">Successful</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{aiStats.autoCreatedJobs}</div>
            <div className="text-sm text-gray-600">Jobs Created</div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{Math.round(aiStats.conversionRate)}%</div>
            <div className="text-sm text-gray-600">Conversion Rate</div>
          </div>
        </div>

        {/* Confidence Distribution */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-4">Confidence Distribution</h4>
          
          <div className="space-y-3">
            {/* High Confidence */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm font-medium text-gray-700">
                  High Confidence (80%+)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${getConfidencePercentage(aiStats.confidenceDistribution.high)}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">
                  {aiStats.confidenceDistribution.high}
                </span>
              </div>
            </div>

            {/* Medium Confidence */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="text-sm font-medium text-gray-700">
                  Medium Confidence (60-79%)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: `${getConfidencePercentage(aiStats.confidenceDistribution.medium)}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">
                  {aiStats.confidenceDistribution.medium}
                </span>
              </div>
            </div>

            {/* Low Confidence */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm font-medium text-gray-700">
                  Low Confidence (&lt;60%)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${getConfidencePercentage(aiStats.confidenceDistribution.low)}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">
                  {aiStats.confidenceDistribution.low}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-md font-semibold text-gray-900 mb-3">Performance Insights</h4>
          
          <div className="space-y-2 text-sm">
            {aiStats.conversionRate > 70 && (
              <div className="flex items-center text-green-700">
                <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Excellent conversion rate - most calls are turning into jobs
              </div>
            )}
            
            {aiStats.avgConfidence > 75 && (
              <div className="flex items-center text-green-700">
                <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                High AI confidence - processing is very accurate
              </div>
            )}
            
            {callStats.failed > 0 && (
              <div className="flex items-center text-amber-700">
                <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {callStats.failed} calls failed processing - check audio quality
              </div>
            )}
            
            {aiStats.confidenceDistribution.low > aiStats.confidenceDistribution.high && (
              <div className="flex items-center text-amber-700">
                <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Many low-confidence extractions - consider training data improvements
              </div>
            )}
            
            {callStats.avgProcessingTime > 60 && (
              <div className="flex items-center text-blue-700">
                <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Processing time is {callStats.avgProcessingTime}s - within normal range
              </div>
            )}
          </div>
        </div>

        {/* Recommended Actions */}
        {(callStats.failed > 2 || aiStats.avgConfidence < 60) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-md font-semibold text-blue-900 mb-2">Recommended Actions</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {callStats.failed > 2 && (
                <li>• Review failed calls and improve audio quality settings</li>
              )}
              {aiStats.avgConfidence < 60 && (
                <li>• Consider manual review for low-confidence extractions</li>
              )}
              {aiStats.conversionRate < 50 && (
                <li>• Analyze why many extractions aren't converting to jobs</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}