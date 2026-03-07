'use server'

import { revalidatePath } from 'next/cache'
import { createDb } from '@/lib/db'
import { services } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { getSession } from '@/lib/auth'

export async function getServices() {
  const session = await getSession()
  if (!session) return []
  const db = createDb()
  return db.query.services.findMany({
    where: eq(services.userId, session.id),
    orderBy: (s, { asc }) => [asc(s.name)]
  })
}

export async function createService(data: { name: string; price: string; duration: number }) {
  const session = await getSession()
  if (!session) return { error: 'Não autorizado' }
  const db = createDb()
  const [row] = await db.insert(services).values({
    userId:   session.id,
    name:     data.name.trim(),
    price:    data.price,
    duration: data.duration,
  }).returning()
  revalidatePath('/services')
  return row
}

export async function updateService(id: number, data: { name: string; price: string; duration: number }) {
  const session = await getSession()
  if (!session) return { error: 'Não autorizado' }
  const db = createDb()
  const [row] = await db.update(services)
    .set({ name: data.name.trim(), price: data.price, duration: data.duration })
    .where(and(eq(services.id, id), eq(services.userId, session.id)))
    .returning()
  revalidatePath('/services')
  return row
}

export async function deleteService(id: number) {
  const session = await getSession()
  if (!session) return { error: 'Não autorizado' }
  const db = createDb()
  await db.delete(services).where(and(eq(services.id, id), eq(services.userId, session.id)))
  revalidatePath('/services')
  return { success: true }
}
