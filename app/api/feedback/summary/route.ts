import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { feedbackManager } from '@/lib/feedback'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    // Validate days parameter
    if (days < 1 || days > 365) {
      return NextResponse.json({ 
        error: 'Days parameter must be between 1 and 365' 
      }, { status: 400 })
    }

    const summary = await feedbackManager.getFeedbackSummary(session.user.id, days)

    return NextResponse.json({
      success: true,
      summary,
      period: `${days} days`
    })

  } catch (error) {
    console.error('❌ Feedback summary failed:', error)
    return NextResponse.json({
      error: 'Failed to get feedback summary',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { callRecordId } = await request.json()

    if (!callRecordId) {
      return NextResponse.json({ 
        error: 'Missing required field: callRecordId' 
      }, { status: 400 })
    }

    const feedbackHistory = await feedbackManager.getCallFeedbackHistory(callRecordId)

    return NextResponse.json({
      success: true,
      feedbackHistory,
      count: feedbackHistory.length
    })

  } catch (error) {
    console.error('❌ Feedback history failed:', error)
    return NextResponse.json({
      error: 'Failed to get feedback history',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}