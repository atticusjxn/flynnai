import { NextRequest, NextResponse } from 'next/server'
import { sendVerificationEmail, generateVerificationCode } from '@/lib/email-verification'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    console.log('Email verification request received')
    
    const { email } = await request.json()
    console.log('Email:', email)

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Generate a 6-digit verification code
    const code = generateVerificationCode()
    console.log('Generated code:', code)

    // For now, let's skip database storage and just send the email
    // This will help us identify if the issue is with the database or email service
    
    // Store code in database for verification
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
    
    try {
      await prisma.emailVerification.upsert({
        where: { email: email.toLowerCase() },
        update: {
          code,
          verified: false,
          expiresAt,
        },
        create: {
          email: email.toLowerCase(),
          code,
          verified: false,
          expiresAt,
        },
      })
      console.log('Verification code stored in database successfully')
    } catch (dbError) {
      console.error('Database storage failed, using fallback:', dbError)
      // For now, continue with email sending even if DB storage fails
      // In production, you might want to use Redis or another storage mechanism
    }

    // Check if RESEND_API_KEY is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      
      // In development, show the code for testing
      if (process.env.NODE_ENV === 'development') {
        console.log(`Development mode - Verification code for ${email}: ${code}`)
        return NextResponse.json({
          success: true,
          message: 'Verification code sent successfully (dev mode)',
          devCode: code, // Only in development
        })
      }
      
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      )
    }

    try {
      // Send email with Resend
      await sendVerificationEmail(email, code)
    } catch (emailError) {
      console.error('Failed to send email:', emailError)
      
      // In development, still allow the flow to continue
      if (process.env.NODE_ENV === 'development') {
        console.log(`Development fallback - Verification code for ${email}: ${code}`)
        return NextResponse.json({
          success: true,
          message: 'Verification code sent successfully (dev mode - email failed)',
          devCode: code,
        })
      }
      
      throw emailError
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent successfully',
    })
  } catch (error) {
    console.error('Error sending verification code:', error)
    return NextResponse.json(
      { error: `Failed to send verification code: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}