import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

async function verifyRecaptcha(
  token: string,
  remoteip?: string
): Promise<{ success: boolean; errorCodes?: string[] }> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY

  if (!secretKey) {
    console.warn('RECAPTCHA_SECRET_KEY не установлен, пропускаем проверку')
    return { success: true }
  }

  try {
    const body = new URLSearchParams({
      secret: secretKey,
      response: token,
    })

    if (remoteip && remoteip !== 'unknown') {
      body.append('remoteip', remoteip)
    }

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    const data = await response.json()
console.log(data)
    if (data.success === true) {
      if (data.score !== undefined) {
        const isValidScore = data.score >= 0.5
        return {
          success: isValidScore,
          errorCodes: isValidScore ? undefined : ['low-score'],
        }
      }
      return { success: true }
    }
    return {
      success: false,
      errorCodes: data['error-codes'] || ['unknown-error'],
    }
  } catch (error) {
    console.error('Ошибка проверки reCAPTCHA:', error)
    return {
      success: false,
      errorCodes: ['verification-failed'],
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { answers, name, phone, contactMethod, recaptchaToken, fingerprintData } =
      await req.json()

    const forwardedFor = req.headers.get('x-forwarded-for')
    const realIp = req.headers.get('x-real-ip')
    const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown'

    const userAgent = req.headers.get('user-agent') || null
    if (!recaptchaToken) {
      return NextResponse.json({ message: 'reCAPTCHA token is required' }, { status: 400 })
    }

    const verificationResult = await verifyRecaptcha(recaptchaToken, ip)
    if (!verificationResult.success) {
      console.error('reCAPTCHA verification failed:', verificationResult.errorCodes)
      return NextResponse.json(
        {
          message: 'reCAPTCHA verification failed',
          errorCodes: verificationResult.errorCodes,
        },
        { status: 403 }
      )
    }

    const recaptchaVerified: boolean = true

    if (!answers || !name || !phone || !contactMethod) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    const questions = await prisma.question.findMany({
      orderBy: { id: 'asc' },
    })

    const orderedAnswers = questions
      .map((question, index) => ({
        questionId: question.id,
        questionText: question.text,
        questionNumber: index + 1,
        answer: answers[question.id] || null,
      }))
      .filter((item) => item.answer !== null)

    const session = await prisma.quizSession.create({
      data: {
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: 'active',
      },
    })

    await (prisma.quizResult as any).create({
      data: {
        sessionId: session.id,
        phone,
        ipAddress: ip,
        userAgent: userAgent,
        fingerprintData: fingerprintData || null,
        recaptchaVerified: recaptchaVerified,
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
      sessionId: session.id,
    })
  } catch (e) {
    console.error('Error submitting quiz:', e)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
