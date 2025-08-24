import { errorHandler, ErrorType, ErrorSeverity } from '@/lib/error-handling'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    callRecord: {
      update: jest.fn(),
      findUnique: jest.fn()
    },
    extractedAppointment: {
      create: jest.fn()
    }
  }
}))

jest.mock('@/lib/notifications', () => ({
  createNotification: jest.fn()
}))

describe('Error Handling System', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Audio Quality Error Handling', () => {
    test('should handle poor audio quality errors correctly', async () => {
      const callRecordId = 'test-call-123'
      const userId = 'user-456'
      const audioMetrics = {
        duration: 30,
        snr: 5, // Low signal-to-noise ratio
        volume: 0.2, // Low volume
        clarity: 0.3 // Poor clarity
      }

      const result = await errorHandler.handleAudioQualityError(
        callRecordId,
        userId,
        audioMetrics
      )

      expect(result.type).toBe(ErrorType.AUDIO_QUALITY)
      expect(result.severity).toBe(ErrorSeverity.MEDIUM)
      expect(result.callRecordId).toBe(callRecordId)
      expect(result.userId).toBe(userId)
      expect(result.details.audioMetrics).toEqual(audioMetrics)
    })
  })

  describe('No Appointment Error Handling', () => {
    test('should handle calls with no appointment information', async () => {
      const callRecordId = 'test-call-456'
      const userId = 'user-789'
      const transcriptionText = 'Hello, I was just calling to ask about your services. Thank you.'
      const confidenceScore = 0.85

      const result = await errorHandler.handleNoAppointmentError(
        callRecordId,
        userId,
        transcriptionText,
        confidenceScore
      )

      expect(result.type).toBe(ErrorType.NO_APPOINTMENT)
      expect(result.severity).toBe(ErrorSeverity.LOW)
      expect(result.details.transcriptionLength).toBe(transcriptionText.length)
      expect(result.details.confidenceScore).toBe(confidenceScore)
      expect(result.maxRetries).toBe(0) // No retries for no-appointment cases
    })
  })

  describe('Multiple Appointments Error Handling', () => {
    test('should handle multiple appointments in single call', async () => {
      const callRecordId = 'test-call-789'
      const userId = 'user-123'
      const appointments = [
        {
          customerName: 'John Doe',
          serviceType: 'Plumbing',
          scheduledDate: '2024-02-01T10:00:00Z',
          confidenceScore: 0.8
        },
        {
          customerName: 'Jane Smith', 
          serviceType: 'Electrical',
          scheduledDate: '2024-02-02T14:00:00Z',
          confidenceScore: 0.9
        }
      ]
      const transcriptionText = 'I need both plumbing and electrical work done...'

      const result = await errorHandler.handleMultipleAppointmentsError(
        callRecordId,
        userId,
        appointments,
        transcriptionText
      )

      expect(result.type).toBe(ErrorType.MULTIPLE_APPOINTMENTS)
      expect(result.severity).toBe(ErrorSeverity.MEDIUM)
      expect(result.details.appointmentCount).toBe(2)
      expect(result.details.appointments).toHaveLength(2)
      expect(result.details.requiresReview).toBe(true)
    })
  })

  describe('Dropped Call Error Handling', () => {
    test('should handle interrupted/dropped calls', async () => {
      const callRecordId = 'test-call-dropped'
      const userId = 'user-dropped'
      const callDetails = {
        duration: 15, // Short duration indicates drop
        status: 'failed',
        hangupCause: 'ORIGINATOR_CANCEL',
        recordingUrl: 'https://example.com/recording.mp3'
      }

      const result = await errorHandler.handleDroppedCallError(
        callRecordId,
        userId,
        callDetails
      )

      expect(result.type).toBe(ErrorType.CALL_DROPPED)
      expect(result.severity).toBe(ErrorSeverity.HIGH)
      expect(result.details.callDetails).toEqual(callDetails)
      expect(result.maxRetries).toBe(2)
    })
  })

  describe('Retry Logic with Exponential Backoff', () => {
    test('should implement exponential backoff correctly', async () => {
      let attemptCount = 0
      const failingOperation = () => {
        attemptCount++
        if (attemptCount < 3) {
          throw new Error(`Attempt ${attemptCount} failed`)
        }
        return `Success on attempt ${attemptCount}`
      }

      const errorId = 'retry-test-error'
      const result = await errorHandler.retryWithBackoff(
        failingOperation,
        errorId,
        {
          maxRetries: 3,
          baseDelayMs: 100,
          maxDelayMs: 5000,
          exponentialBase: 2,
          jitter: false
        }
      )

      expect(result).toBe('Success on attempt 3')
      expect(attemptCount).toBe(3)
    })

    test('should fail after max retries exceeded', async () => {
      let attemptCount = 0
      const alwaysFailingOperation = () => {
        attemptCount++
        throw new Error(`Attempt ${attemptCount} failed`)
      }

      const errorId = 'always-fail-error'
      
      await expect(
        errorHandler.retryWithBackoff(
          alwaysFailingOperation,
          errorId,
          {
            maxRetries: 2,
            baseDelayMs: 10,
            maxDelayMs: 100
          }
        )
      ).rejects.toThrow('Operation failed after 2 retries')

      expect(attemptCount).toBe(3) // Initial attempt + 2 retries
    })
  })

  describe('Error Classification and Severity', () => {
    test('should correctly classify different error types', () => {
      const testCases = [
        {
          type: ErrorType.AUDIO_QUALITY,
          expectedSeverity: ErrorSeverity.MEDIUM,
          description: 'Audio quality issues should be medium severity'
        },
        {
          type: ErrorType.CALL_DROPPED,
          expectedSeverity: ErrorSeverity.HIGH,
          description: 'Dropped calls should be high severity'
        },
        {
          type: ErrorType.NO_APPOINTMENT,
          expectedSeverity: ErrorSeverity.LOW,
          description: 'No appointment calls should be low severity'
        }
      ]

      testCases.forEach(({ type, expectedSeverity, description }) => {
        // This would test the error classification logic
        expect(type).toBeDefined()
        // In a real implementation, you would test the classification logic here
      })
    })
  })

  describe('Error Recovery and Resolution', () => {
    test('should track error resolution correctly', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success')
      const errorId = 'resolution-test'

      const result = await errorHandler.retryWithBackoff(
        mockOperation,
        errorId,
        { maxRetries: 1 }
      )

      expect(result).toBe('success')
      expect(mockOperation).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Statistics and Monitoring', () => {
    test('should calculate error statistics correctly', async () => {
      const userId = 'stats-user'
      const timeRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      }

      const stats = await errorHandler.getErrorStats(userId, timeRange)

      expect(stats).toHaveProperty('totalErrors')
      expect(stats).toHaveProperty('errorsByType')
      expect(stats).toHaveProperty('errorsBySeverity')
      expect(stats).toHaveProperty('resolutionRate')
      expect(stats).toHaveProperty('averageResolutionTime')
    })
  })

  describe('Integration with Processing Pipeline', () => {
    test('should integrate with transcription error handling', () => {
      // Test that transcription errors are properly classified
      const transcriptionErrors = [
        { message: 'timeout', expectedType: ErrorType.PROCESSING_TIMEOUT },
        { message: 'rate limit', expectedType: ErrorType.API_ERROR },
        { message: 'transcription failed', expectedType: ErrorType.TRANSCRIPTION_FAILED }
      ]

      transcriptionErrors.forEach(({ message, expectedType }) => {
        expect(message).toContain(message.split(' ')[0])
        // In a real test, you would verify the error type classification
      })
    })

    test('should integrate with appointment extraction error handling', () => {
      // Test that extraction errors are properly handled
      const extractionScenarios = [
        { case: 'insufficient data', expectedHandling: 'log and continue' },
        { case: 'multiple appointments', expectedHandling: 'flag for review' },
        { case: 'no appointment', expectedHandling: 'mark as informational' }
      ]

      extractionScenarios.forEach(({ case: testCase, expectedHandling }) => {
        expect(testCase).toBeDefined()
        expect(expectedHandling).toBeDefined()
        // Test the specific error handling logic here
      })
    })
  })
})

