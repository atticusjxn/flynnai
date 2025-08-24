import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { exportJobsToICS } from '@/lib/calendar'
import { JobStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const url = new URL(request.url)
    
    const format = url.searchParams.get('format') || 'ics'
    const status = url.searchParams.get('status') as JobStatus
    const days = parseInt(url.searchParams.get('days') || '30')

    // Date range filter
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + days)

    // Build where clause
    const whereClause: any = {
      userId,
      scheduledDate: {
        gte: startDate,
        lte: endDate
      }
    }

    if (status) {
      whereClause.status = status
    }

    // Get jobs with scheduled dates
    const jobs = await prisma.job.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
            email: true
          }
        }
      },
      orderBy: { scheduledDate: 'asc' }
    })

    if (format === 'ics') {
      const icsContent = exportJobsToICS(jobs)
      
      return new Response(icsContent, {
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': `attachment; filename="flynn-appointments-${new Date().toISOString().split('T')[0]}.ics"`,
          'Cache-Control': 'no-cache'
        }
      })
    }

    // Return JSON format
    return NextResponse.json({
      success: true,
      jobs: jobs.map(job => ({
        id: job.id,
        title: job.title,
        customerName: job.customerName,
        scheduledDate: job.scheduledDate,
        scheduledTime: job.scheduledTime,
        estimatedDuration: job.estimatedDuration,
        address: job.address,
        status: job.status,
        serviceType: job.serviceType,
        estimatedCost: job.estimatedCost,
        customer: job.customer
      })),
      totalJobs: jobs.length,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Calendar export API failed:', error)
    return NextResponse.json({
      error: 'Failed to export calendar',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}