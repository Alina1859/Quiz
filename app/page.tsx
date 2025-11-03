'use client'

import { useState } from 'react'
import Image from 'next/image'
import styles from './page.module.css'
import OfferCard from './components/OfferCard/OfferCard'
import QuizPanel from './components/QuizPanel/QuizPanel'

export default function Home() {
  const [isQuizOpen, setIsQuizOpen] = useState(false)

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

  return (
    <main className={styles.main}>
      <div className={`${styles.backgroundContainer} ${isQuizOpen ? styles.slideLeft : ''}`}>
      </div>
      
      <div className={styles.logoContainer}>
        <Image
          src="/images/Logo.svg"
          alt="Logo"
          width={72}
          height={24}
          className={styles.logo}
        />
      </div>
      
      <OfferCard onStartClick={handleStartQuiz} isQuizOpen={isQuizOpen} />
      
      <QuizPanel isOpen={isQuizOpen} onClose={handleCloseQuiz} onReset={handleResetQuiz} />
    </main>
  )
}

