'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const path = usePathname()
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  useEffect(() => {
    setPendingHref(null)
  }, [path])

  useEffect(() => {
    if (!pendingHref) return

    const timeout = window.setTimeout(() => setPendingHref(null), 8000)
    return () => window.clearTimeout(timeout)
  }, [pendingHref])

  const items = [
    { href: '/home', icon: '🏠', label: 'Início' },
    { href: '/calendar', icon: '📅', label: 'Agenda' },
    { href: '/services', icon: '✂️', label: 'Serviços' },
    { href: '/contacts', icon: '📒', label: 'Contatos' },
    ...(isAdmin ? [{ href: '/admin', icon: '🔑', label: 'Admin' }] : []),
  ]

  return (
    <nav className={`bottom-nav ${pendingHref ? 'loading' : ''}`} aria-busy={!!pendingHref}>
      {items.map(item => {
        const isActive = path === item.href
        const isPending = pendingHref === item.href

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${isActive ? 'active' : ''} ${isPending ? 'pending' : ''}`}
            onClick={() => {
              if (!isActive) setPendingHref(item.href)
            }}
          >
            <span className="nav-icon">{isPending ? <span className="nav-spinner" /> : item.icon}</span>
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
