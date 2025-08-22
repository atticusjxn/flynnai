import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay } from 'date-fns'

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

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    
    let whereClause: any = { userId: user.id }
    
    if (date) {
      const targetDate = new Date(date)
      whereClause.startTime = {
        gte: startOfDay(targetDate),
        lte: endOfDay(targetDate)
      }
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { startTime: 'asc' }
    })

    return NextResponse.json(appointments)
  } catch (error) {
    console.error('Error fetching appointments:', error)
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

    const { title, description, startTime, endTime, clientId, clientName } = await request.json()

    if (!title || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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

    const appointment = await prisma.appointment.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        userId: user.id,
        clientId: finalClientId
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    })

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}