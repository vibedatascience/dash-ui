import { NextResponse } from 'next/server'

const DASH_API_URL = process.env.DASH_API_URL || 'http://localhost:8000'

export async function POST(request) {
  try {
    const { message } = await request.json()

    // Call the Dash API
    const response = await fetch(`${DASH_API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Dash API error:', errorText)
      return NextResponse.json(
        { error: `API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Pass through response AND tool_calls
    return NextResponse.json({
      response: data.response,
      tool_calls: data.tool_calls || []
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
