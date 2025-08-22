import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object)
        break
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object)
        break
      
      case 'customer.created':
        await handleCustomerCreated(event.data.object)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    )
  }
}

async function handlePaymentSuccess(paymentIntent: any) {
  try {
    // Find user by Stripe customer ID
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: paymentIntent.customer }
    })

    if (user) {
      // Update subscription status or handle successful payment
      console.log(`Payment succeeded for user ${user.id}: ${paymentIntent.amount}`)
      
      // You could update user's account status, add credits, etc.
    }
  } catch (error) {
    console.error('Error handling payment success:', error)
  }
}

async function handlePaymentFailed(paymentIntent: any) {
  try {
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: paymentIntent.customer }
    })

    if (user) {
      console.log(`Payment failed for user ${user.id}`)
      
      // Handle failed payment - maybe suspend service, send notification, etc.
    }
  } catch (error) {
    console.error('Error handling payment failure:', error)
  }
}

async function handleCustomerCreated(customer: any) {
  try {
    console.log(`New Stripe customer created: ${customer.id}`)
    // Any additional setup needed when a customer is created
  } catch (error) {
    console.error('Error handling customer creation:', error)
  }
}