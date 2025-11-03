import styles from './ButtonText.module.css'

interface ButtonTextProps {
  children: React.ReactNode
}

export default function ButtonText({ children }: ButtonTextProps) {
  return <span className={styles.buttonText}>{children}</span>
}

