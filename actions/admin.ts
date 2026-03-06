'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { users, schedules, contacts } from '@/lib/schema'
import { eq, ne, sql } from 'drizzle-orm'
import { getSession } from '@/lib/auth'

async function requireAdmin() {
  const session = await getSession()
  if (!session?.isAdmin) throw new Error('Acesso restrito ao administrador')
  return session
}

export async function getUsers() {
  await requireAdmin()
  const rows = await db.query.users.findMany({
    orderBy: (u, { desc }) => [desc(u.createdAt)]
  })
  // Count schedules per user
  const counts = await db.select({
    userId: schedules.userId,
    total: sql<number>`count(*)`.as('total')
  }).from(schedules).groupBy(schedules.userId)

  return rows.map(u => ({
    ...u,
    password: undefined,
    totalSchedules: counts.find(c => c.userId === u.id)?.total ?? 0
  }))
}

export async function blockUser(id: number, block: boolean) {
  const session = await requireAdmin()
  if (id === session.id) return { error: 'Não é possível bloquear a si mesmo' }

  const user = await db.query.users.findFirst({ where: eq(users.id, id) })
  if (!user) return { error: 'Usuário não encontrado' }
  if (user.isAdmin) return { error: 'Não é possível bloquear um admin' }

  await db.update(users).set({ isBlocked: block }).where(eq(users.id, id))
  revalidatePath('/admin')
  return { success: true }
}

export async function removeUser(id: number) {
  const session = await requireAdmin()
  if (id === session.id) return { error: 'Não é possível excluir a si mesmo' }

  const user = await db.query.users.findFirst({ where: eq(users.id, id) })
  if (!user) return { error: 'Usuário não encontrado' }
  if (user.isAdmin) return { error: 'Não é possível excluir um admin' }

  await db.delete(schedules).where(eq(schedules.userId, id))
  await db.delete(contacts).where(eq(contacts.userId, id))
  await db.delete(users).where(eq(users.id, id))
  revalidatePath('/admin')
  return { success: true }
}
