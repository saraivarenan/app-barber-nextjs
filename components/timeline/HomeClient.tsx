'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SessionUser } from '@/lib/auth'
import { getSchedulesForDate, countNext30Days, dateStr, scheduleFallsOn } from '@/lib/recurrence'
import ScheduleModal from '@/components/calendar/ScheduleModal'
import { logoutAction } from '@/actions/auth'

type Props = {
  session:   SessionUser
  schedules: any[]
  contacts:  any[]
}

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
               'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DIAS  = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
const RL    = { none:'', weekly:'↺ Semanal', bimonthly:'↺ 2×/mês', monthly:'↺ Mensal' } as any

export default function HomeClient({ session, schedules, contacts }: Props) {
  const router    = useRouter()
  const today     = new Date()
  const todayStr  = dateStr(today)
  const [modalOpen, setModalOpen]   = useState(false)
  const [editId,    setEditId]      = useState<number|null>(null)
  const [preTime,   setPreTime]     = useState('')
  const timelineRef = useRef<HTMLDivElement>(null)

  const h = today.getHours()
  const greeting = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
  const firstName = session.name.split(' ')[0]

  const todaySchedules = getSchedulesForDate(schedules, todayStr)
  const total30        = countNext30Days(schedules)
  const uniqueClients  = new Set(schedules.map((s: any) => s.client.toLowerCase())).size

  // Scroll to current hour on mount
  useEffect(() => {
    if (!timelineRef.current) return
    const rows = timelineRef.current.querySelectorAll('.tl-row')
    const target = Math.max(today.getHours() - 1, 7)
    rows[target]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  function openSlot(time: string) {
    setEditId(null)
    setPreTime(time)
    setModalOpen(true)
  }

  function openEdit(id: number) {
    setEditId(id)
    setPreTime('')
    setModalOpen(true)
  }

  return (
    <>
      {/* Header */}
      <div className="app-header">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>
            {greeting}, {firstName}! ✂️
          </h1>
          <div className="sub">
            {DIAS[today.getDay()]}, {today.getDate()} de {MESES[today.getMonth()]}
          </div>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="btn sm secondary">Sair</button>
        </form>
      </div>

      {/* Stats */}
      <div className="home-stats">
        <div className="home-stat">
          <span>{todaySchedules.length}</span>
          <label>Hoje</label>
        </div>
        <div className="home-stat">
          <span>{total30}</span>
          <label>30 dias</label>
        </div>
        <div className="home-stat">
          <span>{uniqueClients}</span>
          <label>Clientes</label>
        </div>
      </div>

      {/* Timeline label */}
      <div className="section-label">Horários de hoje</div>

      {/* Timeline */}
      <div className="timeline-wrap" ref={timelineRef}>
        {Array.from({ length: 24 }, (_, h) => {
          const time    = `${String(h).padStart(2,'0')}:00`
          const isPast  = h < today.getHours()
          const isNow   = h === today.getHours()
          const sched   = todaySchedules.find((s: any) => s.time === time)

          if (sched) {
            const ini = sched.client.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0,2)
            const tag = RL[sched.recurrence || 'none']
            return (
              <div key={h} className="tl-row" onClick={() => openEdit(sched.id)}>
                <div className={`tl-hour ${isPast?'past':''} ${isNow?'now':''}`}>{time}</div>
                <div className="tl-block tl-filled">
                  <div className="tl-avatar">{ini}</div>
                  <div className="tl-info">
                    <div className="tl-client">{sched.client}</div>
                    <div className="tl-service">{sched.service}{sched.phone ? ` · ${sched.phone}` : ''}</div>
                  </div>
                  {tag && <div className="tl-recur">{tag}</div>}
                </div>
              </div>
            )
          }

          return (
            <div key={h} className="tl-row" onClick={() => openSlot(time)}>
              <div className={`tl-hour ${isPast?'past':''} ${isNow?'now':''}`}>{time}</div>
              <div className="tl-block tl-empty">
                <span className="tl-add">＋</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Schedule modal */}
      {modalOpen && (
        <ScheduleModal
          editId={editId}
          preDate={todayStr}
          preTime={preTime}
          schedules={schedules}
          contacts={contacts}
          onClose={() => { setModalOpen(false); router.refresh() }}
        />
      )}
    </>
  )
}
