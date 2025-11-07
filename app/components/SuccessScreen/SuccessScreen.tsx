import styles from './SuccessScreen.module.css'
import MainButton from '../Buttons/MainButton/MainButton'

interface SuccessScreenProps {
  onReturnHome: () => void
}

export default function SuccessScreen({ onReturnHome }: SuccessScreenProps) {
  return (
    <div className={styles.successScreen}>
      <div className={styles.contentWrapper}>
        <img src="/icons/Success.svg" alt="Success" className={styles.successIcon} />
        <h2 className={styles.title}>Ваша заявка успешно отправлена!</h2>
      </div>

      <p className={styles.message}>
        Мы уже приступили к подбору вариантов и свяжемся с вами через выбранный способ связи.
      </p>

      <div className={styles.buttonWrapper}>
        <MainButton onClick={onReturnHome}>Вернуться на главную</MainButton>
      </div>
    </div>
  )
}
