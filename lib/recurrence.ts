import { createDb } from '@/lib/db'
import { schedule_exceptions } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export type Schedule = {
  id: number
  date: string
  time: string
  recurrence: string
  recurDays: number[]
  client: string
  phone: string | null
  service: string
  notes: string | null
  exceptions?: string[] // 👈 importante pro front
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function getDayOfWeek(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).getDay()
}

export function dateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

//
// =========================
// 🔥 ASYNC (COM BANCO)
// =========================
//

export async function getOccurrences(
  s: Schedule,
  fromDate: Date,
  toDate: Date
): Promise<string[]> {

  const db = createDb()

  const exceptions = await db.query.schedule_exceptions.findMany({
    where: eq(schedule_exceptions.scheduleId, s.id)
  })

  const exceptionDates = new Set(exceptions.map(e => e.date))

  const results: string[] = []
  const base  = parseDate(s.date)
  const recur = s.recurrence || 'none'

  if (recur === 'none') {
    if (base >= fromDate && base <= toDate) {
      results.push(dateStr(base))
    }
    return results.filter(d => !exceptionDates.has(d))
  }

  if (recur === 'weekly') {
    const wds = s.recurDays?.length
      ? s.recurDays
      : [base.getDay()]

    const cur = new Date(fromDate)

    while (cur <= toDate) {
      if (cur >= base && wds.includes(cur.getDay())) {
        results.push(dateStr(cur))
      }
      cur.setDate(cur.getDate() + 1)
    }

    return results.filter(d => !exceptionDates.has(d))
  }

  // 🔵 14 dias infinito
  if (recur === 'bimonthly') {
    const cur = new Date(fromDate)

    while (cur <= toDate) {
      const diffDays = Math.floor(
        (cur.getTime() - base.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (diffDays >= 0 && diffDays % 14 === 0) {
        results.push(dateStr(cur))
      }

      cur.setDate(cur.getDate() + 1)
    }

    return results.filter(d => !exceptionDates.has(d))
  }

  // monthly
  const domList = s.recurDays?.length
    ? s.recurDays
    : [base.getDate()]

  let y = fromDate.getFullYear(), m = fromDate.getMonth()
  const ey = toDate.getFullYear(), em = toDate.getMonth()

  while (y < ey || (y === ey && m <= em)) {
    const dim = new Date(y, m + 1, 0).getDate()

    domList.forEach(d => {
      if (d > dim) return

      const dt = new Date(y, m, d)

      if (dt >= base && dt >= fromDate && dt <= toDate) {
        results.push(dateStr(dt))
      }
    })

    m++
    if (m > 11) { m = 0; y++ }
  }

  return results.filter(d => !exceptionDates.has(d))
}

//
// =========================
// 🔥 SYNC (FRONT/UI)
// =========================
//

export function getOccurrencesSync(
  s: Schedule,
  fromDate: Date,
  toDate: Date
): string[] {

  const results: string[] = []
  const base  = parseDate(s.date)
  const recur = s.recurrence || 'none'

  if (recur === 'none') {
    if (base >= fromDate && base <= toDate) {
      results.push(dateStr(base))
    }
    return results
  }

  if (recur === 'weekly') {
    const wds = s.recurDays?.length
      ? s.recurDays
      : [base.getDay()]

    const cur = new Date(fromDate)

    while (cur <= toDate) {
      if (cur >= base && wds.includes(cur.getDay())) {
        results.push(dateStr(cur))
      }
      cur.setDate(cur.getDate() + 1)
    }

    return results
  }

  if (recur === 'bimonthly') {
    const cur = new Date(fromDate)

    while (cur <= toDate) {
      const diffDays = Math.floor(
        (cur.getTime() - base.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (diffDays >= 0 && diffDays % 14 === 0) {
        results.push(dateStr(cur))
      }

      cur.setDate(cur.getDate() + 1)
    }

    return results
  }

  // monthly
  const domList = s.recurDays?.length
    ? s.recurDays
    : [base.getDate()]

  let y = fromDate.getFullYear(), m = fromDate.getMonth()
  const ey = toDate.getFullYear(), em = toDate.getMonth()

  while (y < ey || (y === ey && m <= em)) {
    const dim = new Date(y, m + 1, 0).getDate()

    domList.forEach(d => {
      if (d > dim) return

      const dt = new Date(y, m, d)

      if (dt >= base && dt >= fromDate && dt <= toDate) {
        results.push(dateStr(dt))
      }
    })

    m++
    if (m > 11) { m = 0; y++ }
  }

  return results
}

export function scheduleFallsOn(s: Schedule, ds: string): boolean {
  const d = parseDate(ds)
  return getOccurrencesSync(s, d, d).includes(ds)
}

export function getSchedulesForDate(schedules: Schedule[], selectedDate: string) {
  return schedules.filter(s => {

    if (selectedDate < s.date) return false
    if (s.exceptions?.includes(selectedDate)) return false

    if (s.recurrence === 'none') {
      return s.date === selectedDate
    }

    if (s.recurrence === 'weekly') {
      const targetWeekDay = getDayOfWeek(selectedDate)

      const days = s.recurDays?.length
        ? s.recurDays
        : [getDayOfWeek(s.date)]

      return days.includes(targetWeekDay)
    }

    if (s.recurrence === 'monthly') {
      const targetDay = Number(selectedDate.split('-')[2])
      const baseDay = Number(s.date.split('-')[2])

      const dom = s.recurDays?.length
        ? s.recurDays
        : [baseDay]

      return dom.includes(targetDay)
    }

    if (s.recurrence === 'bimonthly') {
      const [y1, m1, d1] = s.date.split('-').map(Number)
      const [y2, m2, d2] = selectedDate.split('-').map(Number)

      const base = new Date(y1, m1 - 1, d1)
      const current = new Date(y2, m2 - 1, d2)

      const diffDays = Math.floor(
        (current.getTime() - base.getTime()) / (1000 * 60 * 60 * 24)
      )

      return diffDays >= 0 && diffDays % 14 === 0
    }

    return false
  })
}

export function hasSchedule(schedules: Schedule[], date: string) {
  return getSchedulesForDate(schedules, date).length > 0
}

export function countNext30Days(schedules: Schedule[]): number {
  const from = new Date(); from.setHours(0, 0, 0, 0)
  const to = new Date(from); to.setDate(to.getDate() + 29)

  return schedules.reduce(
    (n, s) => n + getOccurrencesSync(s, from, to).length,
    0
  )
}

export function nextFreeSlot(schedules: Schedule[], ds: string): string {
  const booked = getSchedulesForDate(schedules, ds).map(s => s.time).sort()
  const today = new Date()
  const isToday = ds === dateStr(today)

  let minH = 8, minM = 0

  if (isToday) {
    const nowH = today.getHours(), nowM = today.getMinutes()
    minH = nowM >= 30 ? nowH + 1 : nowH
    minM = nowM < 30 ? 30 : 0
    minM += 30
    if (minM >= 60) { minM -= 60; minH++ }
  }

  for (let h = 8; h < 20; h++) {
    for (const m of [0, 30]) {
      if (isToday && (h < minH || (h === minH && m < minM))) continue

      const slot = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`

      if (!booked.includes(slot)) return slot
    }
  }

  return '09:00'
}