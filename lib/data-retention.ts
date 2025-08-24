import { prisma } from '@/lib/prisma'
import { auditLogger } from './audit-logging'
import { privacyComplianceManager } from './privacy-compliance'
import { dataEncryption } from './encryption'

export interface RetentionPolicy {
  id: string
  name: string
  description: string
  dataCategory: string
  retentionPeriod: number // in days
  gracePeriod: number // days before hard deletion
  legalBasis: string
  isActive: boolean
  createdAt: Date
  lastModified: Date
}

export interface ScheduledDeletion {
  id: string
  policyId: string
  recordType: string
  recordId: string
  scheduledFor: Date
  gracePeriodEnds: Date
  status: 'scheduled' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
  reason?: string
  executedAt?: Date
  error?: string
}

export interface RetentionReport {
  generatedAt: Date
  period: { start: Date; end: Date }
  policiesApplied: {
    policyId: string
    recordsProcessed: number
    recordsDeleted: number
    recordsArchived: number
    errors: number
  }[]
  storageFreed: number // in bytes
  complianceStatus: {
    gdprCompliant: boolean
    ccpaCompliant: boolean
    issues: string[]
  }
  recommendations: string[]
}

export class DataRetentionManager {
  private static instance: DataRetentionManager
  
  private readonly DEFAULT_POLICIES: RetentionPolicy[] = [
    {
      id: 'call_records',
      name: 'Call Records Retention',
      description: 'Voice call recordings and transcriptions',
      dataCategory: 'call_data',
      retentionPeriod: 2555, // 7 years for business records
      gracePeriod: 30, // 30 days grace period
      legalBasis: 'Contract performance and legal obligations',
      isActive: true,
      createdAt: new Date(),
      lastModified: new Date()
    },
    {
      id: 'customer_data',
      name: 'Customer Personal Data',
      description: 'Customer contact information and preferences',
      dataCategory: 'personal_data',
      retentionPeriod: 2555, // 7 years for business records
      gracePeriod: 90, // 90 days grace period for customer data
      legalBasis: 'Contract performance',
      isActive: true,
      createdAt: new Date(),
      lastModified: new Date()
    },
    {
      id: 'job_records',
      name: 'Job and Service Records',
      description: 'Service appointments and job completion records',
      dataCategory: 'business_records',
      retentionPeriod: 2555, // 7 years for business records
      gracePeriod: 60, // 60 days grace period
      legalBasis: 'Contract performance and warranty obligations',
      isActive: true,
      createdAt: new Date(),
      lastModified: new Date()
    },
    {
      id: 'financial_records',
      name: 'Financial and Billing Records',
      description: 'Invoices, payments, and financial transactions',
      dataCategory: 'financial_data',
      retentionPeriod: 2555, // 7 years for tax purposes
      gracePeriod: 30, // 30 days grace period
      legalBasis: 'Legal obligation (tax and accounting)',
      isActive: true,
      createdAt: new Date(),
      lastModified: new Date()
    },
    {
      id: 'audit_logs',
      name: 'Audit and Security Logs',
      description: 'System access logs and security events',
      dataCategory: 'log_data',
      retentionPeriod: 1095, // 3 years for security logs
      gracePeriod: 30, // 30 days grace period
      legalBasis: 'Legal obligation (security and compliance)',
      isActive: true,
      createdAt: new Date(),
      lastModified: new Date()
    },
    {
      id: 'marketing_data',
      name: 'Marketing and Analytics Data',
      description: 'Marketing preferences and analytics data',
      dataCategory: 'marketing_data',
      retentionPeriod: 1095, // 3 years for marketing data
      gracePeriod: 30, // 30 days grace period
      legalBasis: 'Consent and legitimate interests',
      isActive: true,
      createdAt: new Date(),
      lastModified: new Date()
    },
    {
      id: 'temp_processing',
      name: 'Temporary Processing Data',
      description: 'Temporary files and processing artifacts',
      dataCategory: 'temporary_data',
      retentionPeriod: 30, // 30 days for temp data
      gracePeriod: 7, // 7 days grace period
      legalBasis: 'Technical necessity',
      isActive: true,
      createdAt: new Date(),
      lastModified: new Date()
    }
  ]

