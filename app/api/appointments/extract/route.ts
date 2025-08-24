import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { processAppointmentExtraction, extractAppointmentData } from '@/lib/appointment-extraction'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()
    const { callRecordId, transcriptionText, directExtraction = false } = body

    if (directExtraction && transcriptionText) {
      // Direct extraction from provided transcription text
      console.log(`🧠 Performing direct appointment extraction`)
      
      const result = await extractAppointmentData(transcriptionText)
      
      return NextResponse.json({
        success: result.success,
        data: result.data,
        processingTime: result.processingTime,
        error: result.error
      })

    } else if (callRecordId) {
      // Extract from call record
      console.log(`🧠 Processing appointment extraction for call record: ${callRecordId}`)
      
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

      const result = await processAppointmentExtraction(callRecordId)
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'Appointment extraction completed successfully',
          data: result.data,
          processingTime: result.processingTime
        })
      } else {
        return NextResponse.json({
          success: false,
          error: result.error,
          message: 'Appointment extraction failed'
        }, { status: 500 })
      }

    } else {
      return NextResponse.json({ 
        error: 'Missing callRecordId or transcriptionText parameter' 
      }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Appointment extraction API failed:', error)
    return NextResponse.json({ 
      error: 'Appointment extraction failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Appointment Extraction API',
    usage: {
      callRecord: 'POST with callRecordId',
      direct: 'POST with transcriptionText and directExtraction: true'
    },
    features: [
      'GPT-4 powered appointment extraction',
      'Structured data parsing',
      'Confidence scoring',
      'Edge case handling',
      'Customer management integration',
      'Automatic quality checks'
    ]
  })
}