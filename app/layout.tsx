import type { Metadata } from 'next'
import Script from 'next/script'
import './colors.css'
import './globals.css'

export const metadata: Metadata = {
  title: 'Quiz API',
  description: 'Quiz API Backend',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 'reCAPTCHA_site_key'

  return (
    <html lang="ru" style={{ height: '100%' }}>
      <body style={{ height: '100%', margin: 0, padding: 0, overflowY: 'auto' }}>
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`}
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  )
}
