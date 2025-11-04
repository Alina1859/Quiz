'use client'

import { useState } from 'react'
import PhoneInput from 'react-phone-input-2'
import styles from './ContactForm.module.css'
import MainButton from '../Buttons/MainButton/MainButton'

interface ContactFormProps {
  answers: Record<number, string>
  onSubmit: (data: {
    answers: Record<number, string>
    name: string
    phone: string
    contactMethod: string
  }) => Promise<void>
}

export default function ContactForm({ answers, onSubmit }: ContactFormProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [contactMethod, setContactMethod] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (name && phone && contactMethod) {
      await onSubmit({
        answers,
        name,
        phone,
        contactMethod
      })
    }
  }

  const isFormValid = name.trim() !== '' && phone.trim() !== '' && contactMethod !== ''

  return (
    <div className={styles.contactForm}>
      <h2 className={styles.subtitle}>Подборка почти готова</h2>
      <p className={styles.title}>
        Подберите подходящие варианты под мои цели и бюджет
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
            placeholder="Введите ваше имя"
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <PhoneInput
            country={'ru'}
            value={phone}
            onChange={(value) => setPhone(value)}
            inputClass={styles.phoneInput}
            buttonClass={styles.phoneButton}
            containerClass={styles.phoneContainer}
            dropdownClass={styles.phoneDropdown}
            preferredCountries={['ru', 'kz', 'by', 'ua']}
            inputProps={{
              required: true,
              placeholder: 'Введите номер телефона'
            }}
          />
        </div>

        <div className={styles.contactMethods}>
          <label className={styles.label}>Способ связи</label>
          <div className={styles.methodButtons}>
            <button
              type="button"
              className={`${styles.methodButton} ${contactMethod === 'call' ? styles.selected : ''}`}
              onClick={() => setContactMethod('call')}
            >
              Позвонить
            </button>
            <button
              type="button"
              className={`${styles.methodButton} ${contactMethod === 'whatsapp' ? styles.selected : ''}`}
              onClick={() => setContactMethod('whatsapp')}
            >
              Написать в WhatsApp
            </button>
            <button
              type="button"
              className={`${styles.methodButton} ${contactMethod === 'telegram' ? styles.selected : ''}`}
              onClick={() => setContactMethod('telegram')}
            >
              Написать в Telegram
            </button>
          </div>
        </div>

        <div className={styles.submitButton}>
          <MainButton onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)} disabled={!isFormValid}>
            Получить подборку
          </MainButton>
        </div>
      </form>
    </div>
  )
}
