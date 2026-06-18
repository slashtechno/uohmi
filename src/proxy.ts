import { NextRequest, NextResponse } from 'next/server'

const COOKIE = 'uohmi_session'

function isPublic(pathname: string): boolean {
  return (
    pathname === '/login' ||
    pathname.startsWith('/pay/') ||
    pathname.startsWith('/api/public/') ||
    pathname === '/api/auth/login' ||
    pathname === '/api/payments'  // payer POST; /api/payments/*/confirm is admin-only
  )
}

function isAuthenticated(req: NextRequest): boolean {
  const expected = process.env.SESSION_SECRET
  if (!expected) return false  // fail closed if misconfigured
  const session = req.cookies.get(COOKIE)?.value
  return !!session && session === expected
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const authed = isAuthenticated(req)

  // Redirect authenticated users away from /login
  if (pathname === '/login' && authed) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  if (isPublic(pathname)) return NextResponse.next()

  if (authed) return NextResponse.next()

  // API routes: return 401 instead of an HTML redirect
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const loginUrl = new URL('/login', req.url)
  loginUrl.searchParams.set('next', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|icons).*)'],
}
