import { NextRequest, NextResponse } from 'next/server'
import { processCall } from '@/lib/call-processing/callProcessor'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { CallSid, From, To, CallStatus, RecordingUrl } = body

    // Verify this is a Twilio webhook (in production, verify signature)
    if (!CallSid || !From) {
      return NextResponse.json({ error: 'Invalid webhook data' }, { status: 400 })
    }

    // Find the user associated with this phone number
    const phoneIntegration = await prisma.phoneIntegration.findFirst({
      where: {
        phoneNumber: To,
        isActive: true
      },
      include: {
        user: true
      }
    })

    if (!phoneIntegration) {
      return NextResponse.json({ error: 'Phone number not found' }, { status: 404 })
    }

    const user = phoneIntegration.user

    // Check if call already exists
    let callRecord = await prisma.callRecord.findFirst({
      where: {
        callSid: CallSid,
        userId: user.id
      }
    })

    if (!callRecord) {
      // Create new call record
      callRecord = await prisma.callRecord.create({
        data: {
          callSid: CallSid,
          phoneNumber: From,
          userId: user.id,
          status: 'PROCESSING',
          recordingUrl: RecordingUrl
        }
      })
    }

    // Process the call if it's completed and has a recording
    if (CallStatus === 'completed' && RecordingUrl) {
      // Process call in background
      processCall(callRecord.id, user.id).catch(error => {
        console.error('Call processing failed:', error)
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}