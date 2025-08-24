import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { 
  createNotification, 
  NotificationHelpers,
  NotificationType,
  NotificationPriority,
  notificationStore 
} from '@/lib/notifications'
import { exportJobsToICS, generateGoogleCalendarURL, jobToCalendarEvent } from '@/lib/calendar'

// Mock data
const testUserId = 'test-user-notifications'

describe('Notification System', () => {
  beforeAll(async () => {
    // Clean up any existing notifications
    notificationStore.clearNotifications(testUserId)
  })

  afterAll(async () => {
    // Clean up test notifications
    notificationStore.clearNotifications(testUserId)
  })

  describe('Notification Creation', () => {
    it('should create a basic notification', async () => {
      const notificationId = await createNotification(
        testUserId,
        NotificationType.SYSTEM_ALERT,
        'Test Notification',
        'This is a test notification'
      )

      expect(notificationId).toMatch(/^notif_/)
      
      const notifications = notificationStore.getNotifications(testUserId)
      expect(notifications).toHaveLength(1)
      expect(notifications[0].title).toBe('Test Notification')
      expect(notifications[0].type).toBe(NotificationType.SYSTEM_ALERT)
      expect(notifications[0].read).toBe(false)
    })

    it('should create notification with custom priority and data', async () => {
      const notificationId = await createNotification(
        testUserId,
        NotificationType.CALL_RECEIVED,
        'Urgent Call',
        'Emergency call from customer',
        {
          priority: NotificationPriority.URGENT,
          data: { phoneNumber: '+15551234567', callSid: 'test-call-123' }
        }
      )

      const notifications = notificationStore.getNotifications(testUserId)
      const notification = notifications.find(n => n.id === notificationId)
      
      expect(notification).toBeDefined()
      expect(notification!.priority).toBe(NotificationPriority.URGENT)
      expect(notification!.data.phoneNumber).toBe('+15551234567')
    })

    it('should handle notification expiration', async () => {
      const expiryDate = new Date(Date.now() + 1000) // 1 second from now
      
      const notificationId = await createNotification(
        testUserId,
        NotificationType.EXTRACTION_FAILED,
        'Temporary Alert',
        'This notification expires soon',
        { expiresAt: expiryDate }
      )

      const notifications = notificationStore.getNotifications(testUserId)
      const notification = notifications.find(n => n.id === notificationId)
      
      expect(notification).toBeDefined()
      expect(notification!.expiresAt).toEqual(expiryDate)
    })
  })

  describe('Notification Helpers', () => {
    it('should create call received notification', async () => {
      const notificationId = await NotificationHelpers.callReceived(
        testUserId,
        '+15559876543',
        'test-call-456'
      )

      const notifications = notificationStore.getNotifications(testUserId)
      const notification = notifications.find(n => n.id === notificationId)
      
      expect(notification).toBeDefined()
      expect(notification!.type).toBe(NotificationType.CALL_RECEIVED)
      expect(notification!.title).toBe('New Call Received')
      expect(notification!.priority).toBe(NotificationPriority.HIGH)
      expect(notification!.data.phoneNumber).toBe('+15559876543')
    })

    it('should create appointment extracted notification with confidence', async () => {
      const notificationId = await NotificationHelpers.appointmentExtracted(
        testUserId,
        'John Smith',
        'Plumbing Repair',
        0.85
      )

      const notifications = notificationStore.getNotifications(testUserId)
      const notification = notifications.find(n => n.id === notificationId)
      
      expect(notification).toBeDefined()
      expect(notification!.type).toBe(NotificationType.APPOINTMENT_EXTRACTED)
      expect(notification!.priority).toBe(NotificationPriority.HIGH) // High confidence
      expect(notification!.data.confidence).toBe(0.85)
      expect(notification!.message).toContain('85% confidence')
    })

    it('should create job created notification', async () => {
      const notificationId = await NotificationHelpers.jobCreated(
        testUserId,
        'Kitchen Sink Repair',
        'Jane Doe',
        150
      )

      const notifications = notificationStore.getNotifications(testUserId)
      const notification = notifications.find(n => n.id === notificationId)
      
      expect(notification).toBeDefined()
      expect(notification!.type).toBe(NotificationType.JOB_CREATED)
      expect(notification!.data.estimatedCost).toBe(150)
      expect(notification!.message).toContain('$150')
    })

    it('should create job status changed notification', async () => {
      const notificationId = await NotificationHelpers.jobStatusChanged(
        testUserId,
        'Bathroom Renovation',
        'QUOTING',
        'CONFIRMED'
      )

      const notifications = notificationStore.getNotifications(testUserId)
      const notification = notifications.find(n => n.id === notificationId)
      
      expect(notification).toBeDefined()
      expect(notification!.type).toBe(NotificationType.JOB_STATUS_CHANGED)
      expect(notification!.data.oldStatus).toBe('QUOTING')
      expect(notification!.data.newStatus).toBe('CONFIRMED')
    })

    it('should create extraction failed notification', async () => {
      const notificationId = await NotificationHelpers.extractionFailed(
        testUserId,
        'test-call-789',
        'Audio quality too poor'
      )

      const notifications = notificationStore.getNotifications(testUserId)
      const notification = notifications.find(n => n.id === notificationId)
      
      expect(notification).toBeDefined()
      expect(notification!.type).toBe(NotificationType.EXTRACTION_FAILED)
      expect(notification!.priority).toBe(NotificationPriority.HIGH)
      expect(notification!.expiresAt).toBeDefined()
    })
  })

  describe('Notification Store Management', () => {
    it('should support subscription and unsubscription', () => {
      const receivedNotifications: any[] = []
      
      const unsubscribe = notificationStore.subscribe(testUserId, (notification) => {
        receivedNotifications.push(notification)
      })

      // Add a notification
      const testNotification = {
        id: 'test-sub-123',
        userId: testUserId,
        type: NotificationType.SYSTEM_ALERT,
        title: 'Subscription Test',
        message: 'Testing subscription',
        data: {},
        read: false,
        priority: NotificationPriority.NORMAL,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      notificationStore.addNotification(testNotification)
      
      expect(receivedNotifications).toHaveLength(1)
      expect(receivedNotifications[0].title).toBe('Subscription Test')

      // Unsubscribe
      unsubscribe()
      
      // Add another notification - should not be received
      notificationStore.addNotification({
        ...testNotification,
        id: 'test-sub-456',
        title: 'Should not be received'
      })
      
      expect(receivedNotifications).toHaveLength(1) // Still only 1
    })

    it('should mark notifications as read', () => {
      const notifications = notificationStore.getNotifications(testUserId)
      const firstNotification = notifications[0]
      
      expect(firstNotification.read).toBe(false)
      
      notificationStore.markAsRead(testUserId, firstNotification.id)
      
      const updatedNotifications = notificationStore.getNotifications(testUserId)
      const updatedNotification = updatedNotifications.find(n => n.id === firstNotification.id)
      
      expect(updatedNotification!.read).toBe(true)
    })

    it('should limit notification storage to 100 per user', () => {
      // Clear existing notifications
      notificationStore.clearNotifications(testUserId)
      
      // Add 150 notifications
      for (let i = 0; i < 150; i++) {
        notificationStore.addNotification({
          id: `bulk-test-${i}`,
          userId: testUserId,
          type: NotificationType.SYSTEM_ALERT,
          title: `Bulk Test ${i}`,
          message: `Message ${i}`,
          data: {},
          read: false,
          priority: NotificationPriority.NORMAL,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
      
      const notifications = notificationStore.getNotifications(testUserId)
      expect(notifications).toHaveLength(100)
      
      // Should keep the most recent ones
      expect(notifications[0].title).toBe('Bulk Test 149')
      expect(notifications[99].title).toBe('Bulk Test 50')
    })
  })

  describe('Calendar Integration', () => {
    const mockJob = {
      id: 'job-calendar-test',
      title: 'Kitchen Renovation',
      description: 'Complete kitchen renovation project',
      customerName: 'Alice Johnson',
      customerPhone: '+15551234567',
      serviceType: 'Home Renovation',
      address: '123 Main St, City, ST 12345',
      scheduledDate: new Date('2024-02-15T10:00:00Z'),
      scheduledTime: '10:00',
      estimatedDuration: 180, // 3 hours
      estimatedCost: 2500
    }

    it('should convert job to calendar event', () => {
      const event = jobToCalendarEvent(mockJob)
      
      expect(event.id).toBe(mockJob.id)
      expect(event.title).toBe(mockJob.title)
      expect(event.customerName).toBe(mockJob.customerName)
      expect(event.location).toBe(mockJob.address)
      expect(event.startDate).toEqual(mockJob.scheduledDate)
      expect(event.endDate.getTime() - event.startDate.getTime()).toBe(3 * 60 * 60 * 1000) // 3 hours
    })

    it('should generate ICS calendar content', () => {
      const event = jobToCalendarEvent(mockJob)
      const icsContent = exportJobsToICS([mockJob])
      
      expect(icsContent).toContain('BEGIN:VCALENDAR')
      expect(icsContent).toContain('END:VCALENDAR')
      expect(icsContent).toContain('BEGIN:VEVENT')
      expect(icsContent).toContain('END:VEVENT')
      expect(icsContent).toContain(`SUMMARY:${mockJob.title}`)
      expect(icsContent).toContain(`LOCATION:${mockJob.address}`)
      expect(icsContent).toContain('Customer: Alice Johnson')
    })

    it('should generate Google Calendar URL', () => {
      const event = jobToCalendarEvent(mockJob)
      const googleURL = generateGoogleCalendarURL(event)
      
      expect(googleURL).toContain('calendar.google.com')
      expect(googleURL).toContain('action=TEMPLATE')
      expect(googleURL).toContain(encodeURIComponent(mockJob.title))
      expect(googleURL).toContain(encodeURIComponent(mockJob.address))
    })

    it('should handle jobs without scheduled dates', () => {
      const jobWithoutDate = { ...mockJob, scheduledDate: null, scheduledTime: null }
      const icsContent = exportJobsToICS([jobWithoutDate])
      
      // Should not include jobs without dates
      expect(icsContent).toContain('BEGIN:VCALENDAR')
      expect(icsContent).toContain('END:VCALENDAR')
      expect(icsContent).not.toContain('BEGIN:VEVENT')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle notifications for non-existent users gracefully', async () => {
      const notificationId = await createNotification(
        'non-existent-user',
        NotificationType.SYSTEM_ALERT,
        'Test',
        'Test message'
      )
      
      // Should still create notification ID
      expect(notificationId).toMatch(/^notif_/)
      
      // Should be stored in memory even if DB fails
      const notifications = notificationStore.getNotifications('non-existent-user')
      expect(notifications).toHaveLength(1)
    })

    it('should handle malformed notification data', () => {
      expect(() => {
        notificationStore.addNotification({
          id: 'malformed-test',
          userId: testUserId,
          type: 'INVALID_TYPE' as any,
          title: '',
          message: '',
          data: {},
          read: false,
          priority: NotificationPriority.NORMAL,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }).not.toThrow()
    })

    it('should handle concurrent subscriptions properly', () => {
      const subscription1Results: any[] = []
      const subscription2Results: any[] = []
      
      const unsub1 = notificationStore.subscribe(testUserId, (n) => subscription1Results.push(n))
      const unsub2 = notificationStore.subscribe(testUserId, (n) => subscription2Results.push(n))
      
      const testNotification = {
        id: 'concurrent-test',
        userId: testUserId,
        type: NotificationType.SYSTEM_ALERT,
        title: 'Concurrent Test',
        message: 'Testing concurrent subscriptions',
        data: {},
        read: false,
        priority: NotificationPriority.NORMAL,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      notificationStore.addNotification(testNotification)
      
      expect(subscription1Results).toHaveLength(1)
      expect(subscription2Results).toHaveLength(1)
      
      unsub1()
      unsub2()
    })

    it('should handle ICS special characters correctly', () => {
      const specialCharJob = {
        ...mockJob,
        title: 'Job with; special, chars\nand newlines',
        description: 'Description with\\backslashes and;semicolons',
        address: '123 Main St,\nSuite A;B\\C'
      }
      
      const icsContent = exportJobsToICS([specialCharJob])
      
      expect(icsContent).toContain('Job with\\; special\\, chars\\nand newlines')
      expect(icsContent).toContain('Description with\\\\backslashes and\\;semicolons')
    })
  })
})