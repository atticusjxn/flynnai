import { getOpenAI } from '@/lib/openai'
import { prisma } from '@/lib/prisma'
import { errorHandler, ErrorType, ErrorSeverity } from '@/lib/error-handling'

export interface ExtractedAppointmentData {
  // Customer Information
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  
  // Service Details
  serviceType?: string
  jobDescription?: string
  urgencyLevel?: 'emergency' | 'urgent' | 'normal' | 'routine'
  
  // Scheduling
  preferredDate?: string // ISO date string or natural language
  preferredTime?: string
  timeFlexibility?: 'strict' | 'flexible' | 'any_time'
  
  // Location
  serviceAddress?: string
  addressConfidence?: number // 0-1 confidence in address accuracy
  
  // Pricing
  quotedPrice?: number
  budgetMentioned?: number
  pricingDiscussion?: string
  
  // Metadata
  hasAppointment: boolean
  appointmentCount: number
  confidence: number // Overall confidence in extraction
  issues: string[] // Any issues detected
  rawExtraction?: any // Original GPT response
  multipleAppointments?: ExtractedAppointmentData[] // Multiple appointments if detected
}

export interface ExtractionResult {
  success: boolean
  data?: ExtractedAppointmentData
  error?: string
  processingTime?: number
}

/**
 * Create GPT-4 prompt for appointment extraction
 */
function createExtractionPrompt(transcription: string): string {
  return `You are an AI assistant that extracts appointment information from phone call transcriptions for home service businesses (plumbing, electrical, HVAC, etc.).

Analyze the following phone call transcription and extract structured appointment information. If no appointment is being requested, indicate that clearly.

CALL TRANSCRIPTION:
"""
${transcription}
"""

Extract the following information and respond with ONLY a valid JSON object (no additional text):

{
  "hasAppointment": boolean, // true if caller is requesting any kind of service/appointment
  "appointmentCount": number, // number of appointments/jobs requested (0 if none)
  "confidence": number, // overall confidence in extraction accuracy (0.0 to 1.0)
  "customerName": string | null, // caller's name if mentioned
  "customerPhone": string | null, // caller's phone number if mentioned or can be inferred
  "customerEmail": string | null, // email address if provided
  "serviceType": string | null, // type of service (plumbing, electrical, HVAC, etc.)
  "jobDescription": string | null, // description of the work needed
  "urgencyLevel": "emergency" | "urgent" | "normal" | "routine" | null,
  "preferredDate": string | null, // preferred date in natural language or ISO format
  "preferredTime": string | null, // preferred time (morning, afternoon, "2 PM", etc.)
  "timeFlexibility": "strict" | "flexible" | "any_time" | null,
  "serviceAddress": string | null, // full address where service is needed
  "addressConfidence": number | null, // 0.0-1.0 confidence in address accuracy
  "quotedPrice": number | null, // any price mentioned by business
  "budgetMentioned": number | null, // budget mentioned by customer
  "pricingDiscussion": string | null, // summary of pricing discussion
  "issues": string[], // array of any issues detected (unclear info, missing details, etc.)
  "notes": string | null // any additional important notes
}

EXTRACTION GUIDELINES:
1. Only mark hasAppointment=true if the caller is actually requesting service or scheduling
2. For urgencyLevel: "emergency"=immediate/urgent repair, "urgent"=ASAP, "normal"=regular scheduling, "routine"=maintenance
3. Extract addresses carefully - include full address if available (street, city, state)
4. Set addressConfidence low if address is incomplete or unclear
5. Record any pricing discussion, even if approximate
6. Note in "issues" if critical information is missing or unclear
7. Be conservative with confidence scoring - lower is better than overconfident
8. For timeFlexibility: "strict"=specific time required, "flexible"=some flexibility, "any_time"=very flexible

EXAMPLES OF ISSUES TO FLAG:
- Unclear or incomplete address
- No contact information provided
- Vague service description
- Scheduling conflicts mentioned
- Technical audio issues affecting transcription

Remember: Respond with ONLY the JSON object, no additional text or formatting.`
}

/**
 * Extract appointment data using GPT-4 with comprehensive error handling
 */
