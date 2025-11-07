import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    const adminToken = process.env.ADMIN_TOKEN

    if (!adminToken) {
      return NextResponse.json({ error: 'Admin token not configured' }, { status: 500 })
    }

    if (token !== adminToken) {
      return NextResponse.json({ error: 'Неверный токен' }, { status: 401 })
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    const response = NextResponse.json({ success: true })
    response.cookies.set('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    })

    return response
  } catch (error) {
    console.error('Error verifying admin token:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const adminToken = req.cookies.get('adminToken')?.value
    const validToken = process.env.ADMIN_TOKEN

    if (!validToken) {
      return NextResponse.json({ authenticated: false }, { status: 500 })
    }

    if (adminToken === validToken) {
      return NextResponse.json({ authenticated: true })
    }

    return NextResponse.json({ authenticated: false })
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 500 })
  }
}
