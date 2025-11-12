'use client'

import { useEffect, useState } from 'react'
import useResizeObserver from '@/app/hooks/useResizeObserver'
import styles from './OfferCard.module.css'
import MainButton from '../Buttons/MainButton/MainButton'

interface OfferCardProps {
  onStartClick: () => void
  isQuizOpen: boolean
  onHeightChange?: (height: number) => void
  onSessionStarted?: (token: string) => void
}

export default function OfferCard({
  onStartClick,
  isQuizOpen,
  onHeightChange,
  onSessionStarted,
}: OfferCardProps) {
  const { ref, height = 0 } = useResizeObserver<HTMLDivElement>()
  const [windowWidth, setWindowWidth] = useState(0)
  const [isStarting, setIsStarting] = useState(false)

  useEffect(() => {
    setWindowWidth(window.innerWidth)
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (height > 0 && onHeightChange) {
      onHeightChange(height)
    }
  }, [height, onHeightChange])

  const buttonMaxHeight = windowWidth > 0 && windowWidth <= 600 ? 44 : undefined
  const handleStartClick = async () => {
    if (isStarting) {
      return
    }

    try {
      setIsStarting(true)
      const response = await fetch('/api/quiz/start', {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        console.error('Failed to start quiz session')
        return
      }

      const data = await response.json()
      const token = data?.token

      if (typeof token !== 'string' || token.length === 0) {
        console.error('Quiz session token is missing in response')
        return
      }

      onSessionStarted?.(token)
      onStartClick()
    } catch (error) {
      console.error('Error starting quiz session', error)
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <div ref={ref} className={`${styles.offerCard} ${isQuizOpen ? styles.slideLeft : ''}`}>
      <h1 className={styles.title}>
        Подберите элитную недвижимость в Дубае под ваши цели и бюджет — за 1 минуту
      </h1>

      <h2 className={styles.subtitle}>
        Ответьте на несколько вопросов, и мы подберём лучшие варианты от застройщиков с актуальными
        ценами и рассрочкой 0%
      </h2>

      <MainButton
        onClick={handleStartClick}
        maxHeight={buttonMaxHeight}
        style={{ marginBottom: '12px' }}
        disabled={isStarting}
      >
        Начать подбор
      </MainButton>

      <h3 className={styles.features}>
        Без комиссии • Только проверенные застройщики • Юридическое сопровождение сделки •
        Сертификат DLD
      </h3>
    </div>
  )
}
