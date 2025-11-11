import styles from './OptionButtonText.module.css'

interface OptionButtonTextProps {
  children: React.ReactNode
}

export default function OptionButtonText({ children }: OptionButtonTextProps) {
  return <span className={styles.buttonText}>{children}</span>
}
