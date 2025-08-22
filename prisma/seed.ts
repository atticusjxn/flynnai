import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create demo user
  const hashedPassword = await hash('demo123', 12)
  
  const user = await prisma.user.upsert({
    where: { email: 'demo@flynn.ai' },
    update: {},
    create: {
      email: 'demo@flynn.ai',
      name: 'Demo User',
      password: hashedPassword,
      phone: '(555) 123-4567'
    }
  })

  console.log('Created demo user:', user.email)

  // Create sample clients
  const clients = await Promise.all([
    prisma.client.upsert({
      where: { id: 'client-1' },
      update: {},
      create: {
        id: 'client-1',
        name: 'John Smith',
        email: 'john.smith@email.com',
        phone: '(555) 234-5678',
        address: '123 Main St, Springfield, IL 62701',
        notes: 'Regular customer, prefers morning appointments',
        userId: user.id
      }
    }),
    prisma.client.upsert({
      where: { id: 'client-2' },
      update: {},
      create: {
        id: 'client-2',
        name: 'Sarah Johnson',
        email: 'sarah.j@email.com',
        phone: '(555) 345-6789',
        address: '456 Oak Ave, Springfield, IL 62702',
        notes: 'New construction project',
        userId: user.id
      }
    }),
    prisma.client.upsert({
      where: { id: 'client-3' },
      update: {},
      create: {
        id: 'client-3',
        name: 'Mike Davis',
        email: 'mike.davis@email.com',
        phone: '(555) 456-7890',
        address: '789 Pine St, Springfield, IL 62703',
        notes: 'Emergency contact only',
        userId: user.id
      }
    }),
    prisma.client.upsert({
      where: { id: 'client-4' },
      update: {},
      create: {
        id: 'client-4',
        name: 'Jane Wilson',
        email: 'jane.wilson@email.com',
        phone: '(555) 567-8901',
        address: '321 Elm St, Springfield, IL 62704',
        notes: 'Bathroom renovation specialist',
        userId: user.id
      }
    }),
    prisma.client.upsert({
      where: { id: 'client-5' },
      update: {},
      create: {
        id: 'client-5',
        name: 'Tom Anderson',
        email: 'tom.anderson@email.com',
        phone: '(555) 678-9012',
        address: '654 Maple Dr, Springfield, IL 62705',
        notes: 'Commercial property manager',
        userId: user.id
      }
    })
  ])

  console.log('Created clients:', clients.length)

  // Create sample appointments
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)

  const appointments = await Promise.all([
    // Today's appointments
    prisma.appointment.upsert({
      where: { id: 'appt-1' },
      update: {},
      create: {
        id: 'appt-1',
        title: 'Kitchen Pipe Repair',
        description: 'Fix leaking pipe under kitchen sink',
        startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0),
        endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 30),
        status: 'CONFIRMED',
        userId: user.id,
        clientId: 'client-1'
      }
    }),
    prisma.appointment.upsert({
      where: { id: 'appt-2' },
      update: {},
      create: {
        id: 'appt-2',
        title: 'Bathroom Installation',
        description: 'Install new toilet and vanity',
        startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0),
        endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0),
        status: 'SCHEDULED',
        userId: user.id,
        clientId: 'client-2'
      }
    }),
    // Tomorrow's appointments
    prisma.appointment.upsert({
      where: { id: 'appt-3' },
      update: {},
      create: {
        id: 'appt-3',
        title: 'Drain Cleaning',
        description: 'Clear blocked main drain',
        startTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 10, 0),
        endTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 11, 0),
        status: 'SCHEDULED',
        userId: user.id,
        clientId: 'client-3'
      }
    }),
    prisma.appointment.upsert({
      where: { id: 'appt-4' },
      update: {},
      create: {
        id: 'appt-4',
        title: 'Faucet Replacement',
        description: 'Replace kitchen faucet with new model',
        startTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 15, 0),
        endTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 16, 30),
        status: 'CONFIRMED',
        userId: user.id,
        clientId: 'client-4'
      }
    }),
    // Next week
    prisma.appointment.upsert({
      where: { id: 'appt-5' },
      update: {},
      create: {
        id: 'appt-5',
        title: 'Water Heater Service',
        description: 'Annual maintenance and inspection',
        startTime: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 13, 0),
        endTime: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 15, 0),
        status: 'SCHEDULED',
        userId: user.id,
        clientId: 'client-5'
      }
    })
  ])

  console.log('Created appointments:', appointments.length)

  // Create sample invoices
  const invoices = await Promise.all([
    prisma.invoice.upsert({
      where: { id: 'inv-1' },
      update: {},
      create: {
        id: 'inv-1',
        invoiceNumber: 'INV-0001',
        description: 'Kitchen Pipe Repair Service',
        amount: 250.00,
        status: 'SENT',
        dueDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        userId: user.id,
        clientId: 'client-1',
        items: {
          create: [
            {
              description: 'Pipe repair labor (1.5 hours)',
              quantity: 1,
              rate: 150.00,
              amount: 150.00
            },
            {
              description: 'Pipe fittings and materials',
              quantity: 1,
              rate: 100.00,
              amount: 100.00
            }
          ]
        }
      }
    }),
    prisma.invoice.upsert({
      where: { id: 'inv-2' },
      update: {},
      create: {
        id: 'inv-2',
        invoiceNumber: 'INV-0002',
        description: 'Bathroom Installation Project',
        amount: 1200.00,
        status: 'PAID',
        dueDate: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        paidDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        userId: user.id,
        clientId: 'client-2',
        items: {
          create: [
            {
              description: 'Toilet installation',
              quantity: 1,
              rate: 400.00,
              amount: 400.00
            },
            {
              description: 'Vanity installation',
              quantity: 1,
              rate: 500.00,
              amount: 500.00
            },
            {
              description: 'Plumbing materials',
              quantity: 1,
              rate: 300.00,
              amount: 300.00
            }
          ]
        }
      }
    }),
    prisma.invoice.upsert({
      where: { id: 'inv-3' },
      update: {},
      create: {
        id: 'inv-3',
        invoiceNumber: 'INV-0003',
        description: 'Drain Cleaning Service',
        amount: 150.00,
        status: 'DRAFT',
        userId: user.id,
        clientId: 'client-3',
        items: {
          create: [
            {
              description: 'Drain cleaning service',
              quantity: 1,
              rate: 150.00,
              amount: 150.00
            }
          ]
        }
      }
    }),
    prisma.invoice.upsert({
      where: { id: 'inv-4' },
      update: {},
      create: {
        id: 'inv-4',
        invoiceNumber: 'INV-0004',
        description: 'Faucet Replacement',
        amount: 275.00,
        status: 'SENT',
        dueDate: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        userId: user.id,
        clientId: 'client-4',
        items: {
          create: [
            {
              description: 'Kitchen faucet replacement',
              quantity: 1,
              rate: 175.00,
              amount: 175.00
            },
            {
              description: 'Premium kitchen faucet',
              quantity: 1,
              rate: 100.00,
              amount: 100.00
            }
          ]
        }
      }
    })
  ])

  console.log('Created invoices:', invoices.length)
  console.log('✅ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })