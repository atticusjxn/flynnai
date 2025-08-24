import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { processCallRecordingTranscription, batchProcessTranscriptions } from '@/lib/transcription'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()
    const { callRecordId, callRecordIds, batch = false } = body

    if (batch && callRecordIds && Array.isArray(callRecordIds)) {
      // Batch processing
      console.log(`🔄 Starting batch transcription for ${callRecordIds.length} recordings`)
      
      // Verify all call records belong to the user
      const userCallRecords = await prisma.callRecord.findMany({
        where: {
          id: { in: callRecordIds },
          userId
        },
        select: { id: true }
      })

      if (userCallRecords.length !== callRecordIds.length) {
        return NextResponse.json({ 
          error: 'Some call records not found or not accessible' 
        }, { status: 400 })
      }

      const result = await batchProcessTranscriptions(callRecordIds, 3)
      
      return NextResponse.json({
        success: true,
        message: `Batch processing completed: ${result.success} successful, ${result.failed} failed`,
        results: result.results,
        summary: {
          total: callRecordIds.length,
          successful: result.success,
          failed: result.failed
        }
      })

    } else if (callRecordId) {
      // Single transcription processing
      console.log(`🎙️ Processing single transcription for call record: ${callRecordId}`)
      
      // Verify call record belongs to the user
      const callRecord = await prisma.callRecord.findFirst({
        where: {
          id: callRecordId,
          userId
        }
      })

      if (!callRecord) {
        return NextResponse.json({ 
          error: 'Call record not found' 
        }, { status: 404 })
      }

      const result = await processCallRecordingTranscription(callRecordId)
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'Transcription completed successfully',
          transcription: result.transcription,
          confidence: result.confidence,
          processingTime: result.processingTime
        })
      } else {
        return NextResponse.json({
          success: false,
          error: result.error,
          message: 'Transcription failed'
        }, { status: 500 })
      }

    } else {
      return NextResponse.json({ 
        error: 'Missing callRecordId or callRecordIds parameter' 
      }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Transcription API failed:', error)
    return NextResponse.json({ 
      error: 'Transcription processing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Transcription Processing API',
    usage: {
      single: 'POST with callRecordId',
      batch: 'POST with callRecordIds array and batch: true'
    },
    features: [
      'OpenAI Whisper integration',
      'Automatic retry logic',
      'Confidence scoring',
      'Multiple audio format support',
      'Batch processing capability'
    ]
  })
}