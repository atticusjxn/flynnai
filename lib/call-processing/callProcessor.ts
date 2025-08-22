import { prisma } from '@/lib/prisma'
import { transcribeCall } from './transcription'
import { extractAppointmentData } from './appointmentExtractor'
import { sendAppointmentEmail } from './emailDelivery'
import { isAppointmentCall } from './callFiltering'

export async function processCall(callRecordId: string, userId: string) {
  try {
    const callRecord = await prisma.callRecord.findUnique({
      where: { id: callRecordId },
      include: { user: true }
    })

    if (!callRecord || !callRecord.recordingUrl) {
      throw new Error('Call record or recording not found')
    }

    // Step 1: Transcribe the call
    const transcription = await transcribeCall(callRecord.recordingUrl)
    
    await prisma.callRecord.update({
      where: { id: callRecordId },
      data: {
        rawTranscription: transcription,
        transcription: transcription // For now, same as raw
      }
    })

    // Step 2: Check if this is an appointment-related call
    const isAppointment = await isAppointmentCall(transcription)
    
    if (!isAppointment) {
      await prisma.callRecord.update({
        where: { id: callRecordId },
        data: { status: 'FILTERED_OUT' }
      })
      return
    }

    // Step 3: Extract appointment data
    const appointmentData = await extractAppointmentData(transcription)
    
    if (!appointmentData || appointmentData.confidence < 50) {
      await prisma.callRecord.update({
        where: { id: callRecordId },
        data: { status: 'NO_APPOINTMENT' }
      })
      return
    }

    // Update call record with extracted data
    await prisma.callRecord.update({
      where: { id: callRecordId },
      data: {
        appointmentData: appointmentData,
        confidenceScore: appointmentData.confidence,
        status: 'COMPLETED'
      }
    })

    // Step 4: Send email with appointment details
    await sendAppointmentEmail({
      user: callRecord.user,
      callRecord: {
        ...callRecord,
        appointmentData,
        confidenceScore: appointmentData.confidence
      },
      transcription
    })

    // Update email sent status
    await prisma.callRecord.update({
      where: { id: callRecordId },
      data: {
        emailSent: true,
        calendarFileSent: true
      }
    })

    // Update user's trial usage if applicable
    if (callRecord.user.planType === 'trial') {
      await prisma.user.update({
        where: { id: userId },
        data: {
          trialCallsUsed: {
            increment: 1
          }
        }
      })
    }

  } catch (error) {
    console.error('Call processing error:', error)
    
    await prisma.callRecord.update({
      where: { id: callRecordId },
      data: { status: 'FAILED' }
    })
    
    throw error
  }
}