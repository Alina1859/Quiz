import { useState } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { CardDataProps } from '@/types/admin'

const FIELD_CONFIG = [
  { key: 'visitorId', label: 'Visitor ID' },
  { key: 'userAgent', label: 'User Agent' },
  { key: 'language', label: 'Язык' },
  { key: 'platform', label: 'Платформа' },
  { key: 'hardwareConcurrency', label: 'Потоки CPU' },
  { key: 'screen', label: 'Экран' },
  { key: 'timezone', label: 'Часовой пояс' },
  { key: 'gpuVendor', label: 'GPU Vendor' },
  { key: 'gpuRenderer', label: 'GPU Renderer' },
  { key: 'ipAddress', label: 'IP адрес' },
  { key: 'phone', label: 'Телефон' },
  { key: 'recaptchaVerified', label: 'reCAPTCHA' },
  { key: 'fingerprint', label: 'Fingerprint' },
  { key: 'timestamp', label: 'Последнее обновление' },
] as const

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isEmptyValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return true
  if (typeof value === 'string' && value.trim() === '') return true
  return false
}

const normalizeValue = (key: string, value: unknown): string => {
  if (isEmptyValue(value)) return '—'

  if (key === 'timestamp') {
    const date = new Date(String(value))
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    }
  }

  if (key === 'recaptchaVerified' && typeof value === 'boolean') {
    return value ? 'Не бот' : 'Бот'
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

const getComponentValue = (components: Record<string, unknown> | undefined, key: string) => {
  if (!components) return undefined
  const candidate = components[key]
  if (isRecord(candidate) && 'value' in candidate) {
    return (candidate as Record<string, unknown>).value
  }
  return candidate
}

const resolveDeviceInfoValue = (
  key: (typeof FIELD_CONFIG)[number]['key'],
  submission: CardDataProps['submissions'][number] | undefined,
  fingerprintSource: Record<string, unknown> | null
) => {
  const componentsRaw = fingerprintSource ? fingerprintSource['components'] : undefined
  const components = isRecord(componentsRaw)
    ? (componentsRaw as Record<string, unknown>)
    : undefined
  const directValue = fingerprintSource?.[key]
  if (!isEmptyValue(directValue)) {
    return directValue
  }

  const componentValue = getComponentValue(components, key)
  if (!isEmptyValue(componentValue)) {
    return componentValue
  }

  if (key === 'userAgent') {
    return submission?.userAgent ?? componentValue
  }

  if (key === 'visitorId' && typeof submission?.fingerprint === 'string') {
    return submission.fingerprint
  }

  if (key === 'ipAddress') {
    return submission?.ipAddress ?? componentValue
  }

  if (key === 'phone') {
    return submission?.phone ?? componentValue
  }

  if (key === 'recaptchaVerified') {
    const recaptcha = submission?.recaptchaVerified
    if (!isEmptyValue(recaptcha)) {
      return recaptcha as unknown
    }
    return componentValue
  }

  if (key === 'fingerprint') {
    const submissionFingerprint = submission?.fingerprint
    if (!isEmptyValue(submissionFingerprint)) {
      return submissionFingerprint as unknown
    }
    const visitorId = fingerprintSource ? fingerprintSource['visitorId'] : undefined
    if (!isEmptyValue(visitorId)) {
      return visitorId
    }
    return fingerprintSource
  }

  return componentValue
}

export function CardData({ submissions, isLoadingSubmissions }: CardDataProps) {
  const [expandedCardIds, setExpandedCardIds] = useState<Record<string, boolean>>({})

  const toggleCard = (id: string | number) => {
    const key = String(id)
    setExpandedCardIds((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  if (isLoadingSubmissions) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">Загрузка данных устройств...</p>
        </CardContent>
      </Card>
    )
  }

  if (!submissions || submissions.length === 0) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">Нет заявок для отображения данных.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {submissions.map((submission) => {
        const fingerprintData = isRecord(submission?.fingerprintData)
          ? (submission.fingerprintData as Record<string, unknown>)
          : null
        const fingerprint = isRecord(submission?.fingerprint)
          ? (submission.fingerprint as Record<string, unknown>)
          : null

        const fingerprintSource = fingerprintData ?? fingerprint

        const cardId = String(submission.id)
        const isExpanded = expandedCardIds[cardId] ?? false

        const createdAtLabel = (() => {
          if (!submission) return null
          const createdAtDate = new Date(submission.createdAt)
          if (Number.isNaN(createdAtDate.getTime())) return null
          return createdAtDate.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        })()

        return (
          <Card key={submission.id} className="w-full">
            <CardHeader>
              <button
                type="button"
                onClick={() => toggleCard(submission.id)}
                className="flex w-full items-center justify-between gap-2 text-left focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md px-2 -mx-2 py-1"
                aria-expanded={isExpanded}
              >
                <CardTitle className="text-base">Информация об устройстве</CardTitle>
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {isExpanded ? 'Свернуть' : 'Развернуть'}
                </span>
              </button>
              <CardDescription>
                {`ID заявки ${submission.id}${createdAtLabel ? ` • ${createdAtLabel}` : ''}`}
              </CardDescription>
            </CardHeader>
            {isExpanded && (
              <CardContent>
                {!fingerprintSource ? (
                  <p className="text-sm text-muted-foreground">
                    Для этой заявки нет данных устройства.
                  </p>
                ) : (
                  <dl className="space-y-3">
                    {FIELD_CONFIG.map((field) => {
                      const value = resolveDeviceInfoValue(field.key, submission, fingerprintSource)
                      return (
                        <div
                          key={field.key}
                          className="rounded-lg border border-border bg-background/60 p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground sm:w-40">
                            {field.label}
                          </dt>
                          <dd className="text-sm text-foreground break-words whitespace-pre-wrap sm:flex-1">
                            {normalizeValue(field.key, value)}
                          </dd>
                        </div>
                      )
                    })}
                  </dl>
                )}
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
