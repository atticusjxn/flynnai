import { getOpenAI } from '@/lib/openai'
import { prisma } from '@/lib/prisma'
import { getRecordingSignedUrl } from '@/lib/storage'
import { errorHandler, ErrorType, ErrorSeverity } from '@/lib/error-handling'

export interface TranscriptionResult {
  success: boolean
  transcription?: string
  confidence?: number
  language?: string
  duration?: number
  error?: string
  processingTime?: number
  audioQuality?: {
    snr?: number
    volume?: number
    clarity?: number
    durationSeconds?: number
  }
  warnings?: string[]
}

export interface TranscriptionOptions {
  model?: 'whisper-1'
  language?: string
  prompt?: string
  responseFormat?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt'
  temperature?: number
}

/**
 * Transcribe audio file using OpenAI Whisper with comprehensive error handling
 */
export async function transcribeAudio(
  audioFile: File | Buffer | Blob,
  fileName: string,
  options: TranscriptionOptions = {},
  callRecordId?: string,
  userId?: string
): Promise<TranscriptionResult> {
  const startTime = Date.now()
  const openai = getOpenAI()

  if (!openai) {
    return {
      success: false,
      error: 'OpenAI API not configured',
      warnings: ['OpenAI API configuration is missing']
    }
  }

  try {
    console.log(`🎙️ Starting transcription for ${fileName}`)

    // Validate audio file
    const audioValidation = await validateAudioFile(audioFile, fileName)
    if (!audioValidation.valid) {
      if (callRecordId && userId) {
        await errorHandler.handleAudioQualityError(
          callRecordId,
          userId,
          audioValidation.metrics
        )
      }
      
      return {
        success: false,
        error: audioValidation.error,
        audioQuality: audioValidation.metrics,
        warnings: audioValidation.warnings
      }
    }

    // Prepare the audio file for Whisper API
    let audioData: File
    
    if (audioFile instanceof Buffer) {
      audioData = new File([audioFile], fileName, { type: 'audio/mpeg' })
    } else if (audioFile instanceof Blob) {
      audioData = new File([audioFile], fileName, { type: 'audio/mpeg' })
    } else {
      audioData = audioFile
    }

    // Configure transcription parameters with error handling
    const transcriptionParams: any = {
      file: audioData,
      model: options.model || 'whisper-1',
      response_format: options.responseFormat || 'verbose_json',
      temperature: options.temperature || 0
    }

    if (options.language) {
      transcriptionParams.language = options.language
    }

    if (options.prompt) {
      transcriptionParams.prompt = options.prompt
    }

    console.log(`📤 Sending audio to Whisper API...`)
    
    // Implement retry logic with exponential backoff
    const response = await errorHandler.retryWithBackoff(
      () => openai.audio.transcriptions.create(transcriptionParams),
      `transcription_${callRecordId || 'unknown'}_${Date.now()}`,
      {
        maxRetries: 3,
        baseDelayMs: 2000,
        maxDelayMs: 30000
      }
    )

    const processingTime = Date.now() - startTime

    // Handle different response formats with error checking
    let transcription: string
    let confidence: number | undefined
    let language: string | undefined
    let duration: number | undefined
    const warnings: string[] = []

    if (options.responseFormat === 'verbose_json' || !options.responseFormat) {
      const verboseResponse = response as any
      transcription = verboseResponse.text || ''
      language = verboseResponse.language
      duration = verboseResponse.duration
      
      // Calculate average confidence from segments if available
      if (verboseResponse.segments && Array.isArray(verboseResponse.segments)) {
        const confidenceScores = verboseResponse.segments.map((segment: any) => segment.avg_logprob || -3)
        const totalConfidence = confidenceScores.reduce((sum: number, score: number) => sum + score, 0)
        const avgLogProb = totalConfidence / confidenceScores.length
        
        // Convert log probability to confidence score (0-1), with improved scaling
        confidence = Math.max(0, Math.min(1, Math.exp(avgLogProb / 2)))
        
        // Add warnings for low confidence segments
        const lowConfidenceSegments = verboseResponse.segments.filter((segment: any) => 
          segment.avg_logprob < -1.5
        )
        
        if (lowConfidenceSegments.length > verboseResponse.segments.length * 0.3) {
          warnings.push('High number of low-confidence segments detected')
        }
      }
    } else {
      transcription = typeof response === 'string' ? response : (response as any).text || ''
    }

    // Validate transcription quality
    const qualityCheck = await validateTranscriptionQuality(
      transcription, 
      confidence, 
      duration,
      audioValidation.metrics
    )
    
    if (qualityCheck.warnings.length > 0) {
      warnings.push(...qualityCheck.warnings)
    }

    // Handle poor quality transcriptions
    if (qualityCheck.isPoorQuality && callRecordId && userId) {
      await errorHandler.handleAudioQualityError(
        callRecordId,
        userId,
        {
          ...audioValidation.metrics,
          confidence,
          transcriptionLength: transcription.length
        }
      )
    }

    console.log(`✅ Transcription completed in ${processingTime}ms`)
    console.log(`📝 Transcription: "${transcription.substring(0, 100)}${transcription.length > 100 ? '...' : ''}"`)

    return {
      success: true,
      transcription,
      confidence,
      language,
      duration,
      processingTime,
      audioQuality: audioValidation.metrics,
      warnings: warnings.length > 0 ? warnings : undefined
    }

  } catch (error) {
    const processingTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    console.error(`❌ Transcription failed for ${fileName}:`, errorMessage)
    
    // Handle specific error types
    if (errorMessage.includes('timeout')) {
      if (callRecordId && userId) {
        await errorHandler.createError({
          type: ErrorType.PROCESSING_TIMEOUT,
          severity: ErrorSeverity.HIGH,
          message: 'Transcription request timed out',
          details: { fileName, processingTime, error: errorMessage },
          callRecordId,
          userId,
          maxRetries: 2
        })
      }
    } else if (errorMessage.includes('rate limit')) {
      if (callRecordId && userId) {
        await errorHandler.createError({
          type: ErrorType.API_ERROR,
          severity: ErrorSeverity.MEDIUM,
          message: 'OpenAI API rate limit exceeded',
          details: { fileName, error: errorMessage },
          callRecordId,
          userId,
          maxRetries: 3
        })
      }
    } else {
      if (callRecordId && userId) {
        await errorHandler.createError({
          type: ErrorType.TRANSCRIPTION_FAILED,
          severity: ErrorSeverity.HIGH,
          message: 'Transcription processing failed',
          details: { fileName, processingTime, error: errorMessage },
          callRecordId,
          userId,
          maxRetries: 2
        })
      }
    }

    return {
      success: false,
      error: errorMessage,
      processingTime,
      warnings: ['Transcription failed - may require manual review']
    }
  }
}

