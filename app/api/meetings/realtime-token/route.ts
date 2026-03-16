import { NextResponse } from 'next/server'

// POST /api/meetings/realtime-token
// AssemblyAI v3 Streaming 임시 토큰 발급
export async function POST() {
  const apiKey = process.env.ASSEMBLYAI_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'ASSEMBLYAI_API_KEY is not configured' },
      { status: 500 },
    )
  }

  try {
    const res = await fetch(
      `https://streaming.assemblyai.com/v3/token?expires_in_seconds=600`,
      {
        method: 'GET',
        headers: { Authorization: apiKey },
      },
    )

    if (!res.ok) {
      const err = await res.text()
      console.error('[realtime-token] AssemblyAI error:', err)
      return NextResponse.json({ error: 'Token creation failed' }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json({ token: data.token })
  } catch (err) {
    console.error('Realtime token error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
