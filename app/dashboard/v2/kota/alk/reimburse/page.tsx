import { redirect } from 'next/navigation'
import { requireAlkPengurus } from '@/lib/alk-auth'
import { listReimburseSekretariat } from '@/lib/actions/reimburse'
import { ReimburseListV2Client } from '@/components/alk-v2/reimburse'
import { ALK_BASE } from '@/components/alk-v2/paths'

export default async function AlkV2ReimbursePage() {
  await requireAlkPengurus()
  const res = await listReimburseSekretariat()
  if (!res) redirect(ALK_BASE)
  return <ReimburseListV2Client isNasional={res.isNasional} items={res.items} />
}
