import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import BottomNav from '@/components/layout/BottomNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/auth/login')

  return (
    <div className="app-shell">
      {children}
      <BottomNav isAdmin={session.isAdmin} />
    </div>
  )
}
