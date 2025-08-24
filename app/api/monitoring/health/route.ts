import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { monitoringService } from '@/lib/monitoring'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🏥 Health check requested by user:', session.user.id)
    
    const healthStatus = await monitoringService.performHealthCheck()
    
    return NextResponse.json({
      success: true,
      health: healthStatus,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Health check API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Health check failed',
        health: {
          status: 'critical',
          services: {
            database: 'down',
            openai: 'unknown',
            twilio: 'unknown',
            storage: 'unknown',
            queue: 'unknown'
          },
          uptime: process.uptime(),
          lastHealthCheck: new Date(),
          issues: ['Health check system error']
        }
      }, 
      { status: 500 }
    )
  }
}