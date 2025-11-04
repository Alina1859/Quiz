import styles from './MainButtonText.module.css'

interface MainButtonTextProps {
  children: React.ReactNode
}

export default function MainButtonText({ children }: MainButtonTextProps) {
  return <span className={styles.buttonText}>{children}</span>
}

