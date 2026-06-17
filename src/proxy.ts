import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get('uohmi_session')
  const { pathname } = request.nextUrl
  const isPublic = pathname.startsWith('/pay') || pathname.startsWith('/api/payments') || pathname.startsWith('/api/auth') || pathname === '/login' || pathname.startsWith('/api/public')

  if (!isPublic && !sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname === '/login' && sessionCookie) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|sw.js|icons).*)'] }