/**
 * Validate audio file quality and format
 */
async function validateAudioFile(
  audioFile: File | Buffer | Blob,
  fileName: string
): Promise<{
  valid: boolean
  error?: string
  warnings: string[]
  metrics: {
    duration?: number
    snr?: number
    volume?: number
    clarity?: number
    durationSeconds?: number
  }
}> {
  const warnings: string[] = []
  const metrics: any = {}

  try {
    // Get file size
    let fileSize: number
    if (audioFile instanceof File) {
      fileSize = audioFile.size
      metrics.fileSize = fileSize
    } else if (audioFile instanceof Buffer) {
      fileSize = audioFile.length
      metrics.fileSize = fileSize
    } else if (audioFile instanceof Blob) {
      fileSize = audioFile.size
      metrics.fileSize = fileSize
    } else {
      return {
        valid: false,
        error: 'Invalid audio file format',
        warnings: ['Unable to determine file size'],
        metrics
      }
    }

    // Check file size (Whisper has 25MB limit)
    if (fileSize > 25 * 1024 * 1024) {
      return {
        valid: false,
        error: 'Audio file too large (max 25MB for Whisper)',
        warnings: ['File exceeds maximum size limit'],
        metrics
      }
    }

    // Check for very small files (likely poor quality)
    if (fileSize < 1024) {
      warnings.push('Very small audio file - may indicate poor recording')
      metrics.clarity = 0.3
    }

    // Estimate duration from file size (rough approximation)
    const estimatedDuration = fileSize / (128 * 1024 / 8) // Assuming 128kbps
    metrics.durationSeconds = estimatedDuration

    if (estimatedDuration < 5) {
      warnings.push('Very short recording - transcription accuracy may be reduced')
      metrics.clarity = (metrics.clarity || 1.0) * 0.7
    }

    if (estimatedDuration > 300) { // 5 minutes
      warnings.push('Long recording - consider breaking into segments for better accuracy')
    }

    // Basic format validation
    const supportedFormats = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm']
    const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
    
    if (!supportedFormats.some(format => fileName.toLowerCase().endsWith(format))) {
      warnings.push(`Unsupported format ${fileExtension} - may cause transcription issues`)
    }

    // Set default quality metrics
    metrics.volume = metrics.volume || 0.8
    metrics.snr = metrics.snr || 15 // Reasonable default
    metrics.clarity = metrics.clarity || 0.8

    return {
      valid: true,
      warnings,
      metrics
    }

  } catch (error) {
    return {
      valid: false,
      error: `Audio validation failed: ${error}`,
      warnings: ['Unable to validate audio file'],
      metrics
    }
  }
}