  constructor() {
    if (DataRetentionManager.instance) {
      return DataRetentionManager.instance
    }

    this.startAutomatedRetention()
    DataRetentionManager.instance = this
    console.log('🗂️ Data Retention Manager initialized')
  }

  // Evaluate records for retention policy application
  async evaluateRetention(): Promise<{
    recordsEvaluated: number
    recordsScheduledForDeletion: number
    errors: string[]
  }> {
    console.log('🔍 Evaluating records for retention policies...')

    let recordsEvaluated = 0
    let recordsScheduledForDeletion = 0
    const errors: string[] = []

    try {
      for (const policy of this.DEFAULT_POLICIES) {
        if (!policy.isActive) continue

        const evaluationResult = await this.evaluatePolicy(policy)
        recordsEvaluated += evaluationResult.evaluated
        recordsScheduledForDeletion += evaluationResult.scheduled

        if (evaluationResult.errors.length > 0) {
          errors.push(...evaluationResult.errors)
        }
      }

      await auditLogger.logSystemEvent(
        'retention_evaluation',
        'data_retention',
        {
          recordsEvaluated,
          recordsScheduledForDeletion,
          policiesApplied: this.DEFAULT_POLICIES.length,
          errors: errors.length
        },
        errors.length === 0,
        'low'
      )

      return { recordsEvaluated, recordsScheduledForDeletion, errors }
    } catch (error) {
      console.error('❌ Retention evaluation failed:', error)
      throw new Error('Retention evaluation process failed')
    }
  }

  // Execute scheduled deletions
  async executeScheduledDeletions(): Promise<{
    deletionsExecuted: number
    deletionsFailed: number
    storageFreed: number
  }> {
    console.log('🗑️ Executing scheduled deletions...')

    let deletionsExecuted = 0
    let deletionsFailed = 0
    let storageFreed = 0

    try {
      // Get scheduled deletions that are due
      const dueDeletions = await this.getDueDeletions()
      
      for (const deletion of dueDeletions) {
        try {
          const result = await this.executeIndividualDeletion(deletion)
          if (result.success) {
            deletionsExecuted++
            storageFreed += result.bytesFreed
          } else {
            deletionsFailed++
          }
        } catch (error) {
          console.error(`❌ Failed to execute deletion ${deletion.id}:`, error)
          deletionsFailed++
          
          await this.updateDeletionStatus(deletion.id, 'failed', error instanceof Error ? error.message : 'Unknown error')
        }
      }

      await auditLogger.logSystemEvent(
        'scheduled_deletions_executed',
        'data_retention',
        {
          deletionsExecuted,
          deletionsFailed,
          storageFreed,
          totalProcessed: dueDeletions.length
        },
        deletionsFailed === 0,
        'medium'
      )

      return { deletionsExecuted, deletionsFailed, storageFreed }
    } catch (error) {
      console.error('❌ Scheduled deletions execution failed:', error)
      throw new Error('Scheduled deletions execution failed')
    }
  }

  // Anonymize data instead of deletion (GDPR compliant)
  async anonymizeExpiredData(
    recordType: string,
    recordIds: string[],
    anonymizationRules: Record<string, 'hash' | 'remove' | 'pseudonymize' | 'generalize'>
  ): Promise<{
    recordsAnonymized: number
    fieldsProcessed: number
    errors: string[]
  }> {
    console.log(`🎭 Anonymizing ${recordIds.length} ${recordType} records...`)

    let recordsAnonymized = 0
    let fieldsProcessed = 0
    const errors: string[] = []

    try {
      for (const recordId of recordIds) {
        try {
          const anonymizationResult = await this.anonymizeRecord(recordType, recordId, anonymizationRules)
          if (anonymizationResult.success) {
            recordsAnonymized++
            fieldsProcessed += anonymizationResult.fieldsProcessed
          } else {
            errors.push(`Failed to anonymize ${recordType}:${recordId}`)
          }
        } catch (error) {
          errors.push(`Error anonymizing ${recordType}:${recordId}: ${error}`)
        }
      }

      await auditLogger.logSystemEvent(
        'data_anonymization',
        'data_retention',
        {
          recordType,
          recordsAnonymized,
          fieldsProcessed,
          errors: errors.length,
          anonymizationRules
        },
        errors.length === 0,
        'medium'
      )

      return { recordsAnonymized, fieldsProcessed, errors }
    } catch (error) {
      console.error('❌ Data anonymization failed:', error)
      throw new Error('Data anonymization process failed')
    }
  }

