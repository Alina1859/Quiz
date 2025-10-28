import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(req: NextRequest) {
	const sessionId = req.cookies.get('sessionId')?.value
	
	if (!sessionId) {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
	}
	
	const session = await prisma.quizSession.findUnique({ where: { id: sessionId } })
	
	if (!session || session.status !== 'active' || session.expiresAt <= new Date()) {
		return NextResponse.json({ message: 'Invalid or expired session.' }, { status: 403 })
	}
	
	const questions = await prisma.question.findMany({ orderBy: { id: 'asc' } })
	return NextResponse.json({ questions })
}
