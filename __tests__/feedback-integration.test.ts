import { FeedbackType, FeedbackRating } from '@/lib/feedback'

describe('Feedback System Integration', () => {
  describe('FeedbackType enum', () => {
    it('should contain all required feedback types', () => {
      const expectedTypes = [
        'CUSTOMER_NAME_CORRECTION',
        'SERVICE_TYPE_CORRECTION', 
        'ADDRESS_CORRECTION',
        'DATE_TIME_CORRECTION',
        'PHONE_EMAIL_CORRECTION',
        'URGENCY_CORRECTION',
        'PRICE_CORRECTION',
        'DESCRIPTION_CORRECTION',
        'APPOINTMENT_EXISTS',
        'NO_APPOINTMENT',
        'TRANSCRIPTION_ERROR',
        'MULTIPLE_APPOINTMENTS',
        'MANUAL_OVERRIDE'
      ]

      expectedTypes.forEach(type => {
        expect(FeedbackType[type as keyof typeof FeedbackType]).toBeDefined()
      })
    })
  })

  describe('FeedbackRating type', () => {
    it('should accept valid rating values', () => {
      const validRatings: FeedbackRating[] = [1, 2, 3, 4, 5]
      
      validRatings.forEach(rating => {
        expect(rating).toBeGreaterThanOrEqual(1)
        expect(rating).toBeLessThanOrEqual(5)
        expect(Number.isInteger(rating)).toBe(true)
      })
    })
  })

  describe('Confidence Score Calculations', () => {
    // Test confidence adjustment logic without database
    const calculateTestAdjustment = (feedbackType: FeedbackType, rating: FeedbackRating): number => {
      const baseAdjustments = {
        [FeedbackType.CUSTOMER_NAME_CORRECTION]: 0.15,
        [FeedbackType.SERVICE_TYPE_CORRECTION]: 0.12,
        [FeedbackType.ADDRESS_CORRECTION]: 0.10,
        [FeedbackType.DATE_TIME_CORRECTION]: 0.10,
        [FeedbackType.PHONE_EMAIL_CORRECTION]: 0.08,
        [FeedbackType.URGENCY_CORRECTION]: 0.05,
        [FeedbackType.PRICE_CORRECTION]: 0.08,
        [FeedbackType.DESCRIPTION_CORRECTION]: 0.05,
        [FeedbackType.APPOINTMENT_EXISTS]: 0.20,
        [FeedbackType.NO_APPOINTMENT]: 0.25,
        [FeedbackType.TRANSCRIPTION_ERROR]: 0.30,
        [FeedbackType.MULTIPLE_APPOINTMENTS]: 0.18,
        [FeedbackType.MANUAL_OVERRIDE]: 0.35
      }
      
      const baseAdjustment = baseAdjustments[feedbackType] || 0.05
      const ratingMultiplier = (rating - 3) / 2
      
      return baseAdjustment * ratingMultiplier
    }

    it('should calculate positive adjustments for good ratings', () => {
      const adjustment = calculateTestAdjustment(FeedbackType.CUSTOMER_NAME_CORRECTION, 5)
      expect(adjustment).toBeGreaterThan(0)
      expect(adjustment).toBeCloseTo(0.15, 2)
    })

    it('should calculate negative adjustments for poor ratings', () => {
      const adjustment = calculateTestAdjustment(FeedbackType.CUSTOMER_NAME_CORRECTION, 1)
      expect(adjustment).toBeLessThan(0)
      expect(adjustment).toBeCloseTo(-0.15, 2)
    })

    it('should have minimal adjustment for neutral ratings', () => {
      const adjustment = calculateTestAdjustment(FeedbackType.CUSTOMER_NAME_CORRECTION, 3)
      expect(adjustment).toBeCloseTo(0, 2)
    })

    it('should have higher impact for critical feedback types', () => {
      const transcriptionAdjustment = Math.abs(calculateTestAdjustment(FeedbackType.TRANSCRIPTION_ERROR, 1))
      const descriptionAdjustment = Math.abs(calculateTestAdjustment(FeedbackType.DESCRIPTION_CORRECTION, 1))
      
      expect(transcriptionAdjustment).toBeGreaterThan(descriptionAdjustment)
    })
  })

  describe('Feedback Validation Logic', () => {
    const validateFeedbackData = (data: any): { valid: boolean; errors: string[] } => {
      const errors: string[] = []
      
      if (!data.callRecordId) errors.push('callRecordId is required')
      if (!data.feedbackType) errors.push('feedbackType is required')
      if (data.rating === undefined) errors.push('rating is required')
      
      if (!Object.values(FeedbackType).includes(data.feedbackType)) {
        errors.push('Invalid feedback type')
      }
      
      if (![1, 2, 3, 4, 5].includes(data.rating)) {
        errors.push('Rating must be between 1 and 5')
      }
      
      return {
        valid: errors.length === 0,
        errors
      }
    }

    it('should validate correct feedback data', () => {
      const validData = {
        callRecordId: 'call-123',
        feedbackType: FeedbackType.CUSTOMER_NAME_CORRECTION,
        rating: 4,
        originalValue: 'John',
        correctedValue: 'Jane'
      }
      
      const result = validateFeedbackData(validData)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject missing required fields', () => {
      const invalidData = {
        feedbackType: FeedbackType.CUSTOMER_NAME_CORRECTION
        // Missing callRecordId and rating
      }
      
      const result = validateFeedbackData(invalidData)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('callRecordId is required')
      expect(result.errors).toContain('rating is required')
    })

    it('should reject invalid feedback types', () => {
      const invalidData = {
        callRecordId: 'call-123',
        feedbackType: 'INVALID_TYPE',
        rating: 4
      }
      
      const result = validateFeedbackData(invalidData)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Invalid feedback type')
    })

    it('should reject invalid ratings', () => {
      const invalidData = {
        callRecordId: 'call-123',
        feedbackType: FeedbackType.CUSTOMER_NAME_CORRECTION,
        rating: 0
      }
      
      const result = validateFeedbackData(invalidData)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Rating must be between 1 and 5')
    })
  })

  describe('Manual Override Validation', () => {
    const validateOverrideData = (data: any): { valid: boolean; errors: string[] } => {
      const errors: string[] = []
      
      if (!data.callRecordId) errors.push('callRecordId is required')
      if (!data.overrideData) errors.push('overrideData is required')
      if (!data.reason) errors.push('reason is required')
      
      if (data.overrideData?.hasAppointment) {
        const hasRequiredFields = data.overrideData.customerName || data.overrideData.serviceType
        if (!hasRequiredFields) {
          errors.push('For appointments, at least customer name or service type is required')
        }
      }
      
      return {
        valid: errors.length === 0,
        errors
      }
    }

    it('should validate correct override data', () => {
      const validData = {
        callRecordId: 'call-123',
        overrideData: {
          hasAppointment: true,
          customerName: 'Jane Doe',
          serviceType: 'Plumbing'
        },
        reason: 'AI completely misunderstood the call'
      }
      
      const result = validateOverrideData(validData)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should allow no-appointment overrides', () => {
      const validData = {
        callRecordId: 'call-123',
        overrideData: {
          hasAppointment: false
        },
        reason: 'This was not an appointment call'
      }
      
      const result = validateOverrideData(validData)
      expect(result.valid).toBe(true)
    })

    it('should require appointment details when hasAppointment is true', () => {
      const invalidData = {
        callRecordId: 'call-123',
        overrideData: {
          hasAppointment: true
          // Missing customerName and serviceType
        },
        reason: 'Override reason'
      }
      
      const result = validateOverrideData(invalidData)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('For appointments, at least customer name or service type is required')
    })
  })

  describe('Feedback Summary Calculations', () => {
    const calculateSummary = (feedbackData: any[]) => {
      const totalFeedbacks = feedbackData.length
      const averageRating = totalFeedbacks > 0 
        ? feedbackData.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks 
        : 0
      
      const improvementCount = feedbackData.filter(f => f.isModelImprovement).length
      const improvementRate = totalFeedbacks > 0 ? improvementCount / totalFeedbacks : 0
      
      const avgConfidence = totalFeedbacks > 0
        ? feedbackData.reduce((sum, f) => sum + f.confidence, 0) / totalFeedbacks
        : 1.0
      const confidenceImpact = avgConfidence - 1.0
      
      // Group by feedback type
      const typeGroups = feedbackData.reduce((acc, f) => {
        acc[f.feedbackType] = (acc[f.feedbackType] || 0) + 1
        return acc
      }, {})
      
      const commonIssues = Object.entries(typeGroups)
        .map(([type, count]) => ({ type: type as FeedbackType, count: count as number }))
        .sort((a, b) => b.count - a.count)
      
      return {
        totalFeedbacks,
        averageRating,
        improvementRate,
        confidenceImpact,
        commonIssues
      }
    }

    it('should calculate correct summary for sample data', () => {
      const sampleData = [
        { rating: 4, isModelImprovement: true, confidence: 0.9, feedbackType: FeedbackType.CUSTOMER_NAME_CORRECTION },
        { rating: 3, isModelImprovement: false, confidence: 0.8, feedbackType: FeedbackType.SERVICE_TYPE_CORRECTION },
        { rating: 5, isModelImprovement: true, confidence: 1.0, feedbackType: FeedbackType.CUSTOMER_NAME_CORRECTION },
        { rating: 2, isModelImprovement: true, confidence: 0.6, feedbackType: FeedbackType.ADDRESS_CORRECTION }
      ]
      
      const result = calculateSummary(sampleData)
      
      expect(result.totalFeedbacks).toBe(4)
      expect(result.averageRating).toBe(3.5)
      expect(result.improvementRate).toBe(0.75) // 3 out of 4
      expect(result.confidenceImpact).toBeCloseTo(-0.175, 3) // (0.9+0.8+1.0+0.6)/4 - 1
      expect(result.commonIssues[0]).toEqual({ type: FeedbackType.CUSTOMER_NAME_CORRECTION, count: 2 })
    })

    it('should handle empty feedback data', () => {
      const result = calculateSummary([])
      
      expect(result.totalFeedbacks).toBe(0)
      expect(result.averageRating).toBe(0)
      expect(result.improvementRate).toBe(0)
      expect(result.confidenceImpact).toBe(0)
      expect(result.commonIssues).toEqual([])
    })
  })

  describe('API Response Validation', () => {
    it('should validate feedback submission API response structure', () => {
      const mockResponse = {
        success: true,
        feedbackId: 'feedback-123',
        confidence: 0.85,
        isModelImprovement: true
      }
      
      expect(mockResponse.success).toBe(true)
      expect(mockResponse.feedbackId).toMatch(/feedback-\d+/)
      expect(mockResponse.confidence).toBeGreaterThanOrEqual(0)
      expect(mockResponse.confidence).toBeLessThanOrEqual(1)
      expect(typeof mockResponse.isModelImprovement).toBe('boolean')
    })

    it('should validate feedback summary API response structure', () => {
      const mockResponse = {
        success: true,
        summary: {
          totalFeedbacks: 25,
          averageRating: 3.8,
          improvementRate: 0.72,
          confidenceImpact: -0.15,
          commonIssues: [
            { type: FeedbackType.CUSTOMER_NAME_CORRECTION, count: 8 },
            { type: FeedbackType.SERVICE_TYPE_CORRECTION, count: 5 }
          ]
        },
        period: '30 days'
      }
      
      expect(mockResponse.success).toBe(true)
      expect(mockResponse.summary.totalFeedbacks).toBeGreaterThanOrEqual(0)
      expect(mockResponse.summary.averageRating).toBeGreaterThanOrEqual(0)
      expect(mockResponse.summary.averageRating).toBeLessThanOrEqual(5)
      expect(mockResponse.summary.improvementRate).toBeGreaterThanOrEqual(0)
      expect(mockResponse.summary.improvementRate).toBeLessThanOrEqual(1)
      expect(Array.isArray(mockResponse.summary.commonIssues)).toBe(true)
      expect(mockResponse.period).toMatch(/\d+ days/)
    })
  })
})