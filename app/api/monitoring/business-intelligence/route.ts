import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { businessIntelligence } from '@/lib/business-intelligence'
import { auditLogger } from '@/lib/audit-logging'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'metrics' // 'metrics', 'roi', 'insights', 'report', 'competitive'
    const timeRange = searchParams.get('timeRange') as 'day' | 'week' | 'month' | 'quarter' || 'month'

    console.log(`📊 Business Intelligence ${type} requested for ${timeRange} by user:`, session.user.id)

    // Log the BI access
    await auditLogger.logDataAccess(
      session.user.id,
      'business_intelligence',
      type,
      'read',
      { 
        reportType: type,
        timeRange 
      },
      true,
      session.user.email
    )

    let result: any

    switch (type) {
      case 'metrics':
        result = await businessIntelligence.generateBusinessMetrics(timeRange)
        break

      case 'roi':
        const roiTimeRange = timeRange === 'day' || timeRange === 'week' ? 'month' : timeRange as 'month' | 'quarter' | 'year'
        result = await businessIntelligence.calculateROI(roiTimeRange)
        break

      case 'insights':
        result = await businessIntelligence.generatePredictiveInsights()
        break

      case 'report':
        const reportTimeRange = timeRange === 'day' || timeRange === 'week' ? 'month' : timeRange as 'month' | 'quarter'
        result = await businessIntelligence.generateExecutiveReport(reportTimeRange)
        break

      case 'competitive':
        result = await businessIntelligence.generateCompetitiveAnalysis()
        break

      default:
        return NextResponse.json(
          { error: `Unknown report type: ${type}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      type,
      timeRange,
      data: result,
      generatedAt: new Date().toISOString(),
      metadata: {
        userId: session.user.id,
        requestType: type
      }
    })

  } catch (error) {
    console.error('❌ Business Intelligence API error:', error)
    
    // Log the error
    if (request.url) {
      const session = await getServerSession()
      if (session?.user?.id) {
        await auditLogger.logSystemEvent(
          'business_intelligence_error',
          'api_endpoint',
          {
            error: error instanceof Error ? error.message : 'Unknown error',
            endpoint: '/api/monitoring/business-intelligence',
            userId: session.user.id
          },
          false,
          'medium'
        )
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate business intelligence report',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, reportType, parameters } = await request.json()

    if (!action || !reportType) {
      return NextResponse.json(
        { error: 'Missing required fields: action, reportType' },
        { status: 400 }
      )
    }

    console.log(`📊 Business Intelligence action: ${action} for ${reportType} by user:`, session.user.id)

    // Log the action
    await auditLogger.logUserAction(
      session.user.id,
      `bi_${action}`,
      'business_intelligence',
      {
        reportType,
        parameters,
        timestamp: new Date().toISOString()
      },
      true,
      reportType,
      session.user.email
    )

    let result: any

    switch (action) {
      case 'generate_custom_report':
        // In a real implementation, this would generate custom reports based on parameters
        result = {
          reportId: `custom_${Date.now()}`,
          status: 'generated',
          downloadUrl: `/api/reports/${Date.now()}`,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }
        break

      case 'schedule_report':
        // In a real implementation, this would schedule recurring reports
        result = {
          scheduleId: `schedule_${Date.now()}`,
          frequency: parameters.frequency || 'monthly',
          nextRun: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active'
        }
        break

      case 'export_data':
        // In a real implementation, this would export BI data in various formats
        result = {
          exportId: `export_${Date.now()}`,
          format: parameters.format || 'pdf',
          status: 'processing',
          estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        }
        break

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      action,
      reportType,
      result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Business Intelligence action error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process business intelligence action' },
      { status: 500 }
    )
  }
}