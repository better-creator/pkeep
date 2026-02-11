import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  return new OpenAI({ apiKey })
}

// POST /api/meetings/[meetingId]/analyze - Analyze meeting content with AI
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  const supabase = await createClient()
  const { meetingId } = await params

  // Get meeting content
  const { data: meeting, error: meetingError } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', meetingId)
    .single()

  if (meetingError || !meeting) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
  }

  if (!meeting.content) {
    return NextResponse.json({ error: 'Meeting has no content to analyze' }, { status: 400 })
  }

  try {
    const openai = getOpenAIClient()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a meeting analyst. Analyze the meeting notes and extract:
1. Key decisions made (as a list)
2. Action items/todos with assignees if mentioned
3. Important keywords/topics

Respond in JSON format:
{
  "decisions": ["decision 1", "decision 2"],
  "todos": [{"task": "task description", "assignee": "name or null"}],
  "keywords": ["keyword1", "keyword2"]
}

Keep the language same as the input (Korean if input is Korean).`,
        },
        {
          role: 'user',
          content: meeting.content,
        },
      ],
      response_format: { type: 'json_object' },
    })

    const aiSummary = JSON.parse(completion.choices[0].message.content || '{}')

    // Update meeting with AI summary
    const { data: updatedMeeting, error: updateError } = await supabase
      .from('meetings')
      .update({ ai_summary: aiSummary })
      .eq('id', meetingId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      meeting: updatedMeeting,
      ai_summary: aiSummary,
    })
  } catch (error) {
    console.error('OpenAI API error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze meeting' },
      { status: 500 }
    )
  }
}
