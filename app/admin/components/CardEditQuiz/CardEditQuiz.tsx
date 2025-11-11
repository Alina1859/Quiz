'use client'

import { useEffect, useState } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { Question } from '@/types/quiz'
import type { OptionDrafts, NewOptionDrafts, QuestionDrafts } from '@/types/admin'
import { cn } from '@/lib/utils'
import styles from './CardEditQuiz.module.css'

export function CardEditQuiz() {
  const [data, setData] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [questionDrafts, setQuestionDrafts] = useState<QuestionDrafts>({})
  const [savingQuestionIds, setSavingQuestionIds] = useState<Record<number, boolean>>({})
  const [optionDrafts, setOptionDrafts] = useState<OptionDrafts>({})
  const [newOptionDrafts, setNewOptionDrafts] = useState<NewOptionDrafts>({})
  const [newQuestionText, setNewQuestionText] = useState('')
  const [newQuestionOptions, setNewQuestionOptions] = useState<string[]>([''])
  const [newQuestionPosition, setNewQuestionPosition] = useState<'start' | 'end' | number>('end')
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false)
  const [deletingQuestionIds, setDeletingQuestionIds] = useState<Record<number, boolean>>({})

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/admin/questions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error('Не удалось загрузить вопросы')
      }

      const result = await response.json()

      setData(Array.isArray(result?.questions) ? result.questions : [])
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Произошла ошибка при загрузке вопросов')
    } finally {
      setIsLoading(false)
    }
  }

  const createQuestion = async (payload: { text: string; options: string[] }) => {
    try {
      setError(null)

      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Не удалось создать вопрос')
      }

      const result = await response.json()
      const createdQuestion = result?.question

      if (!createdQuestion) {
        throw new Error('Сервер не вернул созданный вопрос')
      }

      return {
        id: createdQuestion.id,
        text: createdQuestion.text,
        options: Array.isArray(createdQuestion.options) ? createdQuestion.options : [],
      } as Question
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Произошла ошибка при создании вопроса')
      throw err
    }
  }

  const updateQuestion = async (
    questionId: number,
    payload: { text: string; options: string[] }
  ) => {
    try {
      setSavingQuestionIds((prev) => ({ ...prev, [questionId]: true }))
      setError(null)
      console.log('payload', payload)
      console.log('questionId', questionId)

      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Не удалось обновить вопрос')
      }

      const result = await response.json()
      const updatedQuestion = result?.question
      setData((prev) =>
        prev.map((question) =>
          question.id === questionId ? (updatedQuestion ?? question) : question
        )
      )
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Произошла ошибка при обновлении вопроса')
      throw err
    } finally {
      setSavingQuestionIds((prev) => {
        const { [questionId]: _discarded, ...rest } = prev
        return rest
      })
    }
  }

  const handleQuestionDraftChange = (questionId: number, value: string) => {
    setQuestionDrafts((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleStartEditQuestion = (question: Question) => {
    setQuestionDrafts((prev) => ({
      ...prev,
      [question.id]: prev[question.id] ?? question.text,
    }))
  }

  const handleCancelEditQuestion = (questionId: number) => {
    setQuestionDrafts((prev) => {
      const { [questionId]: _discarded, ...rest } = prev
      return rest
    })
  }

  const handleSaveQuestion = async (question: Question) => {
    const draft = questionDrafts[question.id] ?? ''
    const trimmedText = draft.trim()

    if (!trimmedText) {
      setError('Текст вопроса не может быть пустым')
      return
    }

    try {
      await updateQuestion(question.id, {
        text: trimmedText,
        options: question.options,
      })
      setQuestionDrafts((prev) => {
        const { [question.id]: _discarded, ...rest } = prev
        return rest
      })
    } catch {
      // Ошибка уже обработана в updateQuestion
    }
  }

  const getOptionKey = (questionId: number, optionIndex: number) => `${questionId}-${optionIndex}`

  const handleStartEditOption = (questionId: number, optionIndex: number, optionText: string) => {
    const key = getOptionKey(questionId, optionIndex)
    setOptionDrafts((prev) => ({ ...prev, [key]: optionText }))
  }

  const handleCancelEditOption = (questionId: number, optionIndex: number) => {
    const key = getOptionKey(questionId, optionIndex)
    setOptionDrafts((prev) => {
      const { [key]: _discarded, ...rest } = prev
      return rest
    })
  }

  const handleSaveOption = async (questionId: number, optionIndex: number) => {
    const key = getOptionKey(questionId, optionIndex)
    const draft = optionDrafts[key]
    if (draft === undefined) {
      return
    }

    const trimmedDraft = draft.trim()
    if (!trimmedDraft) {
      setError('Ответ не может быть пустым')
      return
    }

    const question = data.find((item) => item.id === questionId)
    if (!question) {
      return
    }

    const updatedOptions = question.options.map((option, index) =>
      index === optionIndex ? trimmedDraft : option
    )

    try {
      await updateQuestion(questionId, { text: question.text, options: updatedOptions })
      handleCancelEditOption(questionId, optionIndex)
    } catch {
      // Ошибка уже обработана в updateQuestion
    }
  }

  const handleDeleteOption = async (questionId: number, optionIndex: number) => {
    const question = data.find((item) => item.id === questionId)
    if (!question) {
      return
    }

    const updatedOptions = question.options.filter((_, index) => index !== optionIndex)

    try {
      await updateQuestion(questionId, { text: question.text, options: updatedOptions })
    } catch {
      // Ошибка уже обработана в updateQuestion
    }
  }

  const handleNewOptionChange = (questionId: number, value: string) => {
    setNewOptionDrafts((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleAddOption = async (questionId: number) => {
    const draft = newOptionDrafts[questionId]
    const value = draft?.trim()

    if (!value) {
      setError('Введите текст ответа перед добавлением')
      return
    }

    const question = data.find((item) => item.id === questionId)
    if (!question) {
      return
    }

    const updatedOptions = [...question.options, value]

    try {
      await updateQuestion(questionId, { text: question.text, options: updatedOptions })
      setNewOptionDrafts((prev) => ({ ...prev, [questionId]: '' }))
    } catch {
      // Ошибка уже обработана в updateQuestion
    }
  }

  const handleNewQuestionOptionChange = (index: number, value: string) => {
    setNewQuestionOptions((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const handleAddNewQuestionOption = () => {
    setNewQuestionOptions((prev) => [...prev, ''])
  }

  const handleRemoveNewQuestionOption = (index: number) => {
    setNewQuestionOptions((prev) => {
      if (prev.length <= 1) {
        return prev
      }

      return prev.filter((_, optionIndex) => optionIndex !== index)
    })
  }

  const handleNewQuestionPositionChange = (value: string) => {
    if (value === 'start' || value === 'end') {
      setNewQuestionPosition(value)
      return
    }

    const parsed = Number.parseInt(value, 10)
    setNewQuestionPosition(Number.isNaN(parsed) ? 'end' : parsed)
  }

  const resetNewQuestionForm = () => {
    setNewQuestionText('')
    setNewQuestionOptions([''])
    setNewQuestionPosition('end')
  }

  const handleCreateNewQuestion = async () => {
    const trimmedText = newQuestionText.trim()
    const sanitizedOptions = newQuestionOptions
      .map((option) => option.trim())
      .filter((option) => option.length > 0)

    if (!trimmedText) {
      setError('Текст нового вопроса не может быть пустым')
      return
    }

    if (sanitizedOptions.length === 0) {
      setError('Добавьте хотя бы один ответ для нового вопроса')
      return
    }

    setIsCreatingQuestion(true)
    setError(null)

    try {
      const createdQuestion = await createQuestion({
        text: trimmedText,
        options: sanitizedOptions,
      })

      setData((prev) => {
        if (prev.length === 0) {
          return [createdQuestion]
        }

        if (newQuestionPosition === 'start') {
          return [createdQuestion, ...prev]
        }

        if (newQuestionPosition === 'end') {
          return [...prev, createdQuestion]
        }

        const insertIndex = prev.findIndex((question) => question.id === newQuestionPosition)

        if (insertIndex === -1) {
          return [...prev, createdQuestion]
        }

        return [...prev.slice(0, insertIndex + 1), createdQuestion, ...prev.slice(insertIndex + 1)]
      })

      resetNewQuestionForm()
    } catch {
      // Ошибка уже обработана в createQuestion
    } finally {
      setIsCreatingQuestion(false)
    }
  }

  const cleanupQuestionDrafts = (questionId: number) => {
    setQuestionDrafts((prev) => {
      const { [questionId]: _discarded, ...rest } = prev
      return rest
    })

    setNewOptionDrafts((prev) => {
      const { [questionId]: _discarded, ...rest } = prev
      return rest
    })

    setOptionDrafts((prev) => {
      const entries = Object.entries(prev).filter(([key]) => !key.startsWith(`${questionId}-`))
      return Object.fromEntries(entries)
    })
  }

  const handleDeleteQuestion = async (questionId: number) => {
    if (!window.confirm('Удалить этот вопрос? Действие нельзя отменить.')) {
      return
    }

    setDeletingQuestionIds((prev) => ({ ...prev, [questionId]: true }))
    setError(null)

    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Не удалось удалить вопрос')
      }

      setData((prev) => prev.filter((question) => question.id !== questionId))
      cleanupQuestionDrafts(questionId)

      setSavingQuestionIds((prev) => {
        const { [questionId]: _discarded, ...rest } = prev
        return rest
      })

      if (newQuestionPosition === questionId) {
        setNewQuestionPosition('end')
      }
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Произошла ошибка при удалении вопроса')
    } finally {
      setDeletingQuestionIds((prev) => {
        const { [questionId]: _discarded, ...rest } = prev
        return rest
      })
    }
  }

  return (
    <div className="space-y-4">
      <Card className={styles.card}>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Загрузка вопросов...</div>
          ) : (
            <>
              {error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              {data.length === 0 ? (
                <div className="text-sm text-muted-foreground">Вопросы не найдены.</div>
              ) : (
                <div className="space-y-6">
                  {data.map((question, index) => {
                    const draftText = questionDrafts[question.id]
                    const isEditingQuestion = draftText !== undefined
                    const isSavingQuestion = Boolean(savingQuestionIds[question.id])
                    const isDeletingQuestion = Boolean(deletingQuestionIds[question.id])
                    const isQuestionBusy = isSavingQuestion || isDeletingQuestion

                    return (
                      <Card
                        key={question.id}
                        className={cn('border border-border/80 bg-card shadow-sm', styles.card)}
                      >
                        <CardHeader className="pb-0">
                          <CardTitle className="text-lg font-normal text-foreground">
                            Вопрос {index + 1}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            {isEditingQuestion ? (
                              <div className="space-y-2">
                                <Input
                                  value={draftText ?? ''}
                                  onChange={(event) =>
                                    handleQuestionDraftChange(question.id, event.target.value)
                                  }
                                  onKeyDown={(event) => {
                                    if (event.key === 'Enter' && !isQuestionBusy) {
                                      event.preventDefault()
                                      handleSaveQuestion(question)
                                    }
                                  }}
                                  disabled={isQuestionBusy}
                                />
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    className={styles.buttonClassName}
                                    onClick={() => handleSaveQuestion(question)}
                                    disabled={isQuestionBusy}
                                  >
                                    Сохранить
                                  </button>
                                  <button
                                    type="button"
                                    className={cn(styles.buttonClassName, styles.cancelButton)}
                                    onClick={() => handleCancelEditQuestion(question.id)}
                                    disabled={isQuestionBusy}
                                  >
                                    Отмена
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-wrap items-center gap-3">
                                <div className={cn('text-sm text-foreground', styles.title)}>
                                  {question.text}
                                </div>
                                <button
                                  type="button"
                                  className={cn(styles.buttonClassName, styles.editButton)}
                                  onClick={() => {
                                    handleStartEditQuestion(question)
                                  }}
                                  disabled={isQuestionBusy}
                                >
                                  Редактировать
                                </button>
                                <button
                                  type="button"
                                  className={cn(styles.buttonClassName, styles.deleteButton)}
                                  onClick={() => handleDeleteQuestion(question.id)}
                                  disabled={isQuestionBusy}
                                  title="Удалить вопрос"
                                >
                                  Удалить
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="space-y-3">
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                              Ответы
                            </div>
                            <div className="space-y-2">
                              {question.options.map((option, optionIndex) => {
                                const optionKey = getOptionKey(question.id, optionIndex)
                                const draftOption = optionDrafts[optionKey]
                                const isEditingOption = draftOption !== undefined

                                return (
                                  <div
                                    key={optionKey}
                                    className="flex flex-wrap items-center gap-2 rounded-md border-2 border-border/80 bg-card p-2"
                                  >
                                    {isEditingOption ? (
                                      <>
                                        <Input
                                          value={draftOption}
                                          onChange={(event) =>
                                            setOptionDrafts((prev) => ({
                                              ...prev,
                                              [optionKey]: event.target.value,
                                            }))
                                          }
                                          onKeyDown={(event) => {
                                            if (event.key === 'Enter' && !isQuestionBusy) {
                                              event.preventDefault()
                                              handleSaveOption(question.id, optionIndex)
                                            }
                                          }}
                                          disabled={isQuestionBusy}
                                        />
                                        <div className="flex gap-2">
                                          <button
                                            type="button"
                                            className={styles.buttonClassName}
                                            onClick={() =>
                                              handleSaveOption(question.id, optionIndex)
                                            }
                                            disabled={isQuestionBusy}
                                            title="Сохранить ответ"
                                          >
                                            Сохранить
                                          </button>
                                          <button
                                            type="button"
                                            className={cn(
                                              styles.buttonClassName,
                                              styles.cancelButton
                                            )}
                                            onClick={() =>
                                              handleCancelEditOption(question.id, optionIndex)
                                            }
                                            disabled={isQuestionBusy}
                                            title="Отмена"
                                          >
                                            Отмена
                                          </button>
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <span className="flex-1 text-sm text-foreground">
                                          {option}
                                        </span>
                                        <button
                                          type="button"
                                          className={cn(styles.buttonClassName, styles.editButton)}
                                          onClick={() =>
                                            handleStartEditOption(question.id, optionIndex, option)
                                          }
                                          disabled={isQuestionBusy}
                                          title="Редактировать ответ"
                                        >
                                          Изменить
                                        </button>
                                        <button
                                          type="button"
                                          className={cn(
                                            styles.buttonClassName,
                                            styles.deleteButton
                                          )}
                                          onClick={() =>
                                            handleDeleteOption(question.id, optionIndex)
                                          }
                                          disabled={isQuestionBusy}
                                          title="Удалить ответ"
                                        >
                                          Удалить
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )
                              })}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 rounded-md border border-border/60 p-2">
                              <Input
                                placeholder="Новый ответ"
                                value={newOptionDrafts[question.id] ?? ''}
                                onChange={(event) =>
                                  handleNewOptionChange(question.id, event.target.value)
                                }
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter' && !isQuestionBusy) {
                                    event.preventDefault()
                                    handleAddOption(question.id)
                                  }
                                }}
                                disabled={isQuestionBusy}
                              />
                              <button
                                type="button"
                                className={cn(styles.buttonClassName, styles.addButton)}
                                onClick={() => handleAddOption(question.id)}
                                disabled={isQuestionBusy}
                              >
                                Добавить
                              </button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}

              <div className="space-y-4 rounded-md border border-border/60 bg-card p-4">
                <div className="text-sm font-medium text-foreground">Создать новый вопрос</div>
                <Input
                  placeholder="Текст нового вопроса"
                  value={newQuestionText}
                  onChange={(event) => setNewQuestionText(event.target.value)}
                  disabled={isCreatingQuestion}
                />
                <div className="space-y-2">
                  {newQuestionOptions.map((option, optionIndex) => (
                    <div
                      key={`new-option-${optionIndex}`}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <Input
                        placeholder={`Ответ ${optionIndex + 1}`}
                        value={option}
                        onChange={(event) =>
                          handleNewQuestionOptionChange(optionIndex, event.target.value)
                        }
                        disabled={isCreatingQuestion}
                      />
                      <button
                        type="button"
                        className={cn(styles.buttonClassName, styles.deleteButton)}
                        onClick={() => handleRemoveNewQuestionOption(optionIndex)}
                        disabled={isCreatingQuestion || newQuestionOptions.length <= 1}
                        title="Удалить ответ"
                      >
                        Удалить
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className={cn(styles.buttonClassName, styles.addButton)}
                    onClick={handleAddNewQuestionOption}
                    disabled={isCreatingQuestion}
                  >
                    Добавить вариант ответа
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label
                    className="text-xs uppercase tracking-wide text-muted-foreground"
                    htmlFor="new-question-position"
                  >
                    Поставить после
                  </label>
                  <select
                    id="new-question-position"
                    className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
                    value={
                      typeof newQuestionPosition === 'number'
                        ? String(newQuestionPosition)
                        : newQuestionPosition
                    }
                    onChange={(event) => handleNewQuestionPositionChange(event.target.value)}
                    disabled={isCreatingQuestion}
                  >
                    <option value="start">Перед первым вопросом</option>
                    {data.map((question, questionIndex) => (
                      <option key={`position-${question.id}`} value={question.id}>
                        После вопроса №{questionIndex + 1}
                      </option>
                    ))}
                    <option value="end">В конце списка</option>
                  </select>
                </div>
                <button
                  type="button"
                  className={cn(styles.buttonClassName, styles.addButton)}
                  onClick={handleCreateNewQuestion}
                  disabled={isCreatingQuestion}
                >
                  Создать вопрос
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
