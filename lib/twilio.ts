import twilio from 'twilio'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.warn('Twilio credentials not configured. SMS verification will not work.')
}

// Only create client if we have valid credentials
let client: twilio.Twilio | null = null
if (accountSid && authToken && accountSid.startsWith('AC')) {
  client = twilio(accountSid, authToken)
} else if (accountSid || authToken) {
  console.warn('Twilio credentials are incomplete or invalid - client not initialized')
}

export interface TwilioConfig {
  accountSid: string
  authToken: string
  phoneNumber?: string
}

export interface PhoneNumberSearchOptions {
  areaCode?: string
  contains?: string
  smsEnabled?: boolean
  voiceEnabled?: boolean
  mmsEnabled?: boolean
  limit?: number
}

export interface WebhookConfig {
  voiceUrl: string
  statusCallbackUrl?: string
  recordingStatusCallbackUrl?: string
}

export const sendVerificationCode = async (phoneNumber: string, code: string) => {
  if (!client || !twilioPhoneNumber) {
    throw new Error('Twilio not configured')
  }

  try {
    const message = await client.messages.create({
      body: `Your Flynn AI verification code is: ${code}. This code expires in 10 minutes.`,
      from: twilioPhoneNumber,
      to: phoneNumber,
    })

    return {
      success: true,
      messageId: message.sid,
    }
  } catch (error) {
    console.error('Error sending SMS:', error)
    throw new Error('Failed to send SMS')
  }
}

