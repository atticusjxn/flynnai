'use client'

import { useState } from 'react'
import { ArrowRight, ArrowLeft, Phone, CheckCircle, PlayCircle } from 'lucide-react'

interface TestCallSetupProps {
  onNext: (data: any) => void
  onBack: () => void
}

export function TestCallSetup({ onNext, onBack }: TestCallSetupProps) {
  const [testingPhase, setTestingPhase] = useState<'ready' | 'testing' | 'completed'>('ready')
  const [testResults, setTestResults] = useState<{
    transcription: string
    extractedData: {
      customerName: string
      phoneNumber: string
      serviceType: string
      appointmentDate: string
      appointmentTime: string
      confidence: number
    } | null
    success: boolean
  }>({
    transcription: '',
    extractedData: null,
    success: false
  })

  const startTest = async () => {
    setTestingPhase('testing')
    
    // Simulate test call processing
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Simulate successful extraction
    const mockResults = {
      transcription: "Hi, this is John Smith calling about getting my kitchen sink fixed. I'm available Tuesday around 2 PM or Wednesday morning. My phone number is 555-123-4567.",
      extractedData: {
        customerName: "John Smith",
        phoneNumber: "555-123-4567", 
        serviceType: "Kitchen sink repair",
        appointmentDate: "Tuesday",
        appointmentTime: "2:00 PM",
        confidence: 92
      },
      success: true
    }
    
    setTestResults(mockResults)
    setTestingPhase('completed')
  }

  const handleNext = () => {
    onNext({
      testCompleted: testingPhase === 'completed',
      testResults: testResults
    })
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Phone className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Test Your Setup
        </h2>
        <p className="text-gray-600 text-lg">
          Let's run a quick test to make sure everything is working perfectly
        </p>
      </div>

      <div className="space-y-6">
        {testingPhase === 'ready' && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-semibold text-blue-900 mb-3">What we'll test:</h3>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Phone integration connection</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>AI call processing (transcription + extraction)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Email delivery system</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Job creation in your pipeline</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 text-center">
              <PlayCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">Ready to test!</h4>
              <p className="text-gray-600 text-sm mb-4">
                We'll simulate a customer call and show you exactly how Flynn.ai processes it into a job
              </p>
              <button
                onClick={startTest}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Start Test Call
              </button>
            </div>
          </>
        )}

        {testingPhase === 'testing' && (
          <div className="bg-white border-2 border-blue-200 rounded-xl p-6 text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-lg font-medium text-gray-900">Processing test call...</span>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Transcribing audio with Whisper AI</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Extracting appointment details with GPT-4</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span>Creating job in your pipeline</span>
              </div>
            </div>
          </div>
        )}

        {testingPhase === 'completed' && (
          <>
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <h3 className="text-xl font-semibold text-green-900">Test Completed Successfully!</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Call Transcription:</h4>
                  <div className="bg-white p-3 rounded-lg border text-sm text-gray-700 italic">
                    "{testResults.transcription}"
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Extracted Job Details:</h4>
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Customer:</span>
                        <div className="text-gray-900">{testResults.extractedData?.customerName}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Phone:</span>
                        <div className="text-gray-900">{testResults.extractedData?.phoneNumber}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Service:</span>
                        <div className="text-gray-900">{testResults.extractedData?.serviceType}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">When:</span>
                        <div className="text-gray-900">{testResults.extractedData?.appointmentDate} at {testResults.extractedData?.appointmentTime}</div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                        {testResults.extractedData?.confidence}% Confidence
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-700">
                <strong>Perfect!</strong> This job would now appear in your "Quoting" pipeline stage, 
                and you'd receive an email with the full details and calendar file.
              </p>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        
        <button
          onClick={handleNext}
          disabled={testingPhase !== 'completed'}
          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
        >
          <span>Complete Setup</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}