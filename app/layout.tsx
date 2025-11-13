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
  title: 'Купить квартиру в Дубае | ОАЭ от застройщика',
  description:
    'Недвижимость Дубая напрямую от застройщиков. Рассрочка 0% до 7 лет. Вся база недвижимости ОАЭ',
  verification: {
    yandex: "8dea18e78f02a1d4"
  },
  openGraph: {
    title: 'DDA Real Estate — Недвижимость ОАЭ от застройщиков',
    description:
      'Подберём элитную недвижимость в Дубае под ваши цели и бюджет. Рассрочка до 7 лет, работаем напрямую с застройщиками.',
    url: 'https://dda-real-estate.example.com',
    siteName: 'DDA Real Estate',
    locale: 'ru_RU',
    type: 'website',
    images: [
      {
        url: '/favicon/web-app-manifest-512x512.png',
        width: 1200,
        height: 630,
        alt: 'DDA Real Estate — Недвижимость в Дубае',
      },
    ],
  },
  icons: {
    icon: [
      { url: '/favicon/favicon.ico' },
      { url: '/favicon/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [{ url: '/favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/favicon/favicon.ico'],
  },
  manifest: '/favicon/site.webmanifest',
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
    <Script>
      {`    (function(m, e, t, r, i, k, a) {
  m[i] = m[i] || function() {
    (m[i].a = m[i].a || []).push(arguments)
  }
  m[i].l = 1 * new Date()
  for (var j = 0; j < document.scripts.length; j++) {
    if (document.scripts[j].src === r) {
      return
    }
  }
  k = e.createElement(t), a = e.getElementsByTagName(t)[0], k.async = 1, k.src = r, a.parentNode.insertBefore(k, a)
})(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=105288522', 'ym')
ym(105288522, 'init', {
  ssr: true,
  webvisor: true,
  clickmap: true,
  ecommerce: 'dataLayer',
  accurateTrackBounce: true,
  trackLinks: true,
})`}
    </Script>
    <noscript>
      <div>
        <img
          src={`https://mc.yandex.ru/watch/105288522`}
          style={{ position: "absolute", left: "-9999px;" }}
          alt=""
        />
      </div>
    </noscript>
    {children}
    </body>
    </html>
  )
}
