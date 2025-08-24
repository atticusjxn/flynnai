import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'

export enum FeedbackType {
  CUSTOMER_NAME_CORRECTION = 'CUSTOMER_NAME_CORRECTION',
  SERVICE_TYPE_CORRECTION = 'SERVICE_TYPE_CORRECTION',
  ADDRESS_CORRECTION = 'ADDRESS_CORRECTION',
  DATE_TIME_CORRECTION = 'DATE_TIME_CORRECTION',
  PHONE_EMAIL_CORRECTION = 'PHONE_EMAIL_CORRECTION',
  URGENCY_CORRECTION = 'URGENCY_CORRECTION',
  PRICE_CORRECTION = 'PRICE_CORRECTION',
  DESCRIPTION_CORRECTION = 'DESCRIPTION_CORRECTION',
  APPOINTMENT_EXISTS = 'APPOINTMENT_EXISTS',
  NO_APPOINTMENT = 'NO_APPOINTMENT',
  TRANSCRIPTION_ERROR = 'TRANSCRIPTION_ERROR',
  MULTIPLE_APPOINTMENTS = 'MULTIPLE_APPOINTMENTS',
  MANUAL_OVERRIDE = 'MANUAL_OVERRIDE'
}

export enum FeedbackRating {
  VERY_POOR = 1,
  POOR = 2,
  FAIR = 3,
  GOOD = 4,
  EXCELLENT = 5
}

export interface ExtractionFeedback {
  id: string
  callRecordId: string
  extractedAppointmentId?: string
  userId: string
  feedbackType: FeedbackType
  originalValue?: any
  correctedValue?: any
  confidence: number
  rating: FeedbackRating
  comment?: string
  isModelImprovement: boolean
  isManualOverride: boolean
  correctedAt: Date
  correctedBy: string // User ID
}

export interface FeedbackSummary {
  totalFeedbacks: number
  averageRating: number
  improvementRate: number
  commonIssues: { type: FeedbackType; count: number }[]
  confidenceImpact: number
}

export class FeedbackManager {
  private static instance: FeedbackManager

  static getInstance(): FeedbackManager {
    if (!FeedbackManager.instance) {
      FeedbackManager.instance = new FeedbackManager()
    }
    return FeedbackManager.instance
  }

  /**
   * Submit feedback for an extraction
   */
  async submitFeedback(params: {
    callRecordId: string
    extractedAppointmentId?: string
    userId: string
    feedbackType: FeedbackType
    originalValue?: any
    correctedValue?: any
    rating: FeedbackRating
    comment?: string
    isManualOverride?: boolean
  }): Promise<ExtractionFeedback> {
    const {
      callRecordId,
      extractedAppointmentId,
      userId,
      feedbackType,
      originalValue,
      correctedValue,
      rating,
      comment,
      isManualOverride = false
    } = params

    // Calculate confidence adjustment based on feedback type and rating
    const confidence = this.calculateConfidenceAdjustment(feedbackType, rating)

    const feedback: ExtractionFeedback = {
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      callRecordId,
      extractedAppointmentId,
      userId,
      feedbackType,
      originalValue,
      correctedValue,
      confidence,
      rating,
      comment,
      isModelImprovement: this.isModelImprovementFeedback(feedbackType, rating),
      isManualOverride,
      correctedAt: new Date(),
      correctedBy: userId
    }

    // Store feedback in database (implement actual storage)
    console.log('💾 Storing feedback:', {
      type: feedback.feedbackType,
      rating: feedback.rating,
      confidence: feedback.confidence,
      callId: feedback.callRecordId
    })

    // Apply corrections to the extraction if provided
    if (correctedValue !== undefined && extractedAppointmentId) {
      await this.applyCorrection(extractedAppointmentId, feedbackType, correctedValue, userId)
    }

    // Update confidence scores based on feedback
    await this.updateExtractionConfidence(callRecordId, feedbackType, confidence)

    // Trigger model improvement if applicable
    if (feedback.isModelImprovement) {
      await this.triggerModelImprovement(feedback)
    }

    // Send notification for manual overrides
    if (isManualOverride) {
      await createNotification(
        userId,
        'INFO',
        'Manual Override Applied',
        `Your correction for ${feedbackType} has been applied to improve future extractions.`,
        {
          data: { callRecordId, feedbackType, rating }
        }
      )
    }

    return feedback
  }

