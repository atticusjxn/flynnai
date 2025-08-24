import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { TwilioService } from '@/lib/twilio'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if Twilio credentials are configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return NextResponse.json({ 
        error: 'Twilio credentials not configured' 
      }, { status: 400 })
    }

    try {
      const twilioService = new TwilioService()
      
      // Test the connection by fetching account info
      const accountInfo = await twilioService.getAccountInfo()
      
      return NextResponse.json({
        success: true,
        accountName: accountInfo.friendlyName,
        accountSid: accountInfo.sid,
        status: accountInfo.status
      })

    } catch (twilioError) {
      console.error('Twilio connection test failed:', twilioError)
      
      return NextResponse.json({
        error: 'Failed to connect to Twilio',
        details: twilioError instanceof Error ? twilioError.message : String(twilioError)
      }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Twilio connection test API failed:', error)
    return NextResponse.json({
      error: 'Failed to test Twilio connection',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}