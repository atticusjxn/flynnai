import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { TwilioService } from '@/lib/twilio'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get user's phone numbers from database
    // For now, we'll return mock data since we don't have a phone numbers table
    const mockPhoneNumbers = [
      {
        id: '1',
        number: '+1 (555) 123-4567',
        friendlyName: 'Main Business Line',
        isActive: true,
        smsEnabled: true,
        voiceEnabled: true,
        createdAt: '2024-01-15T10:00:00Z',
        callCount: 45,
        lastUsed: '2024-01-20T15:30:00Z'
      },
      {
        id: '2',
        number: '+1 (555) 987-6543',
        friendlyName: 'Customer Support',
        isActive: false,
        smsEnabled: false,
        voiceEnabled: true,
        createdAt: '2024-01-10T09:00:00Z',
        callCount: 12,
        lastUsed: '2024-01-18T11:15:00Z'
      }
    ]

    return NextResponse.json({
      phoneNumbers: mockPhoneNumbers
    })

  } catch (error) {
    console.error('❌ Phone numbers API failed:', error)
    return NextResponse.json({
      error: 'Failed to get phone numbers',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}