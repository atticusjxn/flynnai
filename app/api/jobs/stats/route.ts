import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getJobCreationStats } from '@/lib/job-creation'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get comprehensive job statistics
    const [
      basicStats,
      recentJobs,
      monthlyStats,
      serviceTypeStats,
      priorityStats
    ] = await Promise.all([
      // Basic job creation stats
      getJobCreationStats(userId),
      
      // Recent jobs
      prisma.job.findMany({
        where: { userId },
        include: {
          customer: {
            select: { name: true }
          },
          extractedAppointment: {
            select: { confidenceScore: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      
      // Monthly job creation stats (last 6 months)
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "createdAt") as month,
          COUNT(*) as jobs_created,
          COUNT(*) FILTER (WHERE "extractedFromCall" = true) as extracted_jobs,
          AVG("confidenceScore") FILTER (WHERE "confidenceScore" IS NOT NULL) as avg_confidence
        FROM jobs 
        WHERE "userId" = ${userId} 
          AND "createdAt" >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month DESC
      `,
      
      // Service type breakdown
      prisma.job.groupBy({
        by: ['serviceType'],
        where: { 
          userId,
          serviceType: { not: null }
        },
        _count: { id: true },
        _avg: { estimatedCost: true },
        orderBy: { _count: { id: 'desc' } }
      }),
      
      // Priority distribution
      prisma.job.groupBy({
        by: ['priority'],
        where: { userId },
        _count: { id: true }
      })
    ])

    // Calculate completion rate
    const completionStats = await prisma.job.aggregate({
      where: { userId },
      _count: {
        id: true,
        completedAt: true
      }
    })

    const completionRate = completionStats._count.id > 0 
      ? (completionStats._count.completedAt / completionStats._count.id) * 100
      : 0

    // Calculate average job value
    const jobValueStats = await prisma.job.aggregate({
      where: { 
        userId,
        actualCost: { not: null }
      },
      _avg: { actualCost: true },
      _sum: { actualCost: true },
      _count: { actualCost: true }
    })

    return NextResponse.json({
      success: true,
      stats: {
        // Basic counts
        totalJobs: basicStats?.totalJobs || 0,
        extractedFromCalls: basicStats?.extractedFromCalls || 0,
        manuallyCreated: basicStats?.manuallyCreated || 0,
        
        // Status and priority breakdowns
        statusBreakdown: basicStats?.statusBreakdown || {},
        priorityBreakdown: basicStats?.priorityBreakdown || {},
        
        // Performance metrics
        completionRate: Math.round(completionRate * 10) / 10,
        averageJobValue: jobValueStats._avg.actualCost ? Math.round(parseFloat(jobValueStats._avg.actualCost.toString()) * 100) / 100 : null,
        totalRevenue: jobValueStats._sum.actualCost ? Math.round(parseFloat(jobValueStats._sum.actualCost.toString()) * 100) / 100 : 0,
        
        // Service type analysis
        serviceTypes: serviceTypeStats.map(stat => ({
          type: stat.serviceType,
          count: stat._count.id,
          averageValue: stat._avg.estimatedCost ? Math.round(parseFloat(stat._avg.estimatedCost.toString()) * 100) / 100 : null
        })),
        
        // Priority distribution
        priorities: priorityStats.reduce((acc, stat) => {
          acc[stat.priority || 'normal'] = stat._count.id
          return acc
        }, {} as Record<string, number>),
        
        // Monthly trends
        monthlyTrends: monthlyStats
      },
      
      recentJobs: recentJobs.map(job => ({
        id: job.id,
        title: job.title,
        customerName: job.customerName,
        serviceType: job.serviceType,
        status: job.status,
        priority: job.priority,
        extractedFromCall: job.extractedFromCall,
        confidenceScore: job.extractedAppointment?.confidenceScore,
        createdAt: job.createdAt
      }))
    })

  } catch (error) {
    console.error('❌ Job stats API failed:', error)
    return NextResponse.json({
      error: 'Failed to get job statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}