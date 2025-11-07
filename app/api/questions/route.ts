import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET() {
  try {
    const questions = await prisma.question.findMany({
      orderBy: { id: 'asc' },
    })

    const formattedQuestions = questions.map((q) => ({
      id: q.id,
      text: q.text,
      options: q.options as string[],
    }))

    return NextResponse.json({ questions: formattedQuestions })
  } catch (error) {
    console.error('Error fetching questions:', error)
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
  }
}
