import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { feedbackManager, FeedbackType, FeedbackRating } from '@/lib/feedback'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      callRecordId,
      extractedAppointmentId,
      feedbackType,
      originalValue,
      correctedValue,
      rating,
      comment,
      isManualOverride
    } = await request.json()

    // Validate required fields
    if (!callRecordId || !feedbackType || rating === undefined) {
      return NextResponse.json({ 
        error: 'Missing required fields: callRecordId, feedbackType, rating' 
      }, { status: 400 })
    }

    // Validate feedback type
    if (!Object.values(FeedbackType).includes(feedbackType)) {
      return NextResponse.json({ 
        error: 'Invalid feedback type' 
      }, { status: 400 })
    }

    // Validate rating
    if (![1, 2, 3, 4, 5].includes(rating)) {
      return NextResponse.json({ 
        error: 'Rating must be between 1 and 5' 
      }, { status: 400 })
    }

    const feedback = await feedbackManager.submitFeedback({
      callRecordId,
      extractedAppointmentId,
      userId: session.user.id,
      feedbackType,
      originalValue,
      correctedValue,
      rating,
      comment,
      isManualOverride
    })

    return NextResponse.json({
      success: true,
      feedbackId: feedback.id,
      confidence: feedback.confidence,
      isModelImprovement: feedback.isModelImprovement
    })

  } catch (error) {
    console.error('❌ Feedback submission failed:', error)
    return NextResponse.json({
      error: 'Failed to submit feedback',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}