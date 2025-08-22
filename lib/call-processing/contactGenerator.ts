export function generateContactCard(appointmentData: any): string {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0']

  // Add name
  if (appointmentData.customerName) {
    lines.push(`FN:${appointmentData.customerName}`)
    lines.push(`N:${appointmentData.customerName};;;;`)
  }

  // Add phone number
  if (appointmentData.customerPhone) {
    lines.push(`TEL;TYPE=CELL:${appointmentData.customerPhone}`)
  }

  // Add email
  if (appointmentData.customerEmail) {
    lines.push(`EMAIL:${appointmentData.customerEmail}`)
  }

  // Add organization/service info
  if (appointmentData.serviceType) {
    lines.push(`NOTE:Service: ${appointmentData.serviceType}`)
  }

  // Add source
  lines.push('ORG:AutoCalendar Contact')
  lines.push('SOURCE:AutoCalendar AI')

  // Add creation timestamp
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  lines.push(`REV:${now}`)

  lines.push('END:VCARD')

  return lines.join('\r\n')
}