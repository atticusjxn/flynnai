// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.DATABASE_URL = 'test-database-url'
process.env.OPENAI_API_KEY = 'test-openai-key'

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn()
  }),
  useSearchParams: () => ({
    get: jest.fn()
  }),
  usePathname: () => '/test-path'
}))

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

// Mock notifications
jest.mock('@/lib/notifications', () => ({
  createNotification: jest.fn()
}))

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    extractionFeedback: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn()
    },
    extractedAppointment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn()
    },
    callRecord: {
      findUnique: jest.fn(),
      update: jest.fn()
    }
  }
}))