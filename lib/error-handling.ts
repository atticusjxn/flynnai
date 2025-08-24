import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'

export enum ErrorType {
  AUDIO_QUALITY = 'AUDIO_QUALITY',
  NO_APPOINTMENT = 'NO_APPOINTMENT', 
  TRANSCRIPTION_FAILED = 'TRANSCRIPTION_FAILED',
  EXTRACTION_FAILED = 'EXTRACTION_FAILED',
  CALL_DROPPED = 'CALL_DROPPED',
  TWILIO_ERROR = 'TWILIO_ERROR',
  API_ERROR = 'API_ERROR',
  PROCESSING_TIMEOUT = 'PROCESSING_TIMEOUT',
  MULTIPLE_APPOINTMENTS = 'MULTIPLE_APPOINTMENTS',
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM', 
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ProcessingError {
  id: string
  type: ErrorType
  severity: ErrorSeverity
  message: string
  details: Record<string, any>
  callRecordId?: string
  userId: string
  retryCount: number
  maxRetries: number
  nextRetryAt?: Date
  resolvedAt?: Date
  createdAt: Date
}

export interface RetryConfig {
  maxRetries: number
  baseDelayMs: number
  maxDelayMs: number
  exponentialBase: number
  jitter: boolean
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 60000,
  exponentialBase: 2,
  jitter: true
}

export class ErrorHandler {
  private static instance: ErrorHandler
  
  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  /**
   * Handle poor audio quality errors
   */
  async handleAudioQualityError(
    callRecordId: string,
    userId: string,
    audioMetrics: {
      duration?: number
      snr?: number
      volume?: number
      clarity?: number
    }
  ): Promise<ProcessingError> {
    const error = await this.createError({
      type: ErrorType.AUDIO_QUALITY,
      severity: ErrorSeverity.MEDIUM,
      message: 'Poor audio quality detected - transcription may be inaccurate',
      details: {
        audioMetrics,
        suggestion: 'Consider requesting customer to call back with better connection',
        autoRetry: false
      },
      callRecordId,
      userId,
      maxRetries: 1
    })

    // Update call record with audio quality warning
    await prisma.callRecord.update({
      where: { id: callRecordId },
      data: {
        status: 'COMPLETED_WITH_WARNINGS',
        processingNotes: 'Audio quality issues detected'
      }
    })

    // Send notification to user about audio quality
    await createNotification(
      userId,
      'WARNING',
      'Poor Audio Quality',
      'Call processed but audio quality was poor. Review transcription for accuracy.',
      {
        data: { callRecordId, audioMetrics },
        priority: 'MEDIUM'
      }
    )

    return error
  }

  /**
   * Handle calls with no appointment information
   */
  async handleNoAppointmentError(
    callRecordId: string,
    userId: string,
    transcriptionText: string,
    confidenceScore: number
  ): Promise<ProcessingError> {
    const error = await this.createError({
      type: ErrorType.NO_APPOINTMENT,
      severity: ErrorSeverity.LOW,
      message: 'No appointment information detected in call',
      details: {
        transcriptionLength: transcriptionText.length,
        confidenceScore,
        suggestion: 'Call may be informational, sales, or wrong number',
        requiresReview: true
      },
      callRecordId,
      userId,
      maxRetries: 0 // Don't retry no-appointment cases
    })

    // Update call record as informational call
    await prisma.callRecord.update({
      where: { id: callRecordId },
      data: {
        status: 'NO_APPOINTMENT_DETECTED',
        processingNotes: 'Call did not contain appointment information'
      }
    })

    // Create informational extraction record
    await prisma.extractedAppointment.create({
      data: {
        callRecordId,
        userId,
        customerName: 'Unknown',
        serviceType: 'Informational Call',
        confidenceScore: 0,
        hasIssues: true,
        extractionNotes: 'No appointment information found in call',
        rawExtraction: {
          classification: 'informational',
          transcription: transcriptionText.substring(0, 500)
        }
      }
    })

    return error
  }

  /**
   * Handle multiple appointments in single call
   */
  async handleMultipleAppointmentsError(
    callRecordId: string,
    userId: string,
    appointments: any[],
    transcriptionText: string
  ): Promise<ProcessingError> {
    const error = await this.createError({
      type: ErrorType.MULTIPLE_APPOINTMENTS,
      severity: ErrorSeverity.MEDIUM,
      message: `Multiple appointments detected in single call (${appointments.length})`,
      details: {
        appointmentCount: appointments.length,
        appointments: appointments.map(apt => ({
          customerName: apt.customerName,
          serviceType: apt.serviceType,
          scheduledDate: apt.scheduledDate,
          confidence: apt.confidenceScore
        })),
        requiresReview: true
      },
      callRecordId,
      userId,
      maxRetries: 0 // Don't retry, needs manual review
    })

    // Update call record
    await prisma.callRecord.update({
      where: { id: callRecordId },
      data: {
        status: 'REQUIRES_REVIEW',
        processingNotes: `Multiple appointments detected: ${appointments.length} appointments found`
      }
    })

    // Create extraction record for manual review
    await prisma.extractedAppointment.create({
      data: {
        callRecordId,
        userId,
        customerName: `Multiple Customers (${appointments.length})`,
        serviceType: 'Multiple Services',
        confidenceScore: Math.max(...appointments.map(apt => apt.confidenceScore || 0)),
        hasIssues: true,
        extractionNotes: `Multiple appointments detected - requires manual processing`,
        rawExtraction: {
          appointments,
          transcription: transcriptionText.substring(0, 1000)
        }
      }
    })

    // Send high-priority notification
    await createNotification(
      userId,
      'INFO',
      'Multiple Appointments Detected',
      `Call contains ${appointments.length} appointments and requires manual review.`,
      {
        data: { callRecordId, appointmentCount: appointments.length },
        priority: 'HIGH'
      }
    )

    return error
  }