export async function extractAppointmentData(
  transcription: string,
  context?: { callSid?: string; phoneNumber?: string; callRecordId?: string; userId?: string }
): Promise<ExtractionResult> {
  const startTime = Date.now()
  const openai = getOpenAI()

  if (!openai) {
    return {
      success: false,
      error: 'OpenAI API not configured'
    }
  }

  if (!transcription || transcription.trim().length < 10) {
    // Handle calls with insufficient transcription data
    if (context?.callRecordId && context?.userId) {
      await errorHandler.createError({
        type: ErrorType.INSUFFICIENT_DATA,
        severity: ErrorSeverity.LOW,
        message: 'Transcription too short for appointment extraction',
        details: { 
          transcriptionLength: transcription?.length || 0,
          callSid: context.callSid
        },
        callRecordId: context.callRecordId,
        userId: context.userId,
        maxRetries: 0
      })
    }
    
    return {
      success: false,
      error: 'Transcription too short or empty',
      data: {
        hasAppointment: false,
        appointmentCount: 0,
        confidence: 0,
        issues: ['Insufficient transcription data'],
        rawExtraction: { transcription: transcription || '' }
      }
    }
  }

  try {
    console.log(`🧠 Starting GPT-4 appointment extraction for ${context?.callSid || 'call'}`)

    const prompt = createExtractionPrompt(transcription)

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1, // Low temperature for consistent extraction
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    })

    const processingTime = Date.now() - startTime
    const rawContent = response.choices[0]?.message?.content

    if (!rawContent) {
      throw new Error('No response content from GPT-4')
    }

    console.log(`📋 GPT-4 extraction completed in ${processingTime}ms`)

    // Parse JSON response
    let extractedData: ExtractedAppointmentData
    try {
      const parsed = JSON.parse(rawContent)
      
      // Validate and structure the data
      extractedData = {
        hasAppointment: Boolean(parsed.hasAppointment),
        appointmentCount: Math.max(0, parseInt(parsed.appointmentCount) || 0),
        confidence: Math.min(1, Math.max(0, parseFloat(parsed.confidence) || 0)),
        customerName: parsed.customerName || undefined,
        customerPhone: parsed.customerPhone || context?.phoneNumber || undefined,
        customerEmail: parsed.customerEmail || undefined,
        serviceType: parsed.serviceType || undefined,
        jobDescription: parsed.jobDescription || undefined,
        urgencyLevel: ['emergency', 'urgent', 'normal', 'routine'].includes(parsed.urgencyLevel) 
          ? parsed.urgencyLevel : undefined,
        preferredDate: parsed.preferredDate || undefined,
        preferredTime: parsed.preferredTime || undefined,
        timeFlexibility: ['strict', 'flexible', 'any_time'].includes(parsed.timeFlexibility) 
          ? parsed.timeFlexibility : undefined,
        serviceAddress: parsed.serviceAddress || undefined,
        addressConfidence: parsed.addressConfidence ? Math.min(1, Math.max(0, parseFloat(parsed.addressConfidence))) : undefined,
        quotedPrice: parsed.quotedPrice ? parseFloat(parsed.quotedPrice) : undefined,
        budgetMentioned: parsed.budgetMentioned ? parseFloat(parsed.budgetMentioned) : undefined,
        pricingDiscussion: parsed.pricingDiscussion || undefined,
        issues: Array.isArray(parsed.issues) ? parsed.issues : [],
        rawExtraction: parsed
      }

      // Add automatic quality checks
      if (!extractedData.hasAppointment) {
        extractedData.issues.push('No appointment request detected')
      }

      if (extractedData.hasAppointment && !extractedData.serviceType) {
        extractedData.issues.push('Service type not specified')
      }

      if (extractedData.hasAppointment && !extractedData.serviceAddress) {
        extractedData.issues.push('Service address missing')
      }

      if (extractedData.hasAppointment && !extractedData.customerName && !extractedData.customerPhone) {
        extractedData.issues.push('No customer contact information')
      }

      // Handle multiple appointments detection
      if (extractedData.appointmentCount > 1) {
        if (context?.callRecordId && context?.userId) {
          const multipleAppointments = Array.isArray(parsed.multipleAppointments) 
            ? parsed.multipleAppointments.slice(0, 5) // Limit to 5 appointments max
            : []
          
          extractedData.multipleAppointments = multipleAppointments
          
          // Handle multiple appointments error
          await errorHandler.handleMultipleAppointmentsError(
            context.callRecordId,
            context.userId,
            multipleAppointments,
            transcription
          )
        }
      }

      // Handle no appointment scenarios
      if (!extractedData.hasAppointment && context?.callRecordId && context?.userId) {
        await errorHandler.handleNoAppointmentError(
          context.callRecordId,
          context.userId,
          transcription,
          extractedData.confidence
        )
      }

      // Adjust confidence based on issues
      if (extractedData.issues.length > 0) {
        extractedData.confidence = Math.max(0.1, extractedData.confidence - (extractedData.issues.length * 0.15))
      }

      console.log(`📊 Extraction summary:`)
      console.log(`   Has appointment: ${extractedData.hasAppointment}`)
      console.log(`   Confidence: ${(extractedData.confidence * 100).toFixed(1)}%`)
      console.log(`   Service type: ${extractedData.serviceType || 'Unknown'}`)
      console.log(`   Issues: ${extractedData.issues.length}`)

      return {
        success: true,
        data: extractedData,
        processingTime
      }

    } catch (parseError) {
      console.error('❌ Failed to parse GPT-4 JSON response:', parseError)
      console.log('Raw response:', rawContent)
      
      return {
        success: false,
        error: 'Failed to parse extraction results',
        processingTime
      }
    }

  } catch (error) {
    const processingTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown extraction error'
    
    console.error('❌ GPT-4 appointment extraction failed:', error)

    // Handle specific error types with retry logic
    if (context?.callRecordId && context?.userId) {
      if (errorMessage.includes('timeout') || errorMessage.includes('rate limit')) {
        await errorHandler.createError({
          type: ErrorType.API_ERROR,
          severity: ErrorSeverity.HIGH,
          message: 'Appointment extraction API error',
          details: { 
            error: errorMessage,
            transcriptionLength: transcription.length,
            callSid: context.callSid
          },
          callRecordId: context.callRecordId,
          userId: context.userId,
          maxRetries: 3
        })
      } else {
        await errorHandler.createError({
          type: ErrorType.EXTRACTION_FAILED,
          severity: ErrorSeverity.HIGH,
          message: 'Failed to extract appointment data',
          details: { 
            error: errorMessage,
            processingTime,
            callSid: context.callSid
          },
          callRecordId: context.callRecordId,
          userId: context.userId,
          maxRetries: 2
        })
      }
    }

    return {
      success: false,
      error: errorMessage,
      processingTime,
      data: {
        hasAppointment: false,
        appointmentCount: 0,
        confidence: 0,
        issues: ['Extraction processing failed'],
        rawExtraction: { error: errorMessage }
      }
    }
  }
}

