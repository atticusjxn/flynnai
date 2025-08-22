'use client'

import { SpeechRecognitionEvent, SpeechRecognitionErrorEvent } from '@/types/voice'

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onend: ((this: SpeechRecognition, ev: Event) => any) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor
    webkitSpeechRecognition: SpeechRecognitionConstructor
  }
}

export class VoiceSpeechRecognition {
  private recognition: SpeechRecognition | null = null
  private isListening = false

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition()
        this.setupRecognition()
      }
    }
  }

  private setupRecognition() {
    if (!this.recognition) return

    this.recognition.continuous = false
    this.recognition.interimResults = true
    this.recognition.lang = 'en-US'
  }

  public isSupported(): boolean {
    return this.recognition !== null
  }

  public startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ): boolean {
    if (!this.recognition || this.isListening) return false

    this.recognition.onstart = () => {
      this.isListening = true
    }

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = event.results
      const lastResult = results[results.length - 1]
      
      if (lastResult) {
        const transcript = lastResult[0].transcript
        onResult(transcript, lastResult.isFinal)
      }
    }

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.isListening = false
      onError(event.error || 'Speech recognition error')
    }

    this.recognition.onend = () => {
      this.isListening = false
      onEnd()
    }

    try {
      this.recognition.start()
      return true
    } catch (error) {
      this.isListening = false
      onError('Failed to start speech recognition')
      return false
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
    }
  }

  public getIsListening(): boolean {
    return this.isListening
  }
}