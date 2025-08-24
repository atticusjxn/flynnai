import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { monitoringService } from '@/lib/monitoring'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') as 'day' | 'week' | 'month' || 'day'
    const includeRecommendations = searchParams.get('recommendations') === 'true'

    console.log(`📈 Analytics requested for ${timeRange} by user:`, session.user.id)

    const analytics = await monitoringService.getPerformanceAnalytics(timeRange)

    const response = {
      success: true,
      analytics,
      generatedAt: new Date().toISOString()
    }

    // Add alert checking
    if (includeRecommendations) {
      await monitoringService.checkAlertThresholds(analytics.callProcessing)
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Analytics API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}