export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  read: boolean
  priority: NotificationPriority
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
}

export enum NotificationType {
  CALL_RECEIVED = 'call_received',
  APPOINTMENT_EXTRACTED = 'appointment_extracted',
  JOB_CREATED = 'job_created',
  JOB_STATUS_CHANGED = 'job_status_changed',
  CUSTOMER_CREATED = 'customer_created',
  EXTRACTION_FAILED = 'extraction_failed',
  SYSTEM_ALERT = 'system_alert'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface NotificationPreferences {
  id: string
  userId: string
  
  // Real-time notifications
  enableRealTime: boolean
  enableSound: boolean
  
  // Email notifications
  enableEmail: boolean
  emailFrequency: 'instant' | 'hourly' | 'daily' | 'never'
  
  // Type-specific preferences
  callReceived: boolean
  appointmentExtracted: boolean
  jobCreated: boolean
  jobStatusChanged: boolean
  customerCreated: boolean
  extractionFailed: boolean
  
  // Calendar integration
  enableCalendar: boolean
  calendarProvider?: 'google' | 'outlook' | 'ics'
  
  createdAt: Date
  updatedAt: Date
}

// In-memory notification store for real-time delivery
class NotificationStore {
  private notifications = new Map<string, Notification[]>()
  private subscribers = new Map<string, Set<(notification: Notification) => void>>()

  subscribe(userId: string, callback: (notification: Notification) => void): () => void {
    if (!this.subscribers.has(userId)) {
      this.subscribers.set(userId, new Set())
    }
    
    this.subscribers.get(userId)!.add(callback)
    
    // Return unsubscribe function
    return () => {
      this.subscribers.get(userId)?.delete(callback)
      if (this.subscribers.get(userId)?.size === 0) {
        this.subscribers.delete(userId)
      }
    }
  }

  addNotification(notification: Notification): void {
    // Add to user's notification queue
    if (!this.notifications.has(notification.userId)) {
      this.notifications.set(notification.userId, [])
    }
    
    this.notifications.get(notification.userId)!.push(notification)
    
    // Notify subscribers
    const subscribers = this.subscribers.get(notification.userId)
    if (subscribers) {
      subscribers.forEach(callback => callback(notification))
    }
    
    // Clean up old notifications (keep last 100 per user)
    const userNotifications = this.notifications.get(notification.userId)!
    if (userNotifications.length > 100) {
      this.notifications.set(notification.userId, userNotifications.slice(-100))
    }
  }

  getNotifications(userId: string): Notification[] {
    return this.notifications.get(userId) || []
  }

  markAsRead(userId: string, notificationId: string): void {
    const userNotifications = this.notifications.get(userId)
    if (userNotifications) {
      const notification = userNotifications.find(n => n.id === notificationId)
      if (notification) {
        notification.read = true
      }
    }
  }

  clearNotifications(userId: string): void {
    this.notifications.delete(userId)
  }
}

export const notificationStore = new NotificationStore()

/**
 * Create and send notification
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  options: {
    data?: Record<string, any>
    priority?: NotificationPriority
    expiresAt?: Date
  } = {}
): Promise<string> {
  const notification: Notification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    type,
    title,
    message,
    data: options.data,
    read: false,
    priority: options.priority || NotificationPriority.NORMAL,
    expiresAt: options.expiresAt,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  // Store notification in database
  try {
    const { prisma } = await import('./prisma')
    
    await prisma.notification.create({
      data: {
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data as any,
        priority: notification.priority,
        expiresAt: notification.expiresAt
      }
    })
  } catch (error) {
    console.error('Failed to store notification in database:', error)
    // Continue with in-memory notification even if DB fails
  }

  // Add to real-time store
  notificationStore.addNotification(notification)

  // Send email if enabled
  try {
    await sendEmailNotification(userId, notification)
  } catch (error) {
    console.error('Failed to send email notification:', error)
  }

  console.log(`📢 Notification sent: ${title} (${type}) to user ${userId}`)
  
  return notification.id
}

/**
 * Send email notification if user has it enabled
 */
async function sendEmailNotification(userId: string, notification: Notification): Promise<void> {
  try {
    const { prisma } = await import('./prisma')
    
    // Get user preferences
    const preferences = await prisma.notificationPreferences.findUnique({
      where: { userId }
    })

    if (!preferences?.enableEmail || preferences.emailFrequency === 'never') {
      return
    }

    // Get user email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true }
    })

    if (!user?.email) {
      return
    }

    // Check if we should send based on frequency
    if (preferences.emailFrequency !== 'instant') {
      // TODO: Implement batching for hourly/daily emails
      return
    }

