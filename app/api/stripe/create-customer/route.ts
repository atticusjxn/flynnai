import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createCustomer } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name } = await request.json()

    // Check if user already has a Stripe customer ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.stripeCustomerId) {
      return NextResponse.json({ customerId: user.stripeCustomerId })
    }

    // Create Stripe customer
    const customer = await createCustomer(session.user.email, name || user.name)

    // Update user with Stripe customer ID
    await prisma.user.update({
      where: { id: user.id },
      data: {
        stripeCustomerId: customer.id
      }
    })

    return NextResponse.json({ customerId: customer.id })

  } catch (error) {
    console.error('Create customer error:', error)
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}