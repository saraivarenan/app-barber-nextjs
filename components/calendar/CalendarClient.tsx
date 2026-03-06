'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { hasSchedule, getSchedulesForDate, dateStr } from '@/lib/recurrence'
import ScheduleModal from './ScheduleModal'

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const RL = { none:'', weekly:'Semanal', bimonthly:'2×/mês', monthly:'Mensal' } as any

export default function CalendarClient({ schedules, contacts }: { schedules: any[], contacts: any[] }) {
  const router   = useRouter()
  const today    = new Date()
  const [year,   setYear]   = useState(today.getFullYear())
  const [month,  setMonth]  = useState(today.getMonth())
  const [selDay, setSelDay] = useState(dateStr(today))
  const [modal,  setModal]  = useState(false)
  const [editId, setEditId] = useState<number|null>(null)
  const [preTime,setPreTime]= useState('')

  function changeMonth(dir: number) {
    let m = month + dir, y = year
    if (m > 11) { m = 0;  y++ }
    if (m < 0)  { m = 11; y-- }
    setMonth(m); setYear(y)
  }

  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr    = dateStr(today)
  const daySchedules = getSchedulesForDate(schedules, selDay)
    .sort((a: any, b: any) => a.time.localeCompare(b.time))

  function openNew() { setEditId(null); setPreTime(''); setModal(true) }
  function openEdit(id: number) { setEditId(id); setPreTime(''); setModal(true) }

  return (
    <>
      <div className="app-header">
        <h1>Calendário</h1>
      </div>

      <div className="cal-wrap">
        {/* Month nav */}
        <div className="month-nav">
          <button onClick={() => changeMonth(-1)}>‹</button>
          <h3>{MONTHS[month]} {year}</h3>
          <button onClick={() => changeMonth(1)}>›</button>
        </div>

        {/* Day labels */}
        <div className="day-labels">
          {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => <span key={d}>{d}</span>)}
        </div>

        {/* Grid */}
        <div className="cal-grid">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const d  = i + 1
            const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
            const cls = ['cal-day',
              ds === todayStr ? 'today' : '',
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

        {/* Day schedules */}
        <div className="day-schedules-title">
          {selDay ? (() => {
            const [y,m,d] = selDay.split('-')
            return `${parseInt(d)} de ${MONTHS[parseInt(m)-1]}`
          })() : 'Selecione um dia'}
        </div>

        {daySchedules.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
            Nenhum agendamento neste dia
          </p>
        ) : daySchedules.map((s: any) => {
          const ini = s.client.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0,2)
          const tag = RL[s.recurrence || 'none']
          return (
            <div key={s.id} className="schedule-card" onClick={() => openEdit(s.id)}>
              <div className="sc-left">
                <div className="sc-avatar">{ini}</div>
                <div>
                  <div className="sc-name">{s.client}</div>
                  <div className="sc-time">{s.time} · {s.service}</div>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
                {tag && <div className="sc-recur">↺ {tag}</div>}
                <div style={{ fontSize:12, color:'var(--muted)' }}>{s.phone||''}</div>
              </div>
            </div>
          )
        })}
      </div>

      <button className="fab" onClick={openNew}>+</button>

      {modal && (
        <ScheduleModal
          editId={editId}
          preDate={selDay}
          preTime={preTime}
          schedules={schedules}
          contacts={contacts}
          onClose={() => { setModal(false); router.refresh() }}
        />
      )}
    </>
  )
}
