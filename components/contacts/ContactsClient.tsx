'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createContact, deleteContact } from '@/actions/contacts'

export default function ContactsClient({ contacts }: { contacts: any[] }) {
  const router  = useRouter()
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const filtered = contacts.filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone||'').includes(search)
  )

  async function handleAdd() {
    const name = prompt('Nome do contato:'); if (!name) return
    const phone = prompt('Número de telefone:') || ''
    setLoading(true)
    await createContact(name.trim(), phone.trim())
    router.refresh()
    setLoading(false)
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Excluir ${name}?`)) return
    await deleteContact(id)
    router.refresh()
  }

  return (
    <>
      <div className="app-header">
        <h1>Contatos</h1>
        <button className="btn sm" onClick={handleAdd} disabled={loading}>＋</button>
      </div>

      <div className="page-content">
        <div className="search-box">
          <span>🔍</span>
          <input
            placeholder="Buscar contatos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <p style={{ color:'var(--muted)', fontSize:14, textAlign:'center', padding:'30px 0' }}>
            {contacts.length === 0 ? 'Nenhum contato ainda. Toque em ＋ para adicionar.' : 'Nenhum contato encontrado'}
          </p>
        ) : filtered.map((c: any) => {
          const ini = c.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0,2)
          return (
            <div key={c.id} className="contact-row">
              <div className="contact-avatar">{ini}</div>
              <div style={{ flex: 1 }}>
                <div className="contact-name">{c.name}</div>
                <div className="contact-phone">{c.phone || 'Sem telefone'}</div>
              </div>
              <button
                onClick={() => handleDelete(c.id, c.name)}
                style={{ background:'none', border:'none', color:'var(--muted)', fontSize:18, cursor:'pointer' }}
              >🗑</button>
            </div>
          )
        })}
      </div>
    </>
  )
}
