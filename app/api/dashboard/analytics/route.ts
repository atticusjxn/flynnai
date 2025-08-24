import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Try to get dashboard data from database, but handle failures gracefully
    let dashboardData = {
      totalCalls: 0,
      processedCalls: 0,
      appointmentsExtracted: 0,
      successRate: 0,
      recentCalls: [] as any[]
    }

    try {
      // Get basic call statistics
      const totalCalls = await prisma.callRecord.count()
      const processedCalls = await prisma.callRecord.count({
        where: {
          status: 'COMPLETED'
        }
      })
      const appointmentsExtracted = await prisma.extractedAppointment.count()
      
      // Calculate success rate
      const successRate = totalCalls > 0 ? Math.round((processedCalls / totalCalls) * 100) : 0

      // Get recent calls with extracted appointments
      const recentCalls = await prisma.callRecord.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          extractedAppointment: true
        }
      })

      dashboardData = {
        totalCalls,
        processedCalls,
        appointmentsExtracted,
        successRate,
        recentCalls: recentCalls.map(call => ({
          id: call.id,
          phoneNumber: call.phoneNumber,
          status: call.status,
          transcription: call.transcription,
          confidenceScore: call.confidenceScore,
          createdAt: call.createdAt.toISOString(),
          hasAppointment: !!call.extractedAppointment
        }))
      }

      console.log('Dashboard data fetched successfully:', {
        totalCalls,
        processedCalls,
        appointmentsExtracted,
        recentCallsCount: recentCalls.length
      })

    } catch (dbError) {
      console.error('Database query failed, returning empty data:', dbError)
      // Return empty data if database fails - dashboard will show "no calls yet"
    }

    return NextResponse.json(dashboardData)

  } catch (error) {
    console.error('Dashboard analytics error:', error)
    
    // Return empty data structure so dashboard doesn't break
    return NextResponse.json({
      totalCalls: 0,
      processedCalls: 0,
      appointmentsExtracted: 0,
      successRate: 0,
      recentCalls: []
    })
  }
}