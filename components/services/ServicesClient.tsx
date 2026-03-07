'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createService, updateService, deleteService } from '@/actions/services'

type Service = { id: number; name: string; price: string | null; duration: number }

const DURATION_OPTIONS = [15, 20, 30, 45, 60, 75, 90, 120]

function fmtDuration(min: number) {
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60), m = min % 60
  return m > 0 ? `${h}h${String(m).padStart(2,'0')}` : `${h}h`
}

function fmtPrice(p: string | null) {
  if (!p || p === '0') return '—'
  return `R$ ${parseFloat(p).toFixed(2).replace('.', ',')}`
}

export default function ServicesClient({ services }: { services: Service[] }) {
  const router = useRouter()
  const [modal, setModal]     = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [name, setName]       = useState('')
  const [price, setPrice]     = useState('')
  const [duration, setDuration] = useState(60)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  function openNew() {
    setEditing(null); setName(''); setPrice(''); setDuration(60); setError(''); setModal(true)
  }
  function openEdit(s: Service) {
    setEditing(s)
    setName(s.name)
    setPrice(s.price && s.price !== '0' ? parseFloat(s.price).toFixed(2) : '')
    setDuration(s.duration)
    setError('')
    setModal(true)
  }

  async function handleSave() {
    if (!name.trim()) { setError('Nome é obrigatório'); return }
    setLoading(true)
    const data = { name, price: price || '0', duration }
    if (editing) await updateService(editing.id, data)
    else         await createService(data)
    setModal(false); setLoading(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!editing || !confirm(`Excluir serviço "${editing.name}"?`)) return
    setLoading(true)
    await deleteService(editing.id)
    setModal(false); setLoading(false)
    router.refresh()
  }

  return (
    <>
      <div className="app-header">
        <h1>Serviços</h1>
        <button className="btn sm" onClick={openNew}>＋ Novo</button>
      </div>

      <div className="page-content">
        {services.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 0', color:'var(--muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✂️</div>
            <p style={{ marginBottom: 8 }}>Nenhum serviço cadastrado</p>
            <p style={{ fontSize: 13 }}>Crie seus serviços para usar nos agendamentos</p>
          </div>
        ) : services.map(s => (
          <div key={s.id} className="service-card" onClick={() => openEdit(s)}>
            <div className="service-icon">{s.name.slice(0,1).toUpperCase()}</div>
            <div className="service-info">
              <div className="service-name">{s.name}</div>
              <div className="service-meta">
                <span className="service-tag">⏱ {fmtDuration(s.duration)}</span>
                {s.price && s.price !== '0' && (
                  <span className="service-tag service-tag-gold">💰 {fmtPrice(s.price)}</span>
                )}
              </div>
            </div>
            <div style={{ color:'var(--muted)', fontSize: 18 }}>›</div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-bg open" onClick={e => { if (e.target === e.currentTarget) setModal(false) }}>
          <div className="modal">
            <div className="modal-handle" />
            <h3>{editing ? 'Editar Serviço' : 'Novo Serviço'}</h3>

            <div className="field">
              <label>Nome do Serviço</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Ex: Corte degradê, Barba completa..."
                autoFocus
              />
            </div>

            <div className="field">
              <label>Preço (R$)</label>
              <input
                type="number" value={price} onChange={e => setPrice(e.target.value)}
                placeholder="0,00" min="0" step="0.01"
              />
            </div>

            <div className="field">
              <label>Duração</label>
              <div className="duration-grid">
                {DURATION_OPTIONS.map(d => (
                  <div
                    key={d}
                    className={`duration-opt ${duration === d ? 'selected' : ''}`}
                    onClick={() => setDuration(d)}
                  >
                    {fmtDuration(d)}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10 }}>
                <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, display: 'block' }}>
                  Ou digite em minutos:
                </label>
                <input
                  type="number" value={duration} onChange={e => setDuration(Number(e.target.value))}
                  min="5" max="480" step="5"
                />
              </div>
            </div>

            {error && <div className="error-msg">{error}</div>}

            <button className="btn" onClick={handleSave} disabled={loading} style={{ marginTop: 12 }}>
              {loading ? 'Salvando...' : 'Salvar Serviço'}
            </button>
            <button className="btn secondary" onClick={() => setModal(false)} style={{ marginTop: 8 }}>
              Cancelar
            </button>
            {editing && (
              <button className="btn danger" onClick={handleDelete} disabled={loading} style={{ marginTop: 8 }}>
                Excluir Serviço
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
