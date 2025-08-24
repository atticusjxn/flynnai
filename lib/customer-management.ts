import { prisma } from '@/lib/prisma'
import { CustomerStatus } from '@prisma/client'

export interface CustomerData {
  name: string
  phone?: string
  email?: string
  address?: string
  preferredContact?: string
  notes?: string
  tags?: string[]
}

export interface CustomerSearchFilters {
  search?: string
  status?: CustomerStatus
  tags?: string[]
  hasJobs?: boolean
  lastContactFrom?: Date
  lastContactTo?: Date
}

export interface CustomerDeduplicationResult {
  customer: any
  isNewCustomer: boolean
  matchedBy: 'phone' | 'email' | 'name_similarity' | 'none'
  confidence: number
}

/**
 * Find or create customer with intelligent deduplication
 */
export async function findOrCreateCustomer(
  userId: string, 
  customerData: CustomerData
): Promise<CustomerDeduplicationResult> {
  try {
    // First, try exact matches
    let existingCustomer = null
    let matchedBy: 'phone' | 'email' | 'name_similarity' | 'none' = 'none'
    let confidence = 0

    // 1. Try phone number match (highest confidence)
    if (customerData.phone) {
      const normalizedPhone = normalizePhoneNumber(customerData.phone)
      existingCustomer = await prisma.customer.findFirst({
        where: {
          userId,
          phone: normalizedPhone
        },
        include: {
          jobs: true,
          extractedAppointments: true
        }
      })
      
      if (existingCustomer) {
        matchedBy = 'phone'
        confidence = 100
      }
    }

    // 2. Try email match if no phone match
    if (!existingCustomer && customerData.email) {
      existingCustomer = await prisma.customer.findFirst({
        where: {
          userId,
          email: customerData.email.toLowerCase()
        },
        include: {
          jobs: true,
          extractedAppointments: true
        }
      })
      
      if (existingCustomer) {
        matchedBy = 'email'
        confidence = 95
      }
    }

    // 3. Try fuzzy name matching if no exact matches
    if (!existingCustomer && customerData.name) {
      const allCustomers = await prisma.customer.findMany({
        where: { userId },
        select: { id: true, name: true, phone: true, email: true }
      })
      
      const nameMatch = findSimilarCustomerName(customerData.name, allCustomers)
      if (nameMatch) {
        existingCustomer = await prisma.customer.findUnique({
          where: { id: nameMatch.id },
          include: {
            jobs: true,
            extractedAppointments: true
          }
        })
        
        if (existingCustomer) {
          matchedBy = 'name_similarity'
          confidence = nameMatch.similarity
        }
      }
    }

    // If customer found, update their information
    if (existingCustomer) {
      const updatedCustomer = await updateCustomerInfo(existingCustomer.id, customerData)
      return {
        customer: updatedCustomer,
        isNewCustomer: false,
        matchedBy,
        confidence
      }
    }

    // Create new customer if no match found
    const newCustomer = await prisma.customer.create({
      data: {
        userId,
        name: customerData.name,
        phone: customerData.phone ? normalizePhoneNumber(customerData.phone) : null,
        email: customerData.email?.toLowerCase(),
        address: customerData.address,
        preferredContact: customerData.preferredContact || 'phone',
        notes: customerData.notes,
        tags: customerData.tags || [],
        lastContactDate: new Date()
      },
      include: {
        jobs: true,
        extractedAppointments: true
      }
    })

    return {
      customer: newCustomer,
      isNewCustomer: true,
      matchedBy: 'none',
      confidence: 100
    }

  } catch (error) {
    console.error('❌ Customer deduplication failed:', error)
    throw error
  }
}

/**
 * Update customer information with merge logic
 */
async function updateCustomerInfo(customerId: string, newData: CustomerData) {
  const updates: any = {
    lastContactDate: new Date()
  }

  // Update fields only if new data is provided and more complete
  if (newData.name && newData.name.trim().length > 0) {
    updates.name = newData.name
  }
  
  if (newData.phone && !updates.phone) {
    updates.phone = normalizePhoneNumber(newData.phone)
  }
  
  if (newData.email && !updates.email) {
    updates.email = newData.email.toLowerCase()
  }
  
  if (newData.address && !updates.address) {
    updates.address = newData.address
  }

  // Merge tags
  if (newData.tags && newData.tags.length > 0) {
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { tags: true }
    })
    
    if (existingCustomer) {
      const mergedTags = [...new Set([...existingCustomer.tags, ...newData.tags])]
      updates.tags = mergedTags
    }
  }

  // Append notes if provided
  if (newData.notes) {
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { notes: true }
    })
    
    const existingNotes = existingCustomer?.notes || ''
    const separator = existingNotes ? '\n---\n' : ''
    updates.notes = existingNotes + separator + newData.notes
  }

  return await prisma.customer.update({
    where: { id: customerId },
    data: updates,
    include: {
      jobs: true,
      extractedAppointments: true
    }
  })
}

/**
 * Normalize phone numbers for consistent comparison
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')
  
  // Add +1 if US number (10 digits)
  if (digits.length === 10) {
    return `+1${digits}`
  }
  
  // Add + if international number without it
  if (digits.length > 10 && !phone.startsWith('+')) {
    return `+${digits}`
  }
  
  return digits.length > 10 ? `+${digits}` : `+1${digits}`
}

/**
 * Find similar customer names using fuzzy matching
 */
