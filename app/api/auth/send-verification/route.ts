import { NextRequest, NextResponse } from 'next/server'
import { sendVerificationCode, generateVerificationCode } from '@/lib/twilio'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Generate a 6-digit verification code
    const code = generateVerificationCode()

    // Store the code in the database with expiration (10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
    
    await prisma.phoneVerification.upsert({
      where: { phoneNumber },
      update: {
        code,
        expiresAt,
        verified: false,
      },
      create: {
        phoneNumber,
        code,
        expiresAt,
        verified: false,
      },
    })

    // Send SMS with Twilio
    await sendVerificationCode(phoneNumber, code)

    return NextResponse.json({
      success: true,
      message: 'Verification code sent successfully',
    })
  } catch (error) {
    console.error('Error sending verification code:', error)
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    )
  }
}