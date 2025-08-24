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
    const timeRange = searchParams.get('timeRange') as 'hour' | 'day' | 'week' | 'month' || 'day'
    const type = searchParams.get('type') || 'all' // 'system', 'calls', 'api', or 'all'

    console.log(`📊 Metrics requested: ${type} for ${timeRange} by user:`, session.user.id)

    const response: any = {
      success: true,
      timeRange,
      timestamp: new Date().toISOString()
    }

    if (type === 'system' || type === 'all') {
      response.systemMetrics = await monitoringService.collectSystemMetrics()
    }

    if (type === 'calls' || type === 'all') {
      response.callMetrics = await monitoringService.getCallProcessingMetrics(timeRange)
    }

    if (type === 'performance' || type === 'all') {
      response.performanceAnalytics = await monitoringService.getPerformanceAnalytics(timeRange === 'hour' ? 'day' : timeRange)
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Metrics API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { endpoint, method, responseTime, statusCode, errorMessage } = await request.json()

    if (!endpoint || !method || responseTime === undefined || !statusCode) {
      return NextResponse.json(
        { error: 'Missing required fields: endpoint, method, responseTime, statusCode' },
        { status: 400 }
      )
    }

    monitoringService.trackApiCall({
      endpoint,
      method,
      responseTime,
      statusCode,
      userId: session.user.id,
      errorMessage
    })

    return NextResponse.json({ success: true, message: 'Metrics recorded' })

  } catch (error) {
    console.error('❌ Metrics recording error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to record metrics' },
      { status: 500 }
    )
  }
}