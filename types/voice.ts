export interface VoiceCommand {
  intent: string
  entities: Record<string, any>
  confidence: number
  originalText: string
}

export interface VoiceResponse {
  text: string
  action?: string
  data?: any
  fallback?: boolean
}

export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'speaking'

export interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}