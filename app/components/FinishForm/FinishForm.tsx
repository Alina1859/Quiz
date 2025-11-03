'use client'

import { useState, useEffect, useRef } from 'react'
import styles from './FinishForm.module.css'
import Button from '../Button/Button'

// Динамический импорт для избежания SSR проблем
if (typeof window !== 'undefined') {
  const jQuery = require('jquery')
  require('country-select-js/build/js/countrySelect')
  window.$ = window.jQuery = jQuery
}

interface FinishFormProps {
  answers: Record<number, string>
  onSubmit: (data: {
    answers: Record<number, string>
    name: string
    phone: string
    contactMethod: string
  }) => Promise<void>
}

export default function FinishForm({ answers, onSubmit }: FinishFormProps) {
  const [name, setName] = useState('')
  const [phonePrefix, setPhonePrefix] = useState('+7')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [contactMethod, setContactMethod] = useState('')
  const countrySelectRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (name && phoneNumber && contactMethod) {
      // Объединяем код страны и номер
      const fullPhone = `${phonePrefix}${phoneNumber}`
      await onSubmit({
        answers,
        name,
        phone: fullPhone,
        contactMethod
      })
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && countrySelectRef.current) {
      const jQuery = require('jquery')
      const $countrySelect = jQuery(countrySelectRef.current)
      
      $countrySelect.countrySelect({
        defaultCountry: 'ru',
        preferredCountries: ['ru', 'kz', 'by', 'ua'],
        responsiveDropdown: true,
        onlyCountries: [] // Можно указать список стран или оставить пустым для всех
      })

      // Устанавливаем только код страны в поле (без возможности ввода номера)
      $countrySelect.on('change', function() {
        const countryData = $countrySelect.countrySelect('getSelectedCountryData')
        if (countryData && countryData.dialCode) {
          setPhonePrefix('+' + countryData.dialCode)
          // Устанавливаем только код страны в поле
          $countrySelect.val('+' + countryData.dialCode)
        }
      })

      // Изначально устанавливаем код России
      const initialCountryData = $countrySelect.countrySelect('getSelectedCountryData')
      if (initialCountryData && initialCountryData.dialCode) {
        const initialCode = '+' + initialCountryData.dialCode
        setPhonePrefix(initialCode)
        $countrySelect.val(initialCode)
      }

      // Предотвращаем ввод в поле с кодом страны
      $countrySelect.on('keydown', function(e: JQuery.Event) {
        e.preventDefault()
        return false
      })

      // Предотвращаем ввод через paste
      $countrySelect.on('paste', function(e: JQuery.Event) {
        e.preventDefault()
        return false
      })

      return () => {
        $countrySelect.off('change keydown paste')
        if ($countrySelect.data('countrySelect')) {
          $countrySelect.countrySelect('destroy')
        }
      }
    }
  }, [])

  const isFormValid = name.trim() !== '' && phonePrefix !== '' && phoneNumber.trim() !== '' && contactMethod !== ''

  return (
    <div className={styles.finishForm}>
      <h2 className={styles.title}>Подборка почти готова</h2>
      <p className={styles.subtitle}>
        Подберите подходящие варианты под мои цели и бюджет
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="name" className={styles.label}>Ваше имя</label>
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

        <div className={styles.phoneGroup}>
          <div className={styles.inputGroup}>
            <label htmlFor="countryCode" className={styles.label}>Код страны</label>
            <input
              ref={countrySelectRef}
              id="countryCode"
              type="tel"
              className={styles.countryCodeInput}
              readOnly
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="phone" className={styles.label}>Номер телефона</label>
            <input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
              className={styles.phoneInput}
              placeholder="999 123 45 67"
              required
            />
          </div>
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
          <Button onClick={handleSubmit} disabled={!isFormValid}>
            Получить подборку
          </Button>
        </div>
      </form>
    </div>
  )
}

