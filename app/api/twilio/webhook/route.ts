import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { errorHandler, ErrorType, ErrorSeverity } from '@/lib/error-handling'

// TwiML Response helper
function createTwiMLResponse(message?: string): string {
  let twiml = '<?xml version="1.0" encoding="UTF-8"?><Response>'
  
  if (message) {
    twiml += `<Say>${message}</Say>`
  }
  
  // Always record the call for processing
  twiml += `<Record maxLength="1800" playBeep="false" transcribe="false" recordingStatusCallback="${process.env.NEXTAUTH_URL}/api/twilio/webhook/recording" recordingStatusCallbackMethod="POST"/>`
  
  twiml += '</Response>'
  return twiml
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Twilio webhook received')
    
    // Get headers for signature validation
    const headersList = headers()
    const twilioSignature = headersList.get('X-Twilio-Signature') || ''
    const requestUrl = headersList.get('host') 
      ? `https://${headersList.get('host')}/api/twilio/webhook`
      : process.env.NEXTAUTH_URL + '/api/twilio/webhook'
    
    // Parse form data (Twilio sends form-encoded data)
    const formData = await request.formData()
    const webhookData: Record<string, string> = {}
    
    formData.forEach((value, key) => {
      webhookData[key] = value.toString()
    })
    
    console.log('📞 Call event:', {
      CallSid: webhookData.CallSid,
      CallStatus: webhookData.CallStatus,
      From: webhookData.From,
      To: webhookData.To,
      Direction: webhookData.Direction
    })

    // Extract key webhook parameters
    const {
      CallSid,
      From,
      To,
      CallStatus,
      Direction,
      CallDuration,
      RecordingUrl,
      RecordingSid,
      RecordingDuration
    } = webhookData

    // Validate required fields
    if (!CallSid || !From || !To) {
      console.error('❌ Missing required webhook fields')
      return NextResponse.json({ error: 'Invalid webhook data' }, { status: 400 })
    }

    // Find the user associated with the called phone number
    const phoneIntegration = await prisma.phoneIntegration.findFirst({
      where: {
        phoneNumber: To,
        isActive: true,
        provider: 'twilio'
      },
      include: {
        user: true
      }
    })

    if (!phoneIntegration) {
      console.error(`❌ Phone integration not found for number: ${To}`)
      return NextResponse.json({ error: 'Phone number not found' }, { status: 404 })
    }

    const user = phoneIntegration.user
    console.log(`👤 Found user: ${user.name} (${user.id})`)

    // TODO: Implement signature validation
    // For now, skip signature validation in development
    if (process.env.NODE_ENV === 'production' && !twilioSignature) {
      console.error('❌ No Twilio signature in production')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    } else if (twilioSignature) {
      console.log('ℹ️ Webhook signature present (validation will be implemented in next iteration)')
    } else {
      console.log('ℹ️ Skipping signature validation in development mode')
    }

    // Find or create call record
    let callRecord = await prisma.callRecord.findFirst({
      where: {
        callSid: CallSid,
        userId: user.id
      }
    })

    if (!callRecord) {
      console.log('📝 Creating new call record')
      callRecord = await prisma.callRecord.create({
        data: {
          callSid: CallSid,
          phoneNumber: From,
          userId: user.id,
          status: 'PROCESSING',
          recordingUrl: RecordingUrl || null,
          duration: CallDuration ? parseInt(CallDuration) : null
        }
      })
    } else {
      console.log('📝 Updating existing call record')
      // Update call record with new information
      callRecord = await prisma.callRecord.update({
        where: { id: callRecord.id },
        data: {
          recordingUrl: RecordingUrl || callRecord.recordingUrl,
          duration: CallDuration ? parseInt(CallDuration) : callRecord.duration,
          status: CallStatus === 'completed' ? 'COMPLETED' : callRecord.status
        }
      })
    }

    // Handle different call statuses with enhanced error handling
    let twimlResponse = ''
    
    switch (CallStatus) {
      case 'ringing':
        console.log('📞 Call ringing - setting up recording')
        twimlResponse = createTwiMLResponse('Thank you for calling. Please describe your service request after the tone.')
        break
        
      case 'in-progress':
        console.log('📞 Call in progress')
        // Call is active, recording should be happening
        break
        
      case 'completed':
        console.log('✅ Call completed')
        if (RecordingUrl) {
          console.log('🎵 Recording available, will process for appointments')
          // The recording webhook will handle processing
        } else {
          console.log('⚠️ Call completed without recording')
          await errorHandler.handleDroppedCallError(
            callRecord.id,
            user.id,
            {
              duration: CallDuration ? parseInt(CallDuration) : 0,
              status: CallStatus,
              hangupCause: webhookData.HangupCause || 'No recording available'
            }
          )
        }
        break
        
      case 'busy':
      case 'no-answer':
      case 'failed':
        console.log(`❌ Call failed with status: ${CallStatus}`)
        await prisma.callRecord.update({
          where: { id: callRecord.id },
          data: {
            status: 'FAILED',
            processingNotes: `Call failed: ${CallStatus} (${webhookData.HangupCause || 'Unknown'})`
          }
        })
        
        await errorHandler.handleDroppedCallError(
          callRecord.id,
          user.id,
          {
            duration: CallDuration ? parseInt(CallDuration) : 0,
            status: CallStatus,
            hangupCause: webhookData.HangupCause || CallStatus
          }
        )
        break
        
      case 'canceled':
        console.log('📞 Call was canceled')
        await prisma.callRecord.update({
          where: { id: callRecord.id },
          data: {
            status: 'CANCELLED',
            processingNotes: 'Call was canceled before connection'
          }
        })
        break
        
      default:
        console.log(`ℹ️ Unknown call status: ${CallStatus}`)
    }

    // Update user's trial calls usage
    if (user.planType === 'free_trial') {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          trialCallsUsed: {
            increment: 1
          }
        }
      })
    }

    // Return TwiML response for call control
    if (twimlResponse) {
      return new NextResponse(twimlResponse, {
        status: 200,
        headers: {
          'Content-Type': 'text/xml',
        },
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ Webhook processing failed:', error)
    
    // Return TwiML error message
    const errorTwiml = createTwiMLResponse('Sorry, we encountered an error processing your call. Please try again later.')
    return new NextResponse(errorTwiml, {
      status: 500,
      headers: {
        'Content-Type': 'text/xml',
      },
    })
  }
}

// Handle GET requests for webhook verification
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const challenge = searchParams.get('challenge')
  
  if (challenge) {
    return NextResponse.json({ challenge })
  }
  
  return NextResponse.json({ 
    message: 'Twilio Voice Webhook Endpoint',
    status: 'active',
    timestamp: new Date().toISOString()
  })
}