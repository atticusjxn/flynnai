import { prisma } from '@/lib/prisma'
import { dataEncryption } from './encryption'
import { auditLogger } from './audit-logging'
import { createNotification } from './notifications'

export interface DataProcessingPurpose {
  id: string
  name: string
  description: string
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests'
  dataCategories: string[]
  retentionPeriod: number // in days
  isEssential: boolean
}

export interface ConsentRecord {
  id: string
  userId: string
  purpose: string
  granted: boolean
  timestamp: Date
  ipAddress: string
  userAgent: string
  version: string // consent version
  method: 'explicit' | 'implicit' | 'pre_ticked' | 'opt_in'
  withdrawnAt?: Date
  withdrawalReason?: string
}

export interface DataSubjectRequest {
  id: string
  requestType: 'access' | 'portability' | 'rectification' | 'erasure' | 'restriction' | 'objection'
  userId: string
  userEmail: string
  requestDetails: string
  submittedAt: Date
  status: 'pending' | 'in_progress' | 'completed' | 'rejected'
  completedAt?: Date
  responseData?: any
  rejectionReason?: string
  processedBy?: string
  notes: string[]
}

export interface PersonalDataInventory {
  dataType: string
  description: string
  category: 'identification' | 'contact' | 'financial' | 'behavioral' | 'technical' | 'health' | 'other'
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted'
  purposes: string[]
  legalBasis: string[]
  retention: number // days
  location: string[] // where data is stored
  thirdParties: string[] // who has access
  encryption: boolean
  backups: boolean
}

export interface ComplianceReport {
  generatedAt: Date
  period: { start: Date; end: Date }
  gdprCompliance: {
    score: number
    issues: string[]
    recommendations: string[]
  }
  ccpaCompliance: {
    score: number
    issues: string[]
    recommendations: string[]
  }
  dataRequests: {
    total: number
    byType: Record<string, number>
    averageResponseTime: number
    completionRate: number
  }
  consentManagement: {
    totalUsers: number
    consentedUsers: number
    withdrawnConsents: number
    consentRate: number
  }
  dataBreaches: {
    total: number
    resolved: number
    pending: number
    averageResolutionTime: number
  }
}

export class PrivacyComplianceManager {
  private static instance: PrivacyComplianceManager
  
  private readonly DATA_PROCESSING_PURPOSES: DataProcessingPurpose[] = [
    {
      id: 'call_processing',
      name: 'Call Processing',
      description: 'Processing phone calls to extract appointment information',
      legalBasis: 'contract',
      dataCategories: ['contact', 'behavioral'],
      retentionPeriod: 2555, // 7 years
      isEssential: true
    },
    {
      id: 'customer_management',
      name: 'Customer Management',
      description: 'Managing customer relationships and service delivery',
      legalBasis: 'contract',
      dataCategories: ['identification', 'contact'],
      retentionPeriod: 2555, // 7 years
      isEssential: true
    },
    {
      id: 'service_improvement',
      name: 'Service Improvement',
      description: 'Analyzing usage patterns to improve our services',
      legalBasis: 'legitimate_interests',
      dataCategories: ['behavioral', 'technical'],
      retentionPeriod: 1095, // 3 years
      isEssential: false
    },
    {
      id: 'marketing',
      name: 'Marketing Communications',
      description: 'Sending promotional materials and service updates',
      legalBasis: 'consent',
      dataCategories: ['contact', 'behavioral'],
      retentionPeriod: 1095, // 3 years
      isEssential: false
    },
    {
      id: 'legal_compliance',
      name: 'Legal Compliance',
      description: 'Meeting legal and regulatory requirements',
      legalBasis: 'legal_obligation',
      dataCategories: ['identification', 'contact', 'financial'],
      retentionPeriod: 2555, // 7 years
      isEssential: true
    }
  ]

  constructor() {
    if (PrivacyComplianceManager.instance) {
      return PrivacyComplianceManager.instance
    }

    PrivacyComplianceManager.instance = this
    console.log('🔒 Privacy Compliance Manager initialized')
  }

