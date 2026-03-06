'use client'

import { useState } from 'react'
import Link from 'next/link'
import { loginAction } from '@/actions/auth'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await loginAction(new FormData(e.currentTarget))
    if (result?.error) { setError(result.error); setLoading(false) }
  }

  return (
    <div className="auth-screen">
      <div className="auth-logo">
        <div className="icon">✂️</div>
        <h1>BarberBook</h1>
        <p>Gestão de agendamentos para barbeiros</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="field">
          <label>E-mail</label>
          <input name="email" type="email" placeholder="seu@email.com" required />
        </div>
        <div className="field">
          <label>Senha</label>
          <input name="password" type="password" placeholder="••••••••" required />
        </div>
        {error && <div className="error-msg">{error}</div>}
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="auth-switch">
        Não tem conta? <Link href="/auth/register">Criar uma</Link>
      </p>
    </div>
  )
}
