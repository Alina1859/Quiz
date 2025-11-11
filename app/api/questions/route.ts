import { NextRequest, NextResponse } from 'next/server'
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

interface CreateQuestionPayload {
  text?: string
  options?: string[]
}

export async function POST(req: NextRequest) {
  try {
    const adminToken = req.cookies.get('adminToken')?.value
    const validToken = process.env.ADMIN_TOKEN

    if (!validToken) {
      return NextResponse.json({ error: 'Admin token not configured' }, { status: 500 })
    }

    if (adminToken !== validToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = (await req.json()) as CreateQuestionPayload
    const { text, options } = payload

    if (typeof text !== 'string') {
      return NextResponse.json({ error: 'Поле text обязательно' }, { status: 400 })
    }

    const trimmedText = text.trim()

    if (!trimmedText) {
      return NextResponse.json({ error: 'Текст вопроса не может быть пустым' }, { status: 400 })
    }

    const sanitizedOptions = Array.isArray(options)
      ? options
          .map((option) => (typeof option === 'string' ? option.trim() : ''))
          .filter((option) => option.length > 0)
      : []

    const newQuestion = await prisma.question.create({
      data: {
        text: trimmedText,
        options: sanitizedOptions,
      },
    })

    return NextResponse.json(
      {
        question: {
          id: newQuestion.id,
          text: newQuestion.text,
          options: (newQuestion.options as string[]) ?? [],
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating question:', error)
    return NextResponse.json({ error: 'Ошибка при создании вопроса' }, { status: 500 })
  }
}
