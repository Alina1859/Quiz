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

    const total = await prisma.quizResult.count()

    const results = await prisma.quizResult.findMany({
      orderBy: { createdAt: 'desc' },
    })

    type SubmissionAnswers = {
      name?: string | null
      contactMethod?: string | null
      answers?: Array<{
        questionId: number
        questionText: string
        questionNumber: number
        answer: string
      }>
    } | null

    type FingerprintPayload = (Record<string, unknown> & {
      visitorId?: unknown
    }) | null

    const submissions = results.map((result) => {
      const answers = result.answers as SubmissionAnswers
      const fingerprintData = result.fingerprintData as FingerprintPayload
      const visitorId =
        typeof fingerprintData?.visitorId === 'string' ? fingerprintData.visitorId : null
      return {
        id: result.id,
        name:
          typeof answers?.name === 'string' && answers.name.trim().length > 0
            ? answers.name
            : 'Не указано',
        phone: result.phone,
        ipAddress: result.ipAddress || 'Не указано',
        userAgent: result.userAgent || null,
        fingerprint: visitorId || fingerprintData || null,
        fingerprintData: fingerprintData || null,
        recaptchaVerified: result.recaptchaVerified,
        createdAt: result.createdAt.toISOString(),
        answers: answers || null,
      }
    })

    return NextResponse.json({
      submissions,
      pagination: {
        page: 1,
        limit: total,
        total,
        totalPages: 1,
      },
    })
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
