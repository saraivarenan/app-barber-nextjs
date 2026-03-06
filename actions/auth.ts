'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { signToken, setSessionCookie, clearSessionCookie } from '@/lib/auth'

export async function loginAction(formData: FormData) {
  const email    = (formData.get('email') as string).toLowerCase().trim()
  const password = formData.get('password') as string

  if (!email || !password) return { error: 'Preencha todos os campos.' }

  const user = await db.query.users.findFirst({ where: eq(users.email, email) })
  if (!user) return { error: 'E-mail ou senha incorretos.' }
  if (user.isBlocked) return { error: 'Conta bloqueada. Fale com o administrador.' }

  const match = await bcrypt.compare(password, user.password)
  if (!match) return { error: 'E-mail ou senha incorretos.' }

  const token = signToken({ id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin })
  setSessionCookie(token)
  redirect('/home')
}

export async function registerAction(formData: FormData) {
  const name     = (formData.get('name') as string).trim()
  const email    = (formData.get('email') as string).toLowerCase().trim()
  const password = formData.get('password') as string

  if (!name || !email || !password) return { error: 'Preencha todos os campos.' }
  if (password.length < 6) return { error: 'Senha mínimo 6 caracteres.' }

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) })
  if (existing) return { error: 'E-mail já cadastrado.' }

  const hash   = await bcrypt.hash(password, 10)
  const [user] = await db.insert(users).values({ name, email, password: hash }).returning()

  const token = signToken({ id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin })
  setSessionCookie(token)
  redirect('/home')
}

export async function logoutAction() {
  clearSessionCookie()
  redirect('/auth/login')
}
