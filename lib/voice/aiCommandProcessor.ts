import { getOpenAI } from '@/lib/openai'
import { VoiceResponse } from '@/types/voice'
import { processVoiceCommand as fallbackProcessor } from './commandProcessor'

interface AICommandResult {
  intent: string
  entities: Record<string, any>
  response: string
  confidence: number
}

const SYSTEM_PROMPT = `You are Flynn, a friendly and helpful AI assistant for service businesses like plumbers, cleaners, and trades professionals. You help them manage their business through voice commands.

Your job is to:
1. Parse voice commands and extract intent and entities
2. Provide helpful, conversational responses
3. Confirm actions clearly

Available actions:
- schedule_appointment: Book appointments with clients
- show_appointments: Display scheduled appointments  
- create_invoice: Generate invoices for clients
- add_client: Add new clients to the system
- show_clients: List existing clients
- cancel_appointment: Cancel scheduled appointments
- show_revenue: Display business revenue/earnings
- show_summary: Give business overview
- help: Provide assistance

Respond with JSON in this format:
{
  "intent": "schedule_appointment",
  "entities": {
    "clientName": "John Smith",
    "date": "tomorrow", 
    "time": "2pm",
    "description": "Kitchen repair"
  },
  "response": "Perfect! I've scheduled John Smith for tomorrow at 2pm for kitchen repair. The appointment is all set!",
  "confidence": 0.95
}

Guidelines:
- Be conversational and friendly ("Got it!", "Perfect!", "All set!")
- Include specific details in confirmations
- Use casual language that field workers would appreciate
- If unclear, ask for clarification
- Handle variations like "2-ish", "around 3", "150 bucks", "this week"
- Be encouraging about their business ("Business is looking good!", "You're staying busy!")

Parse the user's voice command and respond appropriately.`

export async function processAIVoiceCommand(command: string): Promise<VoiceResponse> {
  const openai = getOpenAI()
  
  if (!openai) {
    // Fallback to basic pattern matching
    console.log('OpenAI not available, using fallback processor')
    return fallbackProcessor(command)
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: command }
      ],
      temperature: 0.3,
      max_tokens: 300,
    })

    const aiResponse = completion.choices[0]?.message?.content
    
    if (!aiResponse) {
      throw new Error('No response from OpenAI')
    }

    // Parse the JSON response
    const result: AICommandResult = JSON.parse(aiResponse)
    
    // Validate confidence threshold
    if (result.confidence < 0.6) {
      return {
        text: "I'm not quite sure what you meant. Could you try rephrasing that? For example, you can say 'Schedule John for tomorrow at 2pm' or 'Show my appointments today'.",
        action: 'clarification_needed',
        data: { originalCommand: command }
      }
    }

    return {
      text: result.response,
      action: result.intent,
      data: result.entities
    }

  } catch (error) {
    console.error('OpenAI API error:', error)
    
    // Fallback to basic pattern matching on API failure
    console.log('OpenAI failed, falling back to basic processor')
    return fallbackProcessor(command)
  }
}

// Enhanced fallback function that includes some AI-like responses
export async function processSmartFallbackCommand(command: string): Promise<VoiceResponse> {
  const basicResult = await fallbackProcessor(command)
  
  // Enhance basic responses with more conversational language
  const enhancedResponses: Record<string, (original: string) => string> = {
    schedule_appointment: (original) => {
      const variants = [
        "Perfect! I've got that appointment scheduled for you.",
        "All set! Your appointment has been booked.",
        "Done! I've added that to your calendar.",
        "Great! That appointment is now scheduled."
      ]
      return variants[Math.floor(Math.random() * variants.length)]
    },
    
    show_appointments: (original) => {
      const variants = [
        "Here's what you've got coming up.",
        "Let me show you your schedule.",
        "Here are your upcoming appointments.",
        "This is what's on your calendar."
      ]
      return variants[Math.floor(Math.random() * variants.length)]
    },
    
    create_invoice: (original) => {
      const variants = [
        "Invoice is ready to go!",
        "I've prepared that invoice for you.",
        "Your invoice has been created.",
        "All done! Invoice is ready to send."
      ]
      return variants[Math.floor(Math.random() * variants.length)]
    },
    
    add_client: (original) => {
      const variants = [
        "Great! I've added them to your client list.",
        "New client added successfully!",
        "They're now in your system.",
        "Perfect! I've got their information saved."
      ]
      return variants[Math.floor(Math.random() * variants.length)]
    }
  }

  if (basicResult.action && enhancedResponses[basicResult.action]) {
    basicResult.text = enhancedResponses[basicResult.action](basicResult.text)
  }

  return basicResult
}

// Test function to validate AI responses without making API calls
export function validateAIResponse(response: string): AICommandResult | null {
  try {
    const parsed = JSON.parse(response)
    
    if (
      typeof parsed.intent === 'string' &&
      typeof parsed.entities === 'object' &&
      typeof parsed.response === 'string' &&
      typeof parsed.confidence === 'number'
    ) {
      return parsed as AICommandResult
    }
  } catch (error) {
    console.error('Invalid AI response format:', error)
  }
  
  return null
}