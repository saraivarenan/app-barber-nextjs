'use server'

import { revalidatePath } from 'next/cache'
import { createDb } from '@/lib/db'
import { schedules, schedule_exceptions } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { getSession } from '@/lib/auth'
import { dateStr, parseDate, Schedule } from '@/lib/recurrence'


export async function getSchedules() {
  const session = await getSession()
  if (!session) return []
  const db = createDb()
  const rows = await db.query.schedules.findMany({
    where: eq(schedules.userId, session.id),
    orderBy: (s, { asc }) => [asc(s.date), asc(s.time)]
  })
  const exceptions = await db.query.schedule_exceptions.findMany()

return rows.map(s => ({
  ...s,
  recurDays: JSON.parse(s.recurDays || '[]'),
  exceptions: exceptions
    .filter(e => e.scheduleId === s.id)
    .map(e => e.date)
}))
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
    userId: session.id,
    client: data.client,
    phone: data.phone,
    date: data.date,
    time: data.time,
    service: data.service,
    duration: data.duration,
    price: data.price,
    recurrence: data.recurrence,
    recurDays: JSON.stringify(data.recurDays),
    notes: data.notes,
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
      client: data.client,
      phone: data.phone,
      date: data.date,
      time: data.time,
      service: data.service,
      duration: data.duration,
      price: data.price,
      recurrence: data.recurrence,
      recurDays: JSON.stringify(data.recurDays),
      notes: data.notes,
    })
    .where(and(eq(schedules.id, id), eq(schedules.userId, session.id)))
    .returning()
  revalidatePath('/home')
  revalidatePath('/calendar')
  return { ...row, recurDays: data.recurDays }
}

// 🔥 ALTERADO: agora suporta exclusão por ocorrência
export async function deleteSchedule(id: number, date?: string) {
  const session = await getSession()
  if (!session) return { error: 'Não autorizado' }

  const db = createDb()

  const schedule = await db.query.schedules.findFirst({
    where: and(eq(schedules.id, id), eq(schedules.userId, session.id))
  })

  if (!schedule) return { error: 'Agendamento não encontrado' }

  if (!date || schedule.recurrence === 'none') {
    await db.delete(schedules)
      .where(and(eq(schedules.id, id), eq(schedules.userId, session.id)))

    revalidatePath('/home')
    revalidatePath('/calendar')
    return { success: true }
  }

  await db.insert(schedule_exceptions).values({
    scheduleId: id,
    date,
  })

  revalidatePath('/home')
  revalidatePath('/calendar')
  return { success: true }
}

export async function getOccurrences(s: Schedule, fromDate: Date, toDate: Date): Promise<string[]> {
  const db = createDb()

  // 🔥 busca exceções
  const exceptions = await db.query.schedule_exceptions.findMany({
    where: eq(schedule_exceptions.scheduleId, s.id)
  })

  const exceptionDates = new Set(exceptions.map(e => e.date))

  const results: string[] = []
  const base  = parseDate(s.date)
  const recur = s.recurrence || 'none'

  if (recur === 'none') {
    if (base >= fromDate && base <= toDate) results.push(dateStr(base))
    return results.filter(d => !exceptionDates.has(d))
  }

  if (recur === 'weekly') {
    const wds = (s.recurDays && s.recurDays.length > 0)
      ? s.recurDays
      : [base.getDay()]

    const cur = new Date(fromDate)
    while (cur <= toDate) {
      if (wds.includes(cur.getDay())) results.push(dateStr(cur))
      cur.setDate(cur.getDate() + 1)
    }

    return results.filter(d => !exceptionDates.has(d))
  }
  

  const domList = (s.recurDays && s.recurDays.length > 0)
    ? s.recurDays
    : [base.getDate()]

  let y = fromDate.getFullYear(), m = fromDate.getMonth()
  const ey = toDate.getFullYear(), em = toDate.getMonth()
  while (y < ey || (y === ey && m <= em)) {
    const dim = new Date(y, m + 1, 0).getDate()
    domList.forEach(d => {
      if (d > dim) return
      const dt = new Date(y, m, d)
      if (dt >= fromDate && dt <= toDate) results.push(dateStr(dt))
    })
    m++
    if (m > 11) { m = 0; y++ }
  }

  return results.filter(d => !exceptionDates.has(d))
}
