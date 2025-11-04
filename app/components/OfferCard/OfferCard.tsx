import styles from './OfferCard.module.css'
import MainButton from '../Buttons/MainButton/MainButton'

interface OfferCardProps {
  onStartClick: () => void
  isQuizOpen: boolean
}

export default function OfferCard({ onStartClick, isQuizOpen }: OfferCardProps) {
  return (
    <div className={`${styles.offerCard} ${isQuizOpen ? styles.slideLeft : ''}`}>
      <h1 className={styles.title}>
        Подберите элитную недвижимость в Дубае под ваши цели и бюджет — за 1 минуту
      </h1>
      
      <p className={styles.subtitle}>
        Ответьте на несколько вопросов, и мы подберём лучшие варианты от застройщиков с актуальными ценами и рассрочкой 0%
      </p>
      
      <MainButton onClick={onStartClick}>Начать подбор</MainButton>
      
      <p className={styles.features}>
        Без комиссии • Только проверенные застройщики •
      </p>
      <p className={styles.features}>
        Юридическое сопровождение сделки • Сертификат DLD
      </p>
    </div>
  )
}

