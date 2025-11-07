'use client'

import { useState, useEffect } from 'react'
import './page.css'
import { Field, FieldContent, FieldError, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import MainButton from '../components/Buttons/MainButton/MainButton'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Users, ChevronDown, ChevronUp } from 'lucide-react'
import { getFingerprintFieldValue, formatFingerprintTimestamp } from '@/app/lib/fingerprintParser'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

interface Submission {
  id: number
  name: string
  phone: string
  ipAddress: string
  userAgent: string | null
  fingerprint: any | null
  fingerprintData: any | null
  recaptchaVerified: boolean | null
  createdAt: string
  answers: {
    answers: Array<{
      questionId: number
      questionText: string
      questionNumber: number
      answer: string
    }>
    name: string
    contactMethod: string
  } | null
}

export default function AdminPage() {
  const [token, setToken] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [expandedFingerprints, setExpandedFingerprints] = useState<Set<number>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalSubmissions, setTotalSubmissions] = useState(0)

  useEffect(() => {
    checkAuthentication()
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubmissions(currentPage)
    }
  }, [isAuthenticated, currentPage])

  const checkAuthentication = async () => {
    try {
      const response = await fetch('/api/admin/verify')
      const data = await response.json()
      setIsAuthenticated(data.authenticated === true)
    } catch (error) {
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSubmissions = async (page: number = 1) => {
    setIsLoadingSubmissions(true)
    try {
      const response = await fetch(`/api/admin/submissions?page=${page}`)
      const data = await response.json()

      if (response.ok && data.submissions) {
        setSubmissions(data.submissions)
        setExpandedIds(new Set()) 
        setExpandedFingerprints(new Set())
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages)
          setTotalSubmissions(data.pagination.total)
        }
      } else {
        console.error('Error fetching submissions:', data.error)
      }
    } catch (error) {
      console.error('Error fetching submissions:', error)
    } finally {
      setIsLoadingSubmissions(false)
    }
  }

  const handleToggleExpand = (id: number) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIds(newExpanded)
  }

  const handleToggleFingerprint = (id: number) => {
    const newExpanded = new Set(expandedFingerprints)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedFingerprints(newExpanded)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setIsAuthenticated(true)
        setToken('')
        await fetchSubmissions(1)
      } else {
        setError(data.error || 'Неверный токен')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center admin-page-container">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 admin-page-container">
        <div className="w-full max-w-md">
          <div className="rounded-lg shadow-lg p-8 bg-muted text-card-foreground border">
            <p className="text-center mb-6 text-muted-foreground">Введите свой токен</p>

            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldContent>
                    <Input
                      id="token"
                      type="password"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="Ваш токен"
                      disabled={isSubmitting}
                    />
                  </FieldContent>
                  {error && <FieldError>{error}</FieldError>}
                </Field>
              </FieldGroup>

              <div className="w-full mt-6">
                <MainButton type="submit" disabled={isSubmitting || !token.trim()}>
                  {isSubmitting ? 'Верификация...' : 'Войти'}
                </MainButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="admin-page-container" style={{ padding: '50px' }}>
        <div className="container mx-auto max-w-[1250px]">
          <Card className="bg-muted text-card-foreground flex flex-col gap-4 rounded-lg border p-1 pt-4 w-full mb-[30px]">
            <CardHeader className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6">
              <CardTitle className="leading-none font-semibold">Всего заявок</CardTitle>
            </CardHeader>
            <CardContent className="bg-background h-full rounded-md p-4">
              <div className="flex items-center gap-2">
                <Users className="text-muted-foreground h-5 w-5" aria-hidden="true" />
                <span className="text-foreground text-2xl font-bold">
                  {isLoadingSubmissions ? '...' : totalSubmissions}
                </span>
              </div>
            </CardContent>
          </Card>

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
                        <TableRow
                          key={row.id}
                          className="border-b transition-colors hover:bg-muted/50"
                        >
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
                                      const fingerprint =
                                        row.fingerprintData || row.fingerprint || {}

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
                                        hardwareConcurrency: getFingerprintFieldValue(fingerprint, 'hardwareConcurrency'),
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

          <Pagination
            className="bg-muted rounded-lg border p-4 w-fit"
            style={{ marginTop: '15px' }}
          >
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  size="default"
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage > 1) {
                      setCurrentPage(currentPage - 1)
                    }
                  }}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              {(() => {
                const pages: (number | 'ellipsis')[] = []

                if (totalPages <= 7) {
                  for (let i = 1; i <= totalPages; i++) {
                    pages.push(i)
                  }
                } else {
                  pages.push(1)

                  if (currentPage > 3) {
                    pages.push('ellipsis')
                  }

                  const start = Math.max(2, currentPage - 1)
                  const end = Math.min(totalPages - 1, currentPage + 1)

                  for (let i = start; i <= end; i++) {
                    pages.push(i)
                  }

                  if (currentPage < totalPages - 2) {
                    pages.push('ellipsis')
                  }

                  pages.push(totalPages)
                }

                return pages.map((page, index) => {
                  if (page === 'ellipsis') {
                    return (
                      <PaginationItem key={`ellipsis-${index}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )
                  }
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault()
                          setCurrentPage(page)
                        }}
                        isActive={currentPage === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                })
              })()}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  size="default"
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage < totalPages) {
                      setCurrentPage(currentPage + 1)
                    }
                  }}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </>
  )
}
