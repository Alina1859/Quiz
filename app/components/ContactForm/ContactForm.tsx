'use client'

import styles from './ContactForm.module.css'
import MainButton from '../Buttons/MainButton/MainButton'
import OptionButton from '../Buttons/OptionButton/OptionButton'
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { isValidPhoneNumber } from "react-phone-number-input";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { PhoneInput } from "@/components/ui/phone-input";

interface ContactFormProps {
  answers: Record<number, string>
  onSubmit: (data: {
    answers: Record<number, string>
    name: string
    phone: string
    contactMethod: string
  }) => Promise<void>
}

const FormSchema = z.object({
  name: z.string().min(1, { message: "Введите ваше имя" }),
  phone: z
    .string()
    .refine(isValidPhoneNumber, { message: "Неверный номер телефона" }),
  contactMethod: z.string().min(1, { message: "Выберите способ связи" }),
});

export default function ContactForm({ answers, onSubmit: onSubmitProp }: ContactFormProps) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      phone: "",
      contactMethod: "",
    },
  });

  const handleSubmit = async (data: z.infer<typeof FormSchema>) => {
    await onSubmitProp({
      answers,
      name: data.name,
      phone: data.phone,
      contactMethod: data.contactMethod
    })
  }

  const contactMethod = form.watch('contactMethod') || ''
  const isFormValid = form.formState.isValid && contactMethod !== ''

  return (
    <div className={styles.contactForm}>
      <h2 className={styles.subtitle}>Подборка почти готова</h2>
      <p className={styles.title}>
        Подберите подходящие варианты под мои цели и бюджет
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className={styles.form}>
          <div className={styles.inputGroup}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <input
                      {...field}
                      type="text"
                      className={styles.input}
                      placeholder="Ваше имя"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className={styles.inputGroup}>
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <PhoneInput 
                      placeholder="Введите номер телефона" 
                      value={field.value as any}
                      onChange={(value) => field.onChange(value || "")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className={styles.contactMethods}>
            <div className={styles.methodButtons}>
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
                <FormItem>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className={styles.submitButton}>
            <MainButton type="submit" disabled={!isFormValid}>
              Получить подборку
            </MainButton>
            <p className={styles.consentText}>
              Нажимая кнопку, я соглашаюсь на{' '}
              <a href="#" className={styles.consentLink}>обработку персональных данных</a>
            </p>
          </div>
        </form>
      </Form>
    </div>
  )
}