  // Archive old data to cold storage
  async archiveOldData(
    archivePolicy: {
      dataCategory: string
      archiveAfterDays: number
      compressionLevel: number
      encryptArchive: boolean
    }
  ): Promise<{
    recordsArchived: number
    storageUsed: number
    compressionRatio: number
  }> {
    console.log(`📦 Archiving old data for category: ${archivePolicy.dataCategory}`)

    let recordsArchived = 0
    let storageUsed = 0

    try {
      const recordsToArchive = await this.getRecordsForArchival(archivePolicy)
      
      for (const record of recordsToArchive) {
        const archiveResult = await this.archiveRecord(record, archivePolicy)
        if (archiveResult.success) {
          recordsArchived++
          storageUsed += archiveResult.archiveSize
        }
      }

      const compressionRatio = recordsArchived > 0 ? 0.3 : 1.0 // Mock compression ratio

      await auditLogger.logSystemEvent(
        'data_archival',
        'data_retention',
        {
          dataCategory: archivePolicy.dataCategory,
          recordsArchived,
          storageUsed,
          compressionRatio,
          encrypted: archivePolicy.encryptArchive
        },
        true,
        'low'
      )

      return { recordsArchived, storageUsed, compressionRatio }
    } catch (error) {
      console.error('❌ Data archival failed:', error)
      throw new Error('Data archival process failed')
    }
  }

  // Generate retention compliance report
  async generateRetentionReport(
    startDate: Date,
    endDate: Date
  ): Promise<RetentionReport> {
    console.log(`📊 Generating retention report: ${startDate.toISOString()} to ${endDate.toISOString()}`)

    try {
      const policiesApplied = await this.getRetentionStats(startDate, endDate)
      const storageFreed = policiesApplied.reduce((total, policy) => 
        total + (policy.recordsDeleted * 1024), 0) // Mock calculation

      // Compliance assessment
      const complianceStatus = {
        gdprCompliant: true,
        ccpaCompliant: true,
        issues: [] as string[]
      }

      // Check for compliance issues
      for (const policy of this.DEFAULT_POLICIES) {
        if (policy.retentionPeriod > 2555 && policy.dataCategory === 'personal_data') {
          complianceStatus.gdprCompliant = false
          complianceStatus.issues.push(`Policy ${policy.name} may exceed GDPR retention limits`)
        }
      }

      const recommendations = this.generateRetentionRecommendations(policiesApplied)

      return {
        generatedAt: new Date(),
        period: { start: startDate, end: endDate },
        policiesApplied,
        storageFreed,
        complianceStatus,
        recommendations
      }
    } catch (error) {
      console.error('❌ Retention report generation failed:', error)
      throw new Error('Retention report generation failed')
    }
  }

  // Cancel scheduled deletion (e.g., due to legal hold)
  async cancelScheduledDeletion(
    deletionId: string,
    reason: string,
    cancelledBy: string
  ): Promise<boolean> {
    try {
      await this.updateDeletionStatus(deletionId, 'cancelled', reason)

      await auditLogger.log({
        userId: cancelledBy,
        action: 'deletion_cancelled',
        resource: 'scheduled_deletion',
        resourceId: deletionId,
        details: { reason },
        success: true,
        severity: 'medium'
      })

      console.log(`🚫 Cancelled scheduled deletion ${deletionId}: ${reason}`)
      return true
    } catch (error) {
      console.error('❌ Failed to cancel scheduled deletion:', error)
      return false
    }
  }

