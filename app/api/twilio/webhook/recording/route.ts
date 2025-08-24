import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { downloadAndStoreRecording } from '@/lib/storage'
import { processCallRecordingTranscription } from '@/lib/transcription'

export async function POST(request: NextRequest) {
  try {
    console.log('🎵 Recording webhook received')
    
    // Get headers for signature validation
    const headersList = headers()
    const twilioSignature = headersList.get('X-Twilio-Signature') || ''
    const requestUrl = headersList.get('host') 
      ? `https://${headersList.get('host')}/api/twilio/webhook/recording`
      : process.env.NEXTAUTH_URL + '/api/twilio/webhook/recording'
    
    // Parse form data
    const formData = await request.formData()
    const webhookData: Record<string, string> = {}
    
    formData.forEach((value, key) => {
      webhookData[key] = value.toString()
    })

    const {
      CallSid,
      RecordingUrl,
      RecordingSid,
      RecordingDuration,
      RecordingStatus,
      RecordingChannels
    } = webhookData

    console.log('📊 Recording details:', {
      CallSid,
      RecordingSid,
      RecordingStatus,
      RecordingDuration: RecordingDuration ? `${RecordingDuration}s` : 'unknown'
    })

    if (!CallSid || !RecordingSid) {
      console.error('❌ Missing required recording webhook fields')
      return NextResponse.json({ error: 'Invalid webhook data' }, { status: 400 })
    }

    // Find the call record
    const callRecord = await prisma.callRecord.findFirst({
      where: {
        callSid: CallSid
      },
      include: {
        user: true
      }
    })

    if (!callRecord) {
      console.error(`❌ Call record not found for CallSid: ${CallSid}`)
      return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    }

    const user = callRecord.user

    // TODO: Validate webhook signature
    if (twilioSignature) {
      console.log('ℹ️ Recording webhook signature present (validation will be implemented)')
    } else {
      console.log('ℹ️ No signature provided for recording webhook')
    }

    // Handle different recording statuses
    switch (RecordingStatus) {
      case 'completed':
        console.log('✅ Recording completed, processing and storing...')
        
        let storedRecordingUrl = RecordingUrl
        
        // Download and store recording securely
        if (RecordingUrl) {
          console.log('📥 Downloading and storing recording...')
          
          // Create basic auth header for Twilio API
          const twilioAuth = user.twilioAccountSid && user.twilioAuthToken 
            ? `Basic ${Buffer.from(`${user.twilioAccountSid}:${user.twilioAuthToken}`).toString('base64')}`
            : undefined
          
          const storageResult = await downloadAndStoreRecording(
            RecordingUrl,
            CallSid,
            user.id,
            twilioAuth
          )
          
          if (storageResult.success && storageResult.publicUrl) {
            storedRecordingUrl = storageResult.publicUrl
            console.log('✅ Recording stored successfully')
            
            // Update call record with full metadata
            await prisma.callRecord.update({
              where: { id: callRecord.id },
              data: {
                recordingUrl: storedRecordingUrl,
                recordingSid: RecordingSid,
                recordingStorageKey: storageResult.storageKey,
                recordingFileSize: storageResult.metadata?.fileSize,
                recordingFormat: storageResult.metadata?.format,
                recordingStoredAt: new Date(),
                duration: RecordingDuration ? parseInt(RecordingDuration) : callRecord.duration,
                status: 'COMPLETED'
              }
            })
          } else {
            console.error('❌ Failed to store recording:', storageResult.error)
            // Continue with original URL as fallback
            await prisma.callRecord.update({
              where: { id: callRecord.id },
              data: {
                recordingUrl: storedRecordingUrl,
                recordingSid: RecordingSid,
                duration: RecordingDuration ? parseInt(RecordingDuration) : callRecord.duration,
                status: 'COMPLETED'
              }
            })
          }
        } else {
          // No recording URL provided
          await prisma.callRecord.update({
            where: { id: callRecord.id },
            data: {
              recordingSid: RecordingSid,
              duration: RecordingDuration ? parseInt(RecordingDuration) : callRecord.duration,
              status: 'COMPLETED'
            }
          })
        }

        console.log('📊 Call record updated with recording details:', {
          callSid: CallSid,
          duration: `${RecordingDuration}s`,
          hasRecording: !!storedRecordingUrl,
          recordingSid: RecordingSid
        })

        // Trigger transcription processing in background
        console.log('🎙️ Starting transcription processing...')
        processCallRecordingTranscription(callRecord.id).catch(error => {
          console.error('❌ Transcription processing failed:', error)
        })
        
        // TODO: After transcription, trigger appointment extraction with GPT-4
        console.log('📋 Recording transcription initiated (appointment extraction in next task)')
        
        break
        
      case 'failed':
        console.error('❌ Recording failed')
        await prisma.callRecord.update({
          where: { id: callRecord.id },
          data: {
            status: 'FAILED'
          }
        })
        break
        
      case 'absent':
        console.log('⚠️ No recording available for this call')
        await prisma.callRecord.update({
          where: { id: callRecord.id },
          data: {
            status: 'NO_APPOINTMENT'
          }
        })
        break
        
      default:
        console.log(`ℹ️ Recording status: ${RecordingStatus}`)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ Recording webhook processing failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Handle GET requests
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Twilio Recording Webhook Endpoint',
    status: 'active',
    timestamp: new Date().toISOString()
  })
}