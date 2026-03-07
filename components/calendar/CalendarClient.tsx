'use client'

import { useState } from 'react'
import { hasSchedule, dateStr } from '@/lib/recurrence'
import DayTimeline from '@/components/timeline/DayTimeline'

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

type Props = { schedules: any[], contacts: any[], services: any[] }

export default function CalendarClient({ schedules, contacts, services }: Props) {
  const today = new Date()
  const [year,   setYear]   = useState(today.getFullYear())
  const [month,  setMonth]  = useState(today.getMonth())
  const [selDay, setSelDay] = useState(dateStr(today))

  const todayStr    = dateStr(today)
  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Selected date label
  const [sy, sm, sd] = selDay.split('-')
  const selLabel = `${parseInt(sd)} de ${MONTHS[parseInt(sm)-1]} de ${sy}`

  function changeMonth(dir: number) {
    let m = month + dir, y = year
    if (m > 11) { m = 0;  y++ }
    if (m < 0)  { m = 11; y-- }
    setMonth(m); setYear(y)
    // Keep selected day if it exists in new month, else go to 1st
    const newDs = `${y}-${String(m+1).padStart(2,'0')}-01`
    setSelDay(newDs)
  }

  // Year range: 3 years back to 3 years forward
  const years = Array.from({ length: 7 }, (_, i) => today.getFullYear() - 3 + i)

  return (
    <>
      <div className="app-header">
        <h1>Calendário</h1>
      </div>

      <div className="cal-wrap">
        {/* Year + Month filter */}
        <div className="cal-filters">
          <select
            className="cal-filter-select"
            value={year}
            onChange={e => { setYear(Number(e.target.value)); setSelDay(`${e.target.value}-${String(month+1).padStart(2,'0')}-01`) }}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <div className="month-nav-row">
            <button className="month-arrow" onClick={() => changeMonth(-1)}>‹</button>
            <div className="month-pills">
              {MONTHS.map((m, i) => (
                <div
                  key={i}
                  className={`month-pill ${month === i ? 'active' : ''}`}
                  onClick={() => {
                    setMonth(i)
                    setSelDay(`${year}-${String(i+1).padStart(2,'0')}-01`)
                  }}
                >
                  {m.slice(0,3)}
                </div>
              ))}
            </div>
            <button className="month-arrow" onClick={() => changeMonth(1)}>›</button>
          </div>
        </div>

        {/* Day grid */}
        <div className="day-labels">
          {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => <span key={d}>{d}</span>)}
        </div>
        <div className="cal-grid">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const d  = i + 1
            const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
            const cls = ['cal-day',
              ds === todayStr ? 'today'    : '',
              ds === selDay   ? 'selected' : ''
            ].filter(Boolean).join(' ')
            return (
              <div key={d} className={cls} onClick={() => setSelDay(ds)}>
                {d}
                {hasSchedule(schedules, ds) && <div className="dot" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected day + timeline */}
      <div className="section-label">{selLabel}</div>

      <DayTimeline
        selectedDate={selDay}
        schedules={schedules}
        contacts={contacts}
        services={services}
      />
    </>
  )
}
