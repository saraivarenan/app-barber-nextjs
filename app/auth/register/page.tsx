'use client'

import { useState } from 'react'
import Link from 'next/link'
import { registerAction } from '@/actions/auth'

export default function RegisterPage() {
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await registerAction(new FormData(e.currentTarget))
    if (result?.error) { setError(result.error); setLoading(false) }
  }

  return (
    <div className="auth-screen">
      <div className="auth-logo">
        <div className="icon">✂️</div>
        <h1>BarberBook</h1>
        <p>Crie sua conta</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="field">
          <label>Seu nome</label>
          <input name="name" type="text" placeholder="João Barbeiro" required />
        </div>
        <div className="field">
          <label>E-mail</label>
          <input name="email" type="email" placeholder="seu@email.com" required />
        </div>
        <div className="field">
          <label>Senha</label>
          <input name="password" type="password" placeholder="mín. 6 caracteres" required />
        </div>
        {error && <div className="error-msg">{error}</div>}
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Criando conta...' : 'Criar Conta'}
        </button>
      </form>

      <p className="auth-switch">
        Já tem conta? <Link href="/auth/login">Entrar</Link>
      </p>
    </div>
  )
}
