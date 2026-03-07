'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const path = usePathname()
  return (
    <nav className="bottom-nav">
      <Link href="/home" className={`nav-item ${path === '/home' ? 'active' : ''}`}>
        <span className="nav-icon">🏠</span><span>Início</span>
      </Link>
      <Link href="/calendar" className={`nav-item ${path === '/calendar' ? 'active' : ''}`}>
        <span className="nav-icon">📅</span><span>Agenda</span>
      </Link>
      <Link href="/services" className={`nav-item ${path === '/services' ? 'active' : ''}`}>
        <span className="nav-icon">✂️</span><span>Serviços</span>
      </Link>
      <Link href="/contacts" className={`nav-item ${path === '/contacts' ? 'active' : ''}`}>
        <span className="nav-icon">📒</span><span>Contatos</span>
      </Link>
      {isAdmin && (
        <Link href="/admin" className={`nav-item ${path === '/admin' ? 'active' : ''}`}>
          <span className="nav-icon">🔑</span><span>Admin</span>
        </Link>
      )}
    </nav>
  )
}
