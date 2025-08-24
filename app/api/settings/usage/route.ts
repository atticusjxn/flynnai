import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Mock usage data - in production this would be calculated from actual usage
    const mockUsage = {
      currentPeriod: {
        calls: 156,
        minutes: 1247,
        transcriptionHours: 20.8,
        storage: 3.2,
        aiRequests: 312
      },
      limits: {
        calls: 500,
        minutes: 2500,
        transcriptionHours: 50,
        storage: 25,
        aiRequests: 1000
      },
      costs: {
        calls: 15.60,
        minutes: 24.94,
        transcription: 41.60,
        storage: 1.60,
        aiRequests: 6.24,
        total: 89.98
      }
    }

    return NextResponse.json({ usage: mockUsage })

  } catch (error) {
    console.error('❌ Usage API failed:', error)
    return NextResponse.json({
      error: 'Failed to get usage data',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}