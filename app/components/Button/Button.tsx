import styles from './Button.module.css'
import ButtonText from './ButtonText'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}

export default function Button({ children, onClick, disabled = false }: ButtonProps) {
  return (
    <button 
      className={styles.startButton} 
      onClick={onClick}
      disabled={disabled}
    >
      <ButtonText>{children}</ButtonText>
    </button>
  )
}

