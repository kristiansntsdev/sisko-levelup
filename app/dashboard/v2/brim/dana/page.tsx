import { redirect } from 'next/navigation'
import { requireBrimNasionalPage } from '@/lib/brim-auth'
import { listReimburseBrim } from '@/lib/actions/reimburse'
import { ReimburseListV2Client } from '@/components/alk-v2/reimburse'
import { BRIM_BASE } from '@/components/brim-v2/paths'

export default async function BrimV2DanaPage() {
  await requireBrimNasionalPage()
  const items = await listReimburseBrim()
  if (!items) redirect(BRIM_BASE)
  return <ReimburseListV2Client isNasional items={items} brim />
}