/**
 * Validate transcription quality
 */
async function validateTranscriptionQuality(
  transcription: string,
  confidence?: number,
  duration?: number,
  audioMetrics?: any
): Promise<{
  isPoorQuality: boolean
  warnings: string[]
}> {
  const warnings: string[] = []
  let isPoorQuality = false

  // Check transcription length
  if (!transcription || transcription.trim().length === 0) {
    warnings.push('Empty transcription result')
    isPoorQuality = true
    return { isPoorQuality, warnings }
  }

  if (transcription.length < 10) {
    warnings.push('Very short transcription - may indicate audio quality issues')
    isPoorQuality = true
  }

  // Check confidence score
  if (confidence !== undefined) {
    if (confidence < 0.3) {
      warnings.push('Very low transcription confidence')
      isPoorQuality = true
    } else if (confidence < 0.6) {
      warnings.push('Low transcription confidence - review recommended')
    }
  }

  // Check for repetitive or garbled text
  const words = transcription.toLowerCase().split(/\s+/)
  const uniqueWords = new Set(words)
  const repetitiveness = 1 - (uniqueWords.size / words.length)
  
  if (repetitiveness > 0.7 && words.length > 10) {
    warnings.push('Highly repetitive transcription detected')
    isPoorQuality = true
  }

  // Check for common transcription errors
  const errorIndicators = [
    'inaudible',
    '[music]',
    '[background noise]',
    '(unintelligible)',
    'mmm',
    'uh uh uh',
    'ah ah ah'
  ]

  const hasErrorIndicators = errorIndicators.some(indicator => 
    transcription.toLowerCase().includes(indicator)
  )

  if (hasErrorIndicators) {
    warnings.push('Transcription contains audio quality indicators')
  }

  // Duration vs transcription length check
  if (duration && transcription.length > 0) {
    const wordsPerMinute = (words.length / duration) * 60
    
    if (wordsPerMinute < 30) {
      warnings.push('Very slow speech rate detected - may indicate processing issues')
    } else if (wordsPerMinute > 300) {
      warnings.push('Extremely fast speech rate detected - transcription may be inaccurate')
    }
  }

  return { isPoorQuality, warnings }
}

/**
 * Transcribe audio from URL (download and transcribe)
 */
