import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { signSessionToken } from '@/app/lib/session-token'
import { v4 as uuidv4 } from 'uuid'
import { consumeDailyRateLimit } from '@/app/lib/rate-limit'

const DAILY_LIMIT = 14
const RATE_LIMIT_ROUTE = 'quiz:start'

export async function POST(req: NextRequest) {
  try {
    const forwardedFor = req.headers.get('x-forwarded-for')
    const realIp = req.headers.get('x-real-ip')
    const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown'
    const userAgent = req.headers.get('user-agent') || null

    const rateLimitResult = await consumeDailyRateLimit({
      identifier: ip,
      route: RATE_LIMIT_ROUTE,
      limit: DAILY_LIMIT,
    })

    if (!rateLimitResult.allowed) {
      return NextResponse.json({ message: 'Quiz submitted successfully. rate limit' })
    }

    const sessionId = uuidv4()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await prisma.quizSession.create({
      data: {
        id: sessionId,
        expiresAt,
        status: 'active',
      },
    })

    const token = await signSessionToken(
      {
        sessionId,
        ip,
        ua: userAgent,
      },
      expiresAt
    )

    const response = NextResponse.json({ message: 'Quiz session started.', token })

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
