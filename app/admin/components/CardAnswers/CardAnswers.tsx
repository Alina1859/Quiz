'use client'

import { useState } from 'react'

import { AdminTableCell } from '../TableCell/TableCell'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { CardAnswersProps } from '@/types/admin'

const FILTERS = [
  { value: 'all', label: 'Все заявки' },
  { value: 'human', label: 'Не бот' },
  { value: 'bot', label: 'Бот' },
] as const

type FilterValue = (typeof FILTERS)[number]['value']

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isEmptyValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return true
  if (typeof value === 'string' && value.trim() === '') return true
  return false
}

const getComponentValue = (components: Record<string, unknown> | undefined, key: string) => {
  if (!components) return undefined
  const candidate = components[key]
  if (isRecord(candidate) && 'value' in candidate) {
    return (candidate as Record<string, unknown>).value
  }
  return candidate
}

const normalizeValue = (key: string, value: unknown): string => {
  if (isEmptyValue(value)) return '—'

  if (key === 'timestamp') {
    // Если timestamp - это объект с данными о времени сессии
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const timestampObj = value as Record<string, unknown>
      const parts: string[] = []
      
      if (timestampObj.sessionStart) {
        const sessionStart = new Date(String(timestampObj.sessionStart))
        if (!Number.isNaN(sessionStart.getTime())) {
          parts.push(
            `Начало: ${sessionStart.toLocaleString('ru-RU', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}`
          )
        }
      }
      
      if (timestampObj.submitTime) {
        const submitTime = new Date(String(timestampObj.submitTime))
        if (!Number.isNaN(submitTime.getTime())) {
          parts.push(
            `Отправка: ${submitTime.toLocaleString('ru-RU', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}`
          )
        }
      }
      
      if (timestampObj.timeDifferenceFormatted) {
        parts.push(`Время решения: ${String(timestampObj.timeDifferenceFormatted)}`)
      } else if (timestampObj.timeDifferenceSeconds !== undefined) {
        const seconds = Number(timestampObj.timeDifferenceSeconds)
        if (!Number.isNaN(seconds)) {
          parts.push(`Время решения: ${formatTimeDifference(seconds)}`)
        }
      }
      
      return parts.length > 0 ? parts.join('\n') : '—'
    }
    
    // Старый формат - просто строка с датой
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

function formatTimeDifference(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} сек`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes} мин ${remainingSeconds} сек` : `${minutes} мин`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0
    ? `${hours} ч ${remainingMinutes} мин`
    : `${hours} ч`
}

const resolveDeviceInfoValue = (
  key: string,
  submission: CardAnswersProps['submissions'][number] | undefined,
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
    // Если fingerprintSource существует, возвращаем его как fingerprint
    if (fingerprintSource) {
      return fingerprintSource
    }
    return componentValue
  }

  if (key === 'timestamp') {
    // Используем timestamp из fingerprintData (время сервера при сохранении)
    const timestampValue = fingerprintSource?.['timestamp']
    if (!isEmptyValue(timestampValue)) {
      return timestampValue
    }
    // Fallback на createdAt если timestamp нет
    if (submission?.createdAt) {
      return submission.createdAt
    }
    return componentValue
  }

  return componentValue
}

const getSessionInfo = (submission: CardAnswersProps['submissions'][number]) => {
  const fingerprintData = isRecord(submission?.fingerprintData)
    ? (submission.fingerprintData as Record<string, unknown>)
    : null
  const fingerprint = isRecord(submission?.fingerprint)
    ? (submission.fingerprint as Record<string, unknown>)
    : null

  const fingerprintSource = fingerprintData ?? fingerprint

  const fields = [
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
  ]

  const infoParts: string[] = []

  fields.forEach((field) => {
    const value = resolveDeviceInfoValue(field.key, submission, fingerprintSource)
    if (!isEmptyValue(value)) {
      const normalizedValue = normalizeValue(field.key, value)
      if (normalizedValue !== '—') {
        infoParts.push(`${field.label}: ${normalizedValue}`)
      }
    }
  })

  return infoParts.length > 0 ? infoParts.join('\n') : 'Нет данных'
}

