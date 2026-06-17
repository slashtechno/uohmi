import { NextRequest, NextResponse } from 'next/server'

const COOKIE = 'uohmi_session'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  if (password === process.env.ADMIN_PASSWORD) {
    const res = NextResponse.json({ success: true })
    res.cookies.set(COOKIE, process.env.SESSION_SECRET!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    })
    return res
  }
  return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
}