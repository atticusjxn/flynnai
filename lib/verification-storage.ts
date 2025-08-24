// Temporary in-memory storage for verification codes
// In production, this should be replaced with a database or Redis
export const verificationCodes = new Map<string, { code: string; timestamp: number }>()

export const storeVerificationCode = (email: string, code: string) => {
  verificationCodes.set(email.toLowerCase(), {
    code,
    timestamp: Date.now(),
  })
}

export const getVerificationCode = (email: string) => {
  return verificationCodes.get(email.toLowerCase())
}

export const removeVerificationCode = (email: string) => {
  verificationCodes.delete(email.toLowerCase())
}

export const isCodeExpired = (timestamp: number, expiryMinutes: number = 10) => {
  const now = Date.now()
  return now - timestamp > expiryMinutes * 60 * 1000
}