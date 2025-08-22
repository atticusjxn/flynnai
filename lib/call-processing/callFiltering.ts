import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function isAppointmentCall(transcription: string): Promise<boolean> {
  try {
    const prompt = `
Analyze this call transcription and determine if it contains any appointment or scheduling related content.

Look for discussions about:
- Scheduling appointments or meetings
- Booking services or consultations
- Setting up future visits
- Discussing availability or time slots
- Confirming existing appointments
- Rescheduling or canceling appointments
- Service inquiries that lead to booking

Return only "true" or "false".

Call transcription:
${transcription}
`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at identifying appointment-related conversations. Be thorough but conservative - only return true if there is clear appointment or scheduling discussion.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0,
      max_tokens: 10
    })

    const response = completion.choices[0]?.message?.content?.trim().toLowerCase()
    return response === 'true'

  } catch (error) {
    console.error('Call filtering error:', error)
    // Default to processing the call if filtering fails
    return true
  }
}

export async function shouldProcessCall(transcription: string, userPreferences: any): Promise<boolean> {
  // If user wants all calls processed, skip filtering
  if (userPreferences?.callFiltering === 'all') {
    return true
  }

  // Otherwise use smart filtering
  return await isAppointmentCall(transcription)
}

export function isSpamCall(phoneNumber: string, transcription?: string): boolean {
  // Common spam indicators
  const spamPatterns = [
    /warranty/i,
    /vehicle/i,
    /solar/i,
    /insurance/i,
    /credit card/i,
    /debt/i,
    /IRS/i,
    /final notice/i,
    /limited time/i,
    /act now/i
  ]

  // Check known spam number patterns
  const spamNumberPatterns = [
    /^1?800/, // 800 numbers
    /^1?888/, // 888 numbers
    /^1?877/, // 877 numbers
  ]

  // Check phone number patterns
  for (const pattern of spamNumberPatterns) {
    if (pattern.test(phoneNumber)) {
      return true
    }
  }

  // Check transcription for spam content
  if (transcription) {
    for (const pattern of spamPatterns) {
      if (pattern.test(transcription)) {
        return true
      }
    }
  }

  return false
}