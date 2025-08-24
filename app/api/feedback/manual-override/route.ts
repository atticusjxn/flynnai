import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { feedbackManager } from '@/lib/feedback'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      callRecordId,
      overrideData,
      reason
    } = await request.json()

    // Validate required fields
    if (!callRecordId || !overrideData || !reason) {
      return NextResponse.json({ 
        error: 'Missing required fields: callRecordId, overrideData, reason' 
      }, { status: 400 })
    }

    // Validate override data structure
    const requiredFields = ['hasAppointment']
    if (overrideData.hasAppointment) {
      // If it's an appointment, we need at least some basic info
      const appointmentFields = ['customerName', 'serviceType']
      const hasRequiredAppointmentFields = appointmentFields.some(field => 
        overrideData[field] && overrideData[field].trim()
      )
      
      if (!hasRequiredAppointmentFields) {
        return NextResponse.json({ 
          error: 'For appointments, at least customer name or service type is required' 
        }, { status: 400 })
      }
    }

    const extractionId = await feedbackManager.createManualOverride({
      callRecordId,
      userId: session.user.id,
      overrideData,
      reason
    })

    return NextResponse.json({
      success: true,
      extractionId,
      message: 'Manual override applied successfully'
    })

  } catch (error) {
    console.error('❌ Manual override failed:', error)
    return NextResponse.json({
      error: 'Failed to apply manual override',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}