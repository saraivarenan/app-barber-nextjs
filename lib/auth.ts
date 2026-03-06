import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { db } from './db'
import { users } from './schema'
import { eq } from 'drizzle-orm'

const JWT_SECRET = process.env.JWT_SECRET!
const COOKIE_NAME = 'bb_session'

export type SessionUser = {
  id:       number
  name:     string
  email:    string
  isAdmin:  boolean
}

export function signToken(payload: SessionUser): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' })
}

export function verifyToken(token: string): SessionUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionUser
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null

  const payload = verifyToken(token)
  if (!payload) return null

  // Verify user still exists and is not blocked
  const user = await db.query.users.findFirst({
    where: eq(users.id, payload.id)
  })
  if (!user || user.isBlocked) return null

  return { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin }
}

export function setSessionCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })
}

export function clearSessionCookie() {
  cookies().delete(COOKIE_NAME)
}
