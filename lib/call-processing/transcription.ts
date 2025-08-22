import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function transcribeCall(recordingUrl: string): Promise<string> {
  try {
    // Download the recording file
    const response = await fetch(recordingUrl)
    const audioBuffer = await response.arrayBuffer()
    
    // Convert to File object for OpenAI API
    const audioFile = new File([audioBuffer], 'recording.mp3', { type: 'audio/mpeg' })
    
    // Transcribe using Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
      response_format: 'text'
    })

    return transcription as string
  } catch (error) {
    console.error('Transcription error:', error)
    throw new Error('Failed to transcribe call recording')
  }
}