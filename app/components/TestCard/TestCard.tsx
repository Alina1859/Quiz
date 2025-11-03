import styles from './TestCard.module.css'
import Button from '../Button/Button'

interface TestCardProps {
  step: number
  totalSteps: number
  question: string
  options: string[]
  selectedOption: string | null
  onOptionSelect: (option: string) => void
  onNext: () => void
}

export default function TestCard({ 
  step, 
  totalSteps, 
  question, 
  options,
  selectedOption,
  onOptionSelect,
  onNext
}: TestCardProps) {
  return (
    <div className={styles.testCard}>
      <div className={styles.stepIndicator}>
        Шаг {step} из {totalSteps}
      </div>
      
      <h2 className={styles.question}>{question}</h2>
      
      <div className={styles.options}>
        {options.map((option, index) => (
          <button 
            key={index} 
            className={`${styles.optionButton} ${selectedOption === option ? styles.selected : ''}`}
            onClick={() => onOptionSelect(option)}
          >
            {option}
          </button>
        ))}
      </div>

      <div className={styles.buttonWrapper}>
        <Button onClick={onNext} disabled={!selectedOption}>
          Далее
        </Button>
      </div>
    </div>
  )
}

