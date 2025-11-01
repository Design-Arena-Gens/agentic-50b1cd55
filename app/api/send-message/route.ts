import { NextRequest, NextResponse } from 'next/server'

// In-memory storage for demo purposes
let messageStore: any[] = []

async function generateMessage(messageType: string, context: string): Promise<string> {
  const openaiKey = process.env.OPENAI_API_KEY
  const yourName = process.env.YOUR_NAME || 'the business owner'
  const yourBusiness = process.env.YOUR_BUSINESS || 'our business'

  // If OpenAI is configured, use it
  if (openaiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are ${yourName} from ${yourBusiness}. Write SMS messages in a friendly, professional tone that sounds natural and personal. Keep messages concise (under 160 characters when possible). Sign off with your name.`
            },
            {
              role: 'user',
              content: `Write a ${messageType} message with this context: ${context}`
            }
          ],
          max_tokens: 150,
          temperature: 0.7,
        }),
      })

      const data = await response.json()
      return data.choices[0].message.content.trim()
    } catch (error) {
      console.error('OpenAI error:', error)
      // Fall through to template-based generation
    }
  }

  // Template-based message generation (fallback)
  const templates: Record<string, string> = {
    followup: `Hi! Following up on ${context}. Let me know if you have any questions or if there's anything I can help with. - ${yourName}`,
    reminder: `Hey! Just a friendly reminder about ${context}. Looking forward to connecting! - ${yourName}`,
    greeting: `Hi there! ${context} Hope you're doing well! - ${yourName}`,
    thankyou: `Thank you so much! ${context} Really appreciate it! - ${yourName}`,
    update: `Quick update: ${context} Let me know if you need anything else. - ${yourName}`,
    custom: context,
  }

  return templates[messageType] || templates.custom
}

async function sendSMS(to: string, message: string): Promise<{ success: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER

  // Check if Twilio is configured
  if (!accountSid || !authToken || !fromNumber) {
    console.log('Twilio not configured, running in demo mode')
    return { success: true } // Demo mode
  }

  try {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${auth}`,
        },
        body: new URLSearchParams({
          To: to,
          From: fromNumber,
          Body: message,
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Twilio error:', error)
      return { success: false, error: 'Failed to send SMS' }
    }

    return { success: true }
  } catch (error) {
    console.error('SMS sending error:', error)
    return { success: false, error: 'Network error' }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, messageContext, messageType } = await request.json()

    if (!phoneNumber || !messageContext) {
      return NextResponse.json(
        { error: 'Phone number and context are required' },
        { status: 400 }
      )
    }

    // Generate the message
    const message = await generateMessage(messageType, messageContext)

    // Send the SMS
    const result = await sendSMS(phoneNumber, message)

    // Store the message
    const messageRecord = {
      id: Date.now().toString(),
      recipient: phoneNumber,
      content: message,
      timestamp: new Date().toISOString(),
      status: result.success ? 'sent' : 'failed',
    }
    messageStore.push(messageRecord)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send message' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Message sent successfully! "${message}"`,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
