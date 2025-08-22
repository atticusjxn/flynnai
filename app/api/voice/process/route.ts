import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { processAIVoiceCommand } from '@/lib/voice/aiCommandProcessor'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { command } = await request.json()

    if (!command || typeof command !== 'string') {
      return NextResponse.json(
        { error: 'Command is required and must be a string' },
        { status: 400 }
      )
    }

    // Process the voice command with AI
    const result = await processAIVoiceCommand(command.trim())

    return NextResponse.json({
      success: true,
      result
    })

  } catch (error) {
    console.error('Voice processing error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to process voice command',
        fallback: true 
      },
      { status: 500 }
    )
  }
}