'use server'

import { revalidatePath } from 'next/cache'
import { createDb } from '@/lib/db'
import { schedules } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { getSession } from '@/lib/auth'

export async function getSchedules() {
  const session = await getSession()
  if (!session) return []
  const db = createDb()
  const rows = await db.query.schedules.findMany({
    where: eq(schedules.userId, session.id),
    orderBy: (s, { asc }) => [asc(s.date), asc(s.time)]
  })
  return rows.map(s => ({ ...s, recurDays: JSON.parse(s.recurDays || '[]') }))
}

export async function createSchedule(data: {
  client: string; phone: string; date: string; time: string
  service: string; duration: number; price: string
  recurrence: string; recurDays: number[]; notes: string
}) {
  const session = await getSession()
  if (!session) return { error: 'Não autorizado' }
  const db = createDb()
  const [row] = await db.insert(schedules).values({
    userId:     session.id,
    client:     data.client,
    phone:      data.phone,
    date:       data.date,
    time:       data.time,
    service:    data.service,
    duration:   data.duration,
    price:      data.price,
    recurrence: data.recurrence,
    recurDays:  JSON.stringify(data.recurDays),
    notes:      data.notes,
  }).returning()
  revalidatePath('/home')
  revalidatePath('/calendar')
  return { ...row, recurDays: data.recurDays }
}

export async function updateSchedule(id: number, data: {
  client: string; phone: string; date: string; time: string
  service: string; duration: number; price: string
  recurrence: string; recurDays: number[]; notes: string
}) {
  const session = await getSession()
  if (!session) return { error: 'Não autorizado' }
  const db = createDb()
  const [row] = await db.update(schedules)
    .set({
      client:     data.client,
      phone:      data.phone,
      date:       data.date,
      time:       data.time,
      service:    data.service,
      duration:   data.duration,
      price:      data.price,
      recurrence: data.recurrence,
      recurDays:  JSON.stringify(data.recurDays),
      notes:      data.notes,
    })
    .where(and(eq(schedules.id, id), eq(schedules.userId, session.id)))
    .returning()
  revalidatePath('/home')
  revalidatePath('/calendar')
  return { ...row, recurDays: data.recurDays }
}

export async function deleteSchedule(id: number) {
  const session = await getSession()
  if (!session) return { error: 'Não autorizado' }
  const db = createDb()
  await db.delete(schedules).where(and(eq(schedules.id, id), eq(schedules.userId, session.id)))
  revalidatePath('/home')
  revalidatePath('/calendar')
  return { success: true }
}
