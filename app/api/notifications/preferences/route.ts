import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { EmailFrequency, CalendarProvider } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get or create notification preferences
    let preferences = await prisma.notificationPreferences.findUnique({
      where: { userId }
    })

    if (!preferences) {
      preferences = await prisma.notificationPreferences.create({
        data: { userId }
      })
    }

    return NextResponse.json({
      success: true,
      preferences
    })

  } catch (error) {
    console.error('❌ Get notification preferences API failed:', error)
    return NextResponse.json({
      error: 'Failed to get notification preferences',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()

    const {
      enableRealTime,
      enableSound,
      enableEmail,
      emailFrequency,
      callReceived,
      appointmentExtracted,
      jobCreated,
      jobStatusChanged,
      customerCreated,
      extractionFailed,
      enableCalendar,
      calendarProvider
    } = body

    // Update preferences
    const preferences = await prisma.notificationPreferences.upsert({
      where: { userId },
      update: {
        enableRealTime: enableRealTime !== undefined ? enableRealTime : undefined,
        enableSound: enableSound !== undefined ? enableSound : undefined,
        enableEmail: enableEmail !== undefined ? enableEmail : undefined,
        emailFrequency: emailFrequency ? emailFrequency as EmailFrequency : undefined,
        callReceived: callReceived !== undefined ? callReceived : undefined,
        appointmentExtracted: appointmentExtracted !== undefined ? appointmentExtracted : undefined,
        jobCreated: jobCreated !== undefined ? jobCreated : undefined,
        jobStatusChanged: jobStatusChanged !== undefined ? jobStatusChanged : undefined,
        customerCreated: customerCreated !== undefined ? customerCreated : undefined,
        extractionFailed: extractionFailed !== undefined ? extractionFailed : undefined,
        enableCalendar: enableCalendar !== undefined ? enableCalendar : undefined,
        calendarProvider: calendarProvider ? calendarProvider as CalendarProvider : undefined,
        updatedAt: new Date()
      },
      create: {
        userId,
        enableRealTime: enableRealTime ?? true,
        enableSound: enableSound ?? true,
        enableEmail: enableEmail ?? true,
        emailFrequency: emailFrequency as EmailFrequency ?? EmailFrequency.INSTANT,
        callReceived: callReceived ?? true,
        appointmentExtracted: appointmentExtracted ?? true,
        jobCreated: jobCreated ?? true,
        jobStatusChanged: jobStatusChanged ?? true,
        customerCreated: customerCreated ?? false,
        extractionFailed: extractionFailed ?? true,
        enableCalendar: enableCalendar ?? false,
        calendarProvider: calendarProvider as CalendarProvider ?? null
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated successfully',
      preferences
    })

  } catch (error) {
    console.error('❌ Update notification preferences API failed:', error)
    return NextResponse.json({
      error: 'Failed to update notification preferences',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}