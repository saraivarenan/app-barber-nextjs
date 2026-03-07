export const dynamic = 'force-dynamic'

import { getSession } from '@/lib/auth'
import { getSchedules } from '@/actions/schedules'
import { getContacts } from '@/actions/contacts'
import { getServices } from '@/actions/services'
import HomeClient from '@/components/timeline/HomeClient'

export default async function HomePage() {
  const session   = await getSession()
  const [schedules, contacts, services] = await Promise.all([
    getSchedules(), getContacts(), getServices()
  ])
  return <HomeClient session={session!} schedules={schedules} contacts={contacts} services={services} />
}
