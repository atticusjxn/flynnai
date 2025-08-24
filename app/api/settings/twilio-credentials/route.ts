import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get user settings (we'll use the existing user table for now)
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // For security, don't return the actual auth token
    const credentials = {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN ? '••••••••••••••••' : '',
      webhookUrl: process.env.TWILIO_WEBHOOK_URL || '',
      isConfigured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
    }

    return NextResponse.json(credentials)

  } catch (error) {
    console.error('❌ Twilio credentials API failed:', error)
    return NextResponse.json({
      error: 'Failed to get Twilio credentials',
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

    const { accountSid, authToken, webhookUrl } = await request.json()

    // Validate the credentials format
    if (!accountSid || !accountSid.startsWith('AC')) {
      return NextResponse.json({ 
        error: 'Invalid Account SID format' 
      }, { status: 400 })
    }

    if (!authToken || authToken.length < 30) {
      return NextResponse.json({ 
        error: 'Invalid Auth Token format' 
      }, { status: 400 })
    }

    if (webhookUrl && !webhookUrl.startsWith('https://')) {
      return NextResponse.json({ 
        error: 'Webhook URL must use HTTPS' 
      }, { status: 400 })
    }

    // In a real implementation, you would:
    // 1. Encrypt and store these credentials securely
    // 2. Test the credentials with Twilio API
    // 3. Update user settings in database

    // For now, just return success
    const updatedCredentials = {
      accountSid,
      authToken: '••••••••••••••••',
      webhookUrl: webhookUrl || process.env.TWILIO_WEBHOOK_URL,
      isConfigured: true
    }

    return NextResponse.json(updatedCredentials)

  } catch (error) {
    console.error('❌ Twilio credentials save failed:', error)
    return NextResponse.json({
      error: 'Failed to save Twilio credentials',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}