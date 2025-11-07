import styles from './BackButton.module.css'
import Image from 'next/image'

interface BackButtonProps {
  onClick: () => void
  disabled?: boolean
}

export default function BackButton({ onClick, disabled = false }: BackButtonProps) {
  return (
    <button className={styles.backButton} onClick={onClick} disabled={disabled}>
      <Image src="/icons/ArrowBack.svg" alt="Назад" width={8} height={14} />
    </button>
  )
}
