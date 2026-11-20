import { redirect } from 'next/navigation'
import { pembacaSaatIni } from '@/lib/push/pembaca'
import { pengumumanUntuk } from '@/lib/push/pengumuman'
import { PengumumanListView } from '@/components/pwa/pengumuman'

export const dynamic = 'force-dynamic'

export default async function PengumumanAnggotaPage() {
  const pembaca = await pembacaSaatIni()
  if (!pembaca) redirect('/login?callbackUrl=/dashboard/pengumuman')
  const items = await pengumumanUntuk(pembaca)
  return <PengumumanListView items={items} />
}
