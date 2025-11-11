import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/app/lib/prisma'

interface UpdateQuestionPayload {
  text?: string
  options?: string[]
}

const validateAdmin = (req: NextRequest) => {
  const adminToken = req.cookies.get('adminToken')?.value
  const validToken = process.env.ADMIN_TOKEN

  if (!validToken) {
    return { error: NextResponse.json({ error: 'Admin token not configured' }, { status: 500 }) }
  }

  if (adminToken !== validToken) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  return { ok: true as const }
}

const parseQuestionId = (params: { id: string }) => {
  const { id } = params
  const questionId = Number.parseInt(id, 10)

  if (Number.isNaN(questionId)) {
    return { error: NextResponse.json({ error: 'Invalid question id' }, { status: 400 }) }
  }

  return { questionId }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const adminCheck = validateAdmin(req)
    if ('error' in adminCheck) {
      return adminCheck.error
    }

    const parsed = parseQuestionId(await context.params)
    if ('error' in parsed) {
      return parsed.error
    }

    const { questionId } = parsed

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

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const adminCheck = validateAdmin(req)
    if ('error' in adminCheck) {
      return adminCheck.error
    }

    const parsed = parseQuestionId(await context.params)
    if ('error' in parsed) {
      return parsed.error
    }

    const { questionId } = parsed

    const existingQuestion = await prisma.question.findUnique({
      where: { id: questionId },
    })

    if (!existingQuestion) {
      return NextResponse.json({ error: 'Вопрос не найден' }, { status: 404 })
    }

    await prisma.question.delete({
      where: { id: questionId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting question:', error)
    return NextResponse.json({ error: 'Ошибка при удалении вопроса' }, { status: 500 })
  }
}
