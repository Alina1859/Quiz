'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import styles from './page.module.css'
import OfferCard from './components/OfferCard/OfferCard'
import QuizPanel from './components/QuizPanel/QuizPanel'

export default function Home() {
  const [isQuizOpen, setIsQuizOpen] = useState(false)
  const [offerCardHeight, setOfferCardHeight] = useState(0)
  const [windowWidth, setWindowWidth] = useState(0)

  useEffect(() => {
    // Устанавливаем начальную ширину
    setWindowWidth(window.innerWidth)

    // Отслеживаем изменение ширины окна
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleStartQuiz = () => {
    setIsQuizOpen(true)
  }

  const handleCloseQuiz = () => {
    setIsQuizOpen(false)
  }

  const handleResetQuiz = () => {
    setIsQuizOpen(false)
    // Состояние сбросится автоматически в QuizPanel при закрытии
  }

  const handleOfferCardHeightChange = (height: number) => {
    setOfferCardHeight(height)
  }

  // Вычисляем высоту backgroundContainer для экранов < 1200px
  // Учитываем паддинг OfferCard (20px сверху + 20px снизу = 40px)
  const offerCardPadding = 40 // 20px сверху + 20px снизу
  const backgroundContainerStyle = windowWidth > 0 && windowWidth < 1200 && offerCardHeight > 0
    ? { height: `calc(100vh - ${offerCardHeight}px - ${offerCardPadding}px + 12px)` }
    : undefined

  return (
    <>
      <svg style={{ visibility: 'hidden', position: 'absolute' }} width="0" height="0" xmlns="http://www.w3.org/2000/svg" version="1.1">
        <defs>
          <filter id="round">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />    
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
          </filter>
        </defs>
      </svg>
      <main className={styles.main}>
        <div 
          className={`${styles.backgroundContainer} ${isQuizOpen ? styles.slideLeft : ''}`}
          style={backgroundContainerStyle}
        >
        </div>
        
        <div className={styles.logoContainer} onClick={handleResetQuiz}>
          <Image
            src="/images/Logo.svg"
            alt="Logo"
            width={72}
            height={24}
            className={styles.logo}
          />
        </div>
        
        <OfferCard 
          onStartClick={handleStartQuiz} 
          isQuizOpen={isQuizOpen}
          onHeightChange={handleOfferCardHeightChange}
        />
        
        <QuizPanel isOpen={isQuizOpen} onClose={handleCloseQuiz} onReset={handleResetQuiz} />
      </main>
    </>
  )
}