/**
 * Process appointment extraction for call record
 */
export async function processAppointmentExtraction(
  callRecordId: string,
  retryCount: number = 0
): Promise<ExtractionResult> {
  const maxRetries = 2

  try {
    // Get call record with transcription
    const callRecord = await prisma.callRecord.findUnique({
      where: { id: callRecordId },
      include: {
        user: true,
        transcriptions: true
      }
    })

    if (!callRecord) {
      throw new Error('Call record not found')
    }

    // Get the best transcription
    const transcription = callRecord.transcriptions[0]
    if (!transcription || !transcription.transcriptionText) {
      throw new Error('No transcription available for extraction')
    }

    console.log(`🧠 Processing appointment extraction for call ${callRecord.callSid}`)

    // Check if extraction already exists
    const existingExtraction = await prisma.extractedAppointment.findUnique({
      where: { callRecordId }
    })

    if (existingExtraction && !existingExtraction.manualOverride) {
      console.log('✅ Extraction already exists')
      return {
        success: true,
        data: {
          hasAppointment: true, // Assume true if record exists
          appointmentCount: 1,
          confidence: existingExtraction.confidenceScore || 0.5,
          customerName: existingExtraction.customerName || undefined,
          customerPhone: existingExtraction.customerPhone || undefined,
          customerEmail: existingExtraction.customerEmail || undefined,
          serviceType: existingExtraction.serviceType || undefined,
          jobDescription: existingExtraction.jobDescription || undefined,
          urgencyLevel: existingExtraction.urgencyLevel as any,
          preferredDate: existingExtraction.preferredDate?.toISOString(),
          preferredTime: existingExtraction.preferredTime || undefined,
          timeFlexibility: existingExtraction.timeFlexibility || undefined,
          serviceAddress: existingExtraction.serviceAddress || undefined,
          addressConfidence: existingExtraction.addressConfidence || undefined,
          quotedPrice: existingExtraction.quotedPrice ? parseFloat(existingExtraction.quotedPrice.toString()) : undefined,
          budgetMentioned: existingExtraction.budgetMentioned ? parseFloat(existingExtraction.budgetMentioned.toString()) : undefined,
          pricingDiscussion: existingExtraction.pricingDiscussion || undefined,
          issues: [],
          rawExtraction: existingExtraction.rawExtraction
        }
      }
    }

    // Perform extraction with enhanced error handling
    const result = await extractAppointmentData(
      transcription.transcriptionText,
      { 
        callSid: callRecord.callSid || undefined,
        phoneNumber: callRecord.phoneNumber,
        callRecordId: callRecordId,
        userId: callRecord.userId
      }
    )

    if (result.success && result.data) {
      const data = result.data

      // Find or create customer using intelligent deduplication
      let customer = null
      if (data.customerName || data.customerPhone) {
        try {
          const { findOrCreateCustomer } = await import('./customer-management')
          
          const customerResult = await findOrCreateCustomer(callRecord.userId, {
            name: data.customerName || 'Phone Customer',
            phone: data.customerPhone || callRecord.phoneNumber,
            email: data.customerEmail,
            address: data.serviceAddress,
            notes: `Contact via phone call on ${callRecord.createdAt.toISOString().split('T')[0]}`
          })
          
          customer = customerResult.customer
          
          console.log(`👤 Customer ${customerResult.isNewCustomer ? 'created' : 'linked'}: ${customer.name} (${customerResult.matchedBy}, ${customerResult.confidence}% confidence)`)
          
        } catch (error) {
          console.error('⚠️ Customer deduplication failed:', error)
          // Fallback to basic customer creation
          if (data.customerName || data.customerPhone) {
            customer = await prisma.customer.create({
              data: {
                userId: callRecord.userId,
                name: data.customerName || 'Unknown Customer',
                phone: data.customerPhone || callRecord.phoneNumber,
                email: data.customerEmail,
                address: data.serviceAddress,
                lastContactDate: new Date()
              }
            })
            console.log(`👤 Created fallback customer: ${customer.name}`)
          }
        }
      }

      // Store extraction in database
      const extractedAppointment = await prisma.extractedAppointment.upsert({
        where: { callRecordId },
        update: {
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail,
          serviceType: data.serviceType,
          jobDescription: data.jobDescription,
          urgencyLevel: data.urgencyLevel,
          preferredDate: data.preferredDate ? new Date(data.preferredDate) : null,
          preferredTime: data.preferredTime,
          timeFlexibility: data.timeFlexibility,
          serviceAddress: data.serviceAddress,
          addressConfidence: data.addressConfidence,
          quotedPrice: data.quotedPrice,
          budgetMentioned: data.budgetMentioned,
          pricingDiscussion: data.pricingDiscussion,
          confidenceScore: data.confidence,
          extractionModel: 'gpt-4',
          processingTime: result.processingTime,
          rawExtraction: data.rawExtraction,
          customerId: customer?.id,
          hasIssues: data.issues.length > 0,
          reviewNotes: data.issues.join('; ')
        },
        create: {
          callRecordId,
          userId: callRecord.userId,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail,
          serviceType: data.serviceType,
          jobDescription: data.jobDescription,
          urgencyLevel: data.urgencyLevel,
          preferredDate: data.preferredDate ? new Date(data.preferredDate) : null,
          preferredTime: data.preferredTime,
          timeFlexibility: data.timeFlexibility,
          serviceAddress: data.serviceAddress,
          addressConfidence: data.addressConfidence,
          quotedPrice: data.quotedPrice,
          budgetMentioned: data.budgetMentioned,
          pricingDiscussion: data.pricingDiscussion,
          confidenceScore: data.confidence,
          extractionModel: 'gpt-4',
          processingTime: result.processingTime,
          rawExtraction: data.rawExtraction,
          customerId: customer?.id,
          hasIssues: data.issues.length > 0,
          reviewNotes: data.issues.join('; ')
        }
      })

      // Update call record status
      await prisma.callRecord.update({
        where: { id: callRecordId },
        data: {
          status: data.hasAppointment ? 'COMPLETED' : 'NO_APPOINTMENT',
          appointmentData: data.rawExtraction
        }
      })

      console.log(`✅ Appointment extraction stored for call ${callRecord.callSid}`)
      
      // Send notification about extraction
      try {
        const { NotificationHelpers } = await import('./notifications')
        await NotificationHelpers.appointmentExtracted(
          callRecord.userId,
          data.customerName || 'Unknown Customer',
          data.serviceType || 'Service Request',
          data.confidence
        )
      } catch (error) {
        console.error('Failed to send extraction notification:', error)
      }
      
      // Auto-create job if appointment was detected and confidence is high enough
      if (data.hasAppointment && data.confidence >= 0.6) {
        console.log(`🚀 Auto-creating job (confidence: ${(data.confidence * 100).toFixed(1)}%)`)
        
        try {
          // Import job creation dynamically to avoid circular dependencies
          const { createJobFromExtraction } = await import('./job-creation')
          const jobResult = await createJobFromExtraction(extractedAppointment.id)
          
          if (jobResult.success) {
            console.log(`✅ Job created successfully: ${jobResult.jobId}`)
          } else {
            console.log(`⚠️ Job creation failed: ${jobResult.error}`)
          }
        } catch (error) {
          console.error('❌ Auto job creation failed:', error)
        }
      } else if (data.hasAppointment) {
        console.log(`⏳ Job not auto-created (confidence: ${(data.confidence * 100).toFixed(1)}% < 60%)`)
        console.log(`   Manual review recommended`)
      }
      
      return result

    } else {
      throw new Error(result.error || 'Extraction failed')
    }

  } catch (error) {
    console.error(`❌ Appointment extraction failed (attempt ${retryCount + 1}):`, error)

    // Retry logic
    if (retryCount < maxRetries) {
      console.log(`🔄 Retrying extraction (${retryCount + 1}/${maxRetries})...`)
      
      // Exponential backoff
      const delay = Math.pow(2, retryCount) * 2000
      await new Promise(resolve => setTimeout(resolve, delay))
      
      return processAppointmentExtraction(callRecordId, retryCount + 1)
    }

    // Mark extraction as failed
    await prisma.extractedAppointment.upsert({
      where: { callRecordId },
      update: {
        confidenceScore: 0,
        hasIssues: true,
        reviewNotes: `EXTRACTION FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`
      },
      create: {
        callRecordId,
        userId: (await prisma.callRecord.findUnique({ where: { id: callRecordId } }))?.userId || '',
        confidenceScore: 0,
        hasIssues: true,
        reviewNotes: `EXTRACTION FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`,
        extractionModel: 'gpt-4'
      }
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Appointment extraction failed'
    }
  }
}

/**
 * Get extraction for call record
 */
export async function getAppointmentExtraction(callRecordId: string) {
  try {
    const extraction = await prisma.extractedAppointment.findUnique({
      where: { callRecordId },
      include: {
        callRecord: {
          select: {
            callSid: true,
            phoneNumber: true,
            duration: true,
            createdAt: true
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        }
      }
    })

    return extraction
  } catch (error) {
    console.error('Error getting appointment extraction:', error)
    return null
  }
}

/**
 * Get extraction statistics for user
 */
export async function getExtractionStats(userId: string) {
  try {
    const stats = await prisma.extractedAppointment.aggregate({
      where: { userId },
      _count: { id: true },
      _avg: {
        confidenceScore: true,
        processingTime: true,
        addressConfidence: true
      }
    })

    const statusCounts = await prisma.extractedAppointment.groupBy({
      by: ['hasIssues'],
      where: { userId },
      _count: { id: true }
    })

    const urgencyLevels = await prisma.extractedAppointment.groupBy({
      by: ['urgencyLevel'],
      where: { userId },
      _count: { id: true }
    })

    return {
      total: stats._count.id,
      averageConfidence: stats._avg.confidenceScore,
      averageProcessingTime: stats._avg.processingTime,
      averageAddressConfidence: stats._avg.addressConfidence,
      statusBreakdown: statusCounts,
      urgencyBreakdown: urgencyLevels
    }
  } catch (error) {
    console.error('Error getting extraction stats:', error)
    return null
  }
}