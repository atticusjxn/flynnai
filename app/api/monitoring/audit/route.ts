import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { auditLogger } from '@/lib/audit-logging'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'logs' // 'logs', 'analytics', 'export'
    const timeRange = searchParams.get('timeRange') as 'day' | 'week' | 'month' || 'day'
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')
    const resource = searchParams.get('resource')
    const severity = searchParams.get('severity')
    const success = searchParams.get('success')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const format = searchParams.get('format') as 'json' | 'csv' || 'json'

    console.log(`📝 Audit ${type} requested by user:`, session.user.id)

    // Log the audit access
    await auditLogger.logDataAccess(
      session.user.id,
      'audit_logs',
      type,
      'read',
      { 
        requestType: type,
        timeRange,
        filters: { userId, action, resource, severity, success }
      },
      true,
      session.user.email
    )

    if (type === 'analytics') {
      const analytics = await auditLogger.getAnalytics(timeRange)
      
      return NextResponse.json({
        success: true,
        analytics,
        timeRange,
        generatedAt: new Date().toISOString()
      })
    }

    if (type === 'export') {
      const filter = {
        userId: userId || undefined,
        action: action || undefined,
        resource: resource || undefined,
        severity: severity || undefined,
        success: success === 'true' ? true : success === 'false' ? false : undefined,
        limit: 10000 // Large limit for exports
      }

      const exportData = await auditLogger.exportLogs(filter, format)
      
      const headers: Record<string, string> = {
        'Content-Type': format === 'csv' ? 'text/csv' : 'application/json'
      }
      
      if (format === 'csv') {
        headers['Content-Disposition'] = `attachment; filename="audit_logs_${new Date().toISOString().split('T')[0]}.csv"`
      }

      return new NextResponse(exportData, { headers })
    }

    // Default: return logs
    const filter = {
      userId: userId || undefined,
      action: action || undefined,
      resource: resource || undefined,
      severity: severity || undefined,
      success: success === 'true' ? true : success === 'false' ? false : undefined,
      limit,
      offset
    }

    const logs = await auditLogger.getLogs(filter)

    return NextResponse.json({
      success: true,
      logs,
      count: logs.length,
      filter,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Audit API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve audit data',
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

    const { 
      action, 
      resource, 
      resourceId, 
      details, 
      severity = 'low',
      success = true,
      errorMessage 
    } = await request.json()

    if (!action || !resource) {
      return NextResponse.json(
        { error: 'Missing required fields: action, resource' },
        { status: 400 }
      )
    }

    // Get client IP and User Agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await auditLogger.log({
      userId: session.user.id,
      userEmail: session.user.email,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      success,
      severity,
      errorMessage
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Audit log entry created'
    })

  } catch (error) {
    console.error('❌ Audit logging error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create audit log entry' },
      { status: 500 }
    )
  }
}