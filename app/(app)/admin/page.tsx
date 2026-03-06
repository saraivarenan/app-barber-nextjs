export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getUsers } from '@/actions/admin'
import AdminClient from '@/components/admin/AdminClient'

export default async function AdminPage() {
  const session = await getSession()
  if (!session?.isAdmin) redirect('/home')
  const users = await getUsers()
  return <AdminClient users={users} currentUserId={session.id} />
}
