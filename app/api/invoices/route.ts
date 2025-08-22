import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const invoices = await prisma.invoice.findMany({
      where: { userId: user.id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        items: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(invoices)
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { description, amount, clientId, clientName, dueDate, items } = await request.json()

    if (!description || !amount) {
      return NextResponse.json({ error: 'Description and amount are required' }, { status: 400 })
    }

    let finalClientId = clientId

    // If clientName is provided but no clientId, try to find or create the client
    if (clientName && !clientId) {
      let client = await prisma.client.findFirst({
        where: {
          userId: user.id,
          name: { contains: clientName, mode: 'insensitive' }
        }
      })

      if (!client) {
        client = await prisma.client.create({
          data: {
            name: clientName,
            userId: user.id
          }
        })
      }

      finalClientId = client.id
    }

    if (!finalClientId) {
      return NextResponse.json({ error: 'Client ID or name required' }, { status: 400 })
    }

    // Generate invoice number
    const invoiceCount = await prisma.invoice.count({
      where: { userId: user.id }
    })
    const invoiceNumber = `INV-${(invoiceCount + 1).toString().padStart(4, '0')}`

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        description,
        amount: parseFloat(amount.toString()),
        dueDate: dueDate ? new Date(dueDate) : null,
        userId: user.id,
        clientId: finalClientId,
        items: items ? {
          create: items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity || 1,
            rate: parseFloat(item.rate.toString()),
            amount: parseFloat(((item.quantity || 1) * parseFloat(item.rate.toString())).toString())
          }))
        } : undefined
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        items: true
      }
    })

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}