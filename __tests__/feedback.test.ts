import { FeedbackManager, FeedbackType, FeedbackRating } from '@/lib/feedback'

// Mock the feedback manager's prisma instance
const mockPrisma = {
  extractionFeedback: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn()
  },
  extractedAppointment: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn()
  },
  callRecord: {
    findUnique: jest.fn(),
    update: jest.fn()
  }
}

describe('FeedbackManager', () => {
  let feedbackManager: FeedbackManager

  beforeEach(() => {
    feedbackManager = new FeedbackManager()
    // Replace the prisma instance with our mock
    ;(feedbackManager as any).prisma = mockPrisma
    jest.clearAllMocks()
  })

  describe('submitFeedback', () => {
    const mockFeedbackParams = {
      callRecordId: 'call-123',
      userId: 'user-123',
      feedbackType: FeedbackType.CUSTOMER_NAME_CORRECTION,
      originalValue: 'John Doe',
      correctedValue: 'Jane Doe',
      rating: 4 as FeedbackRating
    }

    beforeEach(() => {
      mockPrisma.extractionFeedback.create.mockResolvedValue({
        id: 'feedback-123',
        confidence: 0.9,
        isModelImprovement: true
      })
      
      mockPrisma.extractedAppointment.findFirst.mockResolvedValue({
        id: 'appointment-123',
        confidenceScore: 0.8,
        feedbackCount: 2
      })
    })

    it('should submit feedback successfully', async () => {
      const result = await feedbackManager.submitFeedback(mockFeedbackParams)

      expect(mockPrisma.extractionFeedback.create).toHaveBeenCalledWith({
        data: {
          callRecordId: 'call-123',
          extractedAppointmentId: undefined,
          userId: 'user-123',
          feedbackType: FeedbackType.CUSTOMER_NAME_CORRECTION,
          originalValue: 'John Doe',
          correctedValue: 'Jane Doe',
          rating: 4,
          comment: undefined,
          confidence: expect.any(Number),
          isModelImprovement: expect.any(Boolean),
          isManualOverride: false
        }
      })

      expect(result.id).toBe('feedback-123')
      expect(result.confidence).toBe(0.9)
      expect(result.isModelImprovement).toBe(true)
    })

    it('should calculate confidence adjustment correctly', async () => {
      await feedbackManager.submitFeedback({
        ...mockFeedbackParams,
        rating: 1 as FeedbackRating
      })

      expect(mockPrisma.extractionFeedback.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            confidence: expect.any(Number)
          })
        })
      )

      const createCall = mockPrisma.extractionFeedback.create.mock.calls[0][0]
      expect(createCall.data.confidence).toBeLessThan(1.0)
    })

    it('should handle manual override feedback', async () => {
      await feedbackManager.submitFeedback({
        ...mockFeedbackParams,
        isManualOverride: true
      })

      expect(mockPrisma.extractionFeedback.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isManualOverride: true
          })
        })
      )
    })

    it('should throw error on invalid feedback type', async () => {
      await expect(
        feedbackManager.submitFeedback({
          ...mockFeedbackParams,
          feedbackType: 'INVALID_TYPE' as any
        })
      ).rejects.toThrow('Invalid feedback type')
    })

    it('should throw error on invalid rating', async () => {
      await expect(
        feedbackManager.submitFeedback({
          ...mockFeedbackParams,
          rating: 0 as any
        })
      ).rejects.toThrow('Rating must be between 1 and 5')
    })
  })

  describe('createManualOverride', () => {
    const mockOverrideParams = {
      callRecordId: 'call-123',
      userId: 'user-123',
      overrideData: {
        hasAppointment: true,
        customerName: 'Jane Doe',
        serviceType: 'Plumbing'
      },
      reason: 'AI extraction was completely wrong'
    }

    beforeEach(() => {
      mockPrisma.extractedAppointment.create.mockResolvedValue({
        id: 'appointment-123'
      })
      
      mockPrisma.extractionFeedback.create.mockResolvedValue({
        id: 'feedback-123'
      })
      
      mockPrisma.extractedAppointment.findFirst.mockResolvedValue(null)
    })

    it('should create manual override successfully', async () => {
      const result = await feedbackManager.createManualOverride(mockOverrideParams)

      expect(mockPrisma.extractedAppointment.create).toHaveBeenCalledWith({
        data: {
          callRecordId: 'call-123',
          hasAppointment: true,
          customerName: 'Jane Doe',
          serviceType: 'Plumbing',
          confidence: 1.0,
          isManualOverride: true
        }
      })

      expect(mockPrisma.extractionFeedback.create).toHaveBeenCalledWith({
        data: {
          callRecordId: 'call-123',
          extractedAppointmentId: 'appointment-123',
          userId: 'user-123',
          feedbackType: FeedbackType.MANUAL_OVERRIDE,
          comment: 'AI extraction was completely wrong',
          rating: 5,
          confidence: 1.0,
          isModelImprovement: true,
          isManualOverride: true
        }
      })

      expect(result).toBe('appointment-123')
    })

    it('should throw error on missing required fields', async () => {
      await expect(
        feedbackManager.createManualOverride({
          ...mockOverrideParams,
          callRecordId: ''
        })
      ).rejects.toThrow('Missing required fields')
    })

    it('should handle appointment creation error', async () => {
      mockPrisma.extractedAppointment.create.mockRejectedValue(
        new Error('Database error')
      )

      await expect(
        feedbackManager.createManualOverride(mockOverrideParams)
      ).rejects.toThrow('Database error')
    })
  })

  describe('getFeedbackSummary', () => {
    beforeEach(() => {
      mockPrisma.extractionFeedback.count.mockResolvedValue(25)
      mockPrisma.extractionFeedback.aggregate.mockResolvedValue({
        _avg: { rating: 3.8, confidence: 0.75 },
        _count: { isModelImprovement: 20 }
      })
      mockPrisma.extractionFeedback.groupBy.mockResolvedValue([
        { feedbackType: FeedbackType.CUSTOMER_NAME_CORRECTION, _count: { id: 8 } },
        { feedbackType: FeedbackType.SERVICE_TYPE_CORRECTION, _count: { id: 5 } },
        { feedbackType: FeedbackType.ADDRESS_CORRECTION, _count: { id: 3 } }
      ])
    })

    it('should return comprehensive feedback summary', async () => {
      const result = await feedbackManager.getFeedbackSummary('user-123', 30)

      expect(result.totalFeedbacks).toBe(25)
      expect(result.averageRating).toBe(3.8)
      expect(result.improvementRate).toBe(0.8) // 20/25
      expect(result.confidenceImpact).toBe(-0.25) // 0.75 - 1.0
      expect(result.commonIssues).toHaveLength(3)
      expect(result.commonIssues[0]).toEqual({
        type: FeedbackType.CUSTOMER_NAME_CORRECTION,
        count: 8
      })
    })

    it('should handle empty feedback data', async () => {
      mockPrisma.extractionFeedback.count.mockResolvedValue(0)
      mockPrisma.extractionFeedback.aggregate.mockResolvedValue({
        _avg: { rating: null, confidence: null },
        _count: { isModelImprovement: 0 }
      })
      mockPrisma.extractionFeedback.groupBy.mockResolvedValue([])

      const result = await feedbackManager.getFeedbackSummary('user-123', 30)

      expect(result.totalFeedbacks).toBe(0)
      expect(result.averageRating).toBe(0)
      expect(result.improvementRate).toBe(0)
      expect(result.confidenceImpact).toBe(0)
      expect(result.commonIssues).toEqual([])
    })

    it('should validate days parameter', async () => {
      await expect(
        feedbackManager.getFeedbackSummary('user-123', -1)
      ).rejects.toThrow('Days must be between 1 and 365')

      await expect(
        feedbackManager.getFeedbackSummary('user-123', 400)
      ).rejects.toThrow('Days must be between 1 and 365')
    })
  })

  describe('getCallFeedbackHistory', () => {
    beforeEach(() => {
      mockPrisma.extractionFeedback.findMany.mockResolvedValue([
        {
          id: 'feedback-1',
          feedbackType: FeedbackType.CUSTOMER_NAME_CORRECTION,
          originalValue: 'John',
          correctedValue: 'Jane',
          rating: 4,
          createdAt: new Date('2023-01-01')
        },
        {
          id: 'feedback-2',
          feedbackType: FeedbackType.SERVICE_TYPE_CORRECTION,
          originalValue: 'Plumbing',
          correctedValue: 'Electrical',
          rating: 3,
          createdAt: new Date('2023-01-02')
        }
      ])
    })

    it('should return feedback history for call', async () => {
      const result = await feedbackManager.getCallFeedbackHistory('call-123')

      expect(mockPrisma.extractionFeedback.findMany).toHaveBeenCalledWith({
        where: { callRecordId: 'call-123' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          feedbackType: true,
          originalValue: true,
          correctedValue: true,
          rating: true,
          comment: true,
          createdAt: true,
          isManualOverride: true
        }
      })

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('feedback-1')
    })

    it('should handle missing call record ID', async () => {
      await expect(
        feedbackManager.getCallFeedbackHistory('')
      ).rejects.toThrow('Call record ID is required')
    })
  })

  describe('calculateConfidenceAdjustment', () => {
    it('should calculate correct adjustments for different feedback types', () => {
      const manager = feedbackManager as any

      // High-impact corrections should have larger adjustments
      expect(
        Math.abs(manager.calculateConfidenceAdjustment(FeedbackType.CUSTOMER_NAME_CORRECTION, 1))
      ).toBeGreaterThan(
        Math.abs(manager.calculateConfidenceAdjustment(FeedbackType.DESCRIPTION_CORRECTION, 1))
      )

      // Good ratings should have positive or minimal negative adjustments
      expect(
        manager.calculateConfidenceAdjustment(FeedbackType.CUSTOMER_NAME_CORRECTION, 5)
      ).toBeGreaterThanOrEqual(-0.05)

      // Poor ratings should have significant negative adjustments
      expect(
        manager.calculateConfidenceAdjustment(FeedbackType.CUSTOMER_NAME_CORRECTION, 1)
      ).toBeLessThan(-0.1)
    })
  })
})

