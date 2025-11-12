import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { consumeDailyRateLimit } from '@/app/lib/rate-limit'
import { verifySessionToken } from '@/app/lib/session-token'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const DAILY_LIMIT = 3
const RATE_LIMIT_ROUTE = 'quiz:submit'

const fingerprintSchema = z
  .object({
    visitorId: z.string().min(1).max(128),
    userAgent: z.string().min(1).max(1024).optional(),
    language: z.string().min(1).max(32).optional(),
    platform: z.string().min(1).max(64).optional(),
    hardwareConcurrency: z.coerce.number().int().min(1).max(512).optional(),
    screen: z
      .string()
      .regex(/^\d+x\d+x\d+$/, 'screen must be formatted as <width>x<height>x<colorDepth>')
      .max(32)
      .optional(),
    timezone: z.string().min(1).max(128).optional(),
    gpuVendor: z.string().min(1).max(256).optional(),
    gpuRenderer: z.string().min(1).max(512).optional(),
    timestamp: z
      .string()
      .refine((value) => !Number.isNaN(Date.parse(value)), {
        message: 'timestamp must be a valid ISO date string',
      })
      .optional(),
  })
  .passthrough()

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

    if (data.success) {
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

    const rateLimitResult = await consumeDailyRateLimit({
      identifier: ip,
      route: RATE_LIMIT_ROUTE,
      limit: DAILY_LIMIT,
    })

    if (!rateLimitResult.allowed) {
      return NextResponse.json({ message: 'Quiz submitted successfully. rate limit' })
    }

    const authHeader = req.headers.get('authorization')
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!bearerToken) {
      return NextResponse.json({ message: 'Quiz submitted successfully. bearerToken' })
    }

    const verifiedToken = await verifySessionToken(bearerToken)

    if (!verifiedToken) {
      return NextResponse.json({ message: 'Quiz submitted successfully. verifiedToken' })
    }

    if (
      verifiedToken.ip &&
      verifiedToken.ip !== 'unknown' &&
      ip !== 'unknown' &&
      verifiedToken.ip !== ip
    ) {
      return NextResponse.json({ message: 'Quiz submitted successfully. ip' })
    }

    if (
      verifiedToken.ua &&
      verifiedToken.ua !== 'unknown' &&
      userAgent &&
      verifiedToken.ua !== userAgent
    ) {
      return NextResponse.json({ message: 'Quiz submitted successfully. ua' })
    }

    const session = await prisma.quizSession.findUnique({
      where: { id: verifiedToken.sessionId },
    })

    if (!session) {
      return NextResponse.json({ message: 'Quiz submitted successfully.' })
    }

    if (session.status !== 'active') {
      return NextResponse.json({ message: 'Quiz submitted successfully.' })
    }

    if (session.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ message: 'Quiz submitted successfully.' })
    }
    let validatedFingerprintData: Prisma.InputJsonValue | undefined

    if (fingerprintData) {
      const parsedFingerprint = fingerprintSchema.safeParse(fingerprintData)

      if (!parsedFingerprint.success) {
        console.error('Invalid fingerprint data:', parsedFingerprint.error.flatten())
        return NextResponse.json({ message: 'Quiz submitted successfully.' })
      }

      validatedFingerprintData = parsedFingerprint.data as Prisma.InputJsonValue
    }
    if (!recaptchaToken) {
      return NextResponse.json({ message: 'Quiz submitted successfully.' })
    }

    const verificationResult = await verifyRecaptcha(recaptchaToken, ip)
    if (!verificationResult.success) {
      console.error('reCAPTCHA verification failed:', verificationResult.errorCodes)
      return NextResponse.json({ message: 'Quiz submitted successfully.' })
    }

    const recaptchaVerified: boolean = true

    if (!answers || !name || !phone || !contactMethod) {
      return NextResponse.json({ message: 'Quiz submitted successfully.' })
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

    const answerCommentParts = orderedAnswers.map(
      (item) => `${item.questionNumber}. (${item.questionText}): ${item.answer}`
    )

    function getContactMethod() {
      if (contactMethod === 'whatsapp') return 'Написать в Whatsapp'
      if (contactMethod === 'telegram') return 'Написать в Telegram'
      return 'Позвонить'
    }

    const crmPayload = {
      name,
      phone,
      utm_source: 'KwizRU',
      comments: answerCommentParts.join(' | '),
      contactMethod: getContactMethod(),
    }

    console.log({ crmPayload })

    try {
      const crmResponse = await fetch(
        `https://wdg.biz-crm.ru/inserv/in.php?token=${process.env.TOKEN_CRM}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(crmPayload),
        }
      )

      if (!crmResponse.ok) {
        const crmBody = await crmResponse.text()
        console.error('Failed to send lead to CRM', crmResponse.status, crmBody)
      }
    } catch (crmError) {
      console.error('Error sending lead to CRM', crmError)
    }

    await prisma.quizResult.create({
      data: {
        sessionId: session.id,
        phone,
        ipAddress: ip,
        userAgent: userAgent,
        fingerprintData: validatedFingerprintData ?? Prisma.JsonNull,
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
    })
  } catch (e) {
    console.error('Error submitting quiz:', e)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
