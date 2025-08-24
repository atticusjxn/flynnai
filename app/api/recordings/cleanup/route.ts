import { NextRequest, NextResponse } from 'next/server'
import { cleanupOldRecordings } from '@/lib/storage'
import { getServerSession } from 'next-auth'

export async function POST(request: NextRequest) {
  try {
    // Check for admin authorization or cron job authorization
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    let userId: string | undefined
    let isAuthorized = false
    
    // Check for cron job authorization
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      isAuthorized = true
      console.log('🔧 Cleanup triggered by cron job')
    } else {
      // Check for user session
      const session = await getServerSession()
      if (session?.user) {
        userId = session.user.id
        isAuthorized = true
        console.log(`🔧 Cleanup triggered by user: ${userId}`)
      }
    }
    
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const retentionDays = body.retentionDays || 30

    console.log(`🧹 Starting cleanup for recordings older than ${retentionDays} days`)
    
    const result = await cleanupOldRecordings(retentionDays, userId)
    
    return NextResponse.json({
      success: true,
      message: `Cleanup completed: ${result.deleted} deleted, ${result.errors} errors`,
      deleted: result.deleted,
      errors: result.errors,
      retentionDays
    })
    
  } catch (error) {
    console.error('❌ Cleanup API failed:', error)
    return NextResponse.json({ 
      error: 'Cleanup failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Recording Cleanup API',
    usage: 'POST with optional retentionDays parameter',
    defaultRetentionDays: 30
  })
}