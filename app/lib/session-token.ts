import { SignJWT, jwtVerify, JWTPayload } from 'jose'

const encoder = new TextEncoder()

function getSessionSecret(): Uint8Array {
  const secret = process.env.QUIZ_SESSION_SECRET

  if (!secret) {
    throw new Error('QUIZ_SESSION_SECRET is not configured')
  }

  return encoder.encode(secret)
}

type BaseSessionTokenPayload = {
  sessionId: string
  ip?: string | null
  ua?: string | null
}

export type SessionTokenPayload = BaseSessionTokenPayload

export type VerifiedSessionTokenPayload = Required<Pick<BaseSessionTokenPayload, 'sessionId'>> &
  Pick<BaseSessionTokenPayload, 'ip' | 'ua'>

export async function signSessionToken(
  payload: SessionTokenPayload,
  expiresAt: Date
): Promise<string> {
  const secret = getSessionSecret()

  return new SignJWT({
    sessionId: payload.sessionId,
    ip: payload.ip ?? null,
    ua: payload.ua ?? null,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secret)
}

export async function verifySessionToken(token: string): Promise<VerifiedSessionTokenPayload | null> {
  const secret = getSessionSecret()

  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    })

    const sessionId = payload.sessionId
    const ip = payload.ip
    const ua = payload.ua

    if (typeof sessionId !== 'string' || sessionId.length === 0) {
      return null
    }

    return {
      sessionId,
      ip: typeof ip === 'string' ? ip : null,
      ua: typeof ua === 'string' ? ua : null,
    }
  } catch (error) {
    console.error('Failed to verify session token:', error)
    return null
  }
}

