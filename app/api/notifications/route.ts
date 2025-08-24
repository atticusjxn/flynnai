import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const url = new URL(request.url)
    
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true'

    const whereClause: any = { userId }
    if (unreadOnly) {
      whereClause.read = false
    }

    const [notifications, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: [
          { read: 'asc' }, // Unread first
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        skip: offset,
        take: Math.min(limit, 100)
      }),

      prisma.notification.count({ where: whereClause })
    ])

    return NextResponse.json({
      success: true,
      notifications,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })

  } catch (error) {
    console.error('❌ Get notifications API failed:', error)
    return NextResponse.json({
      error: 'Failed to get notifications',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Delete all notifications for user
    const result = await prisma.notification.deleteMany({
      where: { userId }
    })

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.count} notifications`
    })

  } catch (error) {
    console.error('❌ Clear notifications API failed:', error)
    return NextResponse.json({
      error: 'Failed to clear notifications',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}