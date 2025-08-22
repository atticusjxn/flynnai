import OpenAI from 'openai'

let openai: OpenAI | null = null

export function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured. Voice commands will use basic pattern matching.')
    return null
  }

  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  return openai
}

export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY
}