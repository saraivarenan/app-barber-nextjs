export const dynamic = 'force-dynamic'

import { getSchedules } from '@/actions/schedules'
import { getContacts } from '@/actions/contacts'
import { getServices } from '@/actions/services'
import CalendarClient from '@/components/calendar/CalendarClient'

export default async function CalendarPage() {
  const [schedules, contacts, services] = await Promise.all([
    getSchedules(), getContacts(), getServices()
  ])
  return <CalendarClient schedules={schedules} contacts={contacts} services={services} />
}
