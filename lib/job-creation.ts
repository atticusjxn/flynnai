import { prisma } from '@/lib/prisma'
import { JobStatus } from '@prisma/client'

export interface JobCreationResult {
  success: boolean
  jobId?: string
  error?: string
  warnings?: string[]
}

export interface JobCreationData {
  title: string
  customerName: string
  customerPhone?: string
  customerEmail?: string
  serviceType?: string
  description?: string
  scheduledDate?: Date
  scheduledTime?: string
  estimatedDuration?: number
  address?: string
  priority?: string
  estimatedCost?: number
  notes?: string
  customerId?: string
  extractedFromCall?: boolean
  callRecordId?: string
  extractedAppointmentId?: string
  confidenceScore?: number
}

/**
 * Validate job creation data
 */
function validateJobData(data: JobCreationData): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Required fields
  if (!data.title || data.title.trim().length < 3) {
    errors.push('Job title must be at least 3 characters')
  }

  if (!data.customerName || data.customerName.trim().length < 2) {
    errors.push('Customer name is required')
  }

  if (!data.customerPhone && !data.customerEmail) {
    errors.push('At least one contact method (phone or email) is required')
  }

  // Validate phone format if provided
  if (data.customerPhone && !/^\+?[\d\s\-\(\)]{10,}$/.test(data.customerPhone)) {
    errors.push('Invalid phone number format')
  }

  // Validate email format if provided
  if (data.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customerEmail)) {
    errors.push('Invalid email format')
  }

  // Validate estimated cost if provided
  if (data.estimatedCost !== undefined && (data.estimatedCost < 0 || data.estimatedCost > 50000)) {
    errors.push('Estimated cost must be between $0 and $50,000')
  }

  // Validate scheduled date if provided
  if (data.scheduledDate) {
    const now = new Date()
    const oneYearFromNow = new Date()
    oneYearFromNow.setFullYear(now.getFullYear() + 1)
    
    if (data.scheduledDate < now) {
      errors.push('Scheduled date cannot be in the past')
    }
    
    if (data.scheduledDate > oneYearFromNow) {
      errors.push('Scheduled date cannot be more than one year in the future')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Generate job title from service type and description
 */
function generateJobTitle(serviceType?: string, description?: string, customerName?: string): string {
  if (description && description.length > 10) {
    // Use description if it's detailed enough
    const cleanDescription = description.trim()
    if (cleanDescription.length <= 50) {
      return cleanDescription
    } else {
      return cleanDescription.substring(0, 47) + '...'
    }
  } else if (serviceType && description) {
    return `${serviceType} - ${description}`
  } else if (serviceType) {
    return `${serviceType} Service${customerName ? ` for ${customerName}` : ''}`
  } else if (description) {
    return description
  } else {
    return `Service Request${customerName ? ` - ${customerName}` : ''}`
  }
}

/**
 * Determine job priority from urgency level
 */
function mapUrgencyToPriority(urgencyLevel?: string): string {
  switch (urgencyLevel?.toLowerCase()) {
    case 'emergency':
      return 'urgent'
    case 'urgent':
      return 'high'
    case 'routine':
      return 'low'
    case 'normal':
    default:
      return 'normal'
  }
}

/**
 * Parse natural language date to Date object
 */
function parseNaturalDate(dateString: string): Date | null {
  if (!dateString) return null

  try {
    // Try ISO date format first
    const isoDate = new Date(dateString)
    if (!isNaN(isoDate.getTime())) {
      return isoDate
    }

    // Handle common natural language patterns
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    
    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)

    const lowerDate = dateString.toLowerCase().trim()

    if (lowerDate.includes('today') || lowerDate.includes('this afternoon') || lowerDate.includes('this morning')) {
      return today
    }

    if (lowerDate.includes('tomorrow')) {
      return tomorrow
    }

    if (lowerDate.includes('next week') || lowerDate.includes('sometime next week')) {
      return nextWeek
    }

    // Try to parse with Date constructor as fallback
    const parsedDate = new Date(dateString)
    return !isNaN(parsedDate.getTime()) ? parsedDate : null

  } catch (error) {
    console.warn(`Failed to parse date: ${dateString}`, error)
    return null
  }
}

/**
 * Create job from extracted appointment data
 */
export async function createJobFromExtraction(extractedAppointmentId: string): Promise<JobCreationResult> {
  try {
    // Get extracted appointment data
    const extraction = await prisma.extractedAppointment.findUnique({
      where: { id: extractedAppointmentId },
      include: {
        callRecord: true,
        customer: true,
        user: true
      }
    })

    if (!extraction) {
      return {
        success: false,
        error: 'Extracted appointment not found'
      }
    }

    // Check if job already exists for this extraction
    const existingJob = await prisma.job.findFirst({
      where: { extractedAppointmentId }
    })

    if (existingJob) {
      return {
        success: false,
        error: 'Job already exists for this extraction'
      }
    }

    const warnings: string[] = []

    // Parse scheduled date
    let scheduledDate: Date | null = null
    if (extraction.preferredDate) {
      scheduledDate = extraction.preferredDate
    } else if (extraction.preferredDate) {
      const parsed = parseNaturalDate(extraction.preferredDate.toString())
      if (parsed) {
        scheduledDate = parsed
      } else {
        warnings.push(`Could not parse preferred date: ${extraction.preferredDate}`)
      }
    }

    // Generate job title
    const title = generateJobTitle(
      extraction.serviceType || undefined,
      extraction.jobDescription || undefined,
      extraction.customerName || undefined
    )

    // Map urgency to priority
    const priority = mapUrgencyToPriority(extraction.urgencyLevel || undefined)

    // Prepare job data
    const jobData: JobCreationData = {
      title,
      customerName: extraction.customerName || 'Unknown Customer',
      customerPhone: extraction.customerPhone || extraction.callRecord?.phoneNumber || undefined,
      customerEmail: extraction.customerEmail || undefined,
      serviceType: extraction.serviceType || undefined,
      description: extraction.jobDescription || undefined,
      scheduledDate,
      scheduledTime: extraction.preferredTime || undefined,
      address: extraction.serviceAddress || undefined,
      priority,
      estimatedCost: extraction.quotedPrice ? parseFloat(extraction.quotedPrice.toString()) : undefined,
      notes: [
        extraction.pricingDiscussion,
        extraction.reviewNotes,
        extraction.urgencyLevel ? `Urgency: ${extraction.urgencyLevel}` : null,
        extraction.timeFlexibility ? `Time flexibility: ${extraction.timeFlexibility}` : null
      ].filter(Boolean).join('\n'),
      customerId: extraction.customerId || undefined,
      extractedFromCall: true,
      callRecordId: extraction.callRecordId,
      extractedAppointmentId,
      confidenceScore: extraction.confidenceScore || undefined
    }

    // Validate job data
    const validation = validateJobData(jobData)
    if (!validation.isValid) {
      return {
        success: false,
        error: `Validation failed: ${validation.errors.join(', ')}`
      }
    }

    // Create the job
    const job = await prisma.job.create({
      data: {
        title: jobData.title,
        customerName: jobData.customerName,
        customerPhone: jobData.customerPhone,
        customerEmail: jobData.customerEmail,
        serviceType: jobData.serviceType,
        description: jobData.description,
        scheduledDate: jobData.scheduledDate,
        scheduledTime: jobData.scheduledTime,
        estimatedDuration: jobData.estimatedDuration,
        address: jobData.address,
        status: JobStatus.QUOTING, // Initial status
        priority: jobData.priority,
        estimatedCost: jobData.estimatedCost,
        notes: jobData.notes,
        extractedFromCall: jobData.extractedFromCall,
        callRecordId: jobData.callRecordId,
        extractedAppointmentId: jobData.extractedAppointmentId,
        confidenceScore: jobData.confidenceScore,
        userId: extraction.userId,
        customerId: jobData.customerId
      }
    })

    // Update customer's job count if customer exists
    if (extraction.customerId) {
      await prisma.customer.update({
        where: { id: extraction.customerId },
        data: {
          totalJobs: { increment: 1 },
          lastContactDate: new Date()
        }
      })
    }

    console.log(`✅ Job created successfully: ${job.id}`)

    // Send notification about job creation
    try {
      const { NotificationHelpers } = await import('./notifications')
      await NotificationHelpers.jobCreated(
        extraction.userId,
        jobData.title,
        jobData.customerName,
        jobData.estimatedCost
      )
    } catch (error) {
      console.error('Failed to send job creation notification:', error)
    }

    return {
      success: true,
      jobId: job.id,
      warnings: warnings.length > 0 ? warnings : undefined
    }

  } catch (error) {
    console.error('❌ Job creation failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown job creation error'
    }
  }
}

/**
 * Create job manually with custom data
 */
export async function createJob(userId: string, jobData: JobCreationData): Promise<JobCreationResult> {
  try {
    // Validate job data
    const validation = validateJobData(jobData)
    if (!validation.isValid) {
      return {
        success: false,
        error: `Validation failed: ${validation.errors.join(', ')}`
      }
    }

    // Find or create customer if phone/email provided
    let customerId = jobData.customerId
    if (!customerId && (jobData.customerPhone || jobData.customerEmail)) {
      // Try to find existing customer
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          userId,
          OR: [
            { phone: jobData.customerPhone },
            { email: jobData.customerEmail }
          ].filter(condition => Object.values(condition)[0]) // Filter out undefined values
        }
      })

      if (existingCustomer) {
        customerId = existingCustomer.id
      } else if (jobData.customerName) {
        // Create new customer
        const newCustomer = await prisma.customer.create({
          data: {
            userId,
            name: jobData.customerName,
            phone: jobData.customerPhone,
            email: jobData.customerEmail,
            address: jobData.address,
            lastContactDate: new Date()
          }
        })
        customerId = newCustomer.id
      }
    }

    // Create the job
    const job = await prisma.job.create({
      data: {
        title: jobData.title,
        customerName: jobData.customerName,
        customerPhone: jobData.customerPhone,
        customerEmail: jobData.customerEmail,
        serviceType: jobData.serviceType,
        description: jobData.description,
        scheduledDate: jobData.scheduledDate,
        scheduledTime: jobData.scheduledTime,
        estimatedDuration: jobData.estimatedDuration,
        address: jobData.address,
        status: JobStatus.QUOTING, // Initial status
        priority: jobData.priority || 'normal',
        estimatedCost: jobData.estimatedCost,
        notes: jobData.notes,
        extractedFromCall: jobData.extractedFromCall || false,
        callRecordId: jobData.callRecordId,
        extractedAppointmentId: jobData.extractedAppointmentId,
        confidenceScore: jobData.confidenceScore,
        userId,
        customerId
      }
    })

    // Update customer's job count if customer exists
    if (customerId) {
      await prisma.customer.update({
        where: { id: customerId },
        data: {
          totalJobs: { increment: 1 },
          lastContactDate: new Date()
        }
      })
    }

    console.log(`✅ Manual job created successfully: ${job.id}`)

    return {
      success: true,
      jobId: job.id
    }

  } catch (error) {
    console.error('❌ Manual job creation failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown job creation error'
    }
  }
}

/**
 * Get job creation stats for user
 */
export async function getJobCreationStats(userId: string) {
  try {
    const stats = await prisma.job.aggregate({
      where: { userId },
      _count: { id: true }
    })

    const extractedJobs = await prisma.job.count({
      where: {
        userId,
        extractedFromCall: true
      }
    })

    const statusCounts = await prisma.job.groupBy({
      by: ['status'],
      where: { userId },
      _count: { id: true }
    })

    const priorityCounts = await prisma.job.groupBy({
      by: ['priority'],
      where: { userId },
      _count: { id: true }
    })

    return {
      totalJobs: stats._count.id,
      extractedFromCalls: extractedJobs,
      manuallyCreated: stats._count.id - extractedJobs,
      statusBreakdown: statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count.id
        return acc
      }, {} as Record<string, number>),
      priorityBreakdown: priorityCounts.reduce((acc, item) => {
        acc[item.priority || 'normal'] = item._count.id
        return acc
      }, {} as Record<string, number>)
    }
  } catch (error) {
    console.error('Error getting job creation stats:', error)
    return null
  }
}