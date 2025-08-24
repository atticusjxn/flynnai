import { prisma } from '../lib/prisma'
import { JobStatus } from '@prisma/client'

const sampleJobs = [
  {
    title: 'Plumbing Repair - Kitchen Sink',
    customerName: 'John Smith',
    customerPhone: '+15551234567',
    serviceType: 'Plumbing',
    description: 'Kitchen sink is leaking and needs immediate attention',
    status: 'QUOTING' as JobStatus,
    priority: 'high',
    estimatedCost: 150,
    extractedFromCall: true,
    confidenceScore: 85
  },
  {
    title: 'HVAC Maintenance',
    customerName: 'Sarah Johnson',
    customerPhone: '+15557654321',
    customerEmail: 'sarah.johnson@email.com',
    serviceType: 'HVAC',
    description: 'Annual maintenance check for heating system',
    status: 'CONFIRMED' as JobStatus,
    priority: 'normal',
    estimatedCost: 200,
    scheduledDate: new Date('2024-01-15'),
    scheduledTime: '10:00',
    extractedFromCall: false
  },
  {
    title: 'Electrical Outlet Installation',
    customerName: 'Mike Davis',
    customerPhone: '+15559876543',
    serviceType: 'Electrical',
    description: 'Install 3 new outlets in home office',
    status: 'IN_PROGRESS' as JobStatus,
    priority: 'normal',
    estimatedCost: 300,
    extractedFromCall: true,
    confidenceScore: 92
  },
  {
    title: 'Water Heater Replacement',
    customerName: 'Lisa Chen',
    customerPhone: '+15552468135',
    customerEmail: 'lisa.chen@gmail.com',
    serviceType: 'Plumbing',
    description: 'Replace old water heater with energy-efficient model',
    status: 'COMPLETED' as JobStatus,
    priority: 'urgent',
    estimatedCost: 1200,
    actualCost: 1150,
    completedAt: new Date('2024-01-10'),
    extractedFromCall: false
  },
  {
    title: 'Drywall Repair',
    customerName: 'Robert Wilson',
    customerPhone: '+15553691472',
    serviceType: 'General Repair',
    description: 'Fix holes in living room wall from furniture move',
    status: 'QUOTING' as JobStatus,
    priority: 'low',
    estimatedCost: 75,
    extractedFromCall: true,
    confidenceScore: 78
  }
]

export async function createSampleJobs(userId: string) {
  try {
    console.log('Creating sample jobs...')
    
    const createdJobs = []
    
    for (const jobData of sampleJobs) {
      // Create or find customer
      let customer = await prisma.customer.findFirst({
        where: {
          userId,
          phone: jobData.customerPhone
        }
      })
      
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            userId,
            name: jobData.customerName,
            phone: jobData.customerPhone,
            email: jobData.customerEmail,
            lastContactDate: new Date()
          }
        })
      }
      
      // Create job
      const job = await prisma.job.create({
        data: {
          ...jobData,
          userId,
          customerId: customer.id
        }
      })
      
      createdJobs.push(job)
      console.log(`✅ Created job: ${job.title}`)
    }
    
    console.log(`🎉 Successfully created ${createdJobs.length} sample jobs`)
    return createdJobs
    
  } catch (error) {
    console.error('❌ Error creating sample jobs:', error)
    throw error
  }
}

// Run if called directly
if (require.main === module) {
  const userId = process.argv[2]
  
  if (!userId) {
    console.error('Please provide a userId as argument')
    process.exit(1)
  }
  
  createSampleJobs(userId)
    .then(() => {
      console.log('Sample jobs created successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Failed to create sample jobs:', error)
      process.exit(1)
    })
}