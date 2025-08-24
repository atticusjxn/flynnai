import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Mock billing data - in production this would come from Stripe/payment provider
    const mockBilling = {
      plan: 'professional',
      status: 'active',
      nextBillDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 99,
      paymentMethod: {
        type: 'card',
        last4: '4242',
        brand: 'Visa'
      }
    }

    return NextResponse.json({ billing: mockBilling })

  } catch (error) {
    console.error('❌ Billing API failed:', error)
    return NextResponse.json({
      error: 'Failed to get billing information',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}