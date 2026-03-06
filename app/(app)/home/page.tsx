export const dynamic = 'force-dynamic'

import { getSession } from '@/lib/auth'
import { getSchedules } from '@/actions/schedules'
import { getContacts } from '@/actions/contacts'
import HomeClient from '@/components/timeline/HomeClient'

export default async function HomePage() {
  const session   = await getSession()
  const schedules = await getSchedules()
  const contacts  = await getContacts()

  return <HomeClient session={session!} schedules={schedules} contacts={contacts} />
}
