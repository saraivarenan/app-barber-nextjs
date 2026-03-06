'use client'

import { useRouter } from 'next/navigation'
import { blockUser, removeUser } from '@/actions/admin'

export default function AdminClient({ users, currentUserId }: { users: any[], currentUserId: number }) {
  const router = useRouter()

  async function handleBlock(id: number, blocked: boolean) {
    await blockUser(id, !blocked)
    router.refresh()
  }

  async function handleRemove(id: number, name: string) {
    if (!confirm(`Excluir ${name}?\nTodos os agendamentos e contatos serão removidos.`)) return
    await removeUser(id)
    router.refresh()
  }

  return (
    <>
      <div className="app-header">
        <h1>Usuários</h1>
        <span style={{ color:'var(--muted)', fontSize:13 }}>{users.length} total</span>
      </div>

      <div className="page-content">
        {users.map((u: any) => {
          const ini   = u.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0,2)
          const isMe  = u.id === currentUserId
          const blocked = u.isBlocked
          const admin   = u.isAdmin

          return (
            <div key={u.id} className={`admin-card ${blocked ? 'blocked' : ''}`}>
              <div className="admin-card-top">
                <div className={`admin-av ${admin ? 'gold' : ''}`}>{ini}</div>
                <div className="admin-info">
                  <div className="admin-name">
                    {u.name}
                    {admin   && <span className="badge">Admin</span>}
                    {isMe    && <span className="badge me">Você</span>}
                    {blocked && <span className="badge" style={{ background:'rgba(192,57,43,.15)', color:'#c0392b' }}>Bloqueado</span>}
                  </div>
                  <div className="admin-email">{u.email}</div>
                  <div className="admin-meta">
                    {u.totalSchedules} agendamento(s) · desde {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>

              {!isMe && (
                <div className="admin-actions">
                  <button
                    className={`admin-btn ${blocked ? 'green' : 'yellow'}`}
                    onClick={() => handleBlock(u.id, blocked)}
                  >
                    {blocked ? '✓ Desbloquear' : '⊘ Bloquear'}
                  </button>
                  <button className="admin-btn red" onClick={() => handleRemove(u.id, u.name)}>
                    🗑 Excluir
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