  /**
   * Handle dropped/interrupted calls
   */
  async handleDroppedCallError(
    callRecordId: string,
    userId: string,
    callDetails: {
      duration?: number
      status?: string
      hangupCause?: string
      recordingUrl?: string
    }
  ): Promise<ProcessingError> {
    const error = await this.createError({
      type: ErrorType.CALL_DROPPED,
      severity: ErrorSeverity.HIGH,
      message: 'Call was dropped or interrupted during processing',
      details: {
        callDetails,
        suggestion: 'Partial processing may be available if recording exists',
        autoRetry: true
      },
      callRecordId,
      userId,
      maxRetries: 2
    })

    // Update call record
    await prisma.callRecord.update({
      where: { id: callRecordId },
      data: {
        status: 'INTERRUPTED',
        processingNotes: `Call dropped: ${callDetails.hangupCause || 'Unknown cause'}`
      }
    })

    // If recording exists but is short, try partial processing
    if (callDetails.recordingUrl && (callDetails.duration || 0) > 10) {
      await this.scheduleRetry(error.id, 'Attempt partial processing of interrupted call')
    }

    return error
  }

  /**
   * Implement retry logic with exponential backoff
   */
  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    errorId: string,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const fullConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
    let lastError: Error

    for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
      try {
        const result = await operation()
        
        // If successful and this was a retry, mark error as resolved
        if (attempt > 0) {
          await this.resolveError(errorId)
        }
        
        return result
      } catch (error) {
        lastError = error as Error
        
        // Update retry count
        await this.updateRetryCount(errorId, attempt)
        
        if (attempt === fullConfig.maxRetries) {
          // Max retries reached
          await this.markErrorAsFailed(errorId, lastError)
          throw new Error(`Operation failed after ${fullConfig.maxRetries} retries: ${lastError.message}`)
        }

        // Calculate delay for next retry
        const delay = this.calculateRetryDelay(attempt, fullConfig)
        await this.sleep(delay)
      }
    }

    throw lastError!
  }

  /**
   * Create a new processing error
   */
  async createError(params: {
    type: ErrorType
    severity: ErrorSeverity
    message: string
    details: Record<string, any>
    callRecordId?: string
    userId: string
    maxRetries: number
  }): Promise<ProcessingError> {
    const error: ProcessingError = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: params.type,
      severity: params.severity,
      message: params.message,
      details: params.details,
      callRecordId: params.callRecordId,
      userId: params.userId,
      retryCount: 0,
      maxRetries: params.maxRetries,
      createdAt: new Date()
    }

    // Store in database (you would implement actual error storage here)
    console.error(`[${error.severity}] ${error.type}: ${error.message}`, error.details)

    return error
  }

  /**
   * Schedule retry for an error
   */
  private async scheduleRetry(errorId: string, reason: string): Promise<void> {
    const retryDelay = this.calculateRetryDelay(0, DEFAULT_RETRY_CONFIG)
    const nextRetryAt = new Date(Date.now() + retryDelay)
    
    console.log(`Scheduling retry for error ${errorId} at ${nextRetryAt.toISOString()}: ${reason}`)
    
    // In production, you would store this in database and use a job queue
    setTimeout(async () => {
      console.log(`Executing retry for error ${errorId}`)
      // Implement actual retry logic here
    }, retryDelay)
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateRetryDelay(attempt: number, config: RetryConfig): number {
    const exponentialDelay = config.baseDelayMs * Math.pow(config.exponentialBase, attempt)
    const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs)
    
    if (config.jitter) {
      // Add random jitter (±25%)
      const jitterRange = cappedDelay * 0.25
      const jitter = (Math.random() - 0.5) * 2 * jitterRange
      return Math.max(0, cappedDelay + jitter)
    }
    
    return cappedDelay
  }

  /**
   * Update retry count for an error
   */
  private async updateRetryCount(errorId: string, attempt: number): Promise<void> {
    console.log(`Error ${errorId} retry attempt ${attempt}`)
    // In production, update database record
  }

  /**
   * Mark error as resolved
   */
  private async resolveError(errorId: string): Promise<void> {
    console.log(`Error ${errorId} resolved successfully`)
    // In production, update database record with resolvedAt timestamp
  }

  /**
   * Mark error as permanently failed
   */
  private async markErrorAsFailed(errorId: string, error: Error): Promise<void> {
    console.error(`Error ${errorId} failed permanently:`, error.message)
    // In production, update database record and send alert
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get error statistics for monitoring
   */
  async getErrorStats(userId: string, timeRange: { start: Date; end: Date }) {
    // In production, query database for error statistics
    return {
      totalErrors: 0,
      errorsByType: {},
      errorsBySeverity: {},
      resolutionRate: 0,
      averageResolutionTime: 0
    }
  }
}

export const errorHandler = ErrorHandler.getInstance()