  /**
   * Apply correction to extracted appointment
   */
  private async applyCorrection(
    extractedAppointmentId: string,
    feedbackType: FeedbackType,
    correctedValue: any,
    userId: string
  ): Promise<void> {
    const updateData: any = {
      manualOverride: true,
      lastCorrectedAt: new Date(),
      lastCorrectedBy: userId
    }

    // Map feedback type to database field
    switch (feedbackType) {
      case FeedbackType.CUSTOMER_NAME_CORRECTION:
        updateData.customerName = correctedValue
        break
      case FeedbackType.SERVICE_TYPE_CORRECTION:
        updateData.serviceType = correctedValue
        break
      case FeedbackType.ADDRESS_CORRECTION:
        updateData.serviceAddress = correctedValue
        break
      case FeedbackType.DATE_TIME_CORRECTION:
        if (correctedValue.date) updateData.preferredDate = new Date(correctedValue.date)
        if (correctedValue.time) updateData.preferredTime = correctedValue.time
        if (correctedValue.flexibility) updateData.timeFlexibility = correctedValue.flexibility
        break
      case FeedbackType.PHONE_EMAIL_CORRECTION:
        if (correctedValue.phone) updateData.customerPhone = correctedValue.phone
        if (correctedValue.email) updateData.customerEmail = correctedValue.email
        break
      case FeedbackType.URGENCY_CORRECTION:
        updateData.urgencyLevel = correctedValue
        break
      case FeedbackType.PRICE_CORRECTION:
        if (correctedValue.quoted) updateData.quotedPrice = correctedValue.quoted
        if (correctedValue.budget) updateData.budgetMentioned = correctedValue.budget
        if (correctedValue.discussion) updateData.pricingDiscussion = correctedValue.discussion
        break
      case FeedbackType.DESCRIPTION_CORRECTION:
        updateData.jobDescription = correctedValue
        break
    }

    // Update extraction record
    await prisma.extractedAppointment.update({
      where: { id: extractedAppointmentId },
      data: updateData
    })

    console.log(`✅ Applied correction for ${feedbackType}:`, correctedValue)
  }

  /**
   * Update extraction confidence based on feedback
   */
  private async updateExtractionConfidence(
    callRecordId: string,
    feedbackType: FeedbackType,
    confidenceAdjustment: number
  ): Promise<void> {
    const extraction = await prisma.extractedAppointment.findFirst({
      where: { callRecordId }
    })

    if (!extraction) return

    const currentConfidence = extraction.confidenceScore || 0.5
    const newConfidence = Math.max(0.1, Math.min(1.0, currentConfidence + confidenceAdjustment))

    await prisma.extractedAppointment.update({
      where: { id: extraction.id },
      data: {
        confidenceScore: newConfidence,
        feedbackCount: (extraction.feedbackCount || 0) + 1
      }
    })

    console.log(`📊 Updated confidence: ${currentConfidence.toFixed(2)} → ${newConfidence.toFixed(2)}`)
  }

  /**
   * Calculate confidence adjustment based on feedback
   */
  private calculateConfidenceAdjustment(
    feedbackType: FeedbackType,
    rating: FeedbackRating
  ): number {
    // Base adjustment based on rating
    const ratingMultiplier = {
      [FeedbackRating.VERY_POOR]: -0.3,
      [FeedbackRating.POOR]: -0.15,
      [FeedbackRating.FAIR]: 0.0,
      [FeedbackRating.GOOD]: 0.1,
      [FeedbackRating.EXCELLENT]: 0.2
    }

    // Weight adjustment based on feedback type importance
    const typeWeight = {
      [FeedbackType.CUSTOMER_NAME_CORRECTION]: 0.8,
      [FeedbackType.SERVICE_TYPE_CORRECTION]: 1.0,
      [FeedbackType.ADDRESS_CORRECTION]: 1.0,
      [FeedbackType.DATE_TIME_CORRECTION]: 0.9,
      [FeedbackType.PHONE_EMAIL_CORRECTION]: 0.7,
      [FeedbackType.URGENCY_CORRECTION]: 0.6,
      [FeedbackType.PRICE_CORRECTION]: 0.5,
      [FeedbackType.DESCRIPTION_CORRECTION]: 0.6,
      [FeedbackType.APPOINTMENT_EXISTS]: 1.0,
      [FeedbackType.NO_APPOINTMENT]: 1.0,
      [FeedbackType.TRANSCRIPTION_ERROR]: 0.8,
      [FeedbackType.MULTIPLE_APPOINTMENTS]: 0.9,
      [FeedbackType.MANUAL_OVERRIDE]: 1.0
    }

    return ratingMultiplier[rating] * (typeWeight[feedbackType] || 0.5)
  }

