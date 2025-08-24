import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Mark all notifications as read for this user
    const result = await prisma.notification.updateMany({
      where: {
        userId: userId,
        read: false
      },
      data: {
        read: true,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: `Marked ${result.count} notifications as read`
    })

  } catch (error) {
    console.error('❌ Mark all notifications read API failed:', error)
    return NextResponse.json({
      error: 'Failed to mark all notifications as read',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}