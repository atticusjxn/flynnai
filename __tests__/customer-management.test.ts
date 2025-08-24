import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { prisma } from '@/lib/prisma'
import { 
  findOrCreateCustomer, 
  normalizePhoneNumber, 
  searchCustomers,
  getCustomerProfile,
  updateCustomerAnalytics
} from '@/lib/customer-management'
import { CustomerStatus } from '@prisma/client'

// Test data
const testUserId = 'test-user-customer-mgmt'
const testCustomerData = {
  name: 'John Smith',
  phone: '+15551234567',
  email: 'john.smith@example.com',
  address: '123 Main St, City, ST 12345'
}

const testCustomerData2 = {
  name: 'Jane Doe',
  phone: '+15559876543',
  email: 'jane.doe@example.com'
}

describe('Customer Management System', () => {
  let testCustomer1Id: string
  let testCustomer2Id: string

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.job.deleteMany({
      where: { userId: testUserId }
    })
    await prisma.customer.deleteMany({
      where: { userId: testUserId }
    })
    await prisma.extractedAppointment.deleteMany({
      where: { userId: testUserId }
    })
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.job.deleteMany({
      where: { userId: testUserId }
    })
    await prisma.customer.deleteMany({
      where: { userId: testUserId }
    })
    await prisma.extractedAppointment.deleteMany({
      where: { userId: testUserId }
    })
  })

  describe('Phone Number Normalization', () => {
    it('should normalize US phone numbers correctly', () => {
      expect(normalizePhoneNumber('(555) 123-4567')).toBe('+15551234567')
      expect(normalizePhoneNumber('555-123-4567')).toBe('+15551234567')
      expect(normalizePhoneNumber('5551234567')).toBe('+15551234567')
      expect(normalizePhoneNumber('+1 555 123 4567')).toBe('+15551234567')
    })

    it('should handle international numbers', () => {
      expect(normalizePhoneNumber('+44 20 7946 0958')).toBe('+442079460958')
      expect(normalizePhoneNumber('44 20 7946 0958')).toBe('+442079460958')
    })
  })

  describe('Customer Deduplication', () => {
    it('should create new customer when none exists', async () => {
      const result = await findOrCreateCustomer(testUserId, testCustomerData)
      
      expect(result.isNewCustomer).toBe(true)
      expect(result.matchedBy).toBe('none')
      expect(result.confidence).toBe(100)
      expect(result.customer.name).toBe(testCustomerData.name)
      expect(result.customer.phone).toBe(testCustomerData.phone)
      expect(result.customer.email).toBe(testCustomerData.email)
      
      testCustomer1Id = result.customer.id
    })

    it('should find existing customer by exact phone match', async () => {
      const result = await findOrCreateCustomer(testUserId, {
        name: 'John Smith Jr', // Different name
        phone: testCustomerData.phone, // Same phone
        email: 'different@example.com' // Different email
      })
      
      expect(result.isNewCustomer).toBe(false)
      expect(result.matchedBy).toBe('phone')
      expect(result.confidence).toBe(100)
      expect(result.customer.id).toBe(testCustomer1Id)
    })

    it('should find existing customer by email match', async () => {
      // Create second customer
      const newCustomer = await findOrCreateCustomer(testUserId, testCustomerData2)
      testCustomer2Id = newCustomer.customer.id

      // Try to find by email
      const result = await findOrCreateCustomer(testUserId, {
        name: 'Jane Smith', // Different name
        phone: '+15551111111', // Different phone
        email: testCustomerData2.email // Same email
      })
      
      expect(result.isNewCustomer).toBe(false)
      expect(result.matchedBy).toBe('email')
      expect(result.confidence).toBe(95)
      expect(result.customer.id).toBe(testCustomer2Id)
    })

    it('should find existing customer by name similarity', async () => {
      const result = await findOrCreateCustomer(testUserId, {
        name: 'Jon Smith', // Very similar name
        phone: '+15550000000', // Different phone
        email: 'different2@example.com' // Different email
      })
      
      expect(result.isNewCustomer).toBe(false)
      expect(result.matchedBy).toBe('name_similarity')
      expect(result.confidence).toBeGreaterThan(80)
      expect(result.customer.id).toBe(testCustomer1Id)
    })

    it('should create new customer when similarity is too low', async () => {
      const result = await findOrCreateCustomer(testUserId, {
        name: 'Robert Johnson',
        phone: '+15552222222',
        email: 'robert@example.com'
      })
      
      expect(result.isNewCustomer).toBe(true)
      expect(result.matchedBy).toBe('none')
    })
  })

  describe('Customer Search', () => {
    it('should search customers by name', async () => {
      const result = await searchCustomers(testUserId, {
        search: 'John'
      })
      
      expect(result.customers.length).toBeGreaterThan(0)
      expect(result.customers.some(c => c.name.includes('John'))).toBe(true)
    })

    it('should filter customers by status', async () => {
      const result = await searchCustomers(testUserId, {
        status: CustomerStatus.ACTIVE
      })
      
      expect(result.customers.every(c => c.status === CustomerStatus.ACTIVE)).toBe(true)
    })

    it('should filter customers with jobs', async () => {
      // First, create a job for a customer
      const { createJob } = await import('@/lib/job-creation')
      await createJob(testUserId, {
        title: 'Test Job for Customer',
        customerName: testCustomerData.name,
        customerPhone: testCustomerData.phone,
        serviceType: 'Testing',
        estimatedCost: 100,
        customerId: testCustomer1Id
      })

      const result = await searchCustomers(testUserId, {
        hasJobs: true
      })
      
      expect(result.customers.length).toBeGreaterThan(0)
      expect(result.customers.every(c => c.totalJobs > 0)).toBe(true)
    })

    it('should support pagination', async () => {
      const result = await searchCustomers(testUserId, {}, {
        limit: 1,
        offset: 0
      })
      
      expect(result.customers.length).toBeLessThanOrEqual(1)
      expect(result.pagination).toBeDefined()
      expect(result.pagination.total).toBeGreaterThan(0)
    })
  })

  describe('Customer Profile', () => {
    it('should get detailed customer profile', async () => {
      const result = await getCustomerProfile(testUserId, testCustomer1Id)
      
      expect(result.customer).toBeDefined()
      expect(result.customer.id).toBe(testCustomer1Id)
      expect(result.stats).toBeDefined()
      expect(result.stats.totalJobs).toBeGreaterThanOrEqual(0)
      expect(result.stats.totalRevenue).toBeGreaterThanOrEqual(0)
    })

    it('should throw error for non-existent customer', async () => {
      await expect(
        getCustomerProfile(testUserId, 'non-existent-id')
      ).rejects.toThrow('Customer not found')
    })

    it('should throw error for customer from different user', async () => {
      await expect(
        getCustomerProfile('different-user-id', testCustomer1Id)
      ).rejects.toThrow('Customer not found')
    })
  })

  describe('Customer Analytics Update', () => {
    it('should update customer analytics after job completion', async () => {
      // Get initial analytics
      const initialProfile = await getCustomerProfile(testUserId, testCustomer1Id)
      const initialRevenue = initialProfile.stats.totalRevenue

      // Create a completed job with actual cost
      const { createJob } = await import('@/lib/job-creation')
      const jobResult = await createJob(testUserId, {
        title: 'Completed Test Job',
        customerName: testCustomerData.name,
        customerPhone: testCustomerData.phone,
        serviceType: 'Testing',
        estimatedCost: 200,
        customerId: testCustomer1Id
      })

      // Update job to completed with actual cost
      if (jobResult.success) {
        await prisma.job.update({
          where: { id: jobResult.jobId },
          data: {
            status: 'COMPLETED',
            actualCost: 250,
            completedAt: new Date()
          }
        })

        // Update customer analytics
        await updateCustomerAnalytics(testCustomer1Id)

        // Get updated analytics
        const updatedProfile = await getCustomerProfile(testUserId, testCustomer1Id)
        
        expect(updatedProfile.stats.totalRevenue).toBeGreaterThan(initialRevenue)
        expect(updatedProfile.stats.completedJobs).toBeGreaterThan(0)
      }
    })
  })

  describe('Customer Data Integrity', () => {
    it('should handle customer updates correctly', async () => {
      // Update customer information
      const updatedCustomer = await prisma.customer.update({
        where: { id: testCustomer1Id },
        data: {
          tags: ['VIP', 'Repeat'],
          notes: 'Excellent customer, always pays on time'
        }
      })

      expect(updatedCustomer.tags).toContain('VIP')
      expect(updatedCustomer.tags).toContain('Repeat')
      expect(updatedCustomer.notes).toContain('Excellent customer')
    })

    it('should maintain referential integrity with jobs', async () => {
      const customer = await prisma.customer.findUnique({
        where: { id: testCustomer1Id },
        include: {
          jobs: true,
          extractedAppointments: true
        }
      })

      expect(customer).toBeDefined()
      expect(customer!.jobs.length).toBeGreaterThan(0)
      
      // All jobs should belong to the correct user
      expect(customer!.jobs.every(job => job.userId === testUserId)).toBe(true)
    })

    it('should soft delete customers properly', async () => {
      // Mark customer as former (soft delete)
      const deletedCustomer = await prisma.customer.update({
        where: { id: testCustomer2Id },
        data: {
          status: CustomerStatus.FORMER,
          phone: null,
          email: null
        }
      })

      expect(deletedCustomer.status).toBe(CustomerStatus.FORMER)
      expect(deletedCustomer.phone).toBeNull()
      expect(deletedCustomer.email).toBeNull()
      
      // Customer should still exist in database
      const stillExists = await prisma.customer.findUnique({
        where: { id: testCustomer2Id }
      })
      expect(stillExists).toBeDefined()
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty customer data gracefully', async () => {
      const result = await findOrCreateCustomer(testUserId, {
        name: '',
        phone: '',
        email: ''
      })
      
      // Should not create customer with empty data
      expect(result.isNewCustomer).toBe(false)
      expect(result.customer).toBeNull()
    })

    it('should handle malformed phone numbers', () => {
      expect(normalizePhoneNumber('invalid')).toMatch(/^\+/)
      expect(normalizePhoneNumber('123')).toMatch(/^\+1123/)
    })

    it('should handle search with no results', async () => {
      const result = await searchCustomers(testUserId, {
        search: 'NonExistentCustomerName12345'
      })
      
      expect(result.customers).toHaveLength(0)
      expect(result.pagination.total).toBe(0)
    })

    it('should handle concurrent customer creation', async () => {
      const sameCustomerData = {
        name: 'Concurrent Test',
        phone: '+15557777777',
        email: 'concurrent@test.com'
      }

      // Create multiple customers concurrently with same data
      const promises = [
        findOrCreateCustomer(testUserId, sameCustomerData),
        findOrCreateCustomer(testUserId, sameCustomerData),
        findOrCreateCustomer(testUserId, sameCustomerData)
      ]

      const results = await Promise.all(promises)
      
      // Should all resolve to the same customer (first one created, others found)
      const customerIds = results.map(r => r.customer.id)
      const uniqueIds = new Set(customerIds)
      
      expect(uniqueIds.size).toBe(1) // All should be same customer
      expect(results.some(r => r.isNewCustomer)).toBe(true) // At least one should be new
    })
  })
})