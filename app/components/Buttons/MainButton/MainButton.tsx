import styles from './MainButton.module.css'
import MainButtonText from './MainButtonText'

interface MainButtonProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}

export default function MainButton({ children, onClick, disabled = false }: MainButtonProps) {
  return (
    <button 
      className={styles.button} 
      onClick={onClick}
      disabled={disabled}
    >
      <MainButtonText>{children}</MainButtonText>
    </button>
  )
}

