import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getExtractionStats } from '@/lib/appointment-extraction'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const includeStats = url.searchParams.get('stats') === 'true'

    // Get extracted appointments for user
    const extractions = await prisma.extractedAppointment.findMany({
      where: { userId },
      include: {
        callRecord: {
          select: {
            callSid: true,
            phoneNumber: true,
            duration: true,
            createdAt: true
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    })

    // Get stats if requested
    let stats = null
    if (includeStats) {
      stats = await getExtractionStats(userId)
    }

    return NextResponse.json({
      success: true,
      extractions: extractions.map(extraction => ({
        id: extraction.id,
        callRecordId: extraction.callRecordId,
        hasAppointment: !!extraction.customerName || !!extraction.serviceType,
        
        // Customer Info
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
        
        // Quality
        confidenceScore: extraction.confidenceScore,
        hasIssues: extraction.hasIssues,
        reviewNotes: extraction.reviewNotes,
        isReviewed: extraction.isReviewed,
        
        // Metadata
        createdAt: extraction.createdAt,
        processingTime: extraction.processingTime,
        extractionModel: extraction.extractionModel,
        
        // Call Info
        callRecord: extraction.callRecord
      })),
      stats,
      pagination: {
        limit,
        offset,
        total: extractions.length
      }
    })

  } catch (error) {
    console.error('❌ Get extracted appointments API failed:', error)
    return NextResponse.json({ 
      error: 'Failed to get extracted appointments',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}