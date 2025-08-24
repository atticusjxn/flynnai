import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, code } = await request.json()

    if (!phoneNumber || !code) {
      return NextResponse.json(
        { error: 'Phone number and code are required' },
        { status: 400 }
      )
    }

    // Find the verification record
    const verification = await prisma.phoneVerification.findUnique({
      where: { phoneNumber },
    })

    if (!verification) {
      return NextResponse.json(
        { error: 'Verification code not found' },
        { status: 404 }
      )
    }

    // Check if code has expired
    if (verification.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Verification code has expired' },
        { status: 400 }
      )
    }

    // Check if code matches
    if (verification.code !== code) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    // Mark as verified
    await prisma.phoneVerification.update({
      where: { phoneNumber },
      data: { verified: true },
    })

    return NextResponse.json({
      success: true,
      message: 'Phone number verified successfully',
    })
  } catch (error) {
    console.error('Error verifying code:', error)
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    )
  }
}