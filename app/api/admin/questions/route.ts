import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/app/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const adminToken = req.cookies.get('adminToken')?.value
    const validToken = process.env.ADMIN_TOKEN

    if (!validToken) {
      return NextResponse.json({ error: 'Admin token not configured' }, { status: 500 })
    }

    if (adminToken !== validToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const questions = await prisma.question.findMany({
      orderBy: { id: 'asc' },
    })

    return NextResponse.json({
      questions: questions.map((question) => ({
        id: question.id,
        text: question.text,
        options: (question.options as string[]) ?? [],
        createdAt: question.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Error fetching questions for admin:', error)
    return NextResponse.json({ error: 'Ошибка при загрузке вопросов' }, { status: 500 })
  }
}
