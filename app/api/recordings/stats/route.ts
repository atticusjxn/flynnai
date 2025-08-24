import { NextRequest, NextResponse } from 'next/server'
import { getStorageStats } from '@/lib/storage'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const stats = await getStorageStats(userId)
    
    // Get additional metadata
    const recentRecordings = await prisma.callRecord.findMany({
      where: {
        userId,
        recordingUrl: { not: null }
      },
      select: {
        id: true,
        callSid: true,
        phoneNumber: true,
        duration: true,
        recordingFileSize: true,
        recordingFormat: true,
        recordingStoredAt: true,
        createdAt: true,
        status: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // Format file sizes
    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalRecordings: stats.totalRecordings,
        totalSizeBytes: stats.totalSizeBytes,
        totalSizeFormatted: formatFileSize(stats.totalSizeBytes),
        oldestRecording: stats.oldestRecording,
        newestRecording: stats.newestRecording,
        averageSizePerRecording: stats.totalRecordings > 0 
          ? Math.round(stats.totalSizeBytes / stats.totalRecordings)
          : 0
      },
      recentRecordings: recentRecordings.map(recording => ({
        id: recording.id,
        callSid: recording.callSid,
        phoneNumber: recording.phoneNumber,
        duration: recording.duration,
        fileSize: recording.recordingFileSize,
        fileSizeFormatted: recording.recordingFileSize ? formatFileSize(recording.recordingFileSize) : 'Unknown',
        format: recording.recordingFormat,
        storedAt: recording.recordingStoredAt,
        createdAt: recording.createdAt,
        status: recording.status
      }))
    })
    
  } catch (error) {
    console.error('❌ Storage stats API failed:', error)
    return NextResponse.json({ 
      error: 'Failed to get storage stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}