import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
	try {
		const sessionId = uuidv4()
		const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
		
		await prisma.quizSession.create({ 
			data: { 
				id: sessionId, 
				expiresAt,
				status: 'active'
			} 
		})
		
		const response = NextResponse.json({ message: 'Quiz session started.' })
		
		response.cookies.set('sessionId', sessionId, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			path: '/',
			expires: expiresAt,
		})
		
		return response
	} catch (e) {
		console.error('Error starting quiz session:', e)
		return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
	}
}