export async function transcribeAudioFromUrl(
  audioUrl: string,
  fileName?: string,
  options: TranscriptionOptions = {},
  callRecordId?: string,
  userId?: string
): Promise<TranscriptionResult> {
  try {
    console.log(`📥 Downloading audio from URL: ${audioUrl}`)

    // Download audio file
    const response = await fetch(audioUrl)
    if (!response.ok) {
      throw new Error(`Failed to download audio: ${response.statusText}`)
    }

    const audioBuffer = await response.arrayBuffer()
    const audioFile = new File([audioBuffer], fileName || 'audio.mp3', {
      type: response.headers.get('content-type') || 'audio/mpeg'
    })

    return await transcribeAudio(audioFile, fileName || 'audio.mp3', options, callRecordId, userId)

  } catch (error) {
    console.error('❌ Failed to download and transcribe audio:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to download audio'
    }
  }
}

/**
 * Process call recording transcription
 */
export async function processCallRecordingTranscription(
  callRecordId: string,
  retryCount: number = 0
): Promise<TranscriptionResult> {
  const maxRetries = 3

  try {
    // Get call record
    const callRecord = await prisma.callRecord.findUnique({
      where: { id: callRecordId },
      include: { user: true }
    })

    if (!callRecord) {
      throw new Error('Call record not found')
    }

    if (!callRecord.recordingUrl) {
      throw new Error('No recording URL available')
    }

    console.log(`🎙️ Processing transcription for call ${callRecord.callSid}`)

    // Check if transcription already exists
    const existingTranscription = await prisma.callTranscription.findFirst({
      where: { callRecordId }
    })

    if (existingTranscription && existingTranscription.transcriptionText) {
      console.log('✅ Transcription already exists')
      return {
        success: true,
        transcription: existingTranscription.transcriptionText,
        confidence: existingTranscription.confidenceScore || undefined,
        processingTime: existingTranscription.processingTime || undefined
      }
    }

    // Get audio URL (use signed URL if stored in our storage)
    let audioUrl = callRecord.recordingUrl
    if (callRecord.recordingStorageKey) {
      const signedUrl = await getRecordingSignedUrl(callRecord.recordingStorageKey, 3600)
      if (signedUrl) {
        audioUrl = signedUrl
        console.log('🔐 Using signed URL for transcription')
      }
    }

    // Set up transcription options with context prompt
    const options: TranscriptionOptions = {
      model: 'whisper-1',
      responseFormat: 'verbose_json',
      temperature: 0,
      prompt: 'This is a phone call to a service business. The caller may be requesting plumbing, electrical, HVAC, or other home services. Listen for appointment requests, service descriptions, contact information, addresses, and scheduling preferences.'
    }

    // Perform transcription with enhanced error handling
    const fileName = `call_${callRecord.callSid}_${callRecord.id}.mp3`
    const result = await transcribeAudioFromUrl(audioUrl, fileName, options, callRecordId, callRecord.userId)

    if (result.success && result.transcription) {
      // Store transcription in database
      await prisma.callTranscription.upsert({
        where: { callRecordId },
        update: {
          transcriptionText: result.transcription,
          language: result.language || 'en',
          confidenceScore: result.confidence,
          processingTime: result.processingTime,
          audioFormat: callRecord.recordingFormat || 'mp3',
          audioDuration: result.duration || callRecord.duration,
          whisperModel: options.model || 'whisper-1'
        },
        create: {
          callRecordId,
          userId: callRecord.userId,
          transcriptionText: result.transcription,
          language: result.language || 'en',
          confidenceScore: result.confidence,
          processingTime: result.processingTime,
          audioFormat: callRecord.recordingFormat || 'mp3',
          audioDuration: result.duration || callRecord.duration,
          whisperModel: options.model || 'whisper-1'
        }
      })

      // Update call record with transcription
      await prisma.callRecord.update({
        where: { id: callRecordId },
        data: {
          transcription: result.transcription,
          rawTranscription: result.transcription
        }
      })

      console.log(`✅ Transcription stored for call ${callRecord.callSid}`)
      
      // Trigger appointment extraction in background
      console.log(`🧠 Starting appointment extraction...`)
      const { processAppointmentExtraction } = await import('./appointment-extraction')
      processAppointmentExtraction(callRecordId).catch(error => {
        console.error('❌ Appointment extraction failed:', error)
      })
      
      return result
    } else {
      throw new Error(result.error || 'Transcription failed')
    }

  } catch (error) {
    console.error(`❌ Transcription processing failed (attempt ${retryCount + 1}):`, error)

    // Retry logic
    if (retryCount < maxRetries) {
      console.log(`🔄 Retrying transcription (${retryCount + 1}/${maxRetries})...`)
      
      // Exponential backoff
      const delay = Math.pow(2, retryCount) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
      
      return processCallRecordingTranscription(callRecordId, retryCount + 1)
    }

    // Mark transcription as failed
    await prisma.callTranscription.upsert({
      where: { callRecordId },
      update: {
        transcriptionText: `[TRANSCRIPTION FAILED: ${error instanceof Error ? error.message : 'Unknown error'}]`,
        confidenceScore: 0
      },
      create: {
        callRecordId,
        userId: (await prisma.callRecord.findUnique({ where: { id: callRecordId } }))?.userId || '',
        transcriptionText: `[TRANSCRIPTION FAILED: ${error instanceof Error ? error.message : 'Unknown error'}]`,
        confidenceScore: 0,
        language: 'en',
        whisperModel: 'whisper-1'
      }
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transcription processing failed'
    }
  }
}

/**
 * Get transcription for call record
 */
export async function getCallTranscription(callRecordId: string) {
  try {
    const transcription = await prisma.callTranscription.findUnique({
      where: { callRecordId },
      include: {
        callRecord: {
          select: {
            callSid: true,
            phoneNumber: true,
            duration: true,
            createdAt: true
          }
        }
      }
    })

    return transcription
  } catch (error) {
    console.error('Error getting transcription:', error)
    return null
  }
}

/**
 * Batch process multiple call recordings
 */
export async function batchProcessTranscriptions(
  callRecordIds: string[],
  concurrency: number = 3
): Promise<{ success: number; failed: number; results: TranscriptionResult[] }> {
  console.log(`🔄 Starting batch transcription of ${callRecordIds.length} recordings`)

  const results: TranscriptionResult[] = []
  let success = 0
  let failed = 0

  // Process in batches to avoid overwhelming the API
  for (let i = 0; i < callRecordIds.length; i += concurrency) {
    const batch = callRecordIds.slice(i, i + concurrency)
    const batchPromises = batch.map(id => processCallRecordingTranscription(id))
    
    const batchResults = await Promise.allSettled(batchPromises)
    
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value)
        if (result.value.success) {
          success++
        } else {
          failed++
        }
      } else {
        results.push({
          success: false,
          error: result.reason?.message || 'Unknown error'
        })
        failed++
      }
    }

    // Small delay between batches
    if (i + concurrency < callRecordIds.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  console.log(`✅ Batch processing completed: ${success} successful, ${failed} failed`)
  
  return { success, failed, results }
}

/**
 * Get transcription statistics for user
 */
export async function getTranscriptionStats(userId: string) {
  try {
    const stats = await prisma.callTranscription.aggregate({
      where: { userId },
      _count: { id: true },
      _avg: {
        confidenceScore: true,
        processingTime: true,
        audioDuration: true
      }
    })

    const recentTranscriptions = await prisma.callTranscription.findMany({
      where: { userId },
      include: {
        callRecord: {
          select: {
            callSid: true,
            phoneNumber: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    return {
      total: stats._count.id,
      averageConfidence: stats._avg.confidenceScore,
      averageProcessingTime: stats._avg.processingTime,
      averageDuration: stats._avg.audioDuration,
      recent: recentTranscriptions
    }
  } catch (error) {
    console.error('Error getting transcription stats:', error)
    return null
  }
}