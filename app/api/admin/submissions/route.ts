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

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = 5
    const skip = (page - 1) * limit

    const total = await prisma.quizResult.count()

    const results = await prisma.quizResult.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })

    const submissions = results.map((result) => {
      const answers = result.answers as any
      const fingerprint = result.fingerprint as any
      const fingerprintData = result.fingerprintData as any
      return {
        id: result.id,
        name: answers?.name || 'Не указано',
        phone: result.phone,
        ipAddress: result.ipAddress || 'Не указано',
        userAgent: result.userAgent || null,
        fingerprint: fingerprint || fingerprintData || null,
        fingerprintData: fingerprintData || null,
        recaptchaVerified: result.recaptchaVerified,
        createdAt: result.createdAt.toISOString(),
        answers: answers || null,
      }
    })

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      submissions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
