import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { CustomerStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get comprehensive customer analytics
    const [
      totalCustomers,
      customersByStatus,
      recentCustomers,
      topCustomers,
      conversionStats,
      monthlyGrowth,
      tagStats,
      activityStats
    ] = await Promise.all([
      // Total customer count
      prisma.customer.count({
        where: { userId }
      }),

      // Customers by status
      prisma.customer.groupBy({
        by: ['status'],
        where: { userId },
        _count: { id: true }
      }),

      // Recent customers (last 30 days)
      prisma.customer.findMany({
        where: {
          userId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        select: {
          id: true,
          name: true,
          phone: true,
          createdAt: true,
          totalJobs: true,
          totalSpent: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),

      // Top customers by revenue
      prisma.customer.findMany({
        where: { 
          userId,
          totalSpent: { gt: 0 }
        },
        select: {
          id: true,
          name: true,
          phone: true,
          totalSpent: true,
          totalJobs: true,
          averageJobValue: true
        },
        orderBy: { totalSpent: 'desc' },
        take: 10
      }),

      // Conversion statistics
      prisma.$queryRaw`
        SELECT 
          COUNT(*) as total_calls,
          COUNT(*) FILTER (WHERE job_count > 0) as converted_calls,
          ROUND(
            (COUNT(*) FILTER (WHERE job_count > 0) * 100.0 / COUNT(*)), 2
          ) as conversion_rate
        FROM (
          SELECT 
            ea.id,
            COUNT(j.id) as job_count
          FROM extracted_appointments ea
          LEFT JOIN jobs j ON j."extractedAppointmentId" = ea.id
          WHERE ea."userId" = ${userId}
          GROUP BY ea.id
        ) call_jobs
      `,

      // Monthly customer growth (last 12 months)
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "createdAt") as month,
          COUNT(*) as new_customers,
          SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', "createdAt")) as cumulative_customers
        FROM customers 
        WHERE "userId" = ${userId} 
          AND "createdAt" >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month DESC
      `,

      // Tag statistics
      prisma.$queryRaw`
        SELECT 
          unnest(tags) as tag,
          COUNT(*) as tag_count
        FROM customers 
        WHERE "userId" = ${userId} AND array_length(tags, 1) > 0
        GROUP BY tag
        ORDER BY tag_count DESC
        LIMIT 20
      `,

      // Activity statistics (calls and jobs in last 90 days)
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('week', date) as week,
          SUM(calls) as weekly_calls,
          SUM(jobs) as weekly_jobs
        FROM (
          SELECT 
            cr."createdAt"::date as date,
            COUNT(*) as calls,
            0 as jobs
          FROM call_records cr
          WHERE cr."userId" = ${userId}
            AND cr."createdAt" >= NOW() - INTERVAL '90 days'
          GROUP BY cr."createdAt"::date
          
          UNION ALL
          
          SELECT 
            j."createdAt"::date as date,
            0 as calls,
            COUNT(*) as jobs
          FROM jobs j
          WHERE j."userId" = ${userId}
            AND j."createdAt" >= NOW() - INTERVAL '90 days'
          GROUP BY j."createdAt"::date
        ) activity
        GROUP BY DATE_TRUNC('week', date)
        ORDER BY week DESC
        LIMIT 12
      `
    ])

    // Calculate key metrics
    const statusBreakdown = customersByStatus.reduce((acc, item) => {
      acc[item.status] = item._count.id
      return acc
    }, {} as Record<CustomerStatus, number>)

    const activeCustomers = statusBreakdown[CustomerStatus.ACTIVE] || 0
    const newCustomersThisMonth = recentCustomers.filter(customer => 
      customer.createdAt >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length

    return NextResponse.json({
      success: true,
      analytics: {
        // Summary metrics
        totalCustomers,
        activeCustomers,
        newCustomersThisMonth,
        statusBreakdown,
        
        // Conversion metrics
        conversionStats: (conversionStats as any)?.[0] || {
          total_calls: 0,
          converted_calls: 0,
          conversion_rate: 0
        },
        
        // Financial metrics
        topCustomers: topCustomers.map(customer => ({
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          totalSpent: customer.totalSpent ? parseFloat(customer.totalSpent.toString()) : 0,
          totalJobs: customer.totalJobs,
          averageJobValue: customer.averageJobValue ? parseFloat(customer.averageJobValue.toString()) : 0
        })),
        
        totalRevenue: topCustomers.reduce((sum, customer) => 
          sum + (customer.totalSpent ? parseFloat(customer.totalSpent.toString()) : 0), 0
        ),
        
        // Growth metrics
        recentCustomers: recentCustomers.map(customer => ({
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          createdAt: customer.createdAt,
          totalJobs: customer.totalJobs,
          totalSpent: customer.totalSpent ? parseFloat(customer.totalSpent.toString()) : 0
        })),
        
        monthlyGrowth: monthlyGrowth,
        activityTrends: activityStats,
        
        // Segmentation
        tagDistribution: (tagStats as any[])?.slice(0, 10) || [],
        
        // Additional insights
        insights: {
          averageCustomerValue: topCustomers.length > 0 
            ? topCustomers.reduce((sum, c) => sum + (c.totalSpent ? parseFloat(c.totalSpent.toString()) : 0), 0) / topCustomers.length
            : 0,
          repeatCustomerRate: totalCustomers > 0 
            ? (topCustomers.filter(c => c.totalJobs > 1).length / Math.min(totalCustomers, topCustomers.length)) * 100
            : 0,
          averageJobsPerCustomer: totalCustomers > 0
            ? topCustomers.reduce((sum, c) => sum + c.totalJobs, 0) / Math.min(totalCustomers, topCustomers.length)
            : 0
        }
      }
    })

  } catch (error) {
    console.error('❌ Customer analytics API failed:', error)
    return NextResponse.json({
      error: 'Failed to get customer analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}