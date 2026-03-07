export const dynamic = 'force-dynamic'

import { getServices } from '@/actions/services'
import ServicesClient from '@/components/services/ServicesClient'

export default async function ServicesPage() {
  const services = await getServices()
  return <ServicesClient services={services} />
}
