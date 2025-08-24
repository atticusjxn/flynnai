import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { alertingSystem } from '@/lib/alerting'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'active' // 'active', 'statistics'

    console.log(`🚨 Alerts requested: ${type} by user:`, session.user.id)

    if (type === 'statistics') {
      const statistics = alertingSystem.getAlertStatistics()
      
      return NextResponse.json({
        success: true,
        statistics,
        timestamp: new Date().toISOString()
      })
    } else {
      const activeAlerts = alertingSystem.getActiveAlerts()
      
      return NextResponse.json({
        success: true,
        alerts: activeAlerts,
        count: activeAlerts.length,
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('❌ Alerts API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve alerts',
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

    const { action, alertId } = await request.json()

    if (!action || !alertId) {
      return NextResponse.json(
        { error: 'Missing required fields: action, alertId' },
        { status: 400 }
      )
    }

    let result = false

    switch (action) {
      case 'acknowledge':
        result = await alertingSystem.acknowledgeAlert(alertId, session.user.id)
        break
      case 'check':
        // Trigger immediate alert check
        await alertingSystem.checkAlerts()
        result = true
        break
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json({ 
      success: true, 
      result,
      message: `Alert ${action} completed`
    })

  } catch (error) {
    console.error('❌ Alert action error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process alert action' },
      { status: 500 }
    )
  }
}