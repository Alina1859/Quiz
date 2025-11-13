'use client'

import { useState, useEffect } from 'react'
import useResizeObserver from '@/app/hooks/useResizeObserver'
import styles from './QuizPanel.module.css'
import TestCard from '../TestCard/TestCard'
import ContactForm from '../ContactForm/ContactForm'
import SuccessScreen from '../SuccessScreen/SuccessScreen'
import { useFingerprint } from '@/app/hooks/useFingerprint'
import ym from 'react-yandex-metrika'

interface QuizPanelProps {
  isOpen: boolean
  onClose: () => void
  onReset: () => void
  sessionToken: string | null
  onHeightChange?: (height: number) => void
}

interface Question {
  id: number
  text: string
  options: string[]
}

export default function QuizPanel({
  isOpen,
  onClose,
  onReset,
  sessionToken,
  onHeightChange,
}: QuizPanelProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isFinished, setIsFinished] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { ref, height = 0 } = useResizeObserver<HTMLDivElement>()
  const { fingerprintData } = useFingerprint(isOpen)

  useEffect(() => {
    if (isOpen) {
      fetchQuestions()
      setCurrentStep(1)
      setAnswers({})
      setSelectedOption(null)
      setIsFinished(false)
      setIsSuccess(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (height > 0 && onHeightChange && isOpen) {
      onHeightChange(height)
    }
  }, [height, onHeightChange, isOpen])

  useEffect(() => {
    const currentQuestionId = questions[currentStep - 1]?.id
    setSelectedOption(currentQuestionId ? answers[currentQuestionId] || null : null)
  }, [currentStep, questions, answers])

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/questions')
      const data = await response.json()
      setQuestions(data.questions || [])
    } catch (error) {
      console.error('Error fetching questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option)
    const currentQuestionId = questions[currentStep - 1]?.id
    if (currentQuestionId) {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestionId]: option,
      }))
    }
  }

  const handleNext = () => {
    if (selectedOption && currentStep < questions.length) {
      setCurrentStep((prev) => prev + 1)
    } else if (selectedOption && currentStep === questions.length) {
      setIsFinished(true)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSubmit = async (data: {
    answers: Record<number, string>
    name: string
    phone: string
    contactMethod: string
    recaptchaToken: string
  }) => {
    try {
      setSubmitting(true)

      const orderedAnswers: Record<number, string> = {}
      questions.forEach((question, index) => {
        if (data.answers[question.id]) {
          orderedAnswers[question.id] = data.answers[question.id]
        }
      })

      if (!sessionToken) {
        console.error('Quiz session token is missing')
        return
      }

      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          answers: orderedAnswers,
          name: data.name,
          phone: data.phone,
          contactMethod: data.contactMethod,
          recaptchaToken: data.recaptchaToken,
          fingerprintData: fingerprintData,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Quiz submitted successfully:', result)
        setIsSuccess(true)
        
        if (typeof window !== 'undefined') {
          const answersCount = Object.keys(orderedAnswers).length
          ym('reachGoal','QUIZ_SUBMIT')
          // ym('reachGoal', 'form_submit', {
          //   contactMethod: data.contactMethod,
          //   answersCount: answersCount,
          //   questionsCount: questions.length,
          // })
        }
      } else {
        console.error('Failed to submit quiz')
      }
    } catch (error) {
      console.error('Error submitting quiz:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReturnHome = () => {
    setCurrentStep(1)
    setAnswers({})
    setSelectedOption(null)
    setIsFinished(false)
    setIsSuccess(false)
    onReset()
    onClose()
  }

  if (!isOpen) return null

  const totalSteps = questions.length
  const currentQuestion = questions[currentStep - 1]

  return (
    <div ref={ref} className={styles.quizPanel}>
      <div className={styles.panelContent}>
        {loading ? (
          <div className={styles.loading}>Загрузка...</div>
        ) : isSuccess ? (
          <SuccessScreen onReturnHome={handleReturnHome} />
        ) : isFinished ? (
          <ContactForm answers={answers} onSubmit={handleSubmit} />
        ) : currentQuestion ? (
          <TestCard
            step={currentStep}
            totalSteps={totalSteps}
            question={currentQuestion.text}
            options={currentQuestion.options}
            selectedOption={selectedOption}
            onOptionSelect={handleOptionSelect}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        ) : (
          <div className={styles.error}>Вопросы не найдены</div>
        )}
      </div>
    </div>
  )
}
