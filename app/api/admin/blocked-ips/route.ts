import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

function ensureAdmin(req: NextRequest) {
  const adminToken = req.cookies.get('adminToken')?.value
  const validToken = process.env.ADMIN_TOKEN

  if (!validToken || adminToken !== validToken) {
    return false
  }
  return true
}

function sanitizeIp(ip: unknown) {
  if (typeof ip !== 'string') {
    return null
  }
  const value = ip.trim()
  if (value.length === 0) {
    return null
  }
  return value
}

export async function GET(req: NextRequest) {
  if (!ensureAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const blockedIpClient = (prisma as any)?.blockedIp

  if (!blockedIpClient?.findMany) {
    console.error('Blocked IP Prisma client is not available. Did you run prisma generate?')
    return NextResponse.json({ error: 'Service not configured' }, { status: 500 })
  }

  try {
    const blockedIps = await blockedIpClient.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      blockedIps: blockedIps.map((item: any) => ({
        id: item.id,
        ipAddress: item.ipAddress,
        reason: item.reason,
        createdBy: item.createdBy,
        createdAt: item.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Error fetching blocked IPs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!ensureAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const blockedIpClient = (prisma as any)?.blockedIp

  if (!blockedIpClient?.create) {
    console.error('Blocked IP Prisma client is not available. Did you run prisma generate?')
    return NextResponse.json({ error: 'Service not configured' }, { status: 500 })
  }

  try {
    const { ipAddress, reason, createdBy } = await req.json()
    const normalizedIp = sanitizeIp(ipAddress)

    if (!normalizedIp) {
      return NextResponse.json({ error: 'Введите корректный IP-адрес' }, { status: 400 })
    }

    try {
      const newEntry = await blockedIpClient.create({
        data: {
          ipAddress: normalizedIp,
          reason: typeof reason === 'string' && reason.trim().length > 0 ? reason.trim() : null,
          createdBy:
            typeof createdBy === 'string' && createdBy.trim().length > 0 ? createdBy.trim() : null,
        },
      })

      return NextResponse.json({
        blockedIp: {
          id: newEntry.id,
          ipAddress: newEntry.ipAddress,
          reason: newEntry.reason,
          createdBy: newEntry.createdBy,
          createdAt: newEntry.createdAt.toISOString(),
        },
      })
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2002' // unique constraint
      ) {
        return NextResponse.json({ error: 'IP-адрес уже заблокирован' }, { status: 409 })
      }
      throw error
    }
  } catch (error) {
    console.error('Error creating blocked IP entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  if (!ensureAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const blockedIpClient = (prisma as any)?.blockedIp

  if (!blockedIpClient?.delete) {
    console.error('Blocked IP Prisma client is not available. Did you run prisma generate?')
    return NextResponse.json({ error: 'Service not configured' }, { status: 500 })
  }

  try {
    const { id, ipAddress } = await req.json()

    if (typeof id !== 'number' && typeof ipAddress !== 'string') {
      return NextResponse.json({ error: 'Укажите IP-адрес или ID для удаления' }, { status: 400 })
    }

    const where =
      typeof id === 'number'
        ? { id }
        : {
            ipAddress: ipAddress.trim(),
          }

    await blockedIpClient.delete({
      where,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting blocked IP entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

