import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
})

export const STRIPE_PLANS = {
  free_trial: {
    name: 'Free Trial',
    description: 'First month completely free',
    price: 0,
    duration: 30, // days
    features: ['Unlimited calls', 'Job scheduler', 'Email notifications', 'In-app management']
  },
  monthly: {
    name: 'Monthly Plan',
    description: 'Complete job management solution',
    price: 1500, // $15.00 in cents
    interval: 'month',
    productId: process.env.STRIPE_MONTHLY_PRODUCT_ID,
    features: ['Unlimited calls', 'Job scheduler', 'Pipeline management', 'Email & in-app notifications', 'Customer history', 'Mobile access']
  },
  enterprise: {
    name: 'Enterprise',
    description: 'Custom solutions for large teams',
    contact: true,
    features: ['Everything in Monthly', 'Multi-user access', 'API access', 'Custom integrations', 'Priority support']
  }
}

export async function createCustomer(email: string, name: string) {
  return await stripe.customers.create({
    email,
    name,
    metadata: {
      source: 'autocalendar'
    }
  })
}

export async function createPaymentIntent(
  customerId: string,
  amount: number,
  description: string
) {
  return await stripe.paymentIntents.create({
    customer: customerId,
    amount,
    currency: 'usd',
    description,
    metadata: {
      service: 'autocalendar-call-processing'
    }
  })
}

export async function chargeForCall(userId: string, callRecordId: string) {
  try {
    // This would be called after a successful appointment call is processed
    // Implementation would depend on how you want to handle billing
    
    // For per-call pricing, you could:
    // 1. Create a payment intent immediately
    // 2. Store pending charges and bill monthly
    // 3. Use Stripe's usage-based billing
    
    console.log(`Would charge for call: ${callRecordId} for user: ${userId}`)
    
    // Example: Create an invoice item for monthly billing
    // const customer = await getStripeCustomer(userId)
    // await stripe.invoiceItems.create({
    //   customer: customer.id,
    //   amount: STRIPE_PLANS.perCall.pricePerCall,
    //   currency: 'usd',
    //   description: `Appointment call processing - ${callRecordId}`
    // })
    
  } catch (error) {
    console.error('Billing error:', error)
    throw error
  }
}