export const dynamic = 'force-dynamic'

import { getSchedules } from '@/actions/schedules'
import { getContacts } from '@/actions/contacts'
import CalendarClient from '@/components/calendar/CalendarClient'

export default async function CalendarPage() {
  const schedules = await getSchedules()
  const contacts  = await getContacts()
  return <CalendarClient schedules={schedules} contacts={contacts} />
}
