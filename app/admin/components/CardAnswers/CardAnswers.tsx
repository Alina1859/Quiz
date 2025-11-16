'use client'

import { useState } from 'react'

import { AdminTableCell } from '../TableCell/TableCell'
import { Card } from '@/components/ui/card'
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

const getSessionInfo = (submission: CardAnswersProps['submissions'][number]) => {
  const fingerprintData = isRecord(submission?.fingerprintData)
    ? (submission.fingerprintData as Record<string, unknown>)
    : null
  const fingerprint = isRecord(submission?.fingerprint)
    ? (submission.fingerprint as Record<string, unknown>)
    : null

  const fingerprintSource = fingerprintData ?? fingerprint
  const componentsRaw = fingerprintSource ? fingerprintSource['components'] : undefined
  const components = isRecord(componentsRaw)
    ? (componentsRaw as Record<string, unknown>)
    : undefined

  const getValue = (key: string) => {
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
    if (key === 'ipAddress') {
      return submission?.ipAddress ?? componentValue
    }
    if (key === 'visitorId' && typeof submission?.fingerprint === 'string') {
      return submission.fingerprint
    }
    return componentValue
  }

  const visitorId = getValue('visitorId')
  const userAgent = getValue('userAgent')
  const ipAddress = getValue('ipAddress')
  const platform = getValue('platform')
  const language = getValue('language')
  const timezone = getValue('timezone')
  const screen = getValue('screen')

  const infoParts: string[] = []
  if (!isEmptyValue(ipAddress)) {
    infoParts.push(`IP: ${String(ipAddress)}`)
  }
  if (!isEmptyValue(visitorId)) {
    infoParts.push(`Visitor ID: ${String(visitorId)}`)
  }
  if (!isEmptyValue(platform)) {
    infoParts.push(`Платформа: ${String(platform)}`)
  }
  if (!isEmptyValue(language)) {
    infoParts.push(`Язык: ${String(language)}`)
  }
  if (!isEmptyValue(timezone)) {
    infoParts.push(`Часовой пояс: ${String(timezone)}`)
  }
  if (!isEmptyValue(screen)) {
    infoParts.push(`Экран: ${String(screen)}`)
  }
  if (!isEmptyValue(userAgent)) {
    infoParts.push(`UA: ${String(userAgent)}`)
  }

  return infoParts.length > 0 ? infoParts.join('\n') : 'Нет данных'
}

export function CardAnswers({ isLoadingSubmissions, submissions }: CardAnswersProps) {
  const [recaptchaFilter, setRecaptchaFilter] = useState<FilterValue>('all')

  const filteredSubmissions =
    recaptchaFilter === 'human'
      ? submissions.filter((row) => row.recaptchaVerified === true)
      : recaptchaFilter === 'bot'
        ? submissions.filter((row) => row.recaptchaVerified === false)
        : submissions

  return (
    <Card className="bg-muted text-card-foreground flex flex-col gap-4 rounded-lg border p-1 py-0">
      <div className="flex flex-wrap items-center justify-between gap-2 px-2 pt-3">
        <div className="text-xs text-muted-foreground">
          Показано: {filteredSubmissions.length} из {submissions.length}
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
                  Нет заявок для выбранного фильтра
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
