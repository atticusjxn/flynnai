import { NextRequest, NextResponse } from 'next/server'
import { monitoringService } from '@/lib/monitoring'

export function createMonitoringMiddleware() {
  return async (request: NextRequest) => {
    const startTime = Date.now()
    const { pathname, search } = request.nextUrl
    const method = request.method
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    let response: NextResponse
    let statusCode = 200
    let errorMessage: string | undefined

    try {
      // Continue with the request
      response = NextResponse.next()
      statusCode = response.status
    } catch (error) {
      statusCode = 500
      errorMessage = error instanceof Error ? error.message : 'Unknown error'
      response = new NextResponse('Internal Server Error', { status: 500 })
    }

    const responseTime = Date.now() - startTime
    const endpoint = pathname + search

    // Skip monitoring for static assets and internal Next.js routes
    if (
      !pathname.startsWith('/_next') &&
      !pathname.startsWith('/api/_next') &&
      !pathname.startsWith('/__next') &&
      !pathname.includes('.') // Skip files with extensions
    ) {
      // Track the API call asynchronously
      setImmediate(() => {
        try {
          monitoringService.trackApiCall({
            endpoint,
            method,
            responseTime,
            statusCode,
            errorMessage
          })
        } catch (error) {
          console.error('Failed to track API call:', error)
        }
      })

      // Log slow requests
      if (responseTime > 3000) {
        console.warn(`🐌 Slow request detected: ${method} ${endpoint} - ${responseTime}ms`)
      }

      // Log errors
      if (statusCode >= 400) {
        console.error(`❌ Request error: ${method} ${endpoint} - ${statusCode}${errorMessage ? `: ${errorMessage}` : ''}`)
      }
    }

    return response
  }
}

export const monitoringMiddleware = createMonitoringMiddleware()

// Enhanced performance tracking hook for React components
export function usePerformanceTracking(componentName: string) {
  const trackRender = (renderTime: number) => {
    if (renderTime > 100) { // Log renders taking more than 100ms
      console.warn(`🐌 Slow component render: ${componentName} - ${renderTime}ms`)
    }

    // Track component performance metrics
    monitoringService.trackApiCall({
      endpoint: `/component/${componentName}`,
      method: 'RENDER',
      responseTime: renderTime,
      statusCode: 200
    })
  }

  const trackError = (error: Error) => {
    console.error(`❌ Component error: ${componentName}`, error)
    
    monitoringService.trackApiCall({
      endpoint: `/component/${componentName}`,
      method: 'ERROR',
      responseTime: 0,
      statusCode: 500,
      errorMessage: error.message
    })
  }

  return { trackRender, trackError }
}

// Database query performance tracking
export function createDbQueryTracker() {
  return {
    async trackQuery<T>(
      queryName: string,
      queryPromise: Promise<T>
    ): Promise<T> {
      const startTime = Date.now()
      
      try {
        const result = await queryPromise
        const queryTime = Date.now() - startTime
        
        // Log slow queries
        if (queryTime > 1000) {
          console.warn(`🐌 Slow database query: ${queryName} - ${queryTime}ms`)
        }

        // Track query performance
        monitoringService.trackApiCall({
          endpoint: `/db/${queryName}`,
          method: 'QUERY',
          responseTime: queryTime,
          statusCode: 200
        })

        return result
      } catch (error) {
        const queryTime = Date.now() - startTime
        const errorMessage = error instanceof Error ? error.message : 'Database query failed'
        
        console.error(`❌ Database query error: ${queryName} - ${queryTime}ms`, error)
        
        monitoringService.trackApiCall({
          endpoint: `/db/${queryName}`,
          method: 'QUERY',
          responseTime: queryTime,
          statusCode: 500,
          errorMessage
        })
        
        throw error
      }
    }
  }
}

// OpenAI API call tracking
export function createOpenAITracker() {
  return {
    async trackOpenAICall<T>(
      operation: string,
      apiPromise: Promise<T>,
      metadata?: { tokens?: number; model?: string }
    ): Promise<T> {
      const startTime = Date.now()
      
      try {
        const result = await apiPromise
        const responseTime = Date.now() - startTime
        
        console.log(`🤖 OpenAI ${operation} completed in ${responseTime}ms`)
        
        // Track OpenAI performance
        monitoringService.trackApiCall({
          endpoint: `/openai/${operation}`,
          method: 'POST',
          responseTime,
          statusCode: 200
        })

        return result
      } catch (error) {
        const responseTime = Date.now() - startTime
        const errorMessage = error instanceof Error ? error.message : 'OpenAI API error'
        
        console.error(`❌ OpenAI ${operation} failed in ${responseTime}ms:`, error)
        
        // Check for rate limiting
        const isRateLimit = errorMessage.includes('rate') || errorMessage.includes('quota')
        
        monitoringService.trackApiCall({
          endpoint: `/openai/${operation}`,
          method: 'POST',
          responseTime,
          statusCode: isRateLimit ? 429 : 500,
          errorMessage
        })
        
        throw error
      }
    }
  }
}

// Twilio API call tracking
export function createTwilioTracker() {
  return {
    async trackTwilioCall<T>(
      operation: string,
      apiPromise: Promise<T>
    ): Promise<T> {
      const startTime = Date.now()
      
      try {
        const result = await apiPromise
        const responseTime = Date.now() - startTime
        
        console.log(`📞 Twilio ${operation} completed in ${responseTime}ms`)
        
        monitoringService.trackApiCall({
          endpoint: `/twilio/${operation}`,
          method: 'POST',
          responseTime,
          statusCode: 200
        })

        return result
      } catch (error) {
        const responseTime = Date.now() - startTime
        const errorMessage = error instanceof Error ? error.message : 'Twilio API error'
        
        console.error(`❌ Twilio ${operation} failed in ${responseTime}ms:`, error)
        
        monitoringService.trackApiCall({
          endpoint: `/twilio/${operation}`,
          method: 'POST',
          responseTime,
          statusCode: 500,
          errorMessage
        })
        
        throw error
      }
    }
  }
}

// Memory usage tracking
export function trackMemoryUsage(context: string) {
  const memUsage = process.memoryUsage()
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024)
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024)
  const externalMB = Math.round(memUsage.external / 1024 / 1024)
  
  console.log(`📊 Memory usage [${context}]: Heap ${heapUsedMB}MB / ${heapTotalMB}MB, External: ${externalMB}MB`)
  
  // Alert on high memory usage
  if (heapUsedMB > 500) {
    console.warn(`⚠️ High memory usage detected in ${context}: ${heapUsedMB}MB`)
  }
  
  return {
    heapUsed: heapUsedMB,
    heapTotal: heapTotalMB,
    external: externalMB,
    percentage: (heapUsedMB / heapTotalMB) * 100
  }
}

// Export singleton instances
export const dbTracker = createDbQueryTracker()
export const openaiTracker = createOpenAITracker()
export const twilioTracker = createTwilioTracker()