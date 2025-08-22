'use client'

export class TextToSpeech {
  private synth: SpeechSynthesis | null = null
  private voices: SpeechSynthesisVoice[] = []

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis
      this.loadVoices()
    }
  }

  private loadVoices() {
    if (!this.synth) return

    const loadVoicesImpl = () => {
      this.voices = this.synth!.getVoices()
    }

    loadVoicesImpl()
    
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoicesImpl
    }
  }

  public isSupported(): boolean {
    return this.synth !== null
  }

  public speak(
    text: string,
    options: {
      rate?: number
      pitch?: number
      volume?: number
      voice?: string
      onStart?: () => void
      onEnd?: () => void
      onError?: (error: any) => void
    } = {}
  ): boolean {
    if (!this.synth) return false

    // Cancel any ongoing speech
    this.synth.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    
    // Set voice preferences
    const preferredVoice = this.voices.find(
      voice => voice.name.includes(options.voice || 'Google') && voice.lang === 'en-US'
    ) || this.voices.find(voice => voice.lang === 'en-US') || this.voices[0]
    
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    // Set speech parameters
    utterance.rate = options.rate || 1
    utterance.pitch = options.pitch || 1
    utterance.volume = options.volume || 1

    // Set event handlers
    utterance.onstart = options.onStart || null
    utterance.onend = options.onEnd || null
    utterance.onerror = options.onError || null

    try {
      this.synth.speak(utterance)
      return true
    } catch (error) {
      if (options.onError) {
        options.onError(error)
      }
      return false
    }
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel()
    }
  }

  public isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false
  }

  public getVoices(): SpeechSynthesisVoice[] {
    return this.voices
  }
}