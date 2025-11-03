import styles from './SuccessScreen.module.css'
import Button from '../Button/Button'

interface SuccessScreenProps {
  onReturnHome: () => void
}

export default function SuccessScreen({ onReturnHome }: SuccessScreenProps) {
  return (
    <div className={styles.successScreen}>
      <h2 className={styles.title}>Ваша заявка успешно отправлена!</h2>
      
      <p className={styles.message}>
        Мы уже приступили к подбору вариантов и свяжемся с вами через выбранный способ связи.
      </p>

      <div className={styles.buttonWrapper}>
        <Button onClick={onReturnHome}>
          Вернуться на главную
        </Button>
      </div>
    </div>
  )
}


