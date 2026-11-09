import { requireBrimNasionalPage } from '@/lib/brim-auth'
import { listArtikelAdmin } from '@/lib/artikel-data'
import { ArtikelListClient } from '@/components/brim-v2/artikel-list'

export default async function BrimV2ArtikelPage() {
  await requireBrimNasionalPage()
  const artikel = await listArtikelAdmin()
  return <ArtikelListClient artikel={artikel} />
}
