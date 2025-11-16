import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { consumeDailyRateLimit } from '@/app/lib/rate-limit'
import { verifySessionToken } from '@/app/lib/session-token'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { isValidPhoneNumber } from 'libphonenumber-js'

const DAILY_LIMIT = 8
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

const submitSchema = z.object({
  answers: z.record(z.string()),
  name: z.string().min(1, 'Имя обязательно для заполнения'),
  phone: z
    .string()
    .min(1, 'Номер телефона обязателен для заполнения')
    .refine(
      (value) => {
        if (!value || value.trim() === '') return false
        try {
          return isValidPhoneNumber(value)
        } catch {
          return false
        }
      },
      { message: 'Некорректный номер телефона' }
    ),
  contactMethod: z.enum(['call', 'whatsapp', 'telegram'], {
    errorMap: () => ({ message: 'Некорректный способ связи' }),
  }),
  recaptchaToken: z.string().min(1, 'reCAPTCHA токен обязателен'),
  fingerprintData: fingerprintSchema.optional(),
})

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
    const body = await req.json()

    const forwardedFor = req.headers.get('x-forwarded-for')
    const realIp = req.headers.get('x-real-ip')
    const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown'
    const userAgent = req.headers.get('user-agent') || null

    const rateLimitResult = await consumeDailyRateLimit({
      identifier: ip,
      route: RATE_LIMIT_ROUTE,
      limit: DAILY_LIMIT,
    })

    const parsedData = submitSchema.safeParse(body)

    if (!parsedData.success) {
      console.error('Invalid submit data:', parsedData.error.flatten())
      return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }

    const { answers, name, phone, contactMethod, recaptchaToken, fingerprintData } = parsedData.data

    if (!rateLimitResult.allowed) {
      console.log('Rate Limit Error!', { name, phone, contactMethod }, rateLimitResult)

      return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }

    const authHeader = req.headers.get('authorization')
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!bearerToken) {
      console.log('Bearer Token Error!', { name, phone, contactMethod })
      return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }

    const verifiedToken = await verifySessionToken(bearerToken)

    if (!verifiedToken) {
      console.log('Verify Session Error!', { name, phone, contactMethod })
      return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }

    if (
      verifiedToken.ip &&
      verifiedToken.ip !== 'unknown' &&
      ip !== 'unknown' &&
      verifiedToken.ip !== ip
    ) {
      console.log('Verify Session Error IP!', { name, phone, contactMethod }, { verifiedToken })
      return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }

    if (
      verifiedToken.ua &&
      verifiedToken.ua !== 'unknown' &&
      userAgent &&
      verifiedToken.ua !== userAgent
    ) {
      console.log('Verify Session Error UA!', { name, phone, contactMethod }, { verifiedToken })
      return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }

    const session = await prisma.quizSession.findUnique({
      where: { id: verifiedToken.sessionId },
    })

    if (!session) {
      console.log('Session Not A found!', { name, phone, contactMethod }, { verifiedToken })
      return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }

    // Проверка на бота по user-agent
    const BOT_USER_AGENTS = [
      'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
    ]
    if (userAgent && BOT_USER_AGENTS.includes(userAgent)) {
      console.log('Bot detected by user-agent!', { name, phone, contactMethod }, { userAgent })

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

      await prisma.quizResult.create({
        data: {
          sessionId: session.id,
          phone,
          ipAddress: ip,
          userAgent: userAgent,
          fingerprintData: fingerprintData
            ? (fingerprintData as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          recaptchaVerified: false,
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

      await new Promise((resolve) => setTimeout(resolve, 3000))

      return NextResponse.json({
        message: 'Quiz submitted successfully.',
      })
    }

    if (session.status !== 'active') {
      console.log('Session is Not active!', { name, phone, contactMethod }, { session })
      return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }

    if (session.expiresAt.getTime() < Date.now()) {
      console.log('Session is expired!', { name, phone, contactMethod }, { session })
      return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }

    const verificationResult = await verifyRecaptcha(recaptchaToken, ip)

    const recaptchaVerified = verificationResult.success

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

    await prisma.quizResult.create({
      data: {
        sessionId: session.id,
        phone,
        ipAddress: ip,
        userAgent: userAgent,
        fingerprintData: fingerprintData
          ? (fingerprintData as Prisma.InputJsonValue)
          : Prisma.JsonNull,
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

    if (!verificationResult.success) {
      console.error('reCAPTCHA verification failed:', verificationResult.errorCodes)
      return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
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
        console.log('CRM Error!', { name, phone, contactMethod }, crmResponse.status, crmBody, {
          crmPayload,
        })
      }
    } catch (crmError) {
      console.log('CRM Error!', { name, phone, contactMethod }, { crmError }, { crmPayload })
      console.error('Error sending lead to CRM', crmError)
    }

    return NextResponse.json({
      message: 'Quiz submitted successfully.',
    })
  } catch (e) {
    console.error('Error submitting quiz:', e)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