  // Set legal hold on data
  async setLegalHold(
    recordType: string,
    recordIds: string[],
    holdReason: string,
    setBy: string,
    expiryDate?: Date
  ): Promise<string> {
    const holdId = `hold_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.log(`⚖️ Setting legal hold ${holdId} on ${recordIds.length} ${recordType} records`)

    // Cancel any scheduled deletions for these records
    for (const recordId of recordIds) {
      await this.cancelScheduledDeletionsForRecord(recordType, recordId, `Legal hold: ${holdReason}`)
    }

    await auditLogger.log({
      userId: setBy,
      action: 'legal_hold_set',
      resource: 'legal_hold',
      resourceId: holdId,
      details: {
        recordType,
        recordCount: recordIds.length,
        holdReason,
        expiryDate: expiryDate?.toISOString()
      },
      success: true,
      severity: 'high'
    })

    return holdId
  }

  // Private helper methods
  private async evaluatePolicy(policy: RetentionPolicy): Promise<{
    evaluated: number
    scheduled: number
    errors: string[]
  }> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriod)

    let evaluated = 0
    let scheduled = 0
    const errors: string[] = []

    try {
      switch (policy.dataCategory) {
        case 'call_data':
          const expiredCalls = await this.getExpiredCallRecords(cutoffDate)
          evaluated = expiredCalls.length
          
          for (const call of expiredCalls) {
            await this.scheduleDeletion(policy.id, 'call_record', call.id)
            scheduled++
          }
          break

        case 'personal_data':
          const expiredCustomers = await this.getExpiredCustomerData(cutoffDate)
          evaluated = expiredCustomers.length
          
          for (const customer of expiredCustomers) {
            await this.scheduleDeletion(policy.id, 'customer', customer.id)
            scheduled++
          }
          break

        // Add other data categories...
        default:
          console.log(`⚠️ No evaluation handler for category: ${policy.dataCategory}`)
      }
    } catch (error) {
      errors.push(`Policy ${policy.id}: ${error}`)
    }

    return { evaluated, scheduled, errors }
  }

  private async getDueDeletions(): Promise<ScheduledDeletion[]> {
    const now = new Date()
    
    // Mock implementation - in reality, query database
    return [
      {
        id: 'del_1',
        policyId: 'call_records',
        recordType: 'call_record',
        recordId: 'call_123',
        scheduledFor: new Date(now.getTime() - 1000),
        gracePeriodEnds: new Date(now.getTime() + 1000),
        status: 'scheduled'
      }
    ]
  }

  private async executeIndividualDeletion(deletion: ScheduledDeletion): Promise<{
    success: boolean
    bytesFreed: number
    error?: string
  }> {
    try {
      await this.updateDeletionStatus(deletion.id, 'in_progress')

      // Perform actual deletion based on record type
      let bytesFreed = 0

      switch (deletion.recordType) {
        case 'call_record':
          bytesFreed = await this.deleteCallRecord(deletion.recordId)
          break
        case 'customer':
          bytesFreed = await this.deleteCustomerData(deletion.recordId)
          break
        default:
          throw new Error(`Unknown record type: ${deletion.recordType}`)
      }

      await this.updateDeletionStatus(deletion.id, 'completed')

      await auditLogger.logSystemEvent(
        'record_deleted',
        deletion.recordType,
        {
          recordId: deletion.recordId,
          policyId: deletion.policyId,
          bytesFreed
        },
        true,
        'medium'
      )

      return { success: true, bytesFreed }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, bytesFreed: 0, error: errorMessage }
    }
  }

  private async anonymizeRecord(
    recordType: string,
    recordId: string,
    rules: Record<string, 'hash' | 'remove' | 'pseudonymize' | 'generalize'>
  ): Promise<{
    success: boolean
    fieldsProcessed: number
  }> {
    let fieldsProcessed = 0

    try {
      for (const [field, action] of Object.entries(rules)) {
        switch (action) {
          case 'hash':
            // Replace with irreversible hash
            const hash = dataEncryption.hashData(`${recordId}:${field}`)
            fieldsProcessed++
            break
          case 'remove':
            // Remove field entirely
            fieldsProcessed++
            break
          case 'pseudonymize':
            // Replace with pseudonym
            const pseudonym = `anon_${dataEncryption.generateSecureToken(8)}`
            fieldsProcessed++
            break
          case 'generalize':
            // Generalize data (e.g., exact age -> age range)
            fieldsProcessed++
            break
        }
      }

      return { success: true, fieldsProcessed }
    } catch (error) {
      console.error(`Failed to anonymize ${recordType}:${recordId}:`, error)
      return { success: false, fieldsProcessed }
    }
  }

  private async getExpiredCallRecords(cutoffDate: Date): Promise<any[]> {
    // Mock implementation
    return []
  }

  private async getExpiredCustomerData(cutoffDate: Date): Promise<any[]> {
    // Mock implementation
    return []
  }

  private async scheduleDeletion(
    policyId: string,
    recordType: string,
    recordId: string
  ): Promise<void> {
    const policy = this.DEFAULT_POLICIES.find(p => p.id === policyId)
    if (!policy) return

    const scheduledFor = new Date()
    scheduledFor.setDate(scheduledFor.getDate() + policy.gracePeriod)

    const gracePeriodEnds = new Date(scheduledFor)
    gracePeriodEnds.setDate(gracePeriodEnds.getDate() + policy.gracePeriod)

    // In reality, store in database
    console.log(`📅 Scheduled deletion: ${recordType}:${recordId} on ${scheduledFor.toISOString()}`)
  }

  private async updateDeletionStatus(
    deletionId: string,
    status: ScheduledDeletion['status'],
    error?: string
  ): Promise<void> {
    // Mock implementation
    console.log(`📝 Updated deletion ${deletionId} status: ${status}`)
  }

  private async deleteCallRecord(recordId: string): Promise<number> {
    // Mock deletion - return bytes freed
    return 1024 * 50 // 50KB
  }

  private async deleteCustomerData(recordId: string): Promise<number> {
    // Mock deletion - return bytes freed
    return 1024 * 10 // 10KB
  }

  private async getRecordsForArchival(policy: any): Promise<any[]> {
    // Mock implementation
    return []
  }

  private async archiveRecord(record: any, policy: any): Promise<{
    success: boolean
    archiveSize: number
  }> {
    // Mock archival
    return { success: true, archiveSize: 1024 }
  }

  private async getRetentionStats(startDate: Date, endDate: Date): Promise<any[]> {
    // Mock statistics
    return this.DEFAULT_POLICIES.map(policy => ({
      policyId: policy.id,
      recordsProcessed: Math.floor(Math.random() * 100),
      recordsDeleted: Math.floor(Math.random() * 50),
      recordsArchived: Math.floor(Math.random() * 30),
      errors: Math.floor(Math.random() * 5)
    }))
  }

  private generateRetentionRecommendations(stats: any[]): string[] {
    const recommendations = []
    
    const totalErrors = stats.reduce((sum, stat) => sum + stat.errors, 0)
    if (totalErrors > 10) {
      recommendations.push('High error rate in retention processing - review and optimize policies')
    }

    const lowProcessingPolicies = stats.filter(stat => stat.recordsProcessed < 10)
    if (lowProcessingPolicies.length > 0) {
      recommendations.push('Some policies are processing very few records - consider policy optimization')
    }

    recommendations.push('Regular review of retention policies is recommended every 6 months')
    
    return recommendations
  }

  private async cancelScheduledDeletionsForRecord(
    recordType: string,
    recordId: string,
    reason: string
  ): Promise<void> {
    // Mock implementation
    console.log(`🚫 Cancelled scheduled deletions for ${recordType}:${recordId} - ${reason}`)
  }

  private startAutomatedRetention(): void {
    console.log('⏰ Starting automated retention processes...')

    // Daily retention evaluation at 2 AM
    const scheduleDaily = () => {
      const now = new Date()
      const tomorrow2AM = new Date(now)
      tomorrow2AM.setDate(tomorrow2AM.getDate() + 1)
      tomorrow2AM.setHours(2, 0, 0, 0)

      const msUntil2AM = tomorrow2AM.getTime() - now.getTime()

      setTimeout(async () => {
        try {
          await this.evaluateRetention()
          await this.executeScheduledDeletions()
          
          // Schedule next run
          setInterval(async () => {
            await this.evaluateRetention()
            await this.executeScheduledDeletions()
          }, 24 * 60 * 60 * 1000) // Every 24 hours
        } catch (error) {
          console.error('❌ Automated retention process failed:', error)
        }
      }, msUntil2AM)
    }

    scheduleDaily()
  }
}

export const dataRetentionManager = new DataRetentionManager()

// Utility functions
export const evaluateRetention = dataRetentionManager.evaluateRetention.bind(dataRetentionManager)
export const executeScheduledDeletions = dataRetentionManager.executeScheduledDeletions.bind(dataRetentionManager)
export const generateRetentionReport = dataRetentionManager.generateRetentionReport.bind(dataRetentionManager)
export const setLegalHold = dataRetentionManager.setLegalHold.bind(dataRetentionManager)