import { NextResponse } from 'next/server'

const COOKIE = 'uohmi_session'

export async function POST() {
  const res = NextResponse.json({ success: true })
  res.cookies.delete(COOKIE)
  return res
}