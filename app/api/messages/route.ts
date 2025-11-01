import { NextResponse } from 'next/server'

// In-memory storage (shared with send-message route)
let messageStore: any[] = []

export async function GET() {
  const stats = {
    total: messageStore.length,
    sent: messageStore.filter(m => m.status === 'sent').length,
    failed: messageStore.filter(m => m.status === 'failed').length,
  }

  return NextResponse.json({
    messages: messageStore.slice().reverse(), // Most recent first
    stats,
  })
}
