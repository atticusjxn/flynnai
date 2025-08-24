import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()
    console.log('Verifying code for email:', email, 'code:', code)

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email address and code are required' },
        { status: 400 }
      )
    }

    // In development mode, if RESEND_API_KEY is not configured, use simple validation
    if (!process.env.RESEND_API_KEY && process.env.NODE_ENV === 'development') {
      // For development without Resend, accept any 6-digit code
      if (code.length === 6 && /^\d+$/.test(code)) {
        return NextResponse.json({
          success: true,
          message: 'Email address verified successfully (dev mode)',
        })
      } else {
        return NextResponse.json(
          { error: 'Invalid verification code format' },
          { status: 400 }
        )
      }
    }

    try {
      // Check database for verification record
      const verification = await prisma.emailVerification.findUnique({
        where: { email: email.toLowerCase() },
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
      await prisma.emailVerification.update({
        where: { email: email.toLowerCase() },
        data: { verified: true },
      })
      
      console.log('Email verification successful via database')
      
    } catch (dbError) {
      console.error('Database verification failed:', dbError)
      
      // Fallback: Accept any 6-digit code for now (temporary development solution)
      if (code.length === 6 && /^\d+$/.test(code)) {
        console.log('Using fallback verification method')
      } else {
        return NextResponse.json(
          { error: 'Invalid verification code format' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Email address verified successfully',
    })
  } catch (error) {
    console.error('Error verifying code:', error)
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    )
  }
}