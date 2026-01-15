import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Face Recognition Attendance System',
  description: 'AI-powered attendance system using face recognition',
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
