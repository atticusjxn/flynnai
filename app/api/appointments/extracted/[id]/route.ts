import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getAppointmentExtraction } from '@/lib/appointment-extraction'
import { prisma } from '@/lib/prisma'

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
    const extraction = await getAppointmentExtraction(callRecordId)

    if (!extraction) {
      return NextResponse.json({ 
        error: 'Appointment extraction not found' 
      }, { status: 404 })
    }

    // Verify the extraction belongs to the current user
    if (extraction.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      extraction: {
        id: extraction.id,
        callRecordId: extraction.callRecordId,
        
        // Customer Information
        customerName: extraction.customerName,
        customerPhone: extraction.customerPhone,
        customerEmail: extraction.customerEmail,
        customer: extraction.customer,
        
        // Service Details
        serviceType: extraction.serviceType,
        jobDescription: extraction.jobDescription,
        urgencyLevel: extraction.urgencyLevel,
        
        // Scheduling
        preferredDate: extraction.preferredDate,
        preferredTime: extraction.preferredTime,
        timeFlexibility: extraction.timeFlexibility,
        
        // Location
        serviceAddress: extraction.serviceAddress,
        addressConfidence: extraction.addressConfidence,
        
        // Pricing
        quotedPrice: extraction.quotedPrice,
        budgetMentioned: extraction.budgetMentioned,
        pricingDiscussion: extraction.pricingDiscussion,
        
        // AI Processing Metadata
        confidenceScore: extraction.confidenceScore,
        extractionModel: extraction.extractionModel,
        processingTime: extraction.processingTime,
        rawExtraction: extraction.rawExtraction,
        
        // Review and Validation
        isReviewed: extraction.isReviewed,
        hasIssues: extraction.hasIssues,
        reviewNotes: extraction.reviewNotes,
        manualOverride: extraction.manualOverride,
        
        createdAt: extraction.createdAt,
        updatedAt: extraction.updatedAt,
        
        callRecord: {
          callSid: extraction.callRecord.callSid,
          phoneNumber: extraction.callRecord.phoneNumber,
          duration: extraction.callRecord.duration,
          createdAt: extraction.callRecord.createdAt
        }
      }
    })

  } catch (error) {
    console.error('❌ Get appointment extraction API failed:', error)
    return NextResponse.json({ 
      error: 'Failed to get appointment extraction',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const callRecordId = params.id
    const userId = session.user.id
    const body = await request.json()

    // Verify extraction exists and belongs to user
    const existingExtraction = await prisma.extractedAppointment.findUnique({
      where: { callRecordId }
    })

    if (!existingExtraction || existingExtraction.userId !== userId) {
      return NextResponse.json({ 
        error: 'Appointment extraction not found' 
      }, { status: 404 })
    }

    // Update extraction with manual overrides
    const updatedExtraction = await prisma.extractedAppointment.update({
      where: { callRecordId },
      data: {
        customerName: body.customerName ?? existingExtraction.customerName,
        customerPhone: body.customerPhone ?? existingExtraction.customerPhone,
        customerEmail: body.customerEmail ?? existingExtraction.customerEmail,
        serviceType: body.serviceType ?? existingExtraction.serviceType,
        jobDescription: body.jobDescription ?? existingExtraction.jobDescription,
        urgencyLevel: body.urgencyLevel ?? existingExtraction.urgencyLevel,
        preferredDate: body.preferredDate ? new Date(body.preferredDate) : existingExtraction.preferredDate,
        preferredTime: body.preferredTime ?? existingExtraction.preferredTime,
        timeFlexibility: body.timeFlexibility ?? existingExtraction.timeFlexibility,
        serviceAddress: body.serviceAddress ?? existingExtraction.serviceAddress,
        quotedPrice: body.quotedPrice ?? existingExtraction.quotedPrice,
        budgetMentioned: body.budgetMentioned ?? existingExtraction.budgetMentioned,
        pricingDiscussion: body.pricingDiscussion ?? existingExtraction.pricingDiscussion,
        isReviewed: true,
        manualOverride: true,
        reviewNotes: body.reviewNotes ?? existingExtraction.reviewNotes
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Appointment extraction updated successfully',
      extraction: updatedExtraction
    })

  } catch (error) {
    console.error('❌ Update appointment extraction API failed:', error)
    return NextResponse.json({ 
      error: 'Failed to update appointment extraction',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}