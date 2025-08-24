// Manual appointment extraction testing utility
const { extractAppointmentData } = require('../lib/appointment-extraction')

// Sample test transcriptions
const samples = [
  {
    name: 'Kitchen Sink Repair',
    text: 'Hi, this is John Smith calling about getting my kitchen sink fixed. It\'s been leaking for two days now and I need someone to come out as soon as possible. My address is 123 Main Street in Springfield. I\'ll be home tomorrow afternoon around 2 PM if someone can come then. My phone number is 555-123-4567.'
  },
  {
    name: 'Emergency Hot Water Heater',
    text: 'Emergency! My hot water heater is flooding my basement right now. I need a plumber immediately. This is Sarah Johnson at 456 Oak Avenue. Please call me back at 555-987-6543. I can pay whatever it costs to fix this today.'
  },
  {
    name: 'Information Only Call',
    text: 'Hi, I was just calling to ask about your rates for different services. I might need some work done in the future but not right now. Do you have a website or brochure you can send me?'
  }
]

async function testExtraction(transcription = null) {
  console.log('🧪 Manual Appointment Extraction Test\n')

  try {
    if (!process.env.OPENAI_API_KEY) {
      console.log('❌ OpenAI API key not configured')
      console.log('   Set OPENAI_API_KEY in your environment variables')
      return
    }

    const testText = transcription || samples[0].text
    console.log('📝 Testing with transcription:')
    console.log(`"${testText.substring(0, 100)}..."\n`)

    console.log('🧠 Starting GPT-4 extraction...')
    const result = await extractAppointmentData(testText, {
      callSid: 'test_call',
      phoneNumber: '+1234567890'
    })

    if (result.success && result.data) {
      const data = result.data
      console.log('✅ Extraction successful!\n')
      
      console.log('📊 Results:')
      console.log(`   Has Appointment: ${data.hasAppointment ? '✅ YES' : '❌ NO'}`)
      console.log(`   Confidence Score: ${(data.confidence * 100).toFixed(1)}%`)
      console.log(`   Processing Time: ${result.processingTime}ms`)
      
      if (data.hasAppointment) {
        console.log('\n👤 Customer Information:')
        console.log(`   Name: ${data.customerName || 'Not provided'}`)
        console.log(`   Phone: ${data.customerPhone || 'Not provided'}`)
        console.log(`   Email: ${data.customerEmail || 'Not provided'}`)
        
        console.log('\n🔧 Service Details:')
        console.log(`   Type: ${data.serviceType || 'Not specified'}`)
        console.log(`   Description: ${data.jobDescription || 'Not provided'}`)
        console.log(`   Urgency: ${data.urgencyLevel || 'Not specified'}`)
        
        console.log('\n📅 Scheduling:')
        console.log(`   Preferred Date: ${data.preferredDate || 'Not specified'}`)
        console.log(`   Preferred Time: ${data.preferredTime || 'Not specified'}`)
        console.log(`   Time Flexibility: ${data.timeFlexibility || 'Not specified'}`)
        
        console.log('\n📍 Location:')
        console.log(`   Service Address: ${data.serviceAddress || 'Not provided'}`)
        console.log(`   Address Confidence: ${data.addressConfidence ? (data.addressConfidence * 100).toFixed(1) + '%' : 'N/A'}`)
        
        console.log('\n💰 Pricing:')
        console.log(`   Quoted Price: ${data.quotedPrice ? '$' + data.quotedPrice : 'Not mentioned'}`)
        console.log(`   Budget Mentioned: ${data.budgetMentioned ? '$' + data.budgetMentioned : 'Not mentioned'}`)
        console.log(`   Pricing Discussion: ${data.pricingDiscussion || 'None'}`)
      }
      
      if (data.issues.length > 0) {
        console.log('\n⚠️ Quality Issues Detected:')
        data.issues.forEach(issue => console.log(`   • ${issue}`))
      }
      
    } else {
      console.log('❌ Extraction failed:', result.error)
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.log('\n💡 Make sure:')
    console.log('   - OpenAI API key is configured')
    console.log('   - Internet connection is available')
  }
}

// Test all samples if called directly
async function testAllSamples() {
  console.log('🧪 Testing All Sample Transcriptions\n')
  
  for (const sample of samples) {
    console.log(`\n${'='.repeat(50)}`)
    console.log(`Testing: ${sample.name}`)
    console.log('='.repeat(50))
    await testExtraction(sample.text)
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2)
  
  if (args.includes('--all')) {
    testAllSamples()
  } else {
    testExtraction()
  }
}

module.exports = { testExtraction, testAllSamples }