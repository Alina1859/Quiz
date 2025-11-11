'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { formatFingerprintTimestamp, getFingerprintFieldValue } from '@/app/lib/fingerprintParser'
import type { Submission } from '@/types/admin'

interface CardAnswersProps {
  isLoadingSubmissions: boolean
  submissions: Submission[]
  expandedIds: Set<number>
  expandedFingerprints: Set<number>
  handleToggleExpand: (id: number) => void
  handleToggleFingerprint: (id: number) => void
}

export function CardAnswers({
  isLoadingSubmissions,
  submissions,
  expandedIds,
  expandedFingerprints,
  handleToggleExpand,
  handleToggleFingerprint,
}: CardAnswersProps) {
  return (
    <Card className="bg-muted text-card-foreground flex flex-col gap-4 rounded-lg border p-1 py-0">
      <div className="admin-table-wrapper">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-muted/50 border-b transition-colors">
              <TableHead className="h-10 px-2 text-left align-middle whitespace-nowrap text-muted-foreground text-xs font-medium tracking-wider">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs font-medium tracking-wider uppercase hover:bg-transparent"
                >
                  ID
                </Button>
              </TableHead>
              <TableHead className="h-10 px-2 text-left align-middle whitespace-nowrap text-muted-foreground text-xs font-medium tracking-wider">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs font-medium tracking-wider uppercase hover:bg-transparent"
                >
                  Имя
                </Button>
              </TableHead>
              <TableHead className="h-10 px-2 text-left align-middle whitespace-nowrap text-muted-foreground text-xs font-medium tracking-wider">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs font-medium tracking-wider uppercase hover:bg-transparent"
                >
                  Телефон
                </Button>
              </TableHead>
              <TableHead className="h-10 px-2 text-left align-middle whitespace-nowrap text-muted-foreground text-xs font-medium tracking-wider">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs font-medium tracking-wider uppercase hover:bg-transparent"
                >
                  IP-адрес
                </Button>
              </TableHead>
              <TableHead className="h-10 px-2 text-left align-middle whitespace-nowrap text-muted-foreground text-xs font-medium tracking-wider">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs font-medium tracking-wider uppercase hover:bg-transparent"
                >
                  Время заявки
                </Button>
              </TableHead>
              <TableHead className="h-10 px-2 text-left align-middle whitespace-nowrap text-muted-foreground text-xs font-medium tracking-wider">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs font-medium tracking-wider uppercase hover:bg-transparent"
                >
                  User-Agent
                </Button>
              </TableHead>
              <TableHead className="h-10 px-2 text-left align-middle whitespace-nowrap text-muted-foreground text-xs font-medium tracking-wider">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs font-medium tracking-wider uppercase hover:bg-transparent"
                >
                  Fingerprint
                </Button>
              </TableHead>
              <TableHead className="h-10 px-2 text-left align-middle whitespace-nowrap text-muted-foreground text-xs font-medium tracking-wider">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs font-medium tracking-wider uppercase hover:bg-transparent"
                >
                  reCAPTCHA
                </Button>
              </TableHead>
              <TableHead className="h-10 px-2 text-left align-middle whitespace-nowrap text-muted-foreground text-xs font-medium tracking-wider">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs font-medium tracking-wider uppercase hover:bg-transparent"
                >
                  Ответы
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingSubmissions ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  Загрузка данных...
                </TableCell>
              </TableRow>
            ) : submissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  Нет заявок
                </TableCell>
              </TableRow>
            ) : (
              submissions.map((row) => {
                const date = new Date(row.createdAt).toLocaleString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
                return (
                  <TableRow key={row.id} className="border-b transition-colors hover:bg-muted/50">
                    <TableCell className="p-2 align-middle whitespace-nowrap py-4">
                      <span className="text-muted-foreground">{row.id}</span>
                    </TableCell>
                    <TableCell className="p-2 align-middle whitespace-nowrap py-4">
                      <span className="text-foreground font-medium">{row.name}</span>
                    </TableCell>
                    <TableCell className="p-2 align-middle whitespace-nowrap py-4">
                      <span className="text-muted-foreground">{row.phone}</span>
                    </TableCell>
                    <TableCell className="p-2 align-middle whitespace-nowrap py-4">
                      <span className="text-foreground">{row.ipAddress}</span>
                    </TableCell>
                    <TableCell className="p-2 align-middle whitespace-nowrap py-4">
                      <span className="text-muted-foreground">{date}</span>
                    </TableCell>
                    <TableCell className="p-2 align-middle py-4">
                      <span
                        className="text-foreground text-sm max-w-xs break-words block"
                        title={row.userAgent || undefined}
                      >
                        {row.userAgent || <span className="text-muted-foreground">—</span>}
                      </span>
                    </TableCell>
                    <TableCell className="p-2 align-middle py-4">
                      <div className="max-w-2xl">
                        {row.fingerprint ? (
                          <div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleFingerprint(row.id)}
                              className="mb-2 h-8 px-2 text-xs"
                            >
                              {expandedFingerprints.has(row.id) ? (
                                <>
                                  <ChevronUp className="h-4 w-4 mr-1" />
                                  Свернуть
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-4 w-4 mr-1" />
                                  Развернуть
                                </>
                              )}
                            </Button>
                            {expandedFingerprints.has(row.id) &&
                              (() => {
                                const fingerprint = row.fingerprintData || row.fingerprint || {}

                                const fieldLabels: Record<string, string> = {
                                  visitorId: 'Visitor ID',
                                  language: 'Language',
                                  platform: 'Platform',
                                  hardwareConcurrency: 'CPU Cores',
                                  screen: 'Screen Resolution',
                                  timezone: 'Timezone',
                                  gpuVendor: 'GPU Vendor',
                                  gpuRenderer: 'GPU Renderer',
                                  timestamp: 'Timestamp',
                                }

                                const fields = {
                                  visitorId: getFingerprintFieldValue(fingerprint, 'visitorId'),
                                  language: getFingerprintFieldValue(fingerprint, 'language'),
                                  platform: getFingerprintFieldValue(fingerprint, 'platform'),
                                  hardwareConcurrency: getFingerprintFieldValue(
                                    fingerprint,
                                    'hardwareConcurrency'
                                  ),
                                  screen: getFingerprintFieldValue(fingerprint, 'screen'),
                                  timezone: getFingerprintFieldValue(fingerprint, 'timezone'),
                                  gpuVendor: getFingerprintFieldValue(fingerprint, 'gpuVendor'),
                                  gpuRenderer: getFingerprintFieldValue(fingerprint, 'gpuRenderer'),
                                  timestamp: formatFingerprintTimestamp(
                                    getFingerprintFieldValue(fingerprint, 'timestamp')
                                  ),
                                }

                                return (
                                  <div className="bg-muted p-4 rounded-md border border-border space-y-2">
                                    {Object.entries(fields).map(([key, value]) => (
                                      <div key={key} className="flex items-start gap-2">
                                        <div className="text-xs font-semibold text-muted-foreground min-w-[160px]">
                                          {fieldLabels[key] || key}:
                                        </div>
                                        <div className="text-xs text-foreground break-words flex-1">
                                          {value !== null && value !== undefined ? (
                                            String(value)
                                          ) : (
                                            <span className="text-muted-foreground">—</span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )
                              })()}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="p-2 align-middle whitespace-nowrap py-4">
                      {row.recaptchaVerified === null ? (
                        <span className="text-muted-foreground text-sm">—</span>
                      ) : row.recaptchaVerified ? (
                        <span className="text-green-600 font-medium">Не бот</span>
                      ) : (
                        <span className="text-red-600 font-medium">Бот</span>
                      )}
                    </TableCell>
                    <TableCell className="p-2 align-middle py-4">
                      <div className="max-w-2xl">
                        {row.answers ? (
                          <div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleExpand(row.id)}
                              className="mb-2 h-8 px-2 text-xs"
                            >
                              {expandedIds.has(row.id) ? (
                                <>
                                  <ChevronUp className="h-4 w-4 mr-1" />
                                  Свернуть
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-4 w-4 mr-1" />
                                  Развернуть
                                </>
                              )}
                            </Button>
                            {expandedIds.has(row.id) && (
                              <div className="bg-muted p-4 rounded-md border border-border space-y-4">
                                {row.answers.name && (
                                  <div>
                                    <div className="text-xs font-semibold text-muted-foreground mb-1">
                                      Имя:
                                    </div>
                                    <div className="text-sm text-foreground">
                                      {row.answers.name}
                                    </div>
                                  </div>
                                )}
                                {row.answers.contactMethod && (
                                  <div>
                                    <div className="text-xs font-semibold text-muted-foreground mb-1">
                                      Способ связи:
                                    </div>
                                    <div className="text-sm text-foreground">
                                      {row.answers.contactMethod}
                                    </div>
                                  </div>
                                )}
                                {row.answers.answers && row.answers.answers.length > 0 && (
                                  <div>
                                    <div className="text-xs font-semibold text-muted-foreground mb-2">
                                      Ответы на вопросы:
                                    </div>
                                    <div className="space-y-3">
                                      {row.answers.answers.map((answerItem, index) => (
                                        <div
                                          key={index}
                                          className="border-l-2 border-primary/30 pl-3"
                                        >
                                          <div className="text-xs font-medium text-foreground mb-1">
                                            Вопрос {answerItem.questionNumber}:{' '}
                                            {answerItem.questionText}
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
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Нет ответов</span>
                        )}
                      </div>
                    </TableCell>
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
