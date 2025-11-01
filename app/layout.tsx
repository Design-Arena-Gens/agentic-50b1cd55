import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SMS Agent - Automated Customer Texting',
  description: 'AI agent that texts your customers and clients like you',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
