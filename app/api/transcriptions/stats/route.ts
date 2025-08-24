import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getTranscriptionStats } from '@/lib/transcription'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const stats = await getTranscriptionStats(userId)

    if (!stats) {
      return NextResponse.json({ 
        error: 'Failed to retrieve transcription stats' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalTranscriptions: stats.total,
        averageConfidenceScore: stats.averageConfidence ? Math.round(stats.averageConfidence * 100) / 100 : null,
        averageProcessingTimeMs: stats.averageProcessingTime ? Math.round(stats.averageProcessingTime) : null,
        averageAudioDurationSec: stats.averageDuration ? Math.round(stats.averageDuration) : null
      },
      recentTranscriptions: stats.recent.map(t => ({
        id: t.id,
        callSid: t.callRecord.callSid,
        phoneNumber: t.callRecord.phoneNumber,
        transcriptionText: t.transcriptionText.substring(0, 200) + (t.transcriptionText.length > 200 ? '...' : ''),
        confidenceScore: t.confidenceScore,
        language: t.language,
        processingTime: t.processingTime,
        createdAt: t.createdAt,
        callCreatedAt: t.callRecord.createdAt
      }))
    })

  } catch (error) {
    console.error('❌ Transcription stats API failed:', error)
    return NextResponse.json({ 
      error: 'Failed to get transcription stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}