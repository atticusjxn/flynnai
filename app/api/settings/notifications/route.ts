import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Mock notification settings - in production this would come from database
    const mockSettings = {
      email: {
        enabled: true,
        address: session.user.email || '',
        frequency: 'immediate',
        types: {
          newCall: true,
          jobCreated: true,
          jobCompleted: false,
          processingErrors: true,
          systemUpdates: false
        }
      },
      inApp: {
        enabled: true,
        sound: true,
        types: {
          newCall: true,
          jobCreated: true,
          jobCompleted: true,
          processingErrors: true
        }
      },
      sms: {
        enabled: false,
        phoneNumber: '',
        types: {
          criticalErrors: true,
          jobReminders: false
        }
      },
      calendar: {
        enabled: false,
        provider: 'google',
        autoCreateEvents: true,
        reminderMinutes: 15
      }
    }

    return NextResponse.json({ settings: mockSettings })

  } catch (error) {
    console.error('❌ Notification settings API failed:', error)
    return NextResponse.json({
      error: 'Failed to get notification settings',
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

    const { settings } = await request.json()

    // Validate settings structure
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ 
        error: 'Invalid settings data' 
      }, { status: 400 })
    }

    // In production, save to database
    // await prisma.notificationPreferences.upsert({
    //   where: { userId: session.user.id },
    //   update: settings,
    //   create: { userId: session.user.id, ...settings }
    // })

    return NextResponse.json({ success: true, settings })

  } catch (error) {
    console.error('❌ Save notification settings failed:', error)
    return NextResponse.json({
      error: 'Failed to save notification settings',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}