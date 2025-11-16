'use client'

import { useState, useEffect, useMemo } from 'react'
import './page.css'
import { Field, FieldContent, FieldError, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import MainButton from '../components/Buttons/MainButton/MainButton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CardAnswers } from './components/CardAnswers/CardAnswers'
import { CardData } from './components/CardData/CardData'
import { CardEditQuiz } from './components/CardEditQuiz/CardEditQuiz'
import { AdminPagination } from './components/Pagination/Pagination'
import { CardApplication } from './components/CardApplication/CardApplication'
import type { Submission } from '@/types/admin'

const PAGE_SIZE = 20

export default function AdminPage() {
  const [token, setToken] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([])
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const totalSubmissions = allSubmissions.length
  const totalPages = totalSubmissions === 0 ? 1 : Math.ceil(totalSubmissions / PAGE_SIZE)

  const paginatedSubmissions = useMemo(() => {
    if (totalSubmissions === 0) {
      return []
    }
    const startIndex = (currentPage - 1) * PAGE_SIZE
    const endIndex = startIndex + PAGE_SIZE
    return allSubmissions.slice(startIndex, endIndex)
  }, [allSubmissions, currentPage, totalSubmissions])

  useEffect(() => {
    checkAuthentication()
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubmissions()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

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

  const fetchSubmissions = async () => {
    setIsLoadingSubmissions(true)
    try {
      const response = await fetch('/api/admin/submissions')
      const data = await response.json()

      if (response.ok && Array.isArray(data.submissions)) {
        setAllSubmissions(data.submissions)
        setCurrentPage(1)
      } else {
        console.error('Error fetching submissions:', data.error)
      }
    } catch (error) {
      console.error('Error fetching submissions:', error)
    } finally {
      setIsLoadingSubmissions(false)
    }
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
        await fetchSubmissions()
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
      <div className="admin-page-container">
        <div className="container mx-auto max-w-[1250px]">
          <CardApplication totalSubmissions={totalSubmissions} isLoading={isLoadingSubmissions} />
          <Tabs defaultValue="answers" className="w-full">
            <TabsList>
              <TabsTrigger value="answers">Ответы пользователей</TabsTrigger>
              <TabsTrigger value="edit-quiz">Редактировать квиз</TabsTrigger>
              <TabsTrigger value="database">Data</TabsTrigger>
            </TabsList>
            <TabsContent value="answers">
              <CardAnswers
                isLoadingSubmissions={isLoadingSubmissions}
                submissions={paginatedSubmissions}
                totalSubmissions={totalSubmissions}
              />
              <div className="mt-6">
                <AdminPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  isDisabled={totalSubmissions === 0}
                />
              </div>
            </TabsContent>
            <TabsContent value="edit-quiz">
              <div>
                <CardEditQuiz />
              </div>
            </TabsContent>
            <TabsContent value="database">
              <CardData submissions={paginatedSubmissions} isLoadingSubmissions={isLoadingSubmissions} />
              <div className="mt-6">
                <AdminPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  isDisabled={totalSubmissions === 0}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}