  /**
   * Determine if feedback should trigger model improvement
   */
  private isModelImprovementFeedback(
    feedbackType: FeedbackType,
    rating: FeedbackRating
  ): boolean {
    // Critical corrections that should improve model
    const criticalTypes = [
      FeedbackType.CUSTOMER_NAME_CORRECTION,
      FeedbackType.SERVICE_TYPE_CORRECTION,
      FeedbackType.ADDRESS_CORRECTION,
      FeedbackType.APPOINTMENT_EXISTS,
      FeedbackType.NO_APPOINTMENT,
      FeedbackType.MULTIPLE_APPOINTMENTS
    ]

    return criticalTypes.includes(feedbackType) && rating <= FeedbackRating.FAIR
  }

  /**
   * Trigger model improvement process
   */
  private async triggerModelImprovement(feedback: ExtractionFeedback): Promise<void> {
    console.log('🎯 Triggering model improvement for:', {
      type: feedback.feedbackType,
      rating: feedback.rating,
      callId: feedback.callRecordId
    })

    // In a production system, this would:
    // 1. Queue feedback for model retraining
    // 2. Update extraction prompts
    // 3. Adjust confidence thresholds
    // 4. Create training examples for fine-tuning

    // For now, log the improvement opportunity
    const improvementData = {
      feedbackId: feedback.id,
      feedbackType: feedback.feedbackType,
      originalValue: feedback.originalValue,
      correctedValue: feedback.correctedValue,
      confidence: feedback.confidence,
      queuedAt: new Date()
    }

    console.log('📚 Model improvement queued:', improvementData)
  }

  /**
   * Get feedback summary for a user
   */
  async getFeedbackSummary(userId: string, days: number = 30): Promise<FeedbackSummary> {
    // This would query actual feedback data from database
    // For now, return mock summary
    return {
      totalFeedbacks: 0,
      averageRating: 0,
      improvementRate: 0,
      commonIssues: [],
      confidenceImpact: 0
    }
  }

  /**
   * Get feedback history for a call
   */
  async getCallFeedbackHistory(callRecordId: string): Promise<ExtractionFeedback[]> {
    // This would query actual feedback records
    return []
  }

  /**
   * Create manual override for extraction
   */
  async createManualOverride(params: {
    callRecordId: string
    userId: string
    overrideData: {
      hasAppointment: boolean
      customerName?: string
      customerPhone?: string
      customerEmail?: string
      serviceType?: string
      jobDescription?: string
      urgencyLevel?: string
      preferredDate?: string
      preferredTime?: string
      timeFlexibility?: string
      serviceAddress?: string
      quotedPrice?: number
      budgetMentioned?: number
    }
    reason: string
  }): Promise<string> {
    const { callRecordId, userId, overrideData, reason } = params

    // Check if extraction already exists
    const existingExtraction = await prisma.extractedAppointment.findFirst({
      where: { callRecordId }
    })

    let extractionId: string

    if (existingExtraction) {
      // Update existing extraction
      await prisma.extractedAppointment.update({
        where: { id: existingExtraction.id },
        data: {
          ...overrideData,
          manualOverride: true,
          lastCorrectedAt: new Date(),
          lastCorrectedBy: userId,
          extractionNotes: `Manual override: ${reason}`,
          confidenceScore: 1.0 // Manual overrides have full confidence
        }
      })
      extractionId = existingExtraction.id
    } else {
      // Create new extraction
      const newExtraction = await prisma.extractedAppointment.create({
        data: {
          callRecordId,
          userId,
          ...overrideData,
          manualOverride: true,
          lastCorrectedAt: new Date(),
          lastCorrectedBy: userId,
          extractionNotes: `Manual override: ${reason}`,
          confidenceScore: 1.0,
          rawExtraction: { manualOverride: true, reason }
        }
      })
      extractionId = newExtraction.id
    }

    // Record the manual override as feedback
    await this.submitFeedback({
      callRecordId,
      extractedAppointmentId: extractionId,
      userId,
      feedbackType: FeedbackType.MANUAL_OVERRIDE,
      originalValue: existingExtraction || null,
      correctedValue: overrideData,
      rating: FeedbackRating.EXCELLENT, // Manual overrides are considered correct
      comment: reason,
      isManualOverride: true
    })

    console.log('🖐️ Manual override created for call:', callRecordId)
    
    return extractionId
  }

  /**
   * Bulk feedback processing for model improvement
   */
  async processBulkFeedback(feedbackBatch: ExtractionFeedback[]): Promise<{
    processed: number
    improvements: number
    errors: number
  }> {
    let processed = 0
    let improvements = 0
    let errors = 0

    for (const feedback of feedbackBatch) {
      try {
        if (feedback.isModelImprovement) {
          await this.triggerModelImprovement(feedback)
          improvements++
        }
        processed++
      } catch (error) {
        console.error('Error processing feedback:', error)
        errors++
      }
    }

    return { processed, improvements, errors }
  }
}

export const feedbackManager = FeedbackManager.getInstance()