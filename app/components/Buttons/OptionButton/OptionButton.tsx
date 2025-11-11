import styles from './OptionButton.module.css'
import OptionButtonText from './OptionButtonText'

interface OptionButtonProps {
  children: React.ReactNode
  onClick: () => void
  selected?: boolean
}

export default function OptionButton({ children, onClick, selected = false }: OptionButtonProps) {
  return (
    <button
      type="button"
      className={`${styles.optionButton} ${selected ? styles.selected : ''}`}
      onClick={onClick}
    >
      <OptionButtonText>{children}</OptionButtonText>
    </button>
  )
}
