import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function POST(req: NextRequest) {
	try {
		const { answers, name, phone, contactMethod } = await req.json()
		
		// Валидация
		if (!answers || !name || !phone || !contactMethod) {
			return NextResponse.json(
				{ message: 'Missing required fields' },
				{ status: 400 }
			)
		}

		// Получаем вопросы в правильном порядке
		const questions = await prisma.question.findMany({ 
			orderBy: { id: 'asc' } 
		})
		
		// Создаем массив ответов в правильном порядке
		const orderedAnswers = questions.map((question, index) => ({
			questionId: question.id,
			questionText: question.text,
			questionNumber: index + 1,
			answer: answers[question.id] || null
		})).filter(item => item.answer !== null)

		// Создаем новую сессию для результата
		const session = await prisma.quizSession.create({
			data: {
				expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 часа
				status: 'active',
			},
		})
		
		await prisma.quizResult.create({
			data: {
				sessionId: session.id,
				phone,
				answers: {
					answers: orderedAnswers,
					name,
					contactMethod,
				},
			},
		})
		
		await prisma.quizSession.update({
			where: { id: session.id },
			data: { status: 'completed' },
		})
		
		return NextResponse.json({ 
			message: 'Quiz submitted successfully.',
			sessionId: session.id
		})
	} catch (e) {
		console.error('Error submitting quiz:', e)
		return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
	}
}
