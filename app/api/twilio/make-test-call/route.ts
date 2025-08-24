import { NextRequest, NextResponse } from 'next/server'

// Import Twilio
let twilioClient: any = null

try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const twilio = require('twilio')
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  }
} catch (error) {
  console.error('Failed to initialize Twilio client:', error)
}

export async function POST(request: NextRequest) {
  try {
    // For now, allow test calls without strict authentication
    // In a production environment, you'd want proper authentication
    console.log('Test call request received')

    // Check if Twilio is configured
    if (!twilioClient) {
      return NextResponse.json(
        { error: 'Twilio integration not configured. Please check your environment variables.' },
        { status: 500 }
      )
    }

    const { toNumber, countryCode } = await request.json()

    if (!toNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Clean and validate phone number
    let formattedToNumber = toNumber
    
    // If the number doesn't start with +, it's already formatted by the frontend
    if (!toNumber.startsWith('+')) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      )
    }
    
    // Basic validation - ensure it has enough digits
    const cleanNumber = toNumber.replace(/\D/g, '')
    if (cleanNumber.length < 8) {
      return NextResponse.json(
        { error: 'Phone number is too short' },
        { status: 400 }
      )
    }
    
    formattedToNumber = toNumber

    // Get business phone number from environment
    const fromNumber = process.env.TWILIO_PHONE_NUMBER
    if (!fromNumber) {
      return NextResponse.json(
        { error: 'Business phone number not configured' },
        { status: 500 }
      )
    }

    console.log('Making test call:', {
      from: fromNumber,
      to: formattedToNumber,
      timestamp: new Date().toISOString()
    })

    // Create the call using Twilio
    const call = await twilioClient.calls.create({
      to: formattedToNumber,
      from: fromNumber,
      // Use TwiML to create a simple test call experience
      twiml: `
        <Response>
          <Say voice="alice">
            Hello! This is a test call from Flynn AI. 
            Please act like a customer and describe the service you need, 
            your preferred date and time, and your contact information. 
            This call is being recorded and processed by our AI system for demonstration purposes.
            You can start speaking now.
          </Say>
          <Record 
            timeout="60" 
            maxLength="120"
            transcribe="true"
            transcribeCallback="${process.env.NEXTAUTH_URL}/api/twilio/webhook"
            action="${process.env.NEXTAUTH_URL}/api/twilio/webhook"
            method="POST"
          />
          <Say voice="alice">
            Thank you for your test call. Flynn AI has recorded your request and will process it shortly.
            You should see the results on your dashboard within a few minutes.
          </Say>
        </Response>
      `,
    })

    console.log('Test call created successfully:', {
      callSid: call.sid,
      status: call.status,
      to: call.to,
      from: call.from
    })

    return NextResponse.json({
      success: true,
      callId: call.sid,
      message: 'Test call initiated successfully',
      to: formattedToNumber,
      from: fromNumber,
      status: call.status
    })

  } catch (error) {
    console.error('Error making test call:', error)
    
    // Handle specific Twilio errors
    if (error && typeof error === 'object' && 'code' in error) {
      const twilioErrorMessages: Record<string, string> = {
        '21211': 'Invalid phone number format',
        '21212': 'Invalid phone number',
        '21213': 'Caller ID not verified',
        '21214': 'Phone number not verified',
        '21215': 'Account not authorized',
        '21216': 'Account suspended',
        '21217': 'Phone number not available',
        '21218': 'Invalid region',
        '21401': 'Invalid phone number',
        '21421': 'PhoneNumber Incapable of Receiving SMS',
        '21610': 'Message cannot be sent',
        '30001': 'Queue overflow',
        '30002': 'Account suspended',
        '30003': 'Unreachable destination handset',
        '30004': 'Message blocked',
        '30005': 'Unknown destination handset',
        '30006': 'Landline or unreachable carrier',
        '30007': 'Carrier violation',
        '30008': 'Unknown error'
      }

      const errorCode = (error as any).code
      const errorMessage = twilioErrorMessages[errorCode] || (error as any).message || 'Twilio API error'
      return NextResponse.json(
        { error: `Twilio Error (${errorCode}): ${errorMessage}` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to make test call' },
      { status: 500 }
    )
  }
}