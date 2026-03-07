'use client'

import { useState, useEffect, useRef } from 'react'
import { createSchedule, updateSchedule, deleteSchedule } from '@/actions/schedules'
import { createContact } from '@/actions/contacts'
import { nextFreeSlot, dateStr } from '@/lib/recurrence'

const WD       = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const MONTHS_S = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function fmtDuration(min: number) {
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60), m = min % 60
  return m > 0 ? `${h}h${String(m).padStart(2,'0')}` : `${h}h`
}

type ServiceOption = { id: number; name: string; price: string | null; duration: number }

type Props = {
  editId:    number | null
  preDate:   string
  preTime:   string
  schedules: any[]
  contacts:  any[]
  services:  ServiceOption[]
  onClose:   () => void
}

export default function ScheduleModal({ editId, preDate, preTime, schedules, contacts, services, onClose }: Props) {
  const editing = editId ? schedules.find((s: any) => s.id === editId) : null
  const today   = new Date()

  const defaultService = services[0] || null

  const [client,     setClient]     = useState(editing?.client || '')
  const [phone,      setPhone]      = useState(editing?.phone  || '')
  const [date,       setDate]       = useState(editing?.date   || preDate || dateStr(today))
  const [time,       setTime]       = useState(editing?.time   || preTime || nextFreeSlot(schedules, preDate || dateStr(today)))
  const [service,    setService]    = useState(editing?.service || defaultService?.name || '')
  const [duration,   setDuration]   = useState<number>(editing?.duration || defaultService?.duration || 60)
  const [price,      setPrice]      = useState<string>(editing?.price || defaultService?.price || '0')
  const [recurrence, setRecurrence] = useState(editing?.recurrence || 'none')
  const [recurDays,  setRecurDays]  = useState<number[]>(editing?.recurDays || [])
  const [notes,      setNotes]      = useState(editing?.notes  || '')
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [cpOpen,     setCpOpen]     = useState(false)
  const [cpSearch,   setCpSearch]   = useState('')
  const [rdpYear,    setRdpYear]    = useState(today.getFullYear())
  const [rdpMonth,   setRdpMonth]   = useState(today.getMonth())
  const cpRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (cpRef.current && !cpRef.current.contains(e.target as Node)) setCpOpen(false)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  function handleSelectService(name: string) {
    setService(name)
    const svc = services.find(s => s.name === name)
    if (svc) {
      setDuration(svc.duration)
      setPrice(svc.price || '0')
    }
  }

  // Calculate end time from start + duration
  function calcEndTime(startTime: string, dur: number) {
    const [h, m] = startTime.split(':').map(Number)
    const total  = h * 60 + m + dur
    return `${String(Math.floor(total / 60) % 24).padStart(2,'0')}:${String(total % 60).padStart(2,'0')}`
  }

  const endTime = calcEndTime(time, duration)

  const ini = client ? client.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0,2) : '?'
  const filteredContacts = contacts.filter((c: any) =>
    c.name.toLowerCase().includes(cpSearch.toLowerCase()) || (c.phone||'').includes(cpSearch)
  )

  async function handleSave() {
    if (!client || !date || !time) { setError('Preencha cliente, data e horário'); return }
    // Check overlap: conflict if another schedule starts during this one's window
    const [sh, sm] = time.split(':').map(Number)
    const startMin = sh * 60 + sm
    const endMin   = startMin + duration
    const conflict = schedules.find((s: any) => {
      if (s.date !== date || s.id === editId) return false
      const [eh, em] = s.time.split(':').map(Number)
      const sStart = eh * 60 + em
      const sEnd   = sStart + (s.duration || 60)
      return startMin < sEnd && endMin > sStart
    })
    if (conflict) { setError(`⚠️ Conflito com ${conflict.client} às ${conflict.time}`); return }

    setLoading(true)
    const payload = { client, phone, date, time, service, duration, price: price || '0', recurrence, recurDays, notes }
    if (editId) await updateSchedule(editId, payload)
    else        await createSchedule(payload)
    onClose()
  }

  async function handleDelete() {
    if (!editId || !confirm('Excluir agendamento?')) return
    setLoading(true)
    await deleteSchedule(editId)
    onClose()
  }

  async function handleManual() {
    const name = prompt('Nome do cliente:'); if (!name) return
    const ph   = prompt('Telefone (opcional):') || ''
    await createContact(name.trim(), ph.trim())
    setClient(name.trim()); setPhone(ph.trim()); setCpOpen(false)
  }

  function toggleWD(i: number) {
    setRecurDays(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])
  }
  function toggleMD(d: number) {
    setRecurDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }

  return (
    <div className="modal-bg open" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-handle" />
        <h3>{editId ? 'Editar Agendamento' : 'Novo Agendamento'}</h3>

        {/* Contact picker */}
        <div className="field">
          <label>Cliente</label>
          <div className="cp-wrap" ref={cpRef}>
            <div className={`cp-trigger ${cpOpen ? 'open' : ''}`} onClick={() => setCpOpen(!cpOpen)}>
              <div className={`cp-avatar ${client ? 'filled' : ''}`}>{ini}</div>
              <span className={`cp-label ${client ? 'set' : ''}`}>{client || 'Selecionar contato…'}</span>
              <span>▾</span>
            </div>
            {cpOpen && (
              <div className="cp-dropdown">
                <div className="cp-search">
                  <input placeholder="🔍  Buscar…" value={cpSearch}
                    onChange={e => setCpSearch(e.target.value)}
                    onClick={e => e.stopPropagation()} autoFocus />
                </div>
                <div className="cp-list">
                  {filteredContacts.length === 0
                    ? <div className="cp-empty">Nenhum contato encontrado</div>
                    : filteredContacts.map((c: any) => {
                        const ci = c.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0,2)
                        return (
                          <div key={c.id} className="cp-item" onClick={() => {
                            setClient(c.name); setPhone(c.phone||''); setCpOpen(false)
                          }}>
                            <div className="cp-avatar filled" style={{ width:32, height:32, fontSize:12 }}>{ci}</div>
                            <div>
                              <div className="cp-item-name">{c.name}</div>
                              <div className="cp-item-phone">{c.phone||'Sem telefone'}</div>
                            </div>
                          </div>
                        )
                      })
                  }
                </div>
                <div className="cp-manual" onClick={handleManual}>＋ Digitar nome manualmente</div>
              </div>
            )}
          </div>
        </div>

        {/* Date + Time row */}
        <div style={{ display:'flex', gap:10 }}>
          <div className="field" style={{ flex:1 }}>
            <label>Data</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="field" style={{ flex:1 }}>
            <label>Horário</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} />
          </div>
        </div>

        {/* Service selector */}
        <div className="field">
          <label>Serviço</label>
          {services.length > 0 ? (
            <div className="service-picker">
              {services.map(s => (
                <div
                  key={s.id}
                  className={`service-pick-opt ${service === s.name ? 'selected' : ''}`}
                  onClick={() => handleSelectService(s.name)}
                >
                  <span className="spopt-name">{s.name}</span>
                  <span className="spopt-meta">
                    ⏱ {fmtDuration(s.duration)}
                    {s.price && s.price !== '0' && ` · R$ ${parseFloat(s.price).toFixed(2).replace('.',',')}`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <input type="text" value={service} onChange={e => setService(e.target.value)}
              placeholder="Ex: Corte, Barba..." />
          )}
        </div>

        {/* Duration + time window */}
        <div className="field">
          <label>Duração (minutos)</label>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <input
              type="number" value={duration} min={5} max={480} step={5}
              onChange={e => setDuration(Number(e.target.value))}
              style={{ flex:1 }}
            />
            <div className="time-window">
              <span>{time}</span>
              <span style={{ color:'var(--muted)', margin:'0 6px' }}>→</span>
              <span style={{ color:'var(--gold)' }}>{endTime}</span>
            </div>
          </div>
          <div style={{ fontSize:11, color:'var(--muted)', marginTop:6 }}>
            {fmtDuration(duration)} · você pode editar a duração livremente
          </div>
        </div>

        {/* Price (editable) */}
        <div className="field">
          <label>Valor (R$)</label>
          <input
            type="number" value={price === '0' ? '' : price}
            onChange={e => setPrice(e.target.value || '0')}
            placeholder="0,00" min="0" step="0.01"
          />
        </div>

        {/* Recurrence */}
        <div className="field">
          <label>Recorrência</label>
          <div className="recur-options">
            {(['none','weekly','bimonthly','monthly'] as const).map(v => (
              <div key={v}
                className={`recur-opt ${recurrence === v ? 'selected' : ''}`}
                onClick={() => { setRecurrence(v); setRecurDays([]) }}
              >
                {{ none:'Sem recorrência', weekly:'Semanal', bimonthly:'2x por mês', monthly:'Mensal' }[v]}
              </div>
            ))}
          </div>

          {recurrence === 'weekly' && (
            <div className="rdp-wrap">
              <div className="rdp-title">📅 Quais dias da semana?</div>
              <div className="rdp-weekdays">
                {WD.map((lb, i) => (
                  <div key={i} className={`rdp-wd ${recurDays.includes(i) ? 'sel' : ''}`}
                    onClick={() => toggleWD(i)}>{lb}</div>
                ))}
              </div>
              {recurDays.length > 0 && (
                <div className="rdp-chips">
                  {[...recurDays].sort().map(d => <span key={d} className="rdp-chip">{WD[d]}</span>)}
                </div>
              )}
            </div>
          )}

          {(recurrence === 'bimonthly' || recurrence === 'monthly') && (
            <div className="rdp-wrap">
              <div className="rdp-title">📅 Qual(is) dia(s) do mês?</div>
              <div className="rdp-cal-nav">
                <button type="button" onClick={() => {
                  let m = rdpMonth - 1, y = rdpYear
                  if (m < 0) { m = 11; y-- }
                  setRdpMonth(m); setRdpYear(y)
                }}>‹</button>
                <span>{MONTHS_S[rdpMonth]} {rdpYear}</span>
                <button type="button" onClick={() => {
                  let m = rdpMonth + 1, y = rdpYear
                  if (m > 11) { m = 0; y++ }
                  setRdpMonth(m); setRdpYear(y)
                }}>›</button>
              </div>
              <div className="rdp-cal-labels">
                {WD.map(d => <span key={d}>{d}</span>)}
              </div>
              <div className="rdp-cal-grid">
                {Array.from({ length: new Date(rdpYear, rdpMonth, 1).getDay() }).map((_, i) => (
                  <div key={`e${i}`} className="rdp-day" />
                ))}
                {Array.from({ length: new Date(rdpYear, rdpMonth+1, 0).getDate() }, (_, i) => i+1).map(d => (
                  <div key={d} className={`rdp-day has-day ${recurDays.includes(d) ? 'sel' : ''}`}
                    onClick={() => toggleMD(d)}>{d}</div>
                ))}
              </div>
              {recurDays.length > 0 && (
                <div className="rdp-chips">
                  {[...recurDays].sort((a,b)=>a-b).map(d => <span key={d} className="rdp-chip">Dia {d}</span>)}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="field">
          <label>Observações</label>
          <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Ex: Fade #2, preferência..." />
        </div>

        {error && <div className="error-msg">{error}</div>}

        <button className="btn" onClick={handleSave} disabled={loading} style={{ marginTop:12 }}>
          {loading ? 'Salvando...' : 'Salvar Agendamento'}
        </button>
        <button className="btn secondary" onClick={onClose} style={{ marginTop:8 }}>Cancelar</button>
        {editId && (
          <button className="btn danger" onClick={handleDelete} style={{ marginTop:8 }}>Excluir</button>
        )}
      </div>
    </div>
  )
}
