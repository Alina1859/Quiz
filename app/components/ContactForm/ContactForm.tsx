'use client'

import { useState } from 'react'
import styles from './ContactForm.module.css'
import MainButton from '../Buttons/MainButton/MainButton'
import OptionButton from '../Buttons/OptionButton/OptionButton'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { isValidPhoneNumber } from 'react-phone-number-input'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { PhoneInput } from '@/components/ui/phone-input'
import { Spinner } from '@/components/ui/spinner'

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void
      execute: (siteKey: string, options: { action: string }) => Promise<string>
    }
  }
}

interface ContactFormProps {
  answers: Record<number, string>
  onSubmit: (data: {
    answers: Record<number, string>
    name: string
    phone: string
    contactMethod: string
    recaptchaToken: string
  }) => Promise<void>
}

const FormSchema = z.object({
  name: z.string().min(1, { message: 'Введите ваше имя' }),
  phone: z.string().refine(isValidPhoneNumber, { message: 'Неверный номер телефона' }),
  contactMethod: z.string().min(1, { message: 'Выберите способ связи' }),
})

export default function ContactForm({ answers, onSubmit: onSubmitProp }: ContactFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    mode: 'onSubmit',
    defaultValues: {
      name: '',
      phone: '',
      contactMethod: '',
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const isValid = await form.trigger()
    if (!isValid) return

    setIsLoading(true)
    const formData = form.getValues()
    const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 'reCAPTCHA_site_key'

    try {
      const token = await new Promise<string>((resolve, reject) => {
        if (typeof window !== 'undefined' && window.grecaptcha) {
          window.grecaptcha.ready(() => {
            window.grecaptcha
              .execute(recaptchaSiteKey, { action: 'submit' })
              .then(resolve)
              .catch(reject)
          })
        } else {
          reject(new Error('reCAPTCHA не загружен'))
        }
      })

      await onSubmitProp({
        answers,
        name: formData.name,
        phone: formData.phone,
        contactMethod: formData.contactMethod,
        recaptchaToken: token,
      })
    } catch (error) {
      console.error('Ошибка reCAPTCHA:', error)
      setIsLoading(false)
    }
  }

  const contactMethod = form.watch('contactMethod') || ''
  const isFormValid = form.formState.isValid && contactMethod !== ''
  const errors = form.formState.errors

  return (
    <div className={styles.contactForm}>
      <h2 className={styles.subtitle}>Подборка почти готова</h2>
      <p className={styles.title}>Подберите подходящие варианты под мои цели и бюджет</p>

      <Form {...form}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className={styles.formItem}>
                  <FormControl>
                    <input
                      autoComplete="off"
                      {...field}
                      type="text"
                      className={`${styles.input} ${errors.name ? styles.error : ''}`}
                      placeholder="Ваше имя"
                    />
                  </FormControl>
                  <FormMessage className={styles.errorMessage} />
                </FormItem>
              )}
            />
          </div>

          <div className={styles.inputGroup}>
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem className={styles.formItem}>
                  <FormControl>
                    <PhoneInput
                      placeholder="Введите номер телефона"
                      value={field.value as any}
                      onChange={(value) => {
                        field.onChange(value || '')
                      }}
                      onBlur={field.onBlur}
                      hasError={!!errors.phone}
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormMessage className={styles.errorMessage} />
                </FormItem>
              )}
            />
          </div>

          <div className={styles.contactMethods}>
            <OptionButton
              onClick={() => form.setValue('contactMethod', 'call')}
              selected={contactMethod === 'call'}
            >
              Позвонить
            </OptionButton>
            <OptionButton
              onClick={() => form.setValue('contactMethod', 'whatsapp')}
              selected={contactMethod === 'whatsapp'}
            >
              Написать в WhatsApp
            </OptionButton>
            <OptionButton
              onClick={() => form.setValue('contactMethod', 'telegram')}
              selected={contactMethod === 'telegram'}
            >
              Написать в Telegram
            </OptionButton>
          </div>
          <FormField
            control={form.control}
            name="contactMethod"
            render={() => (
              <FormItem className={styles.formItem}>
                <FormMessage className={styles.errorMessage} />
              </FormItem>
            )}
          />

          <div className={styles.submitButton}>
            <MainButton type="submit" disabled={!isFormValid || isLoading}>
              {isLoading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <Spinner />
                  Loading...
                </span>
              ) : (
                'Получить подборку'
              )}
            </MainButton>
            <p className={styles.consentText}>
              Нажимая кнопку, я соглашаюсь на{' '}
              <a
                href="https://uaeinvest.ru/consert"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.consentLink}
              >
                обработку персональных данных
              </a>
            </p>
          </div>
        </form>
      </Form>
    </div>
  )
}