function findSimilarCustomerName(
  targetName: string, 
  customers: Array<{ id: string; name: string; phone: string | null; email: string | null }>
): { id: string; similarity: number } | null {
  const threshold = 80 // Minimum similarity score (out of 100)
  let bestMatch: { id: string; similarity: number } | null = null

  for (const customer of customers) {
    const similarity = calculateStringSimilarity(
      targetName.toLowerCase().trim(),
      customer.name.toLowerCase().trim()
    )

    if (similarity >= threshold && (!bestMatch || similarity > bestMatch.similarity)) {
      bestMatch = { id: customer.id, similarity }
    }
  }

  return bestMatch
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const matrix: number[][] = []
  const len1 = str1.length
  const len2 = str2.length

  if (len1 === 0) return len2 === 0 ? 100 : 0
  if (len2 === 0) return 0

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }

  // Calculate distances
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,     // deletion
        matrix[i][j - 1] + 1,     // insertion
        matrix[i - 1][j - 1] + cost // substitution
      )
    }
  }

  const maxLen = Math.max(len1, len2)
  const distance = matrix[len1][len2]
  return Math.round(((maxLen - distance) / maxLen) * 100)
}

/**
 * Search customers with filters
 */
export async function searchCustomers(
  userId: string,
  filters: CustomerSearchFilters = {},
  options: { limit?: number; offset?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {}
) {
  const {
    limit = 20,
    offset = 0,
    sortBy = 'lastContactDate',
    sortOrder = 'desc'
  } = options

  // Build where clause
  const whereClause: any = { userId }

  if (filters.status) {
    whereClause.status = filters.status
  }

  if (filters.hasJobs !== undefined) {
    if (filters.hasJobs) {
      whereClause.totalJobs = { gt: 0 }
    } else {
      whereClause.totalJobs = { equals: 0 }
    }
  }

  if (filters.lastContactFrom || filters.lastContactTo) {
    whereClause.lastContactDate = {}
    if (filters.lastContactFrom) {
      whereClause.lastContactDate.gte = filters.lastContactFrom
    }
    if (filters.lastContactTo) {
      whereClause.lastContactDate.lte = filters.lastContactTo
    }
  }

  // Text search
  if (filters.search) {
    whereClause.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { phone: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
      { address: { contains: filters.search, mode: 'insensitive' } },
      { notes: { contains: filters.search, mode: 'insensitive' } }
    ]
  }

  // Tag filtering
  if (filters.tags && filters.tags.length > 0) {
    whereClause.tags = {
      hasSome: filters.tags
    }
  }

  // Build order by
  const orderBy: any = {}
  orderBy[sortBy] = sortOrder

  const [customers, totalCount] = await Promise.all([
    prisma.customer.findMany({
      where: whereClause,
      include: {
        jobs: {
          orderBy: { createdAt: 'desc' },
          take: 3 // Recent jobs preview
        },
        extractedAppointments: {
          orderBy: { createdAt: 'desc' },
          take: 3 // Recent calls preview
        },
        _count: {
          select: {
            jobs: true,
            extractedAppointments: true
          }
        }
      },
      orderBy,
      skip: offset,
      take: Math.min(limit, 100)
    }),

    prisma.customer.count({ where: whereClause })
  ])

  return {
    customers,
    pagination: {
      total: totalCount,
      limit,
      offset,
      hasMore: offset + limit < totalCount
    }
  }
}

/**
 * Get detailed customer profile with full history
 */
export async function getCustomerProfile(userId: string, customerId: string) {
  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      userId
    },
    include: {
      jobs: {
        orderBy: { createdAt: 'desc' },
        include: {
          invoices: true
        }
      },
      extractedAppointments: {
        orderBy: { createdAt: 'desc' },
        include: {
          callRecord: {
            select: {
              callSid: true,
              duration: true,
              createdAt: true
            }
          }
        }
      }
    }
  })

  if (!customer) {
    throw new Error('Customer not found')
  }

  // Calculate customer statistics
  const stats = {
    totalJobs: customer.jobs.length,
    completedJobs: customer.jobs.filter(job => job.completedAt).length,
    totalRevenue: customer.jobs
      .filter(job => job.actualCost)
      .reduce((sum, job) => sum + parseFloat(job.actualCost!.toString()), 0),
    averageJobValue: 0,
    totalCalls: customer.extractedAppointments.length,
    conversionRate: 0
  }

  if (stats.totalJobs > 0) {
    stats.averageJobValue = stats.totalRevenue / stats.totalJobs
  }

  if (stats.totalCalls > 0) {
    stats.conversionRate = (stats.totalJobs / stats.totalCalls) * 100
  }

  return {
    customer,
    stats
  }
}

/**
 * Update customer analytics after job changes
 */
export async function updateCustomerAnalytics(customerId: string) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        jobs: {
          where: { actualCost: { not: null } }
        }
      }
    })

    if (!customer) return

    const totalSpent = customer.jobs.reduce((sum, job) => {
      return sum + parseFloat(job.actualCost!.toString())
    }, 0)

    const averageJobValue = customer.jobs.length > 0 
      ? totalSpent / customer.jobs.length 
      : 0

    await prisma.customer.update({
      where: { id: customerId },
      data: {
        totalSpent,
        averageJobValue
      }
    })

  } catch (error) {
    console.error('❌ Failed to update customer analytics:', error)
  }
}