import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
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

    const customerId = params.id
    const userId = session.user.id
    const url = new URL(request.url)
    
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // Verify customer belongs to user
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        userId
      }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Get call history for this customer
    const [calls, totalCount] = await Promise.all([
      prisma.extractedAppointment.findMany({
        where: { customerId },
        include: {
          callRecord: {
            include: {
              transcriptions: {
                select: {
                  transcriptionText: true,
                  confidenceScore: true,
                  createdAt: true
                }
              }
            }
          },
          jobs: {
            select: {
              id: true,
              title: true,
              status: true,
              estimatedCost: true,
              actualCost: true,
              createdAt: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: Math.min(limit, 100)
      }),

      prisma.extractedAppointment.count({
        where: { customerId }
      })
    ])

    return NextResponse.json({
      success: true,
      calls: calls.map(call => ({
        id: call.id,
        callSid: call.callRecord.callSid,
        phoneNumber: call.callRecord.phoneNumber,
        duration: call.callRecord.duration,
        callDate: call.callRecord.createdAt,
        
        // Extracted appointment data
        customerName: call.customerName,
        customerPhone: call.customerPhone,
        serviceType: call.serviceType,
        jobDescription: call.jobDescription,
        serviceAddress: call.serviceAddress,
        quotedPrice: call.quotedPrice,
        urgencyLevel: call.urgencyLevel,
        confidenceScore: call.confidenceScore,
        hasIssues: call.hasIssues,
        reviewNotes: call.reviewNotes,
        
        // Transcription
        transcription: call.callRecord.transcriptions[0]?.transcriptionText,
        transcriptionConfidence: call.callRecord.transcriptions[0]?.confidenceScore,
        
        // Generated jobs
        jobs: call.jobs,
        jobCount: call.jobs.length,
        
        createdAt: call.createdAt
      })),
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email
      }
    })

  } catch (error) {
    console.error('❌ Get customer calls API failed:', error)
    return NextResponse.json({
      error: 'Failed to get customer calls',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}