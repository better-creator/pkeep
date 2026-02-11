import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  return new OpenAI({ apiKey })
}

// POST /api/embeddings - Create embedding for text
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text } = body

    if (!text) {
      return NextResponse.json(
        { error: 'text is required' },
        { status: 400 }
      )
    }

    const openai = getOpenAIClient()

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    })

    const embedding = response.data[0].embedding

    return NextResponse.json({ embedding })
  } catch (error) {
    console.error('Embedding API error:', error)
    return NextResponse.json(
      { error: 'Failed to create embedding' },
      { status: 500 }
    )
  }
}
