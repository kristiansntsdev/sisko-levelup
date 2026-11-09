import { requireBrimNasionalPage } from '@/lib/brim-auth'
import { getAllEventsByKotalevelup } from '@/lib/actions/event'
import { getBrimArtikelStats } from '@/lib/artikel-data'
import { BerandaClient } from '@/components/brim-v2/beranda'

export default async function BrimV2BerandaPage() {
  const pengurus = await requireBrimNasionalPage()
  const [events, artikel] = await Promise.all([getAllEventsByKotalevelup(null), getBrimArtikelStats()])
  return <BerandaClient nama={pengurus.nama} events={events} artikel={artikel} />
}
