import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { JobStatus } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const jobId = params.id
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        userId: session.user.id
      },
      include: {
        customer: true,
        callRecord: {
          include: {
            transcriptions: true
          }
        },
        extractedAppointment: {
          include: {
            callRecord: {
              select: {
                callSid: true,
                phoneNumber: true,
                duration: true,
                createdAt: true
              }
            }
          }
        },
        invoices: true
      }
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        title: job.title,
        customerName: job.customerName,
        customerPhone: job.customerPhone,
        customerEmail: job.customerEmail,
        serviceType: job.serviceType,
        description: job.description,
        scheduledDate: job.scheduledDate,
        scheduledTime: job.scheduledTime,
        estimatedDuration: job.estimatedDuration,
        address: job.address,
        status: job.status,
        priority: job.priority,
        estimatedCost: job.estimatedCost,
        actualCost: job.actualCost,
        notes: job.notes,
        attachments: job.attachments,
        extractedFromCall: job.extractedFromCall,
        confidenceScore: job.confidenceScore,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        completedAt: job.completedAt,
        
        // Related data
        customer: job.customer,
        callRecord: job.callRecord,
        extractedAppointment: job.extractedAppointment,
        invoices: job.invoices
      }
    })

  } catch (error) {
    console.error('❌ Get job API failed:', error)
    return NextResponse.json({
      error: 'Failed to get job',
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

    const jobId = params.id
    const userId = session.user.id
    const body = await request.json()

    // Verify job exists and belongs to user
    const existingJob = await prisma.job.findFirst({
      where: {
        id: jobId,
        userId
      }
    })

    if (!existingJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {}
    
    // Updatable fields
    if (body.title !== undefined) updateData.title = body.title
    if (body.customerName !== undefined) updateData.customerName = body.customerName
    if (body.customerPhone !== undefined) updateData.customerPhone = body.customerPhone
    if (body.customerEmail !== undefined) updateData.customerEmail = body.customerEmail
    if (body.serviceType !== undefined) updateData.serviceType = body.serviceType
    if (body.description !== undefined) updateData.description = body.description
    if (body.scheduledDate !== undefined) {
      updateData.scheduledDate = body.scheduledDate ? new Date(body.scheduledDate) : null
    }
    if (body.scheduledTime !== undefined) updateData.scheduledTime = body.scheduledTime
    if (body.estimatedDuration !== undefined) updateData.estimatedDuration = body.estimatedDuration
    if (body.address !== undefined) updateData.address = body.address
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.estimatedCost !== undefined) updateData.estimatedCost = body.estimatedCost
    if (body.actualCost !== undefined) updateData.actualCost = body.actualCost
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.attachments !== undefined) updateData.attachments = body.attachments

    // Handle status updates
    if (body.status !== undefined) {
      updateData.status = body.status
      
      // Set completion date if marking as completed
      if (body.status === JobStatus.COMPLETED && !existingJob.completedAt) {
        updateData.completedAt = new Date()
      }
      
      // Clear completion date if changing from completed to other status
      if (body.status !== JobStatus.COMPLETED && existingJob.completedAt) {
        updateData.completedAt = null
      }
    }

    // Update the job
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: updateData,
      include: {
        customer: true,
        callRecord: true,
        extractedAppointment: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Job updated successfully',
      job: updatedJob
    })

  } catch (error) {
    console.error('❌ Update job API failed:', error)
    return NextResponse.json({
      error: 'Failed to update job',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const jobId = params.id
    const userId = session.user.id

    // Verify job exists and belongs to user
    const existingJob = await prisma.job.findFirst({
      where: {
        id: jobId,
        userId
      },
      include: {
        customer: true
      }
    })

    if (!existingJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Delete the job
    await prisma.job.delete({
      where: { id: jobId }
    })

    // Update customer job count if customer exists
    if (existingJob.customerId) {
      await prisma.customer.update({
        where: { id: existingJob.customerId },
        data: {
          totalJobs: { decrement: 1 }
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Job deleted successfully'
    })

  } catch (error) {
    console.error('❌ Delete job API failed:', error)
    return NextResponse.json({
      error: 'Failed to delete job',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}