import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getJobCreationStats } from '@/lib/job-creation'
import { prisma } from '@/lib/prisma'
import { JobStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const url = new URL(request.url)
    
    // Query parameters
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const status = url.searchParams.get('status') as JobStatus | null
    const priority = url.searchParams.get('priority') || null
    const extractedOnly = url.searchParams.get('extractedOnly') === 'true'
    const includeStats = url.searchParams.get('stats') === 'true'
    const search = url.searchParams.get('search') || null
    const sortBy = url.searchParams.get('sortBy') || 'createdAt'
    const sortOrder = url.searchParams.get('sortOrder') || 'desc'

    // Build where clause
    const whereClause: any = { userId }
    
    if (status) {
      whereClause.status = status
    }
    
    if (priority) {
      whereClause.priority = priority
    }
    
    if (extractedOnly) {
      whereClause.extractedFromCall = true
    }

    // Add search functionality
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { serviceType: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Build order by clause
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    // Get jobs
    const jobs = await prisma.job.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },
        callRecord: {
          select: {
            callSid: true,
            phoneNumber: true,
            createdAt: true
          }
        },
        extractedAppointment: {
          select: {
            id: true,
            confidenceScore: true,
            hasIssues: true,
            urgencyLevel: true
          }
        }
      },
      orderBy,
      skip: offset,
      take: Math.min(limit, 100) // Cap at 100 items
    })

    // Get total count
    const totalCount = await prisma.job.count({ where: whereClause })

    // Get stats if requested
    let stats = null
    if (includeStats) {
      stats = await getJobCreationStats(userId)
    }

    return NextResponse.json({
      success: true,
      jobs: jobs.map(job => ({
        id: job.id,
        title: job.title,
        customerName: job.customerName,
        customerPhone: job.customerPhone,
        customerEmail: job.customerEmail,
        customer: job.customer,
        serviceType: job.serviceType,
        description: job.description,
        scheduledDate: job.scheduledDate,
        scheduledTime: job.scheduledTime,
        estimatedDuration: job.estimatedDuration,
        address: job.address,
        status: job.status,
        priority: job.priority,
        estimatedCost: job.estimatedCost,
        actualCost: job.actualCost,
        notes: job.notes,
        extractedFromCall: job.extractedFromCall,
        confidenceScore: job.confidenceScore,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        completedAt: job.completedAt,
        callRecord: job.callRecord,
        extractedAppointment: job.extractedAppointment
      })),
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      stats
    })

  } catch (error) {
    console.error('❌ Get jobs API failed:', error)
    return NextResponse.json({
      error: 'Failed to get jobs',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}