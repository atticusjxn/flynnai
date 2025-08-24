import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { notificationStore } from '@/lib/notifications'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 })
    }

    const userId = session.user.id

    // Create a readable stream for Server-Sent Events
    const encoder = new TextEncoder()
    let isConnected = true

    const stream = new ReadableStream({
      start(controller) {
        console.log(`🔌 SSE connection opened for user ${userId}`)
        
        // Send initial connection message
        const connectMessage = `data: ${JSON.stringify({
          type: 'connected',
          timestamp: new Date().toISOString(),
          message: 'Real-time notifications connected'
        })}\n\n`
        
        controller.enqueue(encoder.encode(connectMessage))
        
        // Send any pending notifications
        const pendingNotifications = notificationStore.getNotifications(userId)
        const unreadNotifications = pendingNotifications.filter(n => !n.read)
        
        if (unreadNotifications.length > 0) {
          const backlogMessage = `data: ${JSON.stringify({
            type: 'backlog',
            notifications: unreadNotifications,
            count: unreadNotifications.length
          })}\n\n`
          
          controller.enqueue(encoder.encode(backlogMessage))
        }

        // Subscribe to new notifications
        const unsubscribe = notificationStore.subscribe(userId, (notification) => {
          if (!isConnected) return
          
          try {
            const message = `data: ${JSON.stringify({
              type: 'notification',
              notification: {
                id: notification.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                data: notification.data,
                priority: notification.priority,
                createdAt: notification.createdAt
              }
            })}\n\n`
            
            controller.enqueue(encoder.encode(message))
            console.log(`📢 SSE notification sent to user ${userId}: ${notification.title}`)
            
          } catch (error) {
            console.error('Error sending SSE notification:', error)
          }
        })

        // Send keep-alive ping every 30 seconds
        const keepAlive = setInterval(() => {
          if (!isConnected) {
            clearInterval(keepAlive)
            return
          }
          
          try {
            const pingMessage = `data: ${JSON.stringify({
              type: 'ping',
              timestamp: new Date().toISOString()
            })}\n\n`
            
            controller.enqueue(encoder.encode(pingMessage))
          } catch (error) {
            console.error('Error sending keep-alive:', error)
            clearInterval(keepAlive)
            isConnected = false
            unsubscribe()
          }
        }, 30000)

        // Cleanup on close
        request.signal.addEventListener('abort', () => {
          console.log(`🔌 SSE connection closed for user ${userId}`)
          isConnected = false
          clearInterval(keepAlive)
          unsubscribe()
          
          try {
            controller.close()
          } catch (error) {
            // Stream already closed
          }
        })
      },

      cancel() {
        console.log(`🔌 SSE stream cancelled for user ${userId}`)
        isConnected = false
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    })

  } catch (error) {
    console.error('❌ SSE stream error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}