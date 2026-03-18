import { NextRequest, NextResponse } from 'next/server'

// Use Edge Runtime to bypass Vercel's 4.5MB serverless body limit
export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ASSEMBLYAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ upload_url: '__mock__' })
    }

    // Read the raw body as ArrayBuffer
    const body = await request.arrayBuffer()

    if (!body || body.byteLength === 0) {
      return NextResponse.json(
        { error: 'Empty audio file' },
        { status: 400 }
      )
    }

    console.log(`[upload-audio] Uploading ${(body.byteLength / 1024 / 1024).toFixed(1)}MB to AssemblyAI...`)

    // Upload to AssemblyAI
    const res = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/octet-stream',
      },
      body: body,
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('[upload-audio] AssemblyAI error:', errBody)
      return NextResponse.json(
        { error: `AssemblyAI upload failed: ${errBody}` },
        { status: res.status }
      )
    }

    const data = await res.json()
    console.log('[upload-audio] Upload success:', data.upload_url?.substring(0, 50))
    return NextResponse.json({ upload_url: data.upload_url })
  } catch (error) {
    console.error('[upload-audio] Error:', error)
    const message = error instanceof Error ? error.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
