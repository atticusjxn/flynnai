#!/usr/bin/env tsx

import { prisma } from '../lib/prisma'

async function setupPhoneIntegration() {
  try {
    console.log('🔧 Setting up phone integration...')
    
    // Find the most recent user (assuming that's you)
    const user = await prisma.user.findFirst({
      orderBy: { createdAt: 'desc' }
    })
    
    if (!user) {
      console.error('❌ No user found in database')
      process.exit(1)
    }
    
    console.log(`👤 Found user: ${user.email} (${user.id})`)
    
    // Check if phone integration already exists
    const existingIntegration = await prisma.phoneIntegration.findFirst({
      where: {
        userId: user.id,
        provider: 'twilio'
      }
    })
    
    if (existingIntegration) {
      console.log('📞 Phone integration already exists, updating...')
      await prisma.phoneIntegration.update({
        where: { id: existingIntegration.id },
        data: {
          phoneNumber: process.env.TWILIO_PHONE_NUMBER!,
          accountSid: process.env.TWILIO_ACCOUNT_SID!,
          authToken: process.env.TWILIO_AUTH_TOKEN!,
          webhookUrl: `${process.env.NEXTAUTH_URL}/api/twilio/webhook`,
          isActive: true
        }
      })
      console.log('✅ Phone integration updated successfully!')
    } else {
      console.log('📞 Creating new phone integration...')
      const phoneIntegration = await prisma.phoneIntegration.create({
        data: {
          userId: user.id,
          provider: 'twilio',
          phoneNumber: process.env.TWILIO_PHONE_NUMBER!,
          accountSid: process.env.TWILIO_ACCOUNT_SID!,
          authToken: process.env.TWILIO_AUTH_TOKEN!,
          webhookUrl: `${process.env.NEXTAUTH_URL}/api/twilio/webhook`,
          isActive: true
        }
      })
      
      console.log('✅ Phone integration created successfully!')
      console.log(`📱 Phone number: ${phoneIntegration.phoneNumber}`)
      console.log(`🔗 Webhook URL: ${phoneIntegration.webhookUrl}`)
    }
    
    console.log('🎉 Setup complete! Test calls should now appear in your dashboard.')
    
  } catch (error) {
    console.error('❌ Error setting up phone integration:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

setupPhoneIntegration()