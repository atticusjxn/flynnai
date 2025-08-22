import { Resend } from 'resend'
import { generateCalendarFile } from './calendarGenerator'
import { generateContactCard } from './contactGenerator'

const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is required')
  }
  return new Resend(process.env.RESEND_API_KEY)
}

interface EmailData {
  user: any
  callRecord: any
  transcription: string
}

export async function sendAppointmentEmail({ user, callRecord, transcription }: EmailData) {
  try {
    const appointmentData = callRecord.appointmentData
    
    // Generate calendar file
    const calendarFile = generateCalendarFile(appointmentData)
    
    // Generate contact card if we have contact info
    const contactCard = appointmentData.customerName || appointmentData.customerPhone 
      ? generateContactCard(appointmentData)
      : null

    // Create email content
    const emailContent = createEmailContent({
      user,
      appointmentData,
      transcription,
      confidenceScore: callRecord.confidenceScore,
      callDate: callRecord.createdAt,
      phoneNumber: callRecord.phoneNumber
    })

    // Prepare attachments
    const attachments = [
      {
        filename: 'appointment.ics',
        content: Buffer.from(calendarFile),
        contentType: 'text/calendar'
      }
    ]

    if (contactCard) {
      attachments.push({
        filename: 'contact.vcf',
        content: Buffer.from(contactCard),
        contentType: 'text/vcard'
      })
    }

    // Send email
    const resend = getResendClient()
    await resend.emails.send({
      from: 'AutoCalendar <appointments@autocalendar.ai>',
      to: user.email,
      subject: `New Appointment: ${appointmentData.customerName || 'Customer'} - ${appointmentData.serviceType || 'Service'}`,
      html: emailContent,
      attachments
    })

  } catch (error) {
    console.error('Email delivery error:', error)
    throw error
  }
}

function createEmailContent({ user, appointmentData, transcription, confidenceScore, callDate, phoneNumber }: any): string {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Not specified'
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeStr: string) => {
    if (!timeStr) return 'Not specified'
    return timeStr
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 20px; border: 1px solid #e5e7eb; }
    .appointment-details { background: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0; }
    .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
    .label { font-weight: bold; color: #4b5563; }
    .value { color: #111827; }
    .confidence { background: ${confidenceScore >= 80 ? '#dcfce7' : confidenceScore >= 60 ? '#fef3c7' : '#fee2e2'}; 
                  color: ${confidenceScore >= 80 ? '#166534' : confidenceScore >= 60 ? '#92400e' : '#991b1b'};
                  padding: 4px 8px; border-radius: 4px; font-size: 12px; }
    .transcription { background: #f9fafb; padding: 15px; border-radius: 6px; margin: 15px 0; }
    .footer { background: #f3f4f6; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #6b7280; }
    .attachments { background: #eff6ff; padding: 15px; border-radius: 6px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">New Appointment Processed</h1>
      <p style="margin: 5px 0 0 0;">AutoCalendar has extracted appointment details from your call</p>
    </div>
    
    <div class="content">
      <div class="appointment-details">
        <h3 style="margin-top: 0;">Appointment Details</h3>
        <div class="detail-row">
          <span class="label">Customer Name:</span>
          <span class="value">${appointmentData.customerName || 'Not provided'}</span>
        </div>
        <div class="detail-row">
          <span class="label">Phone Number:</span>
          <span class="value">${appointmentData.customerPhone || phoneNumber}</span>
        </div>
        <div class="detail-row">
          <span class="label">Email:</span>
          <span class="value">${appointmentData.customerEmail || 'Not provided'}</span>
        </div>
        <div class="detail-row">
          <span class="label">Date:</span>
          <span class="value">${formatDate(appointmentData.appointmentDate)}</span>
        </div>
        <div class="detail-row">
          <span class="label">Time:</span>
          <span class="value">${formatTime(appointmentData.appointmentTime)}</span>
        </div>
        <div class="detail-row">
          <span class="label">Service:</span>
          <span class="value">${appointmentData.serviceType || 'Not specified'}</span>
        </div>
        <div class="detail-row">
          <span class="label">Duration:</span>
          <span class="value">${appointmentData.duration || 'Not specified'}</span>
        </div>
        <div class="detail-row">
          <span class="label">Location:</span>
          <span class="value">${appointmentData.location || 'Your business location'}</span>
        </div>
        ${appointmentData.notes ? `
        <div class="detail-row">
          <span class="label">Notes:</span>
          <span class="value">${appointmentData.notes}</span>
        </div>
        ` : ''}
        <div class="detail-row">
          <span class="label">Confidence Score:</span>
          <span class="confidence">${confidenceScore}%</span>
        </div>
      </div>

      <div class="attachments">
        <h3 style="margin-top: 0;">📎 Attachments</h3>
        <p><strong>appointment.ics</strong> - Add to your calendar with one click</p>
        ${appointmentData.customerName || appointmentData.customerPhone ? 
          '<p><strong>contact.vcf</strong> - Save customer contact information</p>' : ''
        }
      </div>

      <div class="transcription">
        <h3 style="margin-top: 0;">Call Transcription</h3>
        <p style="font-style: italic; margin-bottom: 10px;">
          Call received on ${new Date(callDate).toLocaleDateString()} at ${new Date(callDate).toLocaleTimeString()}
        </p>
        <p>${transcription}</p>
      </div>
    </div>

    <div class="footer">
      <p>This email was automatically generated by AutoCalendar</p>
      <p>Questions? Contact support@autocalendar.ai</p>
    </div>
  </div>
</body>
</html>
`
}