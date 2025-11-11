import localFont from 'next/font/local'
import type { Metadata } from 'next'
import Script from 'next/script'
import './colors.css'
import './globals.css'

const bebasNeue = localFont({
  src: [{ path: '../public/fonts/BebasNeue-Bold.ttf', weight: '700', style: 'normal' }],
  variable: '--font-bebas-neue',
  display: 'swap',
  preload: true,
})

const interTight = localFont({
  src: [
    { path: '../public/fonts/InterTight-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../public/fonts/InterTight-SemiBold.ttf', weight: '600', style: 'normal' },
  ],
  variable: '--font-inter-tight',
  display: 'swap',
  preload: true,
})

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
    <html
      lang="ru"
      style={{ height: '100%' }}
      className={`${bebasNeue.variable} ${interTight.variable}`}
    >
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
