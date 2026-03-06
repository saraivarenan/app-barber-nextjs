import { getContacts } from '@/actions/contacts'
import ContactsClient from '@/components/contacts/ContactsClient'

export default async function ContactsPage() {
  const contacts = await getContacts()
  return <ContactsClient contacts={contacts} />
}
