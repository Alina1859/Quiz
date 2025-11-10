import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/app/lib/prisma'

interface UpdateQuestionPayload {
  text?: string
  options?: string[]
}

export async function PUT(req: NextRequest, context: { params: { id: number } }) {
  try {
    const adminToken = req.cookies.get('adminToken')?.value
    const validToken = process.env.ADMIN_TOKEN

    if (!validToken) {
      return NextResponse.json({ error: 'Admin token not configured' }, { status: 500 })
    }

    if (adminToken !== validToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const questionId = Number.parseInt(id, 10)

    if (Number.isNaN(questionId)) {
      return NextResponse.json({ error: 'Invalid question id' }, { status: 400 })
    }

    const payload = (await req.json()) as UpdateQuestionPayload
    const { text, options } = payload

    if (typeof text !== 'string') {
      return NextResponse.json({ error: 'Поле text обязательно' }, { status: 400 })
    }

    if (!Array.isArray(options)) {
      return NextResponse.json(
        { error: 'Поле options должно быть массивом строк' },
        { status: 400 }
      )
    }

    const trimmedText = text.trim()

    if (!trimmedText) {
      return NextResponse.json({ error: 'Текст вопроса не может быть пустым' }, { status: 400 })
    }

    const sanitizedOptions = options
      .map((option) => (typeof option === 'string' ? option.trim() : ''))
      .filter((option) => option.length > 0)

    const existingQuestion = await prisma.question.findUnique({
      where: { id: questionId },
    })

    if (!existingQuestion) {
      return NextResponse.json({ error: 'Вопрос не найден' }, { status: 404 })
    }

    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: {
        text: trimmedText,
        options: sanitizedOptions,
      },
    })

    return NextResponse.json({
      question: {
        id: updatedQuestion.id,
        text: updatedQuestion.text,
        options: updatedQuestion.options as string[],
      },
    })
  } catch (error) {
    console.error('Error updating question:', error)
    return NextResponse.json({ error: 'Ошибка при обновлении вопроса' }, { status: 500 })
  }
}
