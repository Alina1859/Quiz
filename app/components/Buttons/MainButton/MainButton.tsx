import styles from './MainButton.module.css'
import MainButtonText from './MainButtonText'

interface MainButtonProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  maxHeight?: number | string
  className?: string
  style?: React.CSSProperties
}

export default function MainButton({
  children,
  onClick,
  disabled = false,
  type = 'button',
  maxHeight,
  className,
  style,
}: MainButtonProps) {
  const computedStyle: React.CSSProperties = {
    ...(maxHeight
      ? { maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }
      : {}),
    ...style,
  }

  return (
    <button
      className={`${styles.button} ${className || ''}`}
      style={Object.keys(computedStyle).length > 0 ? computedStyle : undefined}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      <MainButtonText>{children}</MainButtonText>
    </button>
  )
}
