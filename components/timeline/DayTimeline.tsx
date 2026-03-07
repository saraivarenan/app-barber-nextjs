'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { dateStr } from '@/lib/recurrence'
import ScheduleModal from '@/components/calendar/ScheduleModal'

const RL = { none:'', weekly:'↺ Semanal', bimonthly:'↺ 2×/mês', monthly:'↺ Mensal' } as any
const PX_PER_MIN = 1.2
const HOUR_HEIGHT = PX_PER_MIN * 60

function fmtDuration(min: number) {
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60), m = min % 60
  return m > 0 ? `${h}h${String(m).padStart(2,'0')}` : `${h}h`
}
function fmtPrice(p: string | null) {
  if (!p || p === '0' || p === '0.00') return null
  return `R$ ${parseFloat(p).toFixed(2).replace('.', ',')}`
}
function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number); return h * 60 + m
}
function minutesToTime(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2,'0')}:${String(m % 60).padStart(2,'0')}`
}

type Props = {
  selectedDate: string   // 'YYYY-MM-DD'
  schedules:    any[]
  contacts:     any[]
  services:     any[]
  showNowLine?: boolean  // only on today
}

export default function DayTimeline({ selectedDate, schedules, contacts, services, showNowLine }: Props) {
  const router = useRouter()
  const today  = new Date()
  const [modalOpen, setModalOpen] = useState(false)
  const [editId,    setEditId]    = useState<number|null>(null)
  const [preTime,   setPreTime]   = useState('')
  const timelineRef = useRef<HTMLDivElement>(null)
  const nowMinutes  = today.getHours() * 60 + today.getMinutes()
  const isToday     = selectedDate === dateStr(today)

  const daySchedules = schedules
    .filter((s: any) => s.date === selectedDate)
    .sort((a: any, b: any) => a.time.localeCompare(b.time))

  const scheduleBlocks = daySchedules.map((s: any) => {
    const startMin = timeToMinutes(s.time)
    const dur      = s.duration || 60
    return { ...s, startMin, dur, top: startMin * PX_PER_MIN, height: Math.max(dur * PX_PER_MIN, 44) }
  })

  const totalHeight = 24 * HOUR_HEIGHT
  const hourLabels  = Array.from({ length: 25 }, (_, i) => ({
    label:  `${String(i).padStart(2,'0')}:00`,
    top:    i * HOUR_HEIGHT,
    isPast: isToday && i < today.getHours(),
    isNow:  isToday && i === today.getHours(),
  }))

  // Scroll to current time (today) or 8h (other days)
  useEffect(() => {
    if (!timelineRef.current) return
    const scrollTo = isToday
      ? Math.max(0, (nowMinutes - 60)) * PX_PER_MIN
      : 8 * HOUR_HEIGHT
    timelineRef.current.scrollTop = scrollTo
  }, [selectedDate])

  function openSlot(time: string) { setEditId(null); setPreTime(time); setModalOpen(true) }
  function openEdit(id: number)   { setEditId(id);   setPreTime('');   setModalOpen(true) }

  return (
    <>
      <div className="tl-scroll" ref={timelineRef}>
        <div className="tl-canvas" style={{ height: totalHeight }}>

          {/* Hour grid lines */}
          {hourLabels.map(({ label, top, isPast, isNow }) => (
            <div key={label} className="tl-gridrow" style={{ top }}>
              <div className={`tl-hourlabel ${isPast ? 'past' : ''} ${isNow ? 'now' : ''}`}>{label}</div>
              <div className="tl-gridline" />
            </div>
          ))}

          {/* Empty clickable slots (30min each) */}
          {Array.from({ length: 24 * 2 }, (_, i) => {
            const slotMin = i * 30
            const occupied = scheduleBlocks.some(b => slotMin >= b.startMin && slotMin < b.startMin + b.dur)
            if (occupied) return null
            return (
              <div key={`slot-${i}`} className="tl-empty-slot"
                style={{ top: slotMin * PX_PER_MIN, height: 30 * PX_PER_MIN }}
                onClick={() => openSlot(minutesToTime(slotMin))}
              />
            )
          })}

          {/* Schedule blocks */}
          {scheduleBlocks.map(s => {
            const ini = s.client.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0,2)
            const tag = RL[s.recurrence || 'none']
            const pr  = fmtPrice(s.price)
            return (
              <div key={s.id} className="tl-block-filled"
                style={{ top: s.top, height: s.height }}
                onClick={() => openEdit(s.id)}
              >
                <div className="tl-avatar">{ini}</div>
                <div className="tl-info">
                  <div className="tl-client">{s.client}</div>
                  <div className="tl-service">
                    {s.service} · ⏱ {fmtDuration(s.dur)}{pr && ` · ${pr}`}
                  </div>
                </div>
                {tag && <div className="tl-recur">{tag}</div>}
              </div>
            )
          })}

          {/* Now indicator — only on today */}
          {(showNowLine || isToday) && (
            <div className="tl-now-line" style={{ top: nowMinutes * PX_PER_MIN }}>
              <div className="tl-now-dot" />
              <div className="tl-now-track" />
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <ScheduleModal
          editId={editId}
          preDate={selectedDate}
          preTime={preTime}
          schedules={schedules}
          contacts={contacts}
          services={services}
          onClose={() => { setModalOpen(false); router.refresh() }}
        />
      )}
    </>
  )
}