    // Send email using Resend
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const priorityEmoji = {
      [NotificationPriority.LOW]: '📝',
      [NotificationPriority.NORMAL]: '📋',
      [NotificationPriority.HIGH]: '⚠️',
      [NotificationPriority.URGENT]: '🚨'
    }

    await resend.emails.send({
      from: 'Flynn AI <notifications@flynnai.com>',
      to: [user.email],
      subject: `${priorityEmoji[notification.priority]} ${notification.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #2563eb; margin: 0 0 10px 0;">
              ${priorityEmoji[notification.priority]} ${notification.title}
            </h2>
            <p style="color: #6b7280; margin: 0;">
              ${new Date().toLocaleString()}
            </p>
          </div>
          
          <div style="padding: 0 20px;">
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              ${notification.message}
            </p>
            
            ${notification.data ? `
              <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0; color: #374151;">Details:</h4>
                <pre style="margin: 0; font-size: 12px; color: #6b7280; white-space: pre-wrap;">${JSON.stringify(notification.data, null, 2)}</pre>
              </div>
            ` : ''}
          </div>
          
          <div style="text-align: center; padding: 20px; border-top: 1px solid #e5e7eb; margin-top: 30px;">
            <p style="color: #9ca3af; font-size: 14px; margin: 0;">
              This notification was sent by Flynn AI Phone Integration
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 5px 0 0 0;">
              You can manage your notification preferences in your account settings
            </p>
          </div>
        </div>
      `
    })

    console.log(`📧 Email notification sent to ${user.email}`)

  } catch (error) {
    console.error('Failed to send email notification:', error)
    throw error
  }
}

/**
 * Create notification shortcuts for common events
 */
export const NotificationHelpers = {
  async callReceived(userId: string, phoneNumber: string, callSid: string) {
    return await createNotification(
      userId,
      NotificationType.CALL_RECEIVED,
      'New Call Received',
      `Incoming call from ${phoneNumber}`,
      {
        data: { phoneNumber, callSid },
        priority: NotificationPriority.HIGH
      }
    )
  },

  async appointmentExtracted(userId: string, customerName: string, serviceType: string, confidence: number) {
    return await createNotification(
      userId,
      NotificationType.APPOINTMENT_EXTRACTED,
      'Appointment Extracted',
      `New appointment detected: ${serviceType} for ${customerName} (${Math.round(confidence)}% confidence)`,
      {
        data: { customerName, serviceType, confidence },
        priority: confidence > 80 ? NotificationPriority.HIGH : NotificationPriority.NORMAL
      }
    )
  },

  async jobCreated(userId: string, jobTitle: string, customerName: string, estimatedCost?: number) {
    return await createNotification(
      userId,
      NotificationType.JOB_CREATED,
      'New Job Created',
      `Job "${jobTitle}" created for ${customerName}${estimatedCost ? ` ($${estimatedCost})` : ''}`,
      {
        data: { jobTitle, customerName, estimatedCost },
        priority: NotificationPriority.NORMAL
      }
    )
  },

  async jobStatusChanged(userId: string, jobTitle: string, oldStatus: string, newStatus: string) {
    return await createNotification(
      userId,
      NotificationType.JOB_STATUS_CHANGED,
      'Job Status Updated',
      `"${jobTitle}" moved from ${oldStatus} to ${newStatus}`,
      {
        data: { jobTitle, oldStatus, newStatus },
        priority: newStatus === 'COMPLETED' ? NotificationPriority.HIGH : NotificationPriority.NORMAL
      }
    )
  },

  async customerCreated(userId: string, customerName: string, matchedBy: string) {
    return await createNotification(
      userId,
      NotificationType.CUSTOMER_CREATED,
      'New Customer Added',
      `${customerName} has been ${matchedBy === 'none' ? 'created' : 'linked'} in your customer database`,
      {
        data: { customerName, matchedBy },
        priority: NotificationPriority.LOW
      }
    )
  },

  async extractionFailed(userId: string, callSid: string, error: string) {
    return await createNotification(
      userId,
      NotificationType.EXTRACTION_FAILED,
      'Call Processing Failed',
      `Failed to process appointment data from call ${callSid}. Manual review needed.`,
      {
        data: { callSid, error },
        priority: NotificationPriority.HIGH,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    )
  },

  async systemAlert(userId: string, title: string, message: string, priority = NotificationPriority.NORMAL) {
    return await createNotification(
      userId,
      NotificationType.SYSTEM_ALERT,
      title,
      message,
      { priority }
    )
  }
}