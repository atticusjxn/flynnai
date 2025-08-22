import { VoiceCommand, VoiceResponse } from '@/types/voice'

interface CommandPattern {
  pattern: RegExp
  intent: string
  handler: (matches: RegExpMatchArray, entities: Record<string, any>) => Promise<VoiceResponse>
}

const timePatterns = {
  hour: /(\d{1,2})\s*(?:am|pm|o'clock)?/i,
  time: /(\d{1,2})(?::(\d{2}))?\s*(am|pm|in the morning|in the afternoon|in the evening|at night)?/i,
  timeOfDay: /(morning|afternoon|evening|night)/i,
  day: /(monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tomorrow|next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))/i,
  date: /(\d{1,2})(?:st|nd|rd|th)?\s*(?:of\s*)?(january|february|march|april|may|june|july|august|september|october|november|december)?/i,
  thisWeek: /(this\s+week|the\s+week)/i,
  nextWeek: /(next\s+week)/i,
  phoneNumber: /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/i,
  money: /\$?(\d+(?:\.\d{2})?)/i
}

const commandPatterns: CommandPattern[] = [
  // Enhanced scheduling patterns with more natural variations
  {
    pattern: /(?:schedule|book|set up|arrange)\s+(?:an?\s+)?(?:appointment\s+(?:with\s+)?|meeting\s+with\s+)?(.+?)\s+(?:for|on)\s+(.+?)(?:\s+(?:at|around)\s+(.+?))?$/i,
    intent: 'schedule_appointment',
    handler: async (matches, entities) => {
      const clientName = matches[1]?.trim()
      const dateStr = matches[2]?.trim()
      const timeStr = matches[3]?.trim()
      
      return {
        text: `Perfect! I've scheduled an appointment with ${clientName} for ${dateStr}${timeStr ? ` at ${timeStr}` : ''}. The appointment has been added to your calendar.`,
        action: 'create_appointment',
        data: { clientName, dateStr, timeStr }
      }
    }
  },
  {
    pattern: /(?:book|schedule)\s+(.+?)\s+(?:for\s+)?(?:tomorrow|today|next\s+\w+)\s+(?:at\s+|around\s+)?(.+?)$/i,
    intent: 'schedule_appointment_short',
    handler: async (matches, entities) => {
      const clientName = matches[1]?.trim()
      const timeStr = matches[2]?.trim()
      const dateStr = matches[0].includes('tomorrow') ? 'tomorrow' : 
                     matches[0].includes('today') ? 'today' : 
                     matches[0].match(/next\s+(\w+)/)?.[0] || 'tomorrow'
      
      return {
        text: `Got it! I've scheduled ${clientName} for ${dateStr} at ${timeStr}. All set!`,
        action: 'create_appointment',
        data: { clientName, dateStr, timeStr }
      }
    }
  },
  
  // Enhanced appointment viewing patterns
  {
    pattern: /(?:show|display|what are|what's|list|tell me)\s+(?:my\s+)?(?:appointments|schedule)\s*(?:for\s+(.+?))?$/i,
    intent: 'show_appointments',
    handler: async (matches, entities) => {
      const dateStr = matches[1]?.trim() || 'today'
      const count = Math.floor(Math.random() * 4) + 1 // Simulate appointment count
      
      return {
        text: `You have ${count} appointment${count !== 1 ? 's' : ''} scheduled for ${dateStr}. Let me show you the details.`,
        action: 'show_appointments',
        data: { dateStr }
      }
    }
  },
  {
    pattern: /(?:what's|show me|tell me)\s+(?:my\s+)?(?:schedule\s+)?(?:this\s+week|next\s+week|today|tomorrow)$/i,
    intent: 'show_schedule',
    handler: async (matches, entities) => {
      const period = matches[0].includes('this week') ? 'this week' :
                    matches[0].includes('next week') ? 'next week' :
                    matches[0].includes('tomorrow') ? 'tomorrow' : 'today'
      
      return {
        text: `Here's your schedule for ${period}. Let me pull up those appointments.`,
        action: 'show_appointments',
        data: { dateStr: period }
      }
    }
  },
  
  // Enhanced invoice creation with more natural language
  {
    pattern: /(?:create|make|generate|send)\s+(?:an?\s+)?invoice\s+(?:for\s+)?(.+?)(?:\s+for\s+\$?(\d+(?:\.\d{2})?))?\s*(?:for\s+(.+?))?$/i,
    intent: 'create_invoice',
    handler: async (matches, entities) => {
      const clientName = matches[1]?.trim()
      const amount = matches[2] ? parseFloat(matches[2]) : null
      const description = matches[3]?.trim()
      
      return {
        text: `Invoice created for ${clientName}${amount ? ` for $${amount}` : ''}${description ? ` for ${description}` : ''}. I'll prepare that invoice now.`,
        action: 'create_invoice',
        data: { clientName, amount, description }
      }
    }
  },
  
  // Enhanced client management with phone numbers
  {
    pattern: /(?:add|create)\s+(?:a\s+)?(?:new\s+)?client\s+(.+?)(?:\s+phone\s+(?:number\s+)?(.+?))?$/i,
    intent: 'add_client',
    handler: async (matches, entities) => {
      const clientName = matches[1]?.trim()
      const phoneNumber = matches[2]?.trim()
      
      return {
        text: `Great! I've added ${clientName} as a new client${phoneNumber ? ` with phone number ${phoneNumber}` : ''}. They're now in your system.`,
        action: 'add_client',
        data: { clientName, phoneNumber }
      }
    }
  },
  {
    pattern: /(?:add|create)\s+client\s+(.+?)\s+(?:phone|number)\s+(.+?)$/i,
    intent: 'add_client_with_phone',
    handler: async (matches, entities) => {
      const clientName = matches[1]?.trim()
      const phoneNumber = matches[2]?.trim()
      
      return {
        text: `Perfect! I've added ${clientName} with phone number ${phoneNumber} to your client list.`,
        action: 'add_client',
        data: { clientName, phoneNumber }
      }
    }
  },
  
  // Client listing
  {
    pattern: /(?:show|list|display|tell me)\s+(?:my\s+)?clients?$/i,
    intent: 'show_clients',
    handler: async (matches, entities) => {
      const count = Math.floor(Math.random() * 20) + 10 // Simulate client count
      return {
        text: `You have ${count} clients in your system. Here they are.`,
        action: 'show_clients',
        data: {}
      }
    }
  },
  
  // Appointment cancellation
  {
    pattern: /(?:cancel|delete|remove)\s+(?:the\s+)?appointment\s+(?:with\s+)?(.+?)$/i,
    intent: 'cancel_appointment',
    handler: async (matches, entities) => {
      const clientName = matches[1]?.trim()
      
      return {
        text: `I've cancelled the appointment with ${clientName}. They'll need to reschedule if needed.`,
        action: 'cancel_appointment',
        data: { clientName }
      }
    }
  },
  
  // Revenue and earnings
  {
    pattern: /(?:what's|show|tell me)\s+(?:my\s+)?(?:revenue|income|earnings|money|sales)\s*(?:for\s+(.+?))?$/i,
    intent: 'show_revenue',
    handler: async (matches, entities) => {
      const period = matches[1]?.trim() || 'this month'
      const amount = Math.floor(Math.random() * 5000) + 2000 // Simulate revenue
      
      return {
        text: `Your revenue for ${period} is $${amount.toLocaleString()}. Business is looking good!`,
        action: 'show_revenue',
        data: { period, amount }
      }
    }
  },
  
  // Status and summary commands
  {
    pattern: /(?:how's|what's)\s+(?:my\s+)?(?:business|day|schedule)\s*(?:looking|today)?/i,
    intent: 'business_summary',
    handler: async (matches, entities) => {
      return {
        text: `Let me give you a quick business summary. You have several appointments today and your schedule is looking busy!`,
        action: 'show_summary',
        data: {}
      }
    }
  },
  
  // Help and commands
  {
    pattern: /(?:help|what can you do|commands)/i,
    intent: 'help',
    handler: async (matches, entities) => {
      return {
        text: `I can help you schedule appointments, manage clients, create invoices, and check your business status. Just speak naturally like 'Schedule John for tomorrow at 2pm' or 'Show my appointments today'.`,
        action: 'show_help',
        data: {}
      }
    }
  }
]

function extractEntities(text: string): Record<string, any> {
  const entities: Record<string, any> = {}
  
  // Extract time entities
  const timeMatch = text.match(timePatterns.time)
  if (timeMatch) {
    let hour = parseInt(timeMatch[1])
    const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0
    const period = timeMatch[3]?.toLowerCase()
    
    if (period === 'pm' && hour !== 12) hour += 12
    if (period === 'am' && hour === 12) hour = 0
    
    entities.time = { hour, minute, period }
  }
  
  // Extract day entities
  const dayMatch = text.match(timePatterns.day)
  if (dayMatch) {
    entities.day = dayMatch[1].toLowerCase()
  }
  
  // Extract date entities
  const dateMatch = text.match(timePatterns.date)
  if (dateMatch) {
    entities.date = {
      day: parseInt(dateMatch[1]),
      month: dateMatch[2]?.toLowerCase()
    }
  }
  
  return entities
}

export async function processVoiceCommand(text: string): Promise<VoiceResponse> {
  const normalizedText = text.toLowerCase().trim()
  
  // Extract entities from the command
  const entities = extractEntities(normalizedText)
  
  // Try to match against known patterns
  for (const { pattern, intent, handler } of commandPatterns) {
    const matches = normalizedText.match(pattern)
    if (matches) {
      try {
        return await handler(matches, entities)
      } catch (error) {
        console.error('Command handler error:', error)
        return {
          text: "I had trouble processing that command. Could you try rephrasing it?"
        }
      }
    }
  }
  
  // If no pattern matches, provide a helpful response
  return {
    text: "I didn't understand that command. Try saying something like 'Schedule John for Tuesday at 2pm' or 'Show my appointments for today'."
  }
}

export function getSupportedCommands(): string[] {
  return [
    "Schedule [client] for [day] at [time]",
    "Show my appointments for [day]",
    "Create invoice for [client]",
    "Add new client [name]",
    "Show my clients",
    "Cancel appointment with [client]",
    "What's my revenue for [period]"
  ]
}