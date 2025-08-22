'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Volume2, VolumeX, X } from 'lucide-react'
import { VoiceSpeechRecognition } from '@/lib/voice/speechRecognition'
import { TextToSpeech } from '@/lib/voice/textToSpeech'
import { VoiceStatus } from '@/types/voice'
import { processClientVoiceCommand } from '@/lib/voice/clientCommandProcessor'

interface FloatingVoiceButtonProps {
  className?: string
}

export function FloatingVoiceButton({ className = '' }: FloatingVoiceButtonProps) {
  const [status, setStatus] = useState<VoiceStatus>('idle')
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

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
    setIsExpanded(true)

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
        // Auto-collapse after processing if muted
        setTimeout(() => setIsExpanded(false), 3000)
      }
    } catch (error) {
      console.error('Command processing error:', error)
      const errorMessage = 'Sorry, I had trouble understanding that. Could you try saying that differently?'
      setResponse(errorMessage)
      
      if (!isMuted) {
        speakResponse(errorMessage)
      } else {
        setStatus('idle')
        setTimeout(() => setIsExpanded(false), 3000)
      }
    }
  }

  const speakResponse = (text: string) => {
    if (!textToSpeech.current || isMuted) {
      setStatus('idle')
      setTimeout(() => setIsExpanded(false), 3000)
      return
    }

    setStatus('speaking')
    
    textToSpeech.current.speak(text, {
      onStart: () => setStatus('speaking'),
      onEnd: () => {
        setStatus('idle')
        setTimeout(() => setIsExpanded(false), 2000)
      },
      onError: (error) => {
        console.error('Speech synthesis error:', error)
        setStatus('idle')
        setTimeout(() => setIsExpanded(false), 2000)
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

  const getButtonClass = () => {
    const baseClass = 'voice-button w-16 h-16 md:w-14 md:h-14'
    
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
        return <Mic className="w-7 h-7 md:w-6 md:h-6" />
      case 'processing':
        return <div className="w-7 h-7 md:w-6 md:h-6 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      case 'speaking':
        return <Volume2 className="w-7 h-7 md:w-6 md:h-6" />
      default:
        return <MicOff className="w-7 h-7 md:w-6 md:h-6" />
    }
  }

  if (!isSupported) {
    return null
  }

  return (
    <>
      {/* Floating Button */}
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <button
          onClick={status === 'listening' ? stopListening : startListening}
          disabled={status === 'processing' || status === 'speaking'}
          className={getButtonClass()}
          aria-label="Voice Assistant"
        >
          {getStatusIcon()}
        </button>
      </div>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="fixed bottom-24 right-6 z-40 w-80 max-w-[calc(100vw-3rem)] bg-white rounded-lg shadow-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Flynn Voice</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                aria-label={isMuted ? 'Unmute voice responses' : 'Mute voice responses'}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-gray-600" />
                ) : (
                  <Volume2 className="w-4 h-4 text-gray-600" />
                )}
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                aria-label="Close voice panel"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                {status === 'idle' ? 'Ready to listen' : 
                 status === 'listening' ? 'Listening...' :
                 status === 'processing' ? 'Processing...' :
                 'Speaking...'}
              </p>
            </div>

            {transcript && (
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>You:</strong> "{transcript}"
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

            <div className="border-t pt-3">
              <p className="text-xs text-gray-500 text-center">
                Try: "Show my appointments" or "Schedule John for tomorrow at 2pm"
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}