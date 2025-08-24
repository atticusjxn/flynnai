import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

// Supabase client for file storage
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.DATABASE_URL?.match(/https:\/\/([^.]+)/)?.[0] || ''
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

let supabase: ReturnType<typeof createClient> | null = null

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey)
} else {
  console.warn('Supabase credentials not configured. File storage will not work.')
}

export interface AudioFileMetadata {
  originalUrl: string
  fileName: string
  fileSize?: number
  duration?: number
  format?: string
  uploadedAt: Date
  storageKey: string
}

export interface StorageResult {
  success: boolean
  storageKey?: string
  publicUrl?: string
  error?: string
  metadata?: AudioFileMetadata
}

/**
 * Download audio file from Twilio and upload to Supabase Storage
 */
export async function downloadAndStoreRecording(
  recordingUrl: string,
  callSid: string,
  userId: string,
  authHeader?: string
): Promise<StorageResult> {
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase storage not configured'
    }
  }

  try {
    console.log(`📥 Downloading recording from: ${recordingUrl}`)

    // Download audio file from Twilio
    const headers: Record<string, string> = {}
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const response = await fetch(recordingUrl, { headers })
    
    if (!response.ok) {
      throw new Error(`Failed to download recording: ${response.statusText}`)
    }

    const audioBuffer = await response.arrayBuffer()
    const audioData = new Uint8Array(audioBuffer)
    
    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `recording_${callSid}_${timestamp}.mp3`
    const storageKey = `recordings/${userId}/${fileName}`

    console.log(`📤 Uploading to Supabase storage: ${storageKey}`)

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('call-recordings')
      .upload(storageKey, audioData, {
        contentType: 'audio/mpeg',
        upsert: false
      })

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`)
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('call-recordings')
      .getPublicUrl(storageKey)

    const metadata: AudioFileMetadata = {
      originalUrl: recordingUrl,
      fileName,
      fileSize: audioData.length,
      format: 'mp3',
      uploadedAt: new Date(),
      storageKey
    }

    console.log(`✅ Recording stored successfully: ${fileName}`)

    return {
      success: true,
      storageKey,
      publicUrl: publicUrlData.publicUrl,
      metadata
    }

  } catch (error) {
    console.error('❌ Failed to download and store recording:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get signed URL for private recording access
 */
export async function getRecordingSignedUrl(
  storageKey: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string | null> {
  if (!supabase) {
    console.error('Supabase storage not configured')
    return null
  }

  try {
    const { data, error } = await supabase.storage
      .from('call-recordings')
      .createSignedUrl(storageKey, expiresIn)

    if (error) {
      console.error('Failed to create signed URL:', error)
      return null
    }

    return data.signedUrl
  } catch (error) {
    console.error('Error creating signed URL:', error)
    return null
  }
}

/**
 * Delete recording file from storage
 */
export async function deleteRecording(storageKey: string): Promise<boolean> {
  if (!supabase) {
    console.error('Supabase storage not configured')
    return false
  }

  try {
    const { error } = await supabase.storage
      .from('call-recordings')
      .remove([storageKey])

    if (error) {
      console.error('Failed to delete recording:', error)
      return false
    }

    console.log(`🗑️ Recording deleted: ${storageKey}`)
    return true
  } catch (error) {
    console.error('Error deleting recording:', error)
    return false
  }
}

/**
 * Clean up old recordings based on retention policy
 */
export async function cleanupOldRecordings(
  retentionDays: number = 30,
  userId?: string
): Promise<{ deleted: number; errors: number }> {
  if (!supabase) {
    console.warn('Supabase storage not configured')
    return { deleted: 0, errors: 0 }
  }

  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

    // Find old call records
    const whereClause: any = {
      createdAt: {
        lt: cutoffDate
      },
      recordingUrl: {
        not: null
      }
    }

    if (userId) {
      whereClause.userId = userId
    }

    const oldCallRecords = await prisma.callRecord.findMany({
      where: whereClause,
      select: {
        id: true,
        recordingUrl: true,
        callSid: true
      }
    })

    let deleted = 0
    let errors = 0

    for (const record of oldCallRecords) {
      try {
        // Extract storage key from recording URL or construct it
        const storageKey = `recordings/${record.callSid}_${record.id}.mp3`
        
        const success = await deleteRecording(storageKey)
        if (success) {
          // Update database to remove recording URL
          await prisma.callRecord.update({
            where: { id: record.id },
            data: { recordingUrl: null }
          })
          deleted++
        } else {
          errors++
        }
      } catch (error) {
        console.error(`Failed to cleanup recording ${record.id}:`, error)
        errors++
      }
    }

    console.log(`🧹 Cleanup completed: ${deleted} deleted, ${errors} errors`)
    return { deleted, errors }

  } catch (error) {
    console.error('Error during cleanup:', error)
    return { deleted: 0, errors: 1 }
  }
}

/**
 * Get storage statistics for user
 */
export async function getStorageStats(userId: string): Promise<{
  totalRecordings: number
  totalSizeBytes: number
  oldestRecording?: Date
  newestRecording?: Date
}> {
  try {
    const stats = await prisma.callRecord.aggregate({
      where: {
        userId,
        recordingUrl: { not: null }
      },
      _count: { id: true }
    })

    const recordings = await prisma.callRecord.findMany({
      where: {
        userId,
        recordingUrl: { not: null }
      },
      select: {
        createdAt: true,
        duration: true
      },
      orderBy: { createdAt: 'asc' }
    })

    // Estimate file sizes based on duration (rough estimate: 1MB per minute)
    const estimatedTotalSize = recordings.reduce((total, recording) => {
      const durationMinutes = recording.duration ? recording.duration / 60 : 2 // default 2 min
      return total + (durationMinutes * 1024 * 1024) // 1MB per minute
    }, 0)

    return {
      totalRecordings: stats._count.id,
      totalSizeBytes: Math.round(estimatedTotalSize),
      oldestRecording: recordings[0]?.createdAt,
      newestRecording: recordings[recordings.length - 1]?.createdAt
    }

  } catch (error) {
    console.error('Error getting storage stats:', error)
    return {
      totalRecordings: 0,
      totalSizeBytes: 0
    }
  }
}

/**
 * Initialize storage bucket (call once during setup)
 */
export async function initializeStorage(): Promise<boolean> {
  if (!supabase) {
    console.error('Supabase storage not configured')
    return false
  }

  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('Failed to list buckets:', listError)
      return false
    }

    const bucketExists = buckets?.some(bucket => bucket.name === 'call-recordings')
    
    if (!bucketExists) {
      console.log('Creating call-recordings bucket...')
      
      const { error: createError } = await supabase.storage.createBucket('call-recordings', {
        public: false, // Private bucket for security
        fileSizeLimit: 50 * 1024 * 1024 // 50MB max per file
      })

      if (createError) {
        console.error('Failed to create bucket:', createError)
        return false
      }

      console.log('✅ Call recordings bucket created successfully')
    } else {
      console.log('✅ Call recordings bucket already exists')
    }

    return true

  } catch (error) {
    console.error('Error initializing storage:', error)
    return false
  }
}

export { supabase }