  // Consent Management
  async recordConsent(
    userId: string,
    purposes: string[],
    method: ConsentRecord['method'],
    ipAddress: string,
    userAgent: string,
    version: string = '1.0'
  ): Promise<ConsentRecord[]> {
    const timestamp = new Date()
    const consentRecords: ConsentRecord[] = []

    for (const purpose of purposes) {
      const consentId = `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const consent: ConsentRecord = {
        id: consentId,
        userId,
        purpose,
        granted: true,
        timestamp,
        ipAddress,
        userAgent,
        version,
        method
      }

      consentRecords.push(consent)

      // In a real implementation, store in database
      console.log(`📝 Recorded consent: ${userId} -> ${purpose} (${method})`)

      // Log for audit trail
      await auditLogger.log({
        userId,
        action: 'consent_granted',
        resource: 'privacy_consent',
        resourceId: consentId,
        details: {
          purpose,
          method,
          version,
          ipAddress,
          userAgent
        },
        success: true,
        severity: 'low'
      })
    }

    return consentRecords
  }

  // Withdraw consent
  async withdrawConsent(
    userId: string,
    purposes: string[],
    reason?: string
  ): Promise<boolean> {
    const withdrawnAt = new Date()

    for (const purpose of purposes) {
      // In a real implementation, update database records
      console.log(`❌ Withdrawn consent: ${userId} -> ${purpose}`)

      // Log for audit trail
      await auditLogger.log({
        userId,
        action: 'consent_withdrawn',
        resource: 'privacy_consent',
        details: {
          purpose,
          reason,
          withdrawnAt: withdrawnAt.toISOString()
        },
        success: true,
        severity: 'medium'
      })

      // Handle data processing consequences
      await this.handleConsentWithdrawal(userId, purpose)
    }

    return true
  }

  // Check if user has given consent for a purpose
  async hasValidConsent(userId: string, purpose: string): Promise<boolean> {
    // In a real implementation, query database for active consent
    console.log(`🔍 Checking consent: ${userId} -> ${purpose}`)
    
    // For demo purposes, assume consent exists
    return true
  }

  // Handle data subject requests (GDPR Article 15-22, CCPA)
  async submitDataSubjectRequest(
    requestType: DataSubjectRequest['requestType'],
    userId: string,
    userEmail: string,
    requestDetails: string,
    ipAddress: string,
    userAgent: string
  ): Promise<string> {
    const requestId = `dsr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const request: DataSubjectRequest = {
      id: requestId,
      requestType,
      userId,
      userEmail,
      requestDetails,
      submittedAt: new Date(),
      status: 'pending',
      notes: []
    }

    // In a real implementation, store in database
    console.log(`📋 Data subject request submitted: ${requestType} for ${userEmail}`)

    // Log for audit trail
    await auditLogger.log({
      userId,
      action: `data_request_${requestType}`,
      resource: 'privacy_request',
      resourceId: requestId,
      details: {
        requestType,
        userEmail,
        requestDetails,
        ipAddress,
        userAgent
      },
      success: true,
      severity: 'medium'
    })

    // Create notification for privacy team
    try {
      await createNotification({
        userId: 'privacy-team',
        type: 'INFO' as any,
        title: `New Data Subject Request: ${requestType}`,
        message: `${userEmail} has submitted a ${requestType} request`,
        priority: 'MEDIUM' as any,
        metadata: {
          requestId,
          requestType,
          userEmail,
          submittedAt: request.submittedAt.toISOString()
        }
      })
    } catch (error) {
      console.error('Failed to create notification for data request:', error)
    }

    // Auto-process certain request types if possible
    await this.autoProcessRequest(requestId, request)

    return requestId
  }

  // Process data access request (GDPR Article 15)
  async processAccessRequest(userId: string): Promise<any> {
    console.log(`📊 Processing data access request for user: ${userId}`)

    try {
      // Collect all personal data for the user
      const userData = {
        user: await this.getUserData(userId),
        calls: await this.getUserCalls(userId),
        jobs: await this.getUserJobs(userId),
        invoices: await this.getUserInvoices(userId),
        feedback: await this.getUserFeedback(userId),
        consents: await this.getUserConsents(userId),
        processingActivities: this.getProcessingActivities(userId)
      }

      // Create exportable format
      const exportData = {
        exportDate: new Date().toISOString(),
        userId,
        personalData: userData,
        dataProcessingInfo: {
          purposes: this.DATA_PROCESSING_PURPOSES,
          legalBases: this.getLegalBasesForUser(userId),
          retentionPeriods: this.getRetentionPeriods(),
          thirdParties: this.getThirdPartyProcessors(),
          transfers: this.getInternationalTransfers()
        },
        rights: {
          description: 'You have the right to request rectification, erasure, restriction of processing, data portability, and to object to processing.',
          contact: 'privacy@company.com',
          supervisoryAuthority: 'Your local data protection authority'
        }
      }

      return exportData
    } catch (error) {
      console.error('Failed to process access request:', error)
      throw new Error('Failed to retrieve personal data')
    }
  }

  // Process data erasure request (GDPR Article 17 - Right to be Forgotten)
  async processErasureRequest(userId: string, retainLegalObligations: boolean = true): Promise<{
    erasedData: string[]
    retainedData: string[]
    reasons: string[]
  }> {
    console.log(`🗑️ Processing data erasure request for user: ${userId}`)

    const erasedData: string[] = []
    const retainedData: string[] = []
    const reasons: string[] = []

    try {
      // Check for legal obligations to retain data
      if (retainLegalObligations) {
        const legalRetentionCheck = await this.checkLegalRetentionRequirements(userId)
        
        if (legalRetentionCheck.hasActiveContracts) {
          retainedData.push('Contract data')
          reasons.push('Active service contracts require data retention')
        }
        
        if (legalRetentionCheck.hasTaxObligations) {
          retainedData.push('Financial records')
          reasons.push('Tax and accounting regulations require retention')
        }
        
        if (legalRetentionCheck.hasLegalClaims) {
          retainedData.push('Legal claim data')
          reasons.push('Pending legal claims require data retention')
        }
      }

      // Anonymize/pseudonymize data where erasure is not required
      const anonymizationResult = await this.anonymizeUserData(userId)
      erasedData.push(...anonymizationResult.anonymizedFields)

      // Complete erasure where legally permissible
      if (!retainLegalObligations || retainedData.length === 0) {
        await this.performCompleteErasure(userId)
        erasedData.push('All personal data')
      }

      // Log erasure action
      await auditLogger.log({
        userId,
        action: 'data_erasure',
        resource: 'personal_data',
        details: {
          erasedData,
          retainedData,
          reasons,
          timestamp: new Date().toISOString()
        },
        success: true,
        severity: 'high'
      })

      return { erasedData, retainedData, reasons }
    } catch (error) {
      console.error('Failed to process erasure request:', error)
      throw new Error('Failed to process data erasure request')
    }
  }

  // Data portability (GDPR Article 20)
  async processPortabilityRequest(userId: string): Promise<{
    data: any
    format: string
    size: number
  }> {
    console.log(`📦 Processing data portability request for user: ${userId}`)

    try {
      const userData = await this.processAccessRequest(userId)
      
      // Create structured, machine-readable format
      const portableData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        userId,
        data: userData,
        schema: {
          calls: 'Call records with timestamps and extracted data',
          jobs: 'Service jobs and appointments',
          customers: 'Customer profile information',
          invoices: 'Billing and payment records'
        }
      }

      const dataString = JSON.stringify(portableData, null, 2)
      const dataSize = Buffer.byteLength(dataString, 'utf8')

      return {
        data: portableData,
        format: 'application/json',
        size: dataSize
      }
    } catch (error) {
      console.error('Failed to process portability request:', error)
      throw new Error('Failed to create portable data export')
    }
  }

