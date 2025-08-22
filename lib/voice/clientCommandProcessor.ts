import { VoiceResponse } from '@/types/voice'
import { processVoiceCommand as fallbackProcessor } from './commandProcessor'

interface VoiceProcessingOptions {
  useAI?: boolean
  timeout?: number
}

export async function processClientVoiceCommand(
  command: string, 
  options: VoiceProcessingOptions = {}
): Promise<VoiceResponse> {
  const { useAI = true, timeout = 8000 } = options

  // Always try AI first if enabled
  if (useAI) {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('AI processing timeout')), timeout)
      })

      // Race between API call and timeout
      const apiPromise = fetch('/api/voice/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (!data.success) {
          throw new Error(data.error || 'API processing failed')
        }
        
        return data.result as VoiceResponse
      })

      const result = await Promise.race([apiPromise, timeoutPromise])
      
      // Enhance AI response with local context if needed
      return enhanceAIResponse(result, command)

    } catch (error) {
      console.log('AI processing failed, falling back to local processing:', error)
      
      // Fall back to local processing
      return processLocalVoiceCommand(command)
    }
  }

  // Use local processing directly
  return processLocalVoiceCommand(command)
}

async function processLocalVoiceCommand(command: string): Promise<VoiceResponse> {
  const result = await fallbackProcessor(command)
  
  // Add fallback indicator for debugging
  return {
    ...result,
    text: `${result.text} (Processed locally)`
  }
}

function enhanceAIResponse(response: VoiceResponse, originalCommand: string): VoiceResponse {
  // Add any client-side enhancements to AI responses
  const enhancements: Record<string, (response: VoiceResponse) => VoiceResponse> = {
    schedule_appointment: (resp) => ({
      ...resp,
      text: resp.text.replace(/\bI've\b/g, "I've")
    }),
    
    show_appointments: (resp) => ({
      ...resp,
      // Could add real-time appointment count here
    }),
    
    create_invoice: (resp) => ({
      ...resp,
      // Could add invoice number preview
    })
  }

  if (response.action && enhancements[response.action]) {
    return enhancements[response.action](response)
  }

  return response
}

// Utility function to test different processing methods
export async function compareProcessingMethods(command: string) {
  console.group(`Testing command: "${command}"`)
  
  try {
    // Test AI processing
    console.time('AI Processing')
    const aiResult = await processClientVoiceCommand(command, { useAI: true })
    console.timeEnd('AI Processing')
    console.log('AI Result:', aiResult)
    
    // Test local processing
    console.time('Local Processing')
    const localResult = await processClientVoiceCommand(command, { useAI: false })
    console.timeEnd('Local Processing')
    console.log('Local Result:', localResult)
    
  } catch (error) {
    console.error('Comparison failed:', error)
  }
  
  console.groupEnd()
}

// Voice command quality scoring
export function scoreVoiceCommand(command: string): {
  clarity: number
  completeness: number
  naturalness: number
  overall: number
} {
  const words = command.toLowerCase().split(/\s+/)
  
  // Clarity: fewer filler words, clear pronunciation indicators
  const fillerWords = ['um', 'uh', 'like', 'you know', 'sort of', 'kind of']
  const fillerCount = words.filter(word => fillerWords.includes(word)).length
  const clarity = Math.max(0, 1 - (fillerCount / words.length))
  
  // Completeness: has key components (action, subject, context)
  const hasAction = /\b(schedule|book|show|create|add|cancel|tell|what)\b/i.test(command)
  const hasSubject = /\b(appointment|client|invoice|revenue|schedule)\b/i.test(command)
  const hasContext = /\b(today|tomorrow|week|for|at|with)\b/i.test(command)
  
  const completeness = (Number(hasAction) + Number(hasSubject) + Number(hasContext)) / 3
  
  // Naturalness: conversational vs robotic
  const naturalPhrases = [
    /what('s| is) (my|the)/i,
    /can you/i,
    /i (need|want) to/i,
    /around \d/i,
    /\d-ish/i,
    /bucks?/i,
    /this (week|month)/i
  ]
  
  const naturalCount = naturalPhrases.filter(pattern => pattern.test(command)).length
  const naturalness = Math.min(1, naturalCount / 3)
  
  const overall = (clarity * 0.3 + completeness * 0.5 + naturalness * 0.2)
  
  return {
    clarity: Math.round(clarity * 100) / 100,
    completeness: Math.round(completeness * 100) / 100,
    naturalness: Math.round(naturalness * 100) / 100,
    overall: Math.round(overall * 100) / 100
  }
}