const searchInSubmission = (submission: CardAnswersProps['submissions'][number], searchQuery: string): boolean => {
  if (!searchQuery.trim()) return true

  const query = searchQuery.toLowerCase().trim()

  // Поиск по имени
  const name = submission.name || submission.answers?.name || ''
  if (name.toLowerCase().includes(query)) return true

  // Поиск по телефону
  if (submission.phone.toLowerCase().includes(query)) return true

  // Поиск по IP адресу
  if (submission.ipAddress && submission.ipAddress.toLowerCase().includes(query)) return true

  // Поиск по User Agent
  if (submission.userAgent && submission.userAgent.toLowerCase().includes(query)) return true

  // Поиск по данным сессии (fingerprintData и fingerprint)
  const fingerprintData = isRecord(submission?.fingerprintData)
    ? (submission.fingerprintData as Record<string, unknown>)
    : null
  const fingerprint = isRecord(submission?.fingerprint)
    ? (submission.fingerprint as Record<string, unknown>)
    : null

  const fingerprintSource = fingerprintData ?? fingerprint

  if (fingerprintSource) {
    // Рекурсивный поиск по всем полям fingerprintData
    const searchInObject = (obj: unknown): boolean => {
      if (typeof obj === 'string' && obj.toLowerCase().includes(query)) {
        return true
      }
      if (typeof obj === 'number' && String(obj).includes(query)) {
        return true
      }
      if (isRecord(obj)) {
        for (const value of Object.values(obj)) {
          if (searchInObject(value)) {
            return true
          }
        }
      }
      if (Array.isArray(obj)) {
        for (const item of obj) {
          if (searchInObject(item)) {
            return true
          }
        }
      }
      return false
    }

    if (searchInObject(fingerprintSource)) return true
  }

  // Поиск по Visitor ID (если это строка)
  if (typeof submission.fingerprint === 'string' && submission.fingerprint.toLowerCase().includes(query)) {
    return true
  }

  return false
}

