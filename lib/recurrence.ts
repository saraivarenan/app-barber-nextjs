export type Schedule = {
  id:         number
  date:       string
  time:       string
  recurrence: string
  recurDays:  number[]
  client:     string
  phone:      string | null
  service:    string
  notes:      string | null
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function dateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export function getOccurrences(s: Schedule, fromDate: Date, toDate: Date): string[] {
  const results: string[] = []
  const base  = parseDate(s.date)
  const recur = s.recurrence || 'none'
  const days  = s.recurDays?.length > 0 ? s.recurDays : null

  if (recur === 'none') {
    if (base >= fromDate && base <= toDate) results.push(dateStr(base))
    return results
  }

  if (recur === 'weekly') {
    const wds = days || [base.getDay()]
    const cur = new Date(fromDate)
    while (cur <= toDate) {
      if (wds.includes(cur.getDay())) results.push(dateStr(cur))
      cur.setDate(cur.getDate() + 1)
    }
    return results
  }

  // bimonthly or monthly
  const domList = days || [base.getDate()]
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
  return results
}

export function scheduleFallsOn(s: Schedule, ds: string): boolean {
  const d = parseDate(ds)
  return getOccurrences(s, d, d).includes(ds)
}

export function getSchedulesForDate(schedules: Schedule[], ds: string): Schedule[] {
  return schedules.filter(s => scheduleFallsOn(s, ds))
}

export function hasSchedule(schedules: Schedule[], ds: string): boolean {
  return schedules.some(s => scheduleFallsOn(s, ds))
}

export function countNext30Days(schedules: Schedule[]): number {
  const from = new Date(); from.setHours(0,0,0,0)
  const to   = new Date(from); to.setDate(to.getDate() + 29)
  return schedules.reduce((n, s) => n + getOccurrences(s, from, to).length, 0)
}

export function nextFreeSlot(schedules: Schedule[], ds: string): string {
  const booked  = getSchedulesForDate(schedules, ds).map(s => s.time).sort()
  const today   = new Date()
  const isToday = ds === dateStr(today)
  let minH = 8, minM = 0

  if (isToday) {
    const nowH = today.getHours(), nowM = today.getMinutes()
    minH = nowM >= 30 ? nowH + 1 : nowH
    minM = nowM < 30  ? 30 : 0
    minM += 30
    if (minM >= 60) { minM -= 60; minH++ }
  }

  for (let h = 8; h < 20; h++) {
    for (const m of [0, 30]) {
      if (isToday && (h < minH || (h === minH && m < minM))) continue
      const slot = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
      if (!booked.includes(slot)) return slot
    }
  }
  return '09:00'
}
