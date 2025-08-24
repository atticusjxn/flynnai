import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getCustomerProfile, updateCustomerAnalytics } from '@/lib/customer-management'
import { prisma } from '@/lib/prisma'
import { CustomerStatus } from '@prisma/client'

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

    const result = await getCustomerProfile(userId, customerId)

    return NextResponse.json({
      success: true,
      customer: {
        ...result.customer,
        totalSpent: result.customer.totalSpent ? parseFloat(result.customer.totalSpent.toString()) : 0,
        averageJobValue: result.customer.averageJobValue ? parseFloat(result.customer.averageJobValue.toString()) : 0
      },
      stats: result.stats
    })

  } catch (error) {
    console.error('❌ Get customer profile API failed:', error)
    
    if (error instanceof Error && error.message === 'Customer not found') {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json({
      error: 'Failed to get customer profile',
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

    const customerId = params.id
    const userId = session.user.id
    const body = await request.json()

    // Verify customer belongs to user
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        userId
      }
    })

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {}
    
    if (body.name !== undefined) updateData.name = body.name.trim()
    if (body.phone !== undefined) {
      const { normalizePhoneNumber } = await import('@/lib/customer-management')
      updateData.phone = body.phone ? normalizePhoneNumber(body.phone.trim()) : null
    }
    if (body.email !== undefined) updateData.email = body.email?.trim().toLowerCase() || null
    if (body.address !== undefined) updateData.address = body.address?.trim() || null
    if (body.preferredContact !== undefined) updateData.preferredContact = body.preferredContact
    if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null
    if (body.tags !== undefined) updateData.tags = body.tags || []
    if (body.status !== undefined) updateData.status = body.status as CustomerStatus
    if (body.isBlacklisted !== undefined) {
      updateData.isBlacklisted = body.isBlacklisted
      if (body.blacklistReason !== undefined) {
        updateData.blacklistReason = body.blacklistReason?.trim() || null
      }
    }

    // Update customer
    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: updateData,
      include: {
        jobs: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        extractedAppointments: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Customer updated successfully',
      customer: updatedCustomer
    })

  } catch (error) {
    console.error('❌ Update customer API failed:', error)
    return NextResponse.json({
      error: 'Failed to update customer',
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

    const customerId = params.id
    const userId = session.user.id

    // Verify customer belongs to user
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        userId
      },
      include: {
        jobs: true,
        extractedAppointments: true
      }
    })

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Check if customer has active jobs
    const activeJobs = existingCustomer.jobs.filter(job => 
      !job.completedAt && job.status !== 'COMPLETED'
    )

    if (activeJobs.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete customer with active jobs',
        activeJobsCount: activeJobs.length
      }, { status: 400 })
    }

    // Soft delete: set status to FORMER and clear sensitive data
    const deletedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        status: CustomerStatus.FORMER,
        phone: null,
        email: null,
        address: null,
        notes: `[DELETED] ${new Date().toISOString()}`
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully',
      customer: deletedCustomer
    })

  } catch (error) {
    console.error('❌ Delete customer API failed:', error)
    return NextResponse.json({
      error: 'Failed to delete customer',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}