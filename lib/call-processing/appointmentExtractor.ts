import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

interface AppointmentData {
  confidence: number
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  appointmentDate?: string
  appointmentTime?: string
  serviceType?: string
  duration?: string
  location?: string
  notes?: string
}

export async function extractAppointmentData(transcription: string): Promise<AppointmentData | null> {
  try {
    const prompt = `
You are an AI assistant that extracts appointment information from call transcriptions.
Analyze the following call transcription and extract any appointment-related information.

Return a JSON object with the following structure:
{
  "confidence": number (0-100, how confident you are this contains appointment information),
  "customerName": string or null,
  "customerPhone": string or null,
  "customerEmail": string or null,
  "appointmentDate": string or null (YYYY-MM-DD format),
  "appointmentTime": string or null (HH:MM format),
  "serviceType": string or null,
  "duration": string or null,
  "location": string or null,
  "notes": string or null (any additional relevant details)
}

Rules:
- Only return appointment information if you're at least 50% confident
- Be conservative with confidence scores
- If no clear appointment information exists, return {"confidence": 0}
- Parse dates and times carefully, considering context
- Include any service details mentioned

Call transcription:
${transcription}
`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at extracting structured appointment information from call transcriptions. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 1000
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from OpenAI')
    }

    // Parse the JSON response
    const appointmentData = JSON.parse(response) as AppointmentData
    
    // Validate confidence score
    if (appointmentData.confidence < 0 || appointmentData.confidence > 100) {
      appointmentData.confidence = 0
    }

    return appointmentData

  } catch (error) {
    console.error('Appointment extraction error:', error)
    return { confidence: 0 }
  }
}

export async function isAppointmentCall(transcription: string): Promise<boolean> {
  try {
    const prompt = `
Analyze this call transcription and determine if it contains any appointment or scheduling related content.

Return only "true" or "false" based on whether the call discusses:
- Scheduling appointments
- Booking services
- Setting up meetings
- Discussing availability
- Confirming appointments
- Rescheduling

Call transcription:
${transcription}
`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
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