import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Mock call filters - in production this would come from database
    const mockFilters = [
      {
        id: '1',
        name: 'Business Hours Only',
        enabled: true,
        type: 'allow',
        rules: {
          phoneNumbers: [],
          keywordFilters: [],
          timeRestrictions: {
            enabled: true,
            startTime: '09:00',
            endTime: '17:00',
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
          },
          minimumDuration: 10,
          requireHumanSpeech: true
        },
        actions: {
          autoProcess: true,
          skipTranscription: false,
          sendNotification: true
        }
      },
      {
        id: '2',
        name: 'Emergency Keywords',
        enabled: true,
        type: 'priority',
        rules: {
          phoneNumbers: [],
          keywordFilters: ['emergency', 'urgent', 'immediate', 'ASAP'],
          timeRestrictions: {
            enabled: false,
            startTime: '09:00',
            endTime: '17:00',
            days: []
          },
          minimumDuration: 5,
          requireHumanSpeech: true
        },
        actions: {
          autoProcess: true,
          skipTranscription: false,
          sendNotification: true
        }
      }
    ]

    return NextResponse.json({ filters: mockFilters })

  } catch (error) {
    console.error('❌ Call filters API failed:', error)
    return NextResponse.json({
      error: 'Failed to get call filters',
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

    const { filters } = await request.json()

    // Validate filters array
    if (!Array.isArray(filters)) {
      return NextResponse.json({ 
        error: 'Filters must be an array' 
      }, { status: 400 })
    }

    // In production, save to database
    // await prisma.callFilter.deleteMany({ where: { userId: session.user.id } })
    // await prisma.callFilter.createMany({
    //   data: filters.map(filter => ({ ...filter, userId: session.user.id }))
    // })

    return NextResponse.json({ success: true, filters })

  } catch (error) {
    console.error('❌ Save call filters failed:', error)
    return NextResponse.json({
      error: 'Failed to save call filters',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}