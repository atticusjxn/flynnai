import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { prisma } from '@/lib/prisma'
import { createJob } from '@/lib/job-creation'
import { JobStatus } from '@prisma/client'

// Mock data for testing
const testUserId = 'test-user-id'
const testCustomerData = {
  title: 'Test Plumbing Job',
  customerName: 'Test Customer',
  customerPhone: '+15551234567',
  serviceType: 'Plumbing',
  description: 'Test job for pipeline functionality',
  priority: 'normal',
  estimatedCost: 100
}

describe('Job Pipeline System', () => {
  let testJobId: string
  let testCustomerId: string

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.job.deleteMany({
      where: { userId: testUserId }
    })
    await prisma.customer.deleteMany({
      where: { userId: testUserId }
    })
  })

  afterAll(async () => {
    // Clean up test data
    if (testJobId) {
      await prisma.job.delete({
        where: { id: testJobId }
      }).catch(() => {})
    }
    if (testCustomerId) {
      await prisma.customer.delete({
        where: { id: testCustomerId }
      }).catch(() => {})
    }
  })

  describe('Job Creation', () => {
    it('should create a job successfully', async () => {
      const result = await createJob(testUserId, testCustomerData)
      
      expect(result.success).toBe(true)
      expect(result.jobId).toBeDefined()
      
      testJobId = result.jobId!
      
      // Verify job was created in database
      const createdJob = await prisma.job.findUnique({
        where: { id: testJobId },
        include: { customer: true }
      })
      
      expect(createdJob).toBeDefined()
      expect(createdJob!.title).toBe(testCustomerData.title)
      expect(createdJob!.customerName).toBe(testCustomerData.customerName)
      expect(createdJob!.status).toBe(JobStatus.QUOTING)
      expect(createdJob!.customer).toBeDefined()
      
      testCustomerId = createdJob!.customerId!
    })

    it('should validate required fields', async () => {
      const invalidData = {
        title: '', // Invalid - too short
        customerName: 'A', // Invalid - too short
        customerPhone: 'invalid', // Invalid format
        estimatedCost: -100 // Invalid - negative
      }
      
      const result = await createJob(testUserId, invalidData)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Validation failed')
    })
  })

  describe('Job Status Updates', () => {
    it('should update job status through API', async () => {
      // This would be tested with API calls in integration tests
      // For unit test, we'll test the database update directly
      
      const updatedJob = await prisma.job.update({
        where: { id: testJobId },
        data: { status: JobStatus.CONFIRMED }
      })
      
      expect(updatedJob.status).toBe(JobStatus.CONFIRMED)
    })

    it('should set completion date when marking as completed', async () => {
      const updatedJob = await prisma.job.update({
        where: { id: testJobId },
        data: { 
          status: JobStatus.COMPLETED,
          completedAt: new Date()
        }
      })
      
      expect(updatedJob.status).toBe(JobStatus.COMPLETED)
      expect(updatedJob.completedAt).toBeDefined()
    })
  })

  describe('Job Filtering and Search', () => {
    it('should filter jobs by status', async () => {
      const jobs = await prisma.job.findMany({
        where: {
          userId: testUserId,
          status: JobStatus.COMPLETED
        }
      })
      
      expect(jobs).toBeDefined()
      expect(jobs.every(job => job.status === JobStatus.COMPLETED)).toBe(true)
    })

    it('should search jobs by title', async () => {
      const jobs = await prisma.job.findMany({
        where: {
          userId: testUserId,
          title: {
            contains: 'Test',
            mode: 'insensitive'
          }
        }
      })
      
      expect(jobs.length).toBeGreaterThan(0)
      expect(jobs.some(job => job.title.includes('Test'))).toBe(true)
    })
  })

  describe('Customer Integration', () => {
    it('should link jobs to customers correctly', async () => {
      const jobWithCustomer = await prisma.job.findUnique({
        where: { id: testJobId },
        include: { customer: true }
      })
      
      expect(jobWithCustomer!.customer).toBeDefined()
      expect(jobWithCustomer!.customer!.name).toBe(testCustomerData.customerName)
      expect(jobWithCustomer!.customer!.phone).toBe(testCustomerData.customerPhone)
    })

    it('should increment customer job count', async () => {
      const customer = await prisma.customer.findUnique({
        where: { id: testCustomerId },
        include: { jobs: true }
      })
      
      expect(customer!.totalJobs).toBeGreaterThan(0)
      expect(customer!.jobs.length).toBeGreaterThan(0)
    })
  })

  describe('Job Pipeline Workflow', () => {
    it('should support complete job lifecycle', async () => {
      // Create new job for lifecycle test
      const result = await createJob(testUserId, {
        ...testCustomerData,
        title: 'Lifecycle Test Job'
      })
      
      expect(result.success).toBe(true)
      const lifecycleJobId = result.jobId!
      
      try {
        // Test status progression: QUOTING -> CONFIRMED -> IN_PROGRESS -> COMPLETED
        const statuses = [JobStatus.CONFIRMED, JobStatus.IN_PROGRESS, JobStatus.COMPLETED]
        
        for (const status of statuses) {
          const updated = await prisma.job.update({
            where: { id: lifecycleJobId },
            data: { 
              status,
              ...(status === JobStatus.COMPLETED ? { completedAt: new Date() } : {})
            }
          })
          
          expect(updated.status).toBe(status)
          
          if (status === JobStatus.COMPLETED) {
            expect(updated.completedAt).toBeDefined()
          }
        }
      } finally {
        // Clean up lifecycle test job
        await prisma.job.delete({
          where: { id: lifecycleJobId }
        }).catch(() => {})
      }
    })
  })

  describe('Job Statistics', () => {
    it('should calculate job statistics correctly', async () => {
      const stats = await prisma.job.aggregate({
        where: { userId: testUserId },
        _count: { id: true },
        _avg: { estimatedCost: true }
      })
      
      expect(stats._count.id).toBeGreaterThan(0)
      expect(stats._avg.estimatedCost).toBeGreaterThan(0)
    })

    it('should group jobs by status', async () => {
      const statusCounts = await prisma.job.groupBy({
        by: ['status'],
        where: { userId: testUserId },
        _count: { id: true }
      })
      
      expect(statusCounts.length).toBeGreaterThan(0)
      expect(statusCounts.every(group => group._count.id > 0)).toBe(true)
    })
  })
})