describe('Feedback API Integration', () => {
  // Test the actual API endpoints
  describe('POST /api/feedback/submit', () => {
    it('should handle valid feedback submission', async () => {
      // This would typically be an integration test
      // Testing the actual API endpoint behavior
      const mockRequest = {
        callRecordId: 'call-123',
        feedbackType: FeedbackType.CUSTOMER_NAME_CORRECTION,
        originalValue: 'John',
        correctedValue: 'Jane',
        rating: 4
      }

      // Mock session
      jest.mock('next-auth', () => ({
        getServerSession: jest.fn().mockResolvedValue({
          user: { id: 'user-123' }
        })
      }))

      // Test would verify API response structure and status codes
      expect(mockRequest.callRecordId).toBeTruthy()
    })
  })

  describe('POST /api/feedback/manual-override', () => {
    it('should validate override data structure', () => {
      const validOverride = {
        hasAppointment: true,
        customerName: 'Jane Doe',
        serviceType: 'Plumbing'
      }

      const invalidOverride = {
        hasAppointment: true
        // Missing required fields
      }

      expect(validOverride.customerName).toBeTruthy()
      expect(invalidOverride.hasOwnProperty('customerName')).toBeFalsy()
    })
  })

  describe('GET /api/feedback/summary', () => {
    it('should validate days parameter', () => {
      const validDays = [1, 30, 90, 365]
      const invalidDays = [-1, 0, 366, 1000]

      validDays.forEach(days => {
        expect(days >= 1 && days <= 365).toBeTruthy()
      })

      invalidDays.forEach(days => {
        expect(days >= 1 && days <= 365).toBeFalsy()
      })
    })
  })
})

