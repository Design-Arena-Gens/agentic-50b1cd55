'use client'

import { useState, useEffect } from 'react'

interface Message {
  id: string
  recipient: string
  content: string
  timestamp: string
  status: string
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('send')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [messageContext, setMessageContext] = useState('')
  const [messageType, setMessageType] = useState('followup')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ type: string; message: string } | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [stats, setStats] = useState({ total: 0, sent: 0, failed: 0 })

  useEffect(() => {
    if (activeTab === 'history') {
      fetchMessages()
    }
  }, [activeTab])

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages')
      const data = await response.json()
      setMessages(data.messages || [])
      setStats(data.stats || { total: 0, sent: 0, failed: 0 })
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          messageContext,
          messageType,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ type: 'success', message: data.message })
        setPhoneNumber('')
        setMessageContext('')
      } else {
        setResult({ type: 'error', message: data.error || 'Failed to send message' })
      }
    } catch (error) {
      setResult({ type: 'error', message: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1>📱 SMS Agent</h1>
        <p>AI-powered messaging that texts your customers like you</p>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'send' ? 'active' : ''}`}
          onClick={() => setActiveTab('send')}
        >
          Send Message
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Message History
        </button>
        <button
          className={`tab ${activeTab === 'setup' ? 'active' : ''}`}
          onClick={() => setActiveTab('setup')}
        >
          Setup
        </button>
      </div>

      {activeTab === 'send' && (
        <div className="card">
          <h2 style={{ marginBottom: '1.5rem', color: '#667eea' }}>Send a Message</h2>

          {result && (
            <div className={`message ${result.type}`}>
              {result.message}
            </div>
          )}

          <form onSubmit={handleSendMessage}>
            <div className="form-group">
              <label htmlFor="phoneNumber">Customer Phone Number</label>
              <input
                type="tel"
                id="phoneNumber"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="messageType">Message Type</label>
              <select
                id="messageType"
                value={messageType}
                onChange={(e) => setMessageType(e.target.value)}
              >
                <option value="followup">Follow-up</option>
                <option value="reminder">Reminder</option>
                <option value="greeting">Greeting</option>
                <option value="thankyou">Thank You</option>
                <option value="update">Update</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="messageContext">Context / Details</label>
              <textarea
                id="messageContext"
                placeholder="E.g., 'Following up on their website project inquiry from last week' or 'Reminder about their appointment tomorrow at 2pm'"
                value={messageContext}
                onChange={(e) => setMessageContext(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="button" disabled={loading}>
              {loading ? 'Generating & Sending...' : '🚀 Generate & Send Message'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'history' && (
        <>
          <div className="grid">
            <div className="stat-card">
              <div className="value">{stats.total}</div>
              <div className="label">Total Messages</div>
            </div>
            <div className="stat-card">
              <div className="value">{stats.sent}</div>
              <div className="label">Successfully Sent</div>
            </div>
            <div className="stat-card">
              <div className="value">{stats.failed}</div>
              <div className="label">Failed</div>
            </div>
          </div>

          <div className="card">
            <h2 style={{ marginBottom: '1.5rem', color: '#667eea' }}>Message History</h2>
            <div className="messages-list">
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                  No messages sent yet
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="message-item">
                    <div className="timestamp">{new Date(msg.timestamp).toLocaleString()}</div>
                    <div className="recipient">To: {msg.recipient}</div>
                    <div className="content">{msg.content}</div>
                    <div style={{ fontSize: '0.85rem', color: msg.status === 'sent' ? '#28a745' : '#dc3545', marginTop: '0.5rem' }}>
                      Status: {msg.status}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'setup' && (
        <div className="card">
          <h2 style={{ marginBottom: '1.5rem', color: '#667eea' }}>Setup Instructions</h2>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', color: '#555' }}>1. Twilio Configuration</h3>
            <p style={{ marginBottom: '0.5rem', color: '#666' }}>
              You need a Twilio account to send SMS messages. Follow these steps:
            </p>
            <ol style={{ marginLeft: '1.5rem', color: '#666', lineHeight: '1.8' }}>
              <li>Sign up for Twilio at <a href="https://www.twilio.com/try-twilio" target="_blank" style={{ color: '#667eea' }}>twilio.com/try-twilio</a></li>
              <li>Get a phone number from the Twilio Console</li>
              <li>Find your Account SID and Auth Token in the Console Dashboard</li>
              <li>Set environment variables: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER</li>
            </ol>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', color: '#555' }}>2. OpenAI Configuration (Optional)</h3>
            <p style={{ marginBottom: '0.5rem', color: '#666' }}>
              For AI-powered message generation:
            </p>
            <ol style={{ marginLeft: '1.5rem', color: '#666', lineHeight: '1.8' }}>
              <li>Get an API key from <a href="https://platform.openai.com/api-keys" target="_blank" style={{ color: '#667eea' }}>platform.openai.com</a></li>
              <li>Set environment variable: OPENAI_API_KEY</li>
            </ol>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', color: '#555' }}>3. Environment Variables</h3>
            <p style={{ marginBottom: '0.5rem', color: '#666' }}>
              Set these in your Vercel project settings or .env.local file:
            </p>
            <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '0.5rem', overflow: 'auto', fontSize: '0.9rem' }}>
{`TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
OPENAI_API_KEY=your_openai_api_key
YOUR_NAME=Your Name
YOUR_BUSINESS=Your Business Name`}
            </pre>
          </div>

          <div className="message info">
            <strong>Note:</strong> This application is currently in demo mode. Configure your Twilio and OpenAI credentials to enable full functionality.
          </div>
        </div>
      )}
    </div>
  )
}