export function CardAnswers({ isLoadingSubmissions, submissions, totalSubmissions }: CardAnswersProps) {
  const [recaptchaFilter, setRecaptchaFilter] = useState<FilterValue>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredByRecaptcha =
    recaptchaFilter === 'human'
      ? submissions.filter((row) => row.recaptchaVerified === true)
      : recaptchaFilter === 'bot'
        ? submissions.filter((row) => row.recaptchaVerified === false)
        : submissions

  const filteredSubmissions = filteredByRecaptcha.filter((submission) =>
    searchInSubmission(submission, searchQuery)
  )

  return (
    <Card className="bg-muted text-card-foreground flex flex-col gap-4 rounded-lg border p-1 py-0">
      <div className="flex flex-col gap-3 px-2 pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">
            Показано: {filteredSubmissions.length} из {submissions.length} • Всего: {totalSubmissions}
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="uppercase tracking-wide text-[10px] font-semibold">reCAPTCHA</span>
            <select
              className="text-foreground bg-background border border-border rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              value={recaptchaFilter}
              onChange={(event) => setRecaptchaFilter(event.target.value as FilterValue)}
            >
              {FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Поиск по имени, телефону, IP, User-Agent и данным сессии..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-sm bg-background border-border"
          />
        </div>
      </div>
      <div className="admin-table-wrapper">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-muted/50 border-b transition-colors">
              <TableHead className="h-10 px-2 text-left align-middle whitespace-nowrap border-r border-border text-muted-foreground text-xs font-medium tracking-wider uppercase">
                ID
              </TableHead>
              <TableHead className="h-10 px-2 text-left align-middle whitespace-nowrap border-r border-border text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Имя
              </TableHead>
              <TableHead className="h-10 px-2 text-left align-middle whitespace-nowrap border-r border-border text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Телефон
              </TableHead>
              <TableHead className="h-10 px-2 text-left align-middle whitespace-nowrap border-r border-border text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Способ связи
              </TableHead>
              <TableHead className="h-10 px-2 text-left align-middle whitespace-nowrap border-r border-border text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Время заявки
              </TableHead>
              <TableHead className="h-10 px-2 text-left align-middle whitespace-nowrap border-r border-border text-muted-foreground text-xs font-medium tracking-wider uppercase">
                reCAPTCHA
              </TableHead>
              <TableHead className="h-10 px-2 text-left align-middle whitespace-nowrap border-r border-border text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Данные сессии
              </TableHead>
              <TableHead className="h-10 px-2 text-left align-middle whitespace-nowrap text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Ответы
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingSubmissions ? (
              <TableRow>
                <AdminTableCell
                  bordered={false}
                  nowrap={false}
                  colSpan={8}
                  className="text-center py-8"
                >
                  Загрузка данных...
                </AdminTableCell>
              </TableRow>
            ) : submissions.length === 0 ? (
              <TableRow>
                <AdminTableCell
                  bordered={false}
                  nowrap={false}
                  colSpan={8}
                  className="text-center py-8"
                >
                  Нет заявок
                </AdminTableCell>
              </TableRow>
            ) : filteredSubmissions.length === 0 ? (
              <TableRow>
                <AdminTableCell
                  bordered={false}
                  nowrap={false}
                  colSpan={8}
                  className="text-center py-8"
                >
                  {searchQuery.trim()
                    ? 'Нет заявок, соответствующих поисковому запросу'
                    : 'Нет заявок для выбранного фильтра'}
                </AdminTableCell>
              </TableRow>
            ) : (
              filteredSubmissions.map((row) => {
                const date = new Date(row.createdAt).toLocaleString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
                return (
                  <TableRow key={row.id} className="border-b transition-colors hover:bg-muted/50">
                    <AdminTableCell>
                      <span className="text-muted-foreground">{row.id}</span>
                    </AdminTableCell>
                    <AdminTableCell>
                      <span className="text-muted-foreground">
                        {row.name || row.answers?.name || '—'}
                      </span>
                    </AdminTableCell>
                    <AdminTableCell>
                      <span className="text-muted-foreground">{row.phone}</span>
                    </AdminTableCell>
                    <AdminTableCell>
                      <span className="text-muted-foreground">
                        {row.answers?.contactMethod ?? '—'}
                      </span>
                    </AdminTableCell>

                    <AdminTableCell>
                      <span className="text-muted-foreground">{date}</span>
                    </AdminTableCell>

                    <AdminTableCell>
                      {row.recaptchaVerified === null ? (
                        <span className="text-muted-foreground text-sm">—</span>
                      ) : row.recaptchaVerified ? (
                        <span className="text-green-600 font-medium">Не бот</span>
                      ) : (
                        <span className="text-red-600 font-medium">Бот</span>
                      )}
                    </AdminTableCell>
                    <AdminTableCell nowrap={false}>
                      <div className="text-xs text-muted-foreground whitespace-pre-wrap break-words max-w-xs">
                        {getSessionInfo(row)}
                      </div>
                    </AdminTableCell>
                    <AdminTableCell bordered={false} nowrap={false}>
                      {row.answers ? (
                        <div className="max-w-2xl space-y-4">
                          {row.answers.answers && row.answers.answers.length > 0 && (
                            <div>
                              <div className="text-xs font-semibold text-muted-foreground mb-2">
                                Ответы на вопросы:
                              </div>
                              <div className="space-y-3">
                                {row.answers.answers.map((answerItem, index) => (
                                  <div key={index} className="border-l-2 border-primary/30 pl-3">
                                    <div className="text-xs font-medium text-foreground mb-1">
                                      Вопрос {answerItem.questionNumber}: {answerItem.questionText}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      Ответ: {answerItem.answer}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Нет ответов</span>
                      )}
                    </AdminTableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