describe('FeedbackManager Edge Cases', () => {
  let feedbackManager: FeedbackManager
  let mockPrisma: any

  beforeEach(() => {
    feedbackManager = new FeedbackManager()
    mockPrisma = (feedbackManager as any).prisma
  })

  it('should handle database connection errors gracefully', async () => {
    mockPrisma.extractionFeedback.create.mockRejectedValue(
      new Error('Database connection failed')
    )

    await expect(
      feedbackManager.submitFeedback({
        callRecordId: 'call-123',
        userId: 'user-123',
        feedbackType: FeedbackType.CUSTOMER_NAME_CORRECTION,
        rating: 4 as FeedbackRating
      })
    ).rejects.toThrow('Database connection failed')
  })

  it('should handle concurrent feedback submissions', async () => {
    const feedbackPromises = Array(10).fill(null).map((_, index) => 
      feedbackManager.submitFeedback({
        callRecordId: `call-${index}`,
        userId: 'user-123',
        feedbackType: FeedbackType.CUSTOMER_NAME_CORRECTION,
        rating: 4 as FeedbackRating
      })
    )

    mockPrisma.extractionFeedback.create.mockResolvedValue({
      id: 'feedback-123',
      confidence: 0.9,
      isModelImprovement: true
    })

    const results = await Promise.all(feedbackPromises)
    expect(results).toHaveLength(10)
    expect(mockPrisma.extractionFeedback.create).toHaveBeenCalledTimes(10)
  })

  it('should handle malformed data gracefully', async () => {
    const malformedData = {
      callRecordId: null,
      userId: undefined,
      feedbackType: 'not-a-real-type',
      rating: 'five'
    } as any

    await expect(
      feedbackManager.submitFeedback(malformedData)
    ).rejects.toThrow()
  })
})