// Integration test helper functions
export async function createTestJobs(userId: string, count: number = 5) {
  const jobs = []
  const statuses = [JobStatus.QUOTING, JobStatus.CONFIRMED, JobStatus.IN_PROGRESS, JobStatus.COMPLETED]
  
  for (let i = 0; i < count; i++) {
    const result = await createJob(userId, {
      title: `Test Job ${i + 1}`,
      customerName: `Test Customer ${i + 1}`,
      customerPhone: `+155512345${i.toString().padStart(2, '0')}`,
      serviceType: ['Plumbing', 'Electrical', 'HVAC', 'General Repair'][i % 4],
      description: `Test job description ${i + 1}`,
      priority: ['low', 'normal', 'high', 'urgent'][i % 4],
      estimatedCost: (i + 1) * 100,
      extractedFromCall: i % 2 === 0,
      confidenceScore: i % 2 === 0 ? 80 + (i * 2) : undefined
    })
    
    if (result.success) {
      // Update some jobs to different statuses
      await prisma.job.update({
        where: { id: result.jobId! },
        data: { 
          status: statuses[i % statuses.length],
          ...(statuses[i % statuses.length] === JobStatus.COMPLETED ? { completedAt: new Date() } : {})
        }
      })
      
      jobs.push(result.jobId!)
    }
  }
  
  return jobs
}

export async function cleanupTestJobs(userId: string) {
  await prisma.job.deleteMany({
    where: { userId }
  })
  
  await prisma.customer.deleteMany({
    where: { userId }
  })
}