import styles from './TestCard.module.css'
import MainButton from '../Buttons/MainButton/MainButton'
import OptionButton from '../Buttons/OptionButton/OptionButton'
import BackButton from '../Buttons/BackButton/BackButton'

interface TestCardProps {
  step: number
  totalSteps: number
  question: string
  options: string[]
  selectedOption: string | null
  onOptionSelect: (option: string) => void
  onNext: () => void
  onPrevious?: () => void
}

export default function TestCard({ 
  step, 
  totalSteps, 
  question, 
  options,
  selectedOption,
  onOptionSelect,
  onNext,
  onPrevious
}: TestCardProps) {
  return (
    <div className={styles.testCard}>
      <div className={styles.contentWrapper}>
        <div className={styles.stepIndicator}>
          Шаг {step} из {totalSteps}
        </div>
        
        <h2 className={styles.question}>{question}</h2>
        
        <div className={styles.options}>
          {options.map((option, index) => (
            <OptionButton
              key={index}
              onClick={() => onOptionSelect(option)}
              selected={selectedOption === option}
            >
              {option}
            </OptionButton>
          ))}
        </div>
      </div>

      <div className={styles.buttonWrapper}>
        {step > 1 && onPrevious ? (
          <div className={styles.buttonsContainer}>
            <BackButton onClick={onPrevious} />
            <MainButton onClick={onNext} disabled={!selectedOption}>
              Дальше
            </MainButton>
          </div>
        ) : (
          <MainButton onClick={onNext} disabled={!selectedOption}>
            Дальше
          </MainButton>
        )}
      </div>
    </div>
  )
}

