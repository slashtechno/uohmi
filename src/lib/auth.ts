import { cookies } from 'next/headers'

const COOKIE = 'uohmi_session'

export async function isAuthenticated() {
  return (await cookies()).get(COOKIE)?.value === process.env.SESSION_SECRET
}

export async function clearAuthCookie() {
  (await cookies()).delete(COOKIE)
}