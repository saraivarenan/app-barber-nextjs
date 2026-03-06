'use client'

import { useState, useEffect, useRef } from 'react'
import { createSchedule, updateSchedule, deleteSchedule } from '@/actions/schedules'
import { createContact } from '@/actions/contacts'
import { nextFreeSlot, dateStr } from '@/lib/recurrence'

const SERVICES = ['Corte','Barba','Corte + Barba','Coloração','Corte Infantil']
const WD       = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const MONTHS_S = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

type Props = {
  editId:    number | null
  preDate:   string
  preTime:   string
  schedules: any[]
  contacts:  any[]
  onClose:   () => void
}

export default function ScheduleModal({ editId, preDate, preTime, schedules, contacts, onClose }: Props) {
  const editing  = editId ? schedules.find((s: any) => s.id === editId) : null
  const today    = new Date()

  const [client,     setClient]     = useState(editing?.client || '')
  const [phone,      setPhone]      = useState(editing?.phone  || '')
  const [date,       setDate]       = useState(editing?.date   || preDate || dateStr(today))
  const [time,       setTime]       = useState(editing?.time   || preTime || nextFreeSlot(schedules, preDate || dateStr(today)))
  const [service,    setService]    = useState(editing?.service || 'Corte')
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

  // Close picker on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (cpRef.current && !cpRef.current.contains(e.target as Node)) setCpOpen(false)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const ini = client ? client.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0,2) : '?'
  const filteredContacts = contacts.filter((c: any) =>
    c.name.toLowerCase().includes(cpSearch.toLowerCase()) || (c.phone||'').includes(cpSearch)
  )

  async function handleSave() {
    if (!client || !date || !time) { setError('Preencha cliente, data e horário'); return }
    const conflict = schedules.find((s: any) =>
      s.date === date && s.time === time && s.id !== editId
    )
    if (conflict) { setError(`⚠️ ${conflict.client} já está neste horário`); return }

    setLoading(true)
    const payload = { client, phone, date, time, service, recurrence, recurDays, notes }
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
    try {
      const created: any = await createContact(name.trim(), ph.trim())
      setClient(name.trim()); setPhone(ph.trim()); setCpOpen(false)
    } catch { setClient(name.trim()); setCpOpen(false) }
  }

  function toggleWD(i: number) {
    setRecurDays(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])
  }
  function toggleMD(d: number) {
    setRecurDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }
  function rdpPrev() {
    let m = rdpMonth - 1, y = rdpYear
    if (m < 0) { m = 11; y-- }
    setRdpMonth(m); setRdpYear(y)
  }
  function rdpNext() {
    let m = rdpMonth + 1, y = rdpYear
    if (m > 11) { m = 0; y++ }
    setRdpMonth(m); setRdpYear(y)
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
              <span className={`cp-label ${client ? 'set' : ''}`}>
                {client || 'Selecionar contato…'}
              </span>
              <span>▾</span>
            </div>
            {cpOpen && (
              <div className="cp-dropdown">
                <div className="cp-search">
                  <input
                    placeholder="🔍  Buscar…"
                    value={cpSearch}
                    onChange={e => setCpSearch(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    autoFocus
                  />
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

        <div className="field">
          <label>Data</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="field">
          <label>Horário</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} />
        </div>

        <div className="field">
          <label>Serviço</label>
          <select value={service} onChange={e => setService(e.target.value)}>
            {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
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
                <button type="button" onClick={rdpPrev}>‹</button>
                <span>{MONTHS_S[rdpMonth]} {rdpYear}</span>
                <button type="button" onClick={rdpNext}>›</button>
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
          <label>Observações (opcional)</label>
          <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Ex: Fade #2, prefere manhã..." />
        </div>

        {error && <div className="error-msg">{error}</div>}

        <button className="btn" onClick={handleSave} disabled={loading} style={{ marginTop: 12 }}>
          {loading ? 'Salvando...' : 'Salvar Agendamento'}
        </button>
        <button className="btn secondary" onClick={onClose} style={{ marginTop: 8 }}>Cancelar</button>
        {editId && (
          <button className="btn danger" onClick={handleDelete} style={{ marginTop: 8 }}>Excluir</button>
        )}
      </div>
    </div>
  )
}
