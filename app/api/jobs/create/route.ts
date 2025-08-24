import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createJob, createJobFromExtraction } from '@/lib/job-creation'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()
    
    const {
      extractedAppointmentId,
      // Manual job creation fields
      title,
      customerName,
      customerPhone,
      customerEmail,
      serviceType,
      description,
      scheduledDate,
      scheduledTime,
      estimatedDuration,
      address,
      priority,
      estimatedCost,
      notes,
      customerId
    } = body

    if (extractedAppointmentId) {
      // Create job from extracted appointment
      console.log(`🚀 Creating job from extraction: ${extractedAppointmentId}`)

      // Verify extraction belongs to user
      const extraction = await prisma.extractedAppointment.findFirst({
        where: {
          id: extractedAppointmentId,
          userId
        }
      })

      if (!extraction) {
        return NextResponse.json({
          error: 'Extracted appointment not found'
        }, { status: 404 })
      }

      const result = await createJobFromExtraction(extractedAppointmentId)

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'Job created from extraction successfully',
          jobId: result.jobId,
          warnings: result.warnings
        })
      } else {
        return NextResponse.json({
          success: false,
          error: result.error
        }, { status: 400 })
      }

    } else if (title && customerName) {
      // Manual job creation
      console.log(`🛠️ Creating manual job: ${title}`)

      const result = await createJob(userId, {
        title,
        customerName,
        customerPhone,
        customerEmail,
        serviceType,
        description,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
        scheduledTime,
        estimatedDuration,
        address,
        priority,
        estimatedCost,
        notes,
        customerId,
        extractedFromCall: false
      })

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'Job created successfully',
          jobId: result.jobId,
          warnings: result.warnings
        })
      } else {
        return NextResponse.json({
          success: false,
          error: result.error
        }, { status: 400 })
      }

    } else {
      return NextResponse.json({
        error: 'Missing required parameters. Provide either extractedAppointmentId or title + customerName'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Job creation API failed:', error)
    return NextResponse.json({
      error: 'Job creation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Job Creation API',
    usage: {
      fromExtraction: 'POST with extractedAppointmentId',
      manual: 'POST with title, customerName, and other job fields'
    },
    requiredFields: {
      manual: ['title', 'customerName'],
      optional: [
        'customerPhone',
        'customerEmail', 
        'serviceType',
        'description',
        'scheduledDate',
        'scheduledTime',
        'address',
        'priority',
        'estimatedCost',
        'notes'
      ]
    },
    features: [
      'Automatic job creation from extracted appointments',
      'Manual job creation with validation',
      'Customer management integration',
      'Priority mapping from urgency levels',
      'Natural language date parsing',
      'Job title generation',
      'Data validation and error handling'
    ]
  })
}