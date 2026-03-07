'use client'

import { SessionUser } from '@/lib/auth'
import { dateStr } from '@/lib/recurrence'
import DayTimeline from './DayTimeline'
import { logoutAction } from '@/actions/auth'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
               'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DIAS  = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']

type Props = {
  session:   SessionUser
  schedules: any[]
  contacts:  any[]
  services:  any[]
}

export default function HomeClient({ session, schedules, contacts, services }: Props) {
  const today    = new Date()
  const todayStr = dateStr(today)
  const h        = today.getHours()
  const greeting = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
  const firstName = session.name.split(' ')[0]

  const todaySchedules = schedules.filter((s: any) => s.date === todayStr)
  const total          = schedules.length
  const uniqueClients  = new Set(schedules.map((s: any) => s.client.toLowerCase())).size

  return (
    <>
      <div className="app-header">
        <div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:18 }}>
            {greeting}, {firstName}! ✂️
          </h1>
          <div className="sub">
            {DIAS[today.getDay()]}, {today.getDate()} de {MESES[today.getMonth()]}
          </div>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="btn sm secondary">Sair</button>
        </form>
      </div>

      <div className="home-stats">
        <div className="home-stat"><span>{todaySchedules.length}</span><label>Hoje</label></div>
        <div className="home-stat"><span>{total}</span><label>Total</label></div>
        <div className="home-stat"><span>{uniqueClients}</span><label>Clientes</label></div>
      </div>

      <div className="section-label">Horários de hoje</div>

      <DayTimeline
        selectedDate={todayStr}
        schedules={schedules}
        contacts={contacts}
        services={services}
        showNowLine
      />
    </>
  )
}
