import { cookies } from 'next/headers'
import { prisma } from './prisma'

const SESSION_COOKIE = 'sessionId'

export async function createSession(minutes = 10) {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + minutes * 60 * 1000)
  const session = await prisma.quizSession.create({
    data: { expiresAt, status: 'active' },
  })
  return session
}

export async function getActiveSession() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value
  if (!sessionId) return null
  const session = await prisma.quizSession.findUnique({ where: { id: sessionId } })
  if (!session || session.status !== 'active' || session.expiresAt <= new Date()) return null
  return session
}

export async function deactivateSession(sessionId: string) {
  await prisma.quizSession.update({ where: { id: sessionId }, data: { status: 'completed' } })
}

export { SESSION_COOKIE }
