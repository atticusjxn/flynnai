// Manual transcription testing utility
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testTranscription() {
  console.log('🧪 Manual Transcription Test\n')

  try {
    // Find a call record with recording to test
    const callWithRecording = await prisma.callRecord.findFirst({
      where: {
        recordingUrl: { not: null },
        transcription: null // Not yet transcribed
      },
      include: { user: true }
    })

    if (!callWithRecording) {
      console.log('❌ No call records with recordings found for testing')
      console.log('   Create a test call first or wait for a real call to come in')
      return
    }

    console.log('📞 Found call record for testing:')
    console.log(`   Call SID: ${callWithRecording.callSid}`)
    console.log(`   Phone: ${callWithRecording.phoneNumber}`)
    console.log(`   User: ${callWithRecording.user.name}`)
    console.log(`   Recording URL: ${callWithRecording.recordingUrl}`)

    // Import transcription service dynamically
    console.log('\n🎙️ Starting transcription...')
    
    const { processCallRecordingTranscription } = require('../lib/transcription')
    const result = await processCallRecordingTranscription(callWithRecording.id)

    if (result.success) {
      console.log('✅ Transcription successful!')
      console.log(`   Confidence: ${result.confidence ? (result.confidence * 100).toFixed(1) + '%' : 'Unknown'}`)
      console.log(`   Processing time: ${result.processingTime}ms`)
      console.log(`   Transcription: "${result.transcription?.substring(0, 200)}..."`)
    } else {
      console.log('❌ Transcription failed:', result.error)
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.log('\n💡 Make sure:')
    console.log('   - OpenAI API key is configured')
    console.log('   - Database is accessible')
    console.log('   - Call records with recordings exist')
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  testTranscription()
}

module.exports = { testTranscription }