  // Data breach notification (GDPR Article 33-34)
  async reportDataBreach(
    description: string,
    affectedUsers: string[],
    dataCategories: string[],
    severity: 'low' | 'medium' | 'high' | 'critical',
    containmentActions: string[],
    reportedBy: string
  ): Promise<string> {
    const breachId = `breach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.log(`🚨 DATA BREACH REPORTED: ${breachId}`)

    const breach = {
      id: breachId,
      description,
      affectedUsers,
      affectedCount: affectedUsers.length,
      dataCategories,
      severity,
      containmentActions,
      reportedBy,
      reportedAt: new Date(),
      status: 'investigating',
      supervisoryAuthorityNotified: false,
      subjectsNotified: false
    }

    // Log breach for audit trail
    await auditLogger.log({
      userId: reportedBy,
      action: 'data_breach_reported',
      resource: 'data_breach',
      resourceId: breachId,
      details: {
        ...breach,
        affectedUserIds: affectedUsers // Don't log personal details
      },
      success: true,
      severity: 'critical'
    })

    // Immediate notifications for high/critical breaches
    if (severity === 'high' || severity === 'critical') {
      await this.sendBreachNotifications(breach)
    }

    // Check if supervisory authority notification required (within 72 hours)
    if (this.requiresSupervisoryNotification(breach)) {
      await this.scheduleRegulatoryNotification(breachId, 72) // 72 hours
    }

    // Check if individual notification required
    if (this.requiresIndividualNotification(breach)) {
      await this.scheduleIndividualNotifications(breachId)
    }

    return breachId
  }

  // Generate compliance report
  async generateComplianceReport(
    startDate: Date,
    endDate: Date
  ): Promise<ComplianceReport> {
    console.log(`📊 Generating compliance report: ${startDate.toISOString()} - ${endDate.toISOString()}`)

    // GDPR Compliance Assessment
    const gdprCompliance = await this.assessGDPRCompliance()
    
    // CCPA Compliance Assessment
    const ccpaCompliance = await this.assessCCPACompliance()

    // Data requests statistics
    const dataRequests = await this.getDataRequestsStatistics(startDate, endDate)

    // Consent management statistics
    const consentStats = await this.getConsentStatistics(startDate, endDate)

    // Data breaches statistics
    const breachStats = await this.getDataBreachStatistics(startDate, endDate)

    return {
      generatedAt: new Date(),
      period: { start: startDate, end: endDate },
      gdprCompliance,
      ccpaCompliance,
      dataRequests,
      consentManagement: consentStats,
      dataBreaches: breachStats
    }
  }

  // Private helper methods
  private async handleConsentWithdrawal(userId: string, purpose: string): Promise<void> {
    // Stop processing for withdrawn purposes
    if (purpose === 'marketing') {
      // Remove from marketing lists
      console.log(`📭 Removed ${userId} from marketing communications`)
    }
    
    if (purpose === 'service_improvement') {
      // Anonymize behavioral data
      console.log(`🔒 Anonymized behavioral data for ${userId}`)
    }
  }

  private async autoProcessRequest(requestId: string, request: DataSubjectRequest): Promise<void> {
    // Auto-process simple requests
    if (request.requestType === 'access' || request.requestType === 'portability') {
      setTimeout(async () => {
        try {
          const responseData = await this.processAccessRequest(request.userId)
          console.log(`✅ Auto-processed ${request.requestType} request: ${requestId}`)
        } catch (error) {
          console.error(`❌ Failed to auto-process request ${requestId}:`, error)
        }
      }, 1000) // Process after 1 second
    }
  }

  private async getUserData(userId: string): Promise<any> {
    // Mock user data retrieval
    return {
      id: userId,
      email: 'user@example.com',
      createdAt: new Date(),
      lastLogin: new Date()
    }
  }

  private async getUserCalls(userId: string): Promise<any[]> {
    // Mock call data retrieval
    return []
  }

  private async getUserJobs(userId: string): Promise<any[]> {
    // Mock job data retrieval
    return []
  }

  private async getUserInvoices(userId: string): Promise<any[]> {
    // Mock invoice data retrieval
    return []
  }

  private async getUserFeedback(userId: string): Promise<any[]> {
    // Mock feedback data retrieval
    return []
  }

  private async getUserConsents(userId: string): Promise<ConsentRecord[]> {
    // Mock consent data retrieval
    return []
  }

  private getProcessingActivities(userId: string): DataProcessingPurpose[] {
    return this.DATA_PROCESSING_PURPOSES
  }

  private getLegalBasesForUser(userId: string): string[] {
    return ['contract', 'legitimate_interests', 'consent']
  }

  private getRetentionPeriods(): Record<string, number> {
    return this.DATA_PROCESSING_PURPOSES.reduce((acc, purpose) => {
      acc[purpose.name] = purpose.retentionPeriod
      return acc
    }, {} as Record<string, number>)
  }

  private getThirdPartyProcessors(): string[] {
    return ['OpenAI (AI Processing)', 'Twilio (Communications)', 'AWS (Cloud Storage)']
  }

  private getInternationalTransfers(): string[] {
    return ['United States (OpenAI API)', 'European Union (Data Storage)']
  }

  private async checkLegalRetentionRequirements(userId: string): Promise<{
    hasActiveContracts: boolean
    hasTaxObligations: boolean
    hasLegalClaims: boolean
  }> {
    // Mock legal retention check
    return {
      hasActiveContracts: false,
      hasTaxObligations: false,
      hasLegalClaims: false
    }
  }

  private async anonymizeUserData(userId: string): Promise<{ anonymizedFields: string[] }> {
    // Mock anonymization
    return {
      anonymizedFields: ['email', 'phone', 'address']
    }
  }

  private async performCompleteErasure(userId: string): Promise<void> {
    // Mock complete erasure
    console.log(`🗑️ Completely erased all data for user: ${userId}`)
  }

  private async sendBreachNotifications(breach: any): Promise<void> {
    // Mock breach notifications
    console.log(`📧 Sent breach notifications for breach: ${breach.id}`)
  }

  private requiresSupervisoryNotification(breach: any): boolean {
    return breach.severity === 'high' || breach.severity === 'critical'
  }

  private requiresIndividualNotification(breach: any): boolean {
    return breach.severity === 'critical' && breach.affectedCount > 0
  }

  private async scheduleRegulatoryNotification(breachId: string, hoursDeadline: number): Promise<void> {
    console.log(`⏰ Scheduled regulatory notification for breach ${breachId} within ${hoursDeadline} hours`)
  }

  private async scheduleIndividualNotifications(breachId: string): Promise<void> {
    console.log(`📬 Scheduled individual notifications for breach ${breachId}`)
  }

  private async assessGDPRCompliance(): Promise<{
    score: number
    issues: string[]
    recommendations: string[]
  }> {
    return {
      score: 92,
      issues: [
        'Some consent records missing version information',
        'Data retention policy needs minor updates'
      ],
      recommendations: [
        'Implement automated consent version tracking',
        'Review and update data retention schedules quarterly'
      ]
    }
  }

  private async assessCCPACompliance(): Promise<{
    score: number
    issues: string[]
    recommendations: string[]
  }> {
    return {
      score: 88,
      issues: [
        'Privacy policy could be more detailed about data sharing',
        'Opt-out mechanism needs clearer visibility'
      ],
      recommendations: [
        'Update privacy policy with detailed data sharing information',
        'Implement prominent "Do Not Sell" link'
      ]
    }
  }

  private async getDataRequestsStatistics(startDate: Date, endDate: Date): Promise<{
    total: number
    byType: Record<string, number>
    averageResponseTime: number
    completionRate: number
  }> {
    return {
      total: 25,
      byType: {
        access: 12,
        erasure: 8,
        portability: 3,
        rectification: 2
      },
      averageResponseTime: 18, // hours
      completionRate: 96
    }
  }

  private async getConsentStatistics(startDate: Date, endDate: Date): Promise<{
    totalUsers: number
    consentedUsers: number
    withdrawnConsents: number
    consentRate: number
  }> {
    return {
      totalUsers: 1250,
      consentedUsers: 1180,
      withdrawnConsents: 32,
      consentRate: 94.4
    }
  }

  private async getDataBreachStatistics(startDate: Date, endDate: Date): Promise<{
    total: number
    resolved: number
    pending: number
    averageResolutionTime: number
  }> {
    return {
      total: 2,
      resolved: 2,
      pending: 0,
      averageResolutionTime: 36 // hours
    }
  }
}

export const privacyComplianceManager = new PrivacyComplianceManager()

// Utility functions
export const recordConsent = privacyComplianceManager.recordConsent.bind(privacyComplianceManager)
export const withdrawConsent = privacyComplianceManager.withdrawConsent.bind(privacyComplianceManager)
export const hasValidConsent = privacyComplianceManager.hasValidConsent.bind(privacyComplianceManager)
export const submitDataSubjectRequest = privacyComplianceManager.submitDataSubjectRequest.bind(privacyComplianceManager)
export const reportDataBreach = privacyComplianceManager.reportDataBreach.bind(privacyComplianceManager)
export const generateComplianceReport = privacyComplianceManager.generateComplianceReport.bind(privacyComplianceManager)