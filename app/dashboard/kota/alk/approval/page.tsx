import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getPendingSquadApprovals } from '@/lib/actions/upgrade'
import { ApprovalClient } from './approval-client'

export default async function AlkApprovalPage() {
  const cookieStore = await cookies()
  const pengurusId = cookieStore.get('pengurus_id')?.value
  if (!pengurusId) redirect('/admin')

  const pengurus = await db.pengurus.findUnique({
    where: { id_pengurus: Number(pengurusId) },
    select: { divisi: true },
  })
  if (!pengurus || pengurus.divisi !== 'alk') redirect('/admin')

  const items = await getPendingSquadApprovals()
  return <ApprovalClient items={items} />
}
