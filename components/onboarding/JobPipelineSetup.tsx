'use client'

import { useState } from 'react'
import { ArrowRight, ArrowLeft, CheckCircle, Settings } from 'lucide-react'

interface JobPipelineSetupProps {
  onNext: (data: any) => void
  onBack: () => void
}

const defaultStages = [
  { name: 'Quoting', color: 'yellow', description: 'New leads requiring estimates' },
  { name: 'Confirmed', color: 'blue', description: 'Accepted jobs, scheduled' },
  { name: 'In Progress', color: 'purple', description: 'Currently working on' },
  { name: 'Completed', color: 'green', description: 'Finished jobs' }
]

const industryTemplates = [
  {
    name: 'Service Professional',
    stages: ['Quoting', 'Scheduled', 'In Progress', 'Completed'],
    description: 'Perfect for plumbing, HVAC, electrical, cleaning'
  },
  {
    name: 'Healthcare',
    stages: ['Consultation', 'Scheduled', 'Completed', 'Follow-up'],
    description: 'Medical, dental, therapy practices'
  },
  {
    name: 'Legal Services',
    stages: ['Initial Contact', 'Consultation', 'Active Case', 'Closed'],
    description: 'Law firms and legal professionals'
  },
  {
    name: 'Custom',
    stages: ['Stage 1', 'Stage 2', 'Stage 3', 'Stage 4'],
    description: 'Create your own workflow'
  }
]

export function JobPipelineSetup({ onNext, onBack }: JobPipelineSetupProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('Service Professional')
  const [customStages, setCustomStages] = useState(defaultStages)

  const handleNext = () => {
    const template = industryTemplates.find(t => t.name === selectedTemplate)
    onNext({
      template: selectedTemplate,
      stages: template?.stages || customStages.map(s => s.name)
    })
  }

  const getStageColor = (color: string) => {
    const colors = {
      yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      green: 'bg-green-100 text-green-700 border-green-200'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Settings className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Set Up Your Job Pipeline
        </h2>
        <p className="text-gray-600 text-lg">
          Choose how you want to organize and track your jobs from start to finish
        </p>
      </div>

      <div className="space-y-6">
        {/* Template Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Choose a Pipeline Template
          </label>
          <div className="grid gap-4">
            {industryTemplates.map((template) => (
              <div
                key={template.name}
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                  selectedTemplate === template.name
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedTemplate(template.name)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    selectedTemplate === template.name
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedTemplate === template.name && (
                      <CheckCircle className="w-4 h-4 text-white" />
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                <div className="flex flex-wrap gap-2">
                  {template.stages.map((stage, index) => (
                    <span
                      key={index}
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        getStageColor(['yellow', 'blue', 'purple', 'green'][index])
                      }`}
                    >
                      {stage}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline Preview */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Pipeline Preview</h4>
          <div className="flex items-center space-x-2 overflow-x-auto">
            {(industryTemplates.find(t => t.name === selectedTemplate)?.stages || []).map((stage, index, array) => (
              <div key={index} className="flex items-center">
                <div className={`px-4 py-2 rounded-lg font-medium text-sm border ${
                  getStageColor(['yellow', 'blue', 'purple', 'green'][index])
                } whitespace-nowrap`}>
                  {stage}
                </div>
                {index < array.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-gray-400 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
          <h4 className="font-semibold text-blue-900 mb-3">✨ What you'll get:</h4>
          <div className="grid md:grid-cols-2 gap-3 text-sm text-blue-800">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Drag & drop job management</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Automatic job creation from calls</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Progress tracking for each job</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Customer history and notes</span>
            </div>
          </div>
        </div>
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
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <span>Continue Setup</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}