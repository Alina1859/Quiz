'use client'

import { useEffect, useState } from 'react'
import useResizeObserver from 'use-resize-observer'
import styles from './OfferCard.module.css'
import MainButton from '../Buttons/MainButton/MainButton'

interface OfferCardProps {
  onStartClick: () => void
  isQuizOpen: boolean
  onHeightChange?: (height: number) => void
}

export default function OfferCard({ onStartClick, isQuizOpen, onHeightChange }: OfferCardProps) {
  const { ref, height = 0 } = useResizeObserver<HTMLDivElement>()
  const [windowWidth, setWindowWidth] = useState(0)

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

  // Определяем maxHeight для кнопки на разрешении 768px
  const buttonMaxHeight = windowWidth > 0 && windowWidth <= 768 ? 44 : undefined

  return (
    <div ref={ref} className={`${styles.offerCard} ${isQuizOpen ? styles.slideLeft : ''}`}>
      <h1 className={styles.title}>
        Подберите элитную недвижимость в Дубае под ваши цели и бюджет — за 1 минуту
      </h1>
      
      <p className={styles.subtitle}>
        Ответьте на несколько вопросов, и мы подберём лучшие варианты от застройщиков с актуальными ценами и рассрочкой 0%
      </p>
      
      <MainButton onClick={onStartClick} maxHeight={buttonMaxHeight}>
        Начать подбор
      </MainButton>
      
      <p className={styles.features}>
        Без комиссии • Только проверенные застройщики • Юридическое сопровождение сделки • Сертификат DLD
      </p>
    </div>
  )
}

