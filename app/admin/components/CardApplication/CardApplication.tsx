'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from 'lucide-react'

interface CardApplicationProps {
  totalSubmissions: number
  isLoading: boolean
}

export function CardApplication({ totalSubmissions, isLoading }: CardApplicationProps) {
  return (
    <Card className="bg-muted text-card-foreground flex flex-col gap-4 rounded-lg border p-1 pt-4 w-full mb-[30px]">
      <CardHeader className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6">
        <CardTitle className="leading-none font-semibold">Всего заявок</CardTitle>
      </CardHeader>
      <CardContent className="bg-background h-full rounded-md p-4">
        <div className="flex items-center gap-2">
          <Users className="text-muted-foreground h-5 w-5" aria-hidden="true" />
          <span className="text-foreground text-2xl font-bold">
            {isLoading ? '...' : totalSubmissions}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
