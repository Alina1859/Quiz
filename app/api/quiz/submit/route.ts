import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function POST(req: NextRequest) {
	const sessionId = req.cookies.get('sessionId')?.value
	
	if (!sessionId) {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
	}
	
	const session = await prisma.quizSession.findUnique({ where: { id: sessionId } })
	if (!session || session.status !== 'active' || session.expiresAt <= new Date()) {
		return NextResponse.json({ message: 'Invalid or expired session.' }, { status: 403 })
	}
	
	try {
		const { answers, phone } = await req.json()
		
		await prisma.quizResult.create({
			data: {
				sessionId,
				phone,
				answers,
			},
		})
		
		await prisma.quizSession.update({
			where: { id: sessionId },
			data: { status: 'completed' },
		})
		
		const response = NextResponse.json({ message: 'Quiz submitted successfully.' })
		
		response.cookies.set('sessionId', '', {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			path: '/',
			expires: new Date(0),
		})
		
		return response
	} catch (e) {
		return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
	}
}
