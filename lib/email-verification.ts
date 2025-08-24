import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export const sendVerificationEmail = async (email: string, code: string) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('Resend API key not configured')
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Flynn AI <noreply@resend.dev>', // Using Resend's verified domain
      to: [email],
      subject: 'Verify your email address - Flynn AI',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Flynn AI</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Verify your email address</p>
          </div>
          
          <div style="background: #ffffff; padding: 40px 20px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0; font-size: 24px;">Welcome to Flynn AI!</h2>
            
            <p style="font-size: 16px; margin-bottom: 30px;">
              Please verify your email address by entering this 6-digit code in the app:
            </p>
            
            <div style="background: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
              <div style="font-size: 36px; font-weight: bold; color: #495057; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${code}
              </div>
            </div>
            
            <p style="font-size: 14px; color: #666; text-align: center;">
              This code expires in 10 minutes.
            </p>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="font-size: 14px; color: #888; margin: 0;">
                If you didn't request this verification, you can safely ignore this email.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <p style="font-size: 12px; color: #aaa;">
              © 2024 Flynn AI. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to Flynn AI!
        
        Please verify your email address by entering this 6-digit code: ${code}
        
        This code expires in 10 minutes.
        
        If you didn't request this verification, you can safely ignore this email.
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      throw new Error('Failed to send email')
    }

    return {
      success: true,
      messageId: data?.id,
    }
  } catch (error) {
    console.error('Error sending verification email:', error)
    throw new Error('Failed to send verification email')
  }
}