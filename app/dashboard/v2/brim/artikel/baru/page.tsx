import { requireBrimNasionalPage } from '@/lib/brim-auth'
import { ArtikelFormClient } from '@/components/brim-v2/artikel-form'

export default async function BrimV2ArtikelBaruPage() {
  await requireBrimNasionalPage()
  return <ArtikelFormClient initial={{ judul: '', ringkasan: '', coverUrl: '', isi: '', published: false }} />
}
