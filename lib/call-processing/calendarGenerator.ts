import ical, { ICalAttendeeRole, ICalAttendeeStatus } from 'ical-generator'

export function generateCalendarFile(appointmentData: any): string {
  const calendar = ical({ name: 'AutoCalendar Appointment' })

  // Parse appointment date and time
  let startDate: Date | undefined
  let endDate: Date | undefined

  if (appointmentData.appointmentDate) {
    const dateStr = appointmentData.appointmentDate
    const timeStr = appointmentData.appointmentTime || '09:00'
    
    try {
      // Combine date and time
      const dateTimeStr = `${dateStr}T${timeStr}:00`
      startDate = new Date(dateTimeStr)
      
      // If duration is specified, calculate end time
      if (appointmentData.duration) {
        const durationMatch = appointmentData.duration.match(/(\d+)/)
        if (durationMatch) {
          const minutes = parseInt(durationMatch[1])
          endDate = new Date(startDate.getTime() + minutes * 60000)
        }
      } else {
        // Default to 1 hour appointment
        endDate = new Date(startDate.getTime() + 60 * 60000)
      }
    } catch (error) {
      console.error('Error parsing appointment date/time:', error)
    }
  }

  // Create the appointment event
  const event = calendar.createEvent({
    start: startDate || new Date(),
    end: endDate || new Date(Date.now() + 60 * 60000),
    summary: `Appointment: ${appointmentData.customerName || 'Customer'} - ${appointmentData.serviceType || 'Service'}`,
    description: createEventDescription(appointmentData),
    location: appointmentData.location || 'Business Location',
    url: 'https://autocalendar.ai',
    organizer: {
      name: 'AutoCalendar',
      email: 'appointments@autocalendar.ai'
    }
  })

  // Add attendee if customer email is available
  if (appointmentData.customerEmail) {
    event.createAttendee({
      email: appointmentData.customerEmail,
      name: appointmentData.customerName || 'Customer',
      role: ICalAttendeeRole.REQ,
      status: ICalAttendeeStatus.NEEDSACTION
    })
  }

  // Add alarm/reminder
  event.createAlarm({
    type: 'display',
    trigger: 15 * 60, // 15 minutes before
    description: 'Appointment reminder'
  })

  return calendar.toString()
}

function createEventDescription(appointmentData: any): string {
  const parts = ['Appointment details extracted by AutoCalendar:', '']

  if (appointmentData.customerName) {
    parts.push(`Customer: ${appointmentData.customerName}`)
  }

  if (appointmentData.customerPhone) {
    parts.push(`Phone: ${appointmentData.customerPhone}`)
  }

  if (appointmentData.customerEmail) {
    parts.push(`Email: ${appointmentData.customerEmail}`)
  }

  if (appointmentData.serviceType) {
    parts.push(`Service: ${appointmentData.serviceType}`)
  }

  if (appointmentData.duration) {
    parts.push(`Duration: ${appointmentData.duration}`)
  }

  if (appointmentData.notes) {
    parts.push(`Notes: ${appointmentData.notes}`)
  }

  parts.push('')
  parts.push('Generated automatically from phone call')
  parts.push(`Confidence Score: ${appointmentData.confidence || 0}%`)

  return parts.join('\n')
}