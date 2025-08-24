import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // For now, we'll use a simple approach to find a user
    // In production, you'd get the user from the authenticated session
    
    const { userId } = await request.json()
    
    if (!userId) {
      // Try to find the most recent user as a fallback
      const recentUser = await prisma.user.findFirst({
        orderBy: { createdAt: 'desc' }
      })
      
      if (!recentUser) {
        return NextResponse.json({ error: 'No user found' }, { status: 404 })
      }
      
      // Create phone integration for the most recent user
      const phoneIntegration = await prisma.phoneIntegration.create({
        data: {
          userId: recentUser.id,
          provider: 'twilio',
          phoneNumber: process.env.TWILIO_PHONE_NUMBER!,
          accountSid: process.env.TWILIO_ACCOUNT_SID!,
          authToken: process.env.TWILIO_AUTH_TOKEN!,
          webhookUrl: `${process.env.NEXTAUTH_URL}/api/twilio/webhook`,
          isActive: true
        }
      })
      
      return NextResponse.json({ 
        success: true, 
        phoneIntegration,
        message: `Phone integration created for user ${recentUser.email}` 
      })
    }
    
    // Create phone integration for specific user
    const phoneIntegration = await prisma.phoneIntegration.create({
      data: {
        userId,
        provider: 'twilio',
        phoneNumber: process.env.TWILIO_PHONE_NUMBER!,
        accountSid: process.env.TWILIO_ACCOUNT_SID!,
        authToken: process.env.TWILIO_AUTH_TOKEN!,
        webhookUrl: `${process.env.NEXTAUTH_URL}/api/twilio/webhook`,
        isActive: true
      }
    })
    
    return NextResponse.json({ success: true, phoneIntegration })
    
  } catch (error) {
    console.error('Error setting up phone integration:', error)
    return NextResponse.json(
      { error: 'Failed to setup phone integration' },
      { status: 500 }
    )
  }
}