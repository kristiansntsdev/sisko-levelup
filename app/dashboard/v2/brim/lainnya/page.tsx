import { requireBrimNasionalPage } from '@/lib/brim-auth'
import { LainnyaClient } from '@/components/brim-v2/lainnya'

export default async function BrimV2LainnyaPage() {
  const pengurus = await requireBrimNasionalPage()
  return <LainnyaClient nama={pengurus.nama} username={pengurus.username} />
}
