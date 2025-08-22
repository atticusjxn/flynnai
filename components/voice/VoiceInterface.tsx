'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import { AIStatusIndicator } from './AIStatusIndicator'
import { VoiceSpeechRecognition } from '@/lib/voice/speechRecognition'
import { TextToSpeech } from '@/lib/voice/textToSpeech'
import { VoiceStatus } from '@/types/voice'
import { processClientVoiceCommand } from '@/lib/voice/clientCommandProcessor'

export function VoiceInterface() {
  const [status, setStatus] = useState<VoiceStatus>('idle')
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  const speechRecognition = useRef<VoiceSpeechRecognition | null>(null)
  const textToSpeech = useRef<TextToSpeech | null>(null)

  useEffect(() => {
    speechRecognition.current = new VoiceSpeechRecognition()
    textToSpeech.current = new TextToSpeech()
    
    setIsSupported(
      speechRecognition.current.isSupported() && textToSpeech.current.isSupported()
    )
  }, [])

  const startListening = () => {
    if (!speechRecognition.current || status !== 'idle') return

    setStatus('listening')
    setTranscript('')
    setResponse('')

    speechRecognition.current.startListening(
      (transcript, isFinal) => {
        setTranscript(transcript)
        
        if (isFinal) {
          handleVoiceCommand(transcript)
        }
      },
      (error) => {
        console.error('Speech recognition error:', error)
        setStatus('idle')
        speakResponse('Sorry, I had trouble hearing you. Please try again.')
      },
      () => {
        setStatus(prevStatus => prevStatus === 'listening' ? 'idle' : prevStatus)
      }
    )
  }

  const stopListening = () => {
    if (speechRecognition.current) {
      speechRecognition.current.stopListening()
    }
    setStatus('idle')
  }

  const handleVoiceCommand = async (command: string) => {
    setStatus('processing')
    
    try {
      // Use AI-powered processing with fallback
      const result = await processClientVoiceCommand(command, {
        useAI: true,
        timeout: 8000
      })
      
      setResponse(result.text)
      
      if (!isMuted) {
        speakResponse(result.text)
      } else {
        setStatus('idle')
      }
    } catch (error) {
      console.error('Command processing error:', error)
      const errorMessage = 'Sorry, I had trouble understanding that. Could you try rephrasing your request?'
      setResponse(errorMessage)
      
      if (!isMuted) {
        speakResponse(errorMessage)
      } else {
        setStatus('idle')
      }
    }
  }

  const speakResponse = (text: string) => {
    if (!textToSpeech.current || isMuted) {
      setStatus('idle')
      return
    }

    setStatus('speaking')
    
    textToSpeech.current.speak(text, {
      onStart: () => setStatus('speaking'),
      onEnd: () => setStatus('idle'),
      onError: (error) => {
        console.error('Speech synthesis error:', error)
        setStatus('idle')
      }
    })
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (textToSpeech.current && textToSpeech.current.isSpeaking()) {
      textToSpeech.current.stop()
      setStatus('idle')
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'listening':
        return 'Listening...'
      case 'processing':
        return 'Processing...'
      case 'speaking':
        return 'Speaking...'
      default:
        return 'Tap to speak'
    }
  }

  const getButtonClass = () => {
    const baseClass = 'voice-button w-24 h-24 md:w-20 md:h-20'
    
    switch (status) {
      case 'listening':
        return `${baseClass} listening`
      case 'processing':
        return `${baseClass} processing`
      case 'speaking':
        return `${baseClass} speaking`
      default:
        return `${baseClass} inactive`
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'listening':
        return <Mic className="w-10 h-10 md:w-8 md:h-8" />
      case 'processing':
        return <div className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      case 'speaking':
        return <Volume2 className="w-10 h-10 md:w-8 md:h-8" />
      default:
        return <MicOff className="w-10 h-10 md:w-8 md:h-8" />
    }
  }

  const getDetailedStatusText = () => {
    switch (status) {
      case 'listening':
        return 'I\'m listening... Speak your command!'
      case 'processing':
        return 'Processing your request...'
      case 'speaking':
        return 'Flynn is responding...'
      default:
        return 'Tap to speak with Flynn'
    }
  }

  if (!isSupported) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <MicOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Voice Not Supported
          </h3>
          <p className="text-gray-500 text-sm">
            Your browser doesn't support voice features. Please use a modern browser like Chrome.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="text-center">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-700">
            Flynn Voice Assistant
          </h3>
        </div>
        
        <AIStatusIndicator className="mb-4" />
        
        <div className="flex flex-col items-center space-y-6 mb-6">
          <div className="relative">
            <button
              onClick={status === 'listening' ? stopListening : startListening}
              disabled={status === 'processing' || status === 'speaking'}
              className={getButtonClass()}
              aria-label={getDetailedStatusText()}
            >
              {getStatusIcon()}
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleMute}
              className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label={isMuted ? 'Unmute voice responses' : 'Mute voice responses'}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-gray-600" />
              ) : (
                <Volume2 className="w-5 h-5 text-gray-600" />
              )}
            </button>
            
            <div className="text-center">
              <p className="text-lg font-medium text-gray-700 mb-1">{getDetailedStatusText()}</p>
              <p className="text-sm text-gray-500">
                {status === 'idle' ? 'Voice commands ready' : 
                 status === 'listening' ? 'Listening for your command...' :
                 status === 'processing' ? 'Understanding your request...' :
                 'Speaking response...'}
              </p>
            </div>
          </div>
        </div>
        
        {transcript && (
          <div className="bg-blue-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">
              <strong>You said:</strong> "{transcript}"
            </p>
          </div>
        )}
        
        {response && (
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-sm text-green-800">
              <strong>Flynn:</strong> {response}
            </p>
          </div>
        )}
      </div>
      
      <div className="mt-6 border-t pt-4 space-y-3">
        <h4 className="text-sm font-medium text-gray-700 text-center">Voice Commands</h4>
        <div className="grid grid-cols-1 gap-2 text-xs text-gray-500">
          <div className="bg-gray-50 rounded p-2">
            <strong>"Schedule [client] for [day] at [time]"</strong>
            <br />Book appointments quickly
          </div>
          <div className="bg-gray-50 rounded p-2">
            <strong>"Show my appointments today"</strong>
            <br />View your schedule
          </div>
          <div className="bg-gray-50 rounded p-2">
            <strong>"Create invoice for [client] for $[amount]"</strong>
            <br />Generate invoices
          </div>
          <div className="bg-gray-50 rounded p-2">
            <strong>"Add client [name] phone [number]"</strong>
            <br />Add new clients
          </div>
        </div>
        <p className="text-xs text-gray-400 text-center mt-3">
          Speak naturally - Flynn understands conversational commands!
        </p>
      </div>
    </div>
  )
}