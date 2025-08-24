import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { searchCustomers } from '@/lib/customer-management'
import { CustomerStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const url = new URL(request.url)
    
    // Parse query parameters
    const search = url.searchParams.get('search') || undefined
    const status = url.searchParams.get('status') as CustomerStatus | undefined
    const tags = url.searchParams.get('tags')?.split(',').filter(Boolean) || undefined
    const hasJobs = url.searchParams.get('hasJobs') ? url.searchParams.get('hasJobs') === 'true' : undefined
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const sortBy = url.searchParams.get('sortBy') || 'lastContactDate'
    const sortOrder = (url.searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'
    
    // Date filters
    const lastContactFrom = url.searchParams.get('lastContactFrom') 
      ? new Date(url.searchParams.get('lastContactFrom')!) 
      : undefined
    const lastContactTo = url.searchParams.get('lastContactTo')
      ? new Date(url.searchParams.get('lastContactTo')!)
      : undefined

    const result = await searchCustomers(
      userId,
      {
        search,
        status,
        tags,
        hasJobs,
        lastContactFrom,
        lastContactTo
      },
      {
        limit,
        offset,
        sortBy,
        sortOrder
      }
    )

    return NextResponse.json({
      success: true,
      customers: result.customers.map(customer => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        preferredContact: customer.preferredContact,
        tags: customer.tags,
        totalJobs: customer.totalJobs,
        totalSpent: customer.totalSpent,
        averageJobValue: customer.averageJobValue,
        lastContactDate: customer.lastContactDate,
        status: customer.status,
        isBlacklisted: customer.isBlacklisted,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
        recentJobs: customer.jobs.slice(0, 3),
        recentCalls: customer.extractedAppointments.slice(0, 3),
        jobCount: customer._count.jobs,
        callCount: customer._count.extractedAppointments
      })),
      pagination: result.pagination
    })

  } catch (error) {
    console.error('❌ Get customers API failed:', error)
    return NextResponse.json({
      error: 'Failed to get customers',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()
    
    const {
      name,
      phone,
      email,
      address,
      preferredContact,
      notes,
      tags,
      status
    } = body

    // Validate required fields
    if (!name || name.trim().length < 2) {
      return NextResponse.json({
        error: 'Customer name is required and must be at least 2 characters'
      }, { status: 400 })
    }

    if (!phone && !email) {
      return NextResponse.json({
        error: 'At least one contact method (phone or email) is required'
      }, { status: 400 })
    }

    // Create customer directly (manual creation, no deduplication)
    const { findOrCreateCustomer } = await import('@/lib/customer-management')
    
    const result = await findOrCreateCustomer(userId, {
      name: name.trim(),
      phone: phone?.trim(),
      email: email?.trim(),
      address: address?.trim(),
      preferredContact: preferredContact || 'phone',
      notes: notes?.trim(),
      tags: tags || []
    })

    return NextResponse.json({
      success: true,
      customer: result.customer,
      isNewCustomer: result.isNewCustomer,
      matchedBy: result.matchedBy,
      confidence: result.confidence
    })

  } catch (error) {
    console.error('❌ Create customer API failed:', error)
    return NextResponse.json({
      error: 'Failed to create customer',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}