export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export class TwilioService {
  private client: twilio.Twilio
  private config: TwilioConfig

  constructor(config: TwilioConfig) {
    this.config = config
    this.client = twilio(config.accountSid, config.authToken)
  }

  /**
   * Test connection to Twilio API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.api.accounts.list({ limit: 1 })
      return true
    } catch (error) {
      console.error('Twilio connection test failed:', error)
      return false
    }
  }

  /**
   * Search for available phone numbers
   */
  async searchAvailableNumbers(
    countryCode: string = 'US',
    options: PhoneNumberSearchOptions = {}
  ) {
    try {
      const searchOptions: any = {
        limit: options.limit || 20,
        voiceEnabled: options.voiceEnabled !== false,
        smsEnabled: options.smsEnabled !== false,
      }

      if (options.areaCode) {
        searchOptions.areaCode = options.areaCode
      }

      if (options.contains) {
        searchOptions.contains = options.contains
      }

      if (options.mmsEnabled) {
        searchOptions.mmsEnabled = options.mmsEnabled
      }

      const availableNumbers = await this.client.availablePhoneNumbers(countryCode)
        .local
        .list(searchOptions)

      return availableNumbers.map(number => ({
        phoneNumber: number.phoneNumber,
        friendlyName: number.friendlyName,
        locality: number.locality,
        region: number.region,
        postalCode: number.postalCode,
        capabilities: {
          voice: number.capabilities.voice,
          SMS: number.capabilities.sms,
          MMS: number.capabilities.mms
        }
      }))
    } catch (error) {
      console.error('Error searching available numbers:', error)
      throw new Error(`Failed to search available numbers: ${error}`)
    }
  }

  /**
   * Purchase a phone number
   */
  async purchasePhoneNumber(phoneNumber: string, webhookConfig?: WebhookConfig) {
    try {
      const purchaseOptions: any = {
        phoneNumber: phoneNumber,
        voiceMethod: 'POST',
        statusCallbackMethod: 'POST'
      }

      if (webhookConfig) {
        purchaseOptions.voiceUrl = webhookConfig.voiceUrl
        
        if (webhookConfig.statusCallbackUrl) {
          purchaseOptions.statusCallback = webhookConfig.statusCallbackUrl
        }
      }

      const incomingPhoneNumber = await this.client.incomingPhoneNumbers.create(purchaseOptions)

      return {
        sid: incomingPhoneNumber.sid,
        phoneNumber: incomingPhoneNumber.phoneNumber,
        friendlyName: incomingPhoneNumber.friendlyName,
        voiceUrl: incomingPhoneNumber.voiceUrl,
        statusCallback: incomingPhoneNumber.statusCallback
      }
    } catch (error) {
      console.error('Error purchasing phone number:', error)
      throw new Error(`Failed to purchase phone number: ${error}`)
    }
  }

  /**
   * Update webhook URLs for an existing phone number
   */
  async updatePhoneNumberWebhooks(phoneNumberSid: string, webhookConfig: WebhookConfig) {
    try {
      const updatedNumber = await this.client.incomingPhoneNumbers(phoneNumberSid)
        .update({
          voiceUrl: webhookConfig.voiceUrl,
          voiceMethod: 'POST',
          statusCallback: webhookConfig.statusCallbackUrl,
          statusCallbackMethod: 'POST'
        })

      return {
        sid: updatedNumber.sid,
        phoneNumber: updatedNumber.phoneNumber,
        voiceUrl: updatedNumber.voiceUrl,
        statusCallback: updatedNumber.statusCallback
      }
    } catch (error) {
      console.error('Error updating phone number webhooks:', error)
      throw new Error(`Failed to update webhooks: ${error}`)
    }
  }

  /**
   * Get Twilio account information
   */
  async getAccountInfo() {
    try {
      const account = await this.client.api.v2010.accounts(this.accountSid).fetch()
      
      return {
        sid: account.sid,
        friendlyName: account.friendlyName,
        status: account.status,
        type: account.type,
        dateCreated: account.dateCreated
      }
    } catch (error) {
      console.error('Error fetching account info:', error)
      throw new Error(`Failed to fetch account info: ${error}`)
    }
  }

  /**
   * List all purchased phone numbers
   */
  async listPhoneNumbers() {
    try {
      const phoneNumbers = await this.client.incomingPhoneNumbers.list()
      
      return phoneNumbers.map(number => ({
        sid: number.sid,
        phoneNumber: number.phoneNumber,
        friendlyName: number.friendlyName,
        voiceUrl: number.voiceUrl,
        statusCallback: number.statusCallback,
        capabilities: {
          voice: number.capabilities.voice,
          SMS: number.capabilities.sms,
          MMS: number.capabilities.mms
        }
      }))
    } catch (error) {
      console.error('Error listing phone numbers:', error)
      throw new Error(`Failed to list phone numbers: ${error}`)
    }
  }

  /**
   * Enable call recording for a phone number
   */
  async enableCallRecording(phoneNumberSid: string, recordingStatusCallbackUrl: string) {
    try {
      const updatedNumber = await this.client.incomingPhoneNumbers(phoneNumberSid)
        .update({
          statusCallback: recordingStatusCallbackUrl,
          statusCallbackMethod: 'POST'
        })

      return updatedNumber
    } catch (error) {
      console.error('Error enabling call recording:', error)
      throw new Error(`Failed to enable call recording: ${error}`)
    }
  }

  /**
   * Get call details
   */
  async getCallDetails(callSid: string) {
    try {
      const call = await this.client.calls(callSid).fetch()
      
      return {
        sid: call.sid,
        from: call.from,
        to: call.to,
        status: call.status,
        duration: call.duration,
        startTime: call.startTime,
        endTime: call.endTime,
        price: call.price,
        direction: call.direction
      }
    } catch (error) {
      console.error('Error fetching call details:', error)
      throw new Error(`Failed to fetch call details: ${error}`)
    }
  }

  /**
   * Get call recordings
   */
  async getCallRecordings(callSid: string) {
    try {
      const recordings = await this.client.calls(callSid).recordings.list()
      
      return recordings.map(recording => ({
        sid: recording.sid,
        uri: recording.uri,
        duration: recording.duration,
        status: recording.status,
        channels: recording.channels,
        source: recording.source,
        errorCode: recording.errorCode
      }))
    } catch (error) {
      console.error('Error fetching call recordings:', error)
      throw new Error(`Failed to fetch call recordings: ${error}`)
    }
  }

  /**
   * Download recording audio file
   */
  async downloadRecording(recordingSid: string): Promise<Buffer> {
    try {
      const recording = await this.client.recordings(recordingSid).fetch()
      const audioUrl = `https://api.twilio.com${recording.uri.replace('.json', '.mp3')}`
      
      const response = await fetch(audioUrl, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.config.accountSid}:${this.config.authToken}`).toString('base64')}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to download recording: ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch (error) {
      console.error('Error downloading recording:', error)
      throw new Error(`Failed to download recording: ${error}`)
    }
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(
    url: string,
    params: Record<string, string>,
    signature: string
  ): boolean {
    try {
      return twilio.validateRequest(this.config.authToken, signature, url, params)
    } catch (error) {
      console.error('Error validating webhook signature:', error)
      return false
    }
  }
}

/**
 * Create TwilioService instance from environment variables
 */
export function createTwilioService(): TwilioService {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken) {
    throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables are required')
  }

  return new TwilioService({
    accountSid,
    authToken,
    phoneNumber
  })
}

/**
 * Create TwilioService instance from user's database settings
 */
export async function createUserTwilioService(userId: string): Promise<TwilioService | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        twilioAccountSid: true,
        twilioAuthToken: true,
        phoneIntegrations: {
          where: { 
            provider: 'twilio',
            isActive: true 
          },
          select: {
            phoneNumber: true,
            accountSid: true,
            authToken: true
          }
        }
      }
    })

    if (!user) {
      return null
    }

    // Try user-specific Twilio settings first
    const integration = user.phoneIntegrations[0]
    if (integration && integration.accountSid && integration.authToken) {
      return new TwilioService({
        accountSid: integration.accountSid,
        authToken: integration.authToken,
        phoneNumber: integration.phoneNumber
      })
    }

    // Fall back to user's main Twilio settings
    if (user.twilioAccountSid && user.twilioAuthToken) {
      return new TwilioService({
        accountSid: user.twilioAccountSid,
        authToken: user.twilioAuthToken
      })
    }

    return null
  } catch (error) {
    console.error('Error creating user Twilio service:', error)
    return null
  }
}

/**
 * Store phone integration in database
 */
export async function storePhoneIntegration(
  userId: string,
  phoneNumber: string,
  twilioData: {
    accountSid: string
    authToken: string
    phoneNumberSid: string
    webhookUrl: string
  }
) {
  try {
    return await prisma.phoneIntegration.create({
      data: {
        userId,
        provider: 'twilio',
        phoneNumber,
        accountSid: twilioData.accountSid,
        authToken: twilioData.authToken,
        webhookUrl: twilioData.webhookUrl
      }
    })
  } catch (error) {
    console.error('Error storing phone integration:', error)
    throw new Error(`Failed to store phone integration: ${error}`)
  }
}

/**
 * Get user's active phone integrations
 */
export async function getUserPhoneIntegrations(userId: string) {
  try {
    return await prisma.phoneIntegration.findMany({
      where: {
        userId,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  } catch (error) {
    console.error('Error fetching phone integrations:', error)
    throw new Error(`Failed to fetch phone integrations: ${error}`)
  }
}