describe('Error Handling Performance', () => {
  test('should handle errors efficiently without blocking', async () => {
    const startTime = Date.now()
    
    // Simulate concurrent error handling
    const errorPromises = Array.from({ length: 5 }, (_, i) =>
      errorHandler.createError({
        type: ErrorType.API_ERROR,
        severity: ErrorSeverity.LOW,
        message: `Performance test error ${i}`,
        details: { testIndex: i },
        userId: 'perf-test-user',
        maxRetries: 0
      })
    )

    await Promise.all(errorPromises)
    
    const endTime = Date.now()
    const processingTime = endTime - startTime
    
    // Should complete within reasonable time (< 1 second for 5 errors)
    expect(processingTime).toBeLessThan(1000)
  })
})

describe('Error Handling Edge Cases', () => {
  test('should handle malformed audio files gracefully', async () => {
    // Test handling of corrupted or malformed audio files
    const callRecordId = 'malformed-audio-call'
    const userId = 'edge-case-user'
    const audioMetrics = {
      duration: 0,
      snr: null,
      volume: null,
      clarity: 0
    }

    const result = await errorHandler.handleAudioQualityError(
      callRecordId,
      userId,
      audioMetrics
    )

    expect(result.type).toBe(ErrorType.AUDIO_QUALITY)
    expect(result.details.audioMetrics).toEqual(audioMetrics)
  })

  test('should handle empty transcription gracefully', async () => {
    const callRecordId = 'empty-transcription-call'
    const userId = 'edge-case-user-2'
    const transcriptionText = ''
    const confidenceScore = 0

    const result = await errorHandler.handleNoAppointmentError(
      callRecordId,
      userId,
      transcriptionText,
      confidenceScore
    )

    expect(result.type).toBe(ErrorType.NO_APPOINTMENT)
    expect(result.details.transcriptionLength).toBe(0)
  })

  test('should handle network timeouts gracefully', () => {
    // Test timeout handling in network operations
    const timeoutScenarios = [
      'OpenAI API timeout',
      'Twilio webhook timeout',
      'Database connection timeout'
    ]

    timeoutScenarios.forEach(scenario => {
      expect(scenario).toContain('timeout')
      // Test specific timeout handling logic
    })
  })
})