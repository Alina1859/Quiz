import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import MainButton from '@/app/components/Buttons/MainButton/MainButton'
import type { CardBlockedIpsProps } from '@/types/admin'

function formatDate(dateIso: string) {
  const date = new Date(dateIso)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function CardBlockedIps({
  blockedIps,
  isLoading,
  isSaving,
  onAdd,
  onRemove,
}: CardBlockedIpsProps) {
  const [ipValue, setIpValue] = useState('')
  const [reasonValue, setReasonValue] = useState('')
  const [formError, setFormError] = useState('')
  const [removingId, setRemovingId] = useState<number | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')
    const ip = ipValue.trim()
    if (!ip) {
      setFormError('Введите IP-адрес')
      return
    }
    try {
      await onAdd(ip, reasonValue.trim())
      setIpValue('')
      setReasonValue('')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Не удалось добавить IP-адрес. Попробуйте ещё раз.'
      setFormError(message)
    }
  }

  const handleRemove = async (id: number) => {
    setRemovingId(id)
    try {
      await onRemove(id)
    } catch (error) {
      console.error('Error removing blocked IP', error)
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Блокировка IP адресов</CardTitle>
        <CardDescription>
          Добавьте IP адрес, чтобы заблокировать отправку заявок, или удалите ранее добавленные.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-[2fr,3fr]">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="blocked-ip-input">
                IP адрес
              </label>
              <Input
                id="blocked-ip-input"
                placeholder="Например, 192.168.0.1"
                value={ipValue}
                onChange={(event) => setIpValue(event.target.value)}
                disabled={isSaving}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="blocked-ip-reason">
                Комментарий (необязательно)
              </label>
              <Input
                id="blocked-ip-reason"
                placeholder="Краткая причина блокировки"
                value={reasonValue}
                onChange={(event) => setReasonValue(event.target.value)}
                disabled={isSaving}
              />
            </div>
          </div>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <MainButton type="submit" disabled={isSaving}>
            {isSaving ? 'Сохранение...' : 'Добавить IP'}
          </MainButton>
        </form>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Текущие блокировки
          </h3>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Загрузка списка заблокированных IP...</p>
          ) : blockedIps.length === 0 ? (
            <p className="text-sm text-muted-foreground">Список пуст.</p>
          ) : (
            <div className="space-y-2">
              {blockedIps.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-sm">{entry.ipAddress}</p>
                    <p className="text-xs text-muted-foreground">
                      Добавлен: {formatDate(entry.createdAt)}
                      {entry.createdBy ? ` • ${entry.createdBy}` : ''}
                    </p>
                    {entry.reason && (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        Причина: {entry.reason}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(entry.id)}
                    disabled={removingId === entry.id || isSaving}
                    className="inline-flex items-center justify-center rounded-md border border-destructive px-3 py-1 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {removingId === entry.id ? 'Удаление...' : 'Удалить'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

