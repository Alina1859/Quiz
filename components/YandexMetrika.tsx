'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import ym, { YMInitializer } from 'react-yandex-metrika'

const YM_COUNTER_ID = 105288522

const YandexMetrika = () => {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname) {
      ym('hit', pathname)
    }
  }, [pathname])

  return (
    <YMInitializer
      accounts={[YM_COUNTER_ID]}
      options={{
        ssr: true,
        webvisor: true,
        clickmap: true,
        ecommerce: 'dataLayer',
        accurateTrackBounce: true,
        trackLinks: true,
      }}
    />
  )
}

export default YandexMetrika