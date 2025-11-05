import styles from './MainButton.module.css'
import MainButtonText from './MainButtonText'

interface MainButtonProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  maxHeight?: number | string
  className?: string
}

export default function MainButton({ 
  children, 
  onClick, 
  disabled = false, 
  type = 'button',
  maxHeight,
  className
}: MainButtonProps) {
  const style = maxHeight ? { maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight } : undefined

  return (
    <button 
      className={`${styles.button} ${className || ''}`}
      style={style}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      <MainButtonText>{children}</MainButtonText>
    </button>
  )
}

