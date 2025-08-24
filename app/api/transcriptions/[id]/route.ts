import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getCallTranscription } from '@/lib/transcription'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const callRecordId = params.id
    const transcription = await getCallTranscription(callRecordId)

    if (!transcription) {
      return NextResponse.json({ 
        error: 'Transcription not found' 
      }, { status: 404 })
    }

    // Verify the transcription belongs to the current user
    if (transcription.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      transcription: {
        id: transcription.id,
        callRecordId: transcription.callRecordId,
        transcriptionText: transcription.transcriptionText,
        language: transcription.language,
        confidenceScore: transcription.confidenceScore,
        processingTime: transcription.processingTime,
        audioFormat: transcription.audioFormat,
        audioDuration: transcription.audioDuration,
        whisperModel: transcription.whisperModel,
        createdAt: transcription.createdAt,
        updatedAt: transcription.updatedAt,
        callRecord: {
          callSid: transcription.callRecord.callSid,
          phoneNumber: transcription.callRecord.phoneNumber,
          duration: transcription.callRecord.duration,
          createdAt: transcription.callRecord.createdAt
        }
      }
    })

  } catch (error) {
    console.error('❌ Get transcription API failed:', error)
    return NextResponse.json({ 
      error: 'Failed to get transcription',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}