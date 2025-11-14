import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible'

type RateLimitOptions = {
  identifier: string | null
  route: string
  limit: number
}

type RateLimitResult =
  | {
      allowed: true
      remaining: number
    }
  | {
      allowed: false
      remaining: 0
      retryAfterSeconds: number
    }

type LimiterKey = `${string}:${number}`

declare global {
  // eslint-disable-next-line no-var
  var __rateLimiterStore: Map<LimiterKey, RateLimiterMemory> | undefined
}

const limiterStore: Map<LimiterKey, RateLimiterMemory> =
  globalThis.__rateLimiterStore ?? new Map<LimiterKey, RateLimiterMemory>()

if (!globalThis.__rateLimiterStore) {
  globalThis.__rateLimiterStore = limiterStore
}

function getLimiter(route: string, limit: number): RateLimiterMemory {
  const safeLimit = Math.max(limit, 1)
  const key: LimiterKey = `${route}:${safeLimit}`

  const existing = limiterStore.get(key)
  if (existing) {
    return existing
  }

  const limiter = new RateLimiterMemory({
    points: safeLimit,
    duration: 24 * 60 * 60, // 1 day window
    blockDuration: 24 * 60 * 60,
  })

  limiterStore.set(key, limiter)

  return limiter
}

function isIpWhitelisted(ip: string | null): boolean {
  if (!ip || ip === 'unknown') {
    return false
  }

  const whitelistEnv = process.env.RATE_LIMIT_WHITELIST_IPS
  if (!whitelistEnv) {
    return false
  }

  const whitelistedIps = whitelistEnv.split(',').map((ip) => ip.trim()).filter(Boolean)
  return whitelistedIps.includes(ip)
}

export async function consumeDailyRateLimit({
  identifier,
  route,
  limit,
}: RateLimitOptions): Promise<RateLimitResult> {
  // Пропускаем rate limiting для IP-адресов из whitelist
  if (isIpWhitelisted(identifier)) {
    return {
      allowed: true,
      remaining: limit,
    }
  }

  const key = identifier && identifier !== 'unknown' ? identifier : 'anonymous'
  const limiter = getLimiter(route, limit)

  try {
    const res = await limiter.consume(`${route}:${key}`)
    return {
      allowed: true,
      remaining: res.remainingPoints,
    }
  } catch (error) {
    if (error instanceof RateLimiterRes) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.ceil(error.msBeforeNext / 1000),
      }
    }

    throw error
  }
}

