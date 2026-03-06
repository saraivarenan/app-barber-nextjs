'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { contacts } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { getSession } from '@/lib/auth'

export async function getContacts() {
  const session = await getSession()
  if (!session) return []
  return db.query.contacts.findMany({
    where: eq(contacts.userId, session.id),
    orderBy: (c, { asc }) => [asc(c.name)]
  })
}

export async function createContact(name: string, phone: string) {
  const session = await getSession()
  if (!session) return { error: 'Não autorizado' }
  const [row] = await db.insert(contacts)
    .values({ userId: session.id, name: name.trim(), phone })
    .returning()
  revalidatePath('/contacts')
  return row
}

export async function updateContact(id: number, name: string, phone: string) {
  const session = await getSession()
  if (!session) return { error: 'Não autorizado' }
  const [row] = await db.update(contacts)
    .set({ name, phone })
    .where(and(eq(contacts.id, id), eq(contacts.userId, session.id)))
    .returning()
  revalidatePath('/contacts')
  return row
}

export async function deleteContact(id: number) {
  const session = await getSession()
  if (!session) return { error: 'Não autorizado' }
  await db.delete(contacts)
    .where(and(eq(contacts.id, id), eq(contacts.userId, session.id)))
  revalidatePath('/contacts')
  return { success: true }
}
