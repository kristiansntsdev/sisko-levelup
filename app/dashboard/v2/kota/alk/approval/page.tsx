import { db } from '@/lib/db'
import { requireAlkPengurus } from '@/lib/alk-auth'
import { getPendingSquadApprovals } from '@/lib/actions/upgrade'
import { ApprovalV2Client } from '@/components/alk-v2/approval'

export default async function AlkV2ApprovalPage() {
  const pengurus = await requireAlkPengurus()
  const [items, cabang] = await Promise.all([
    getPendingSquadApprovals(),
    db.cabang.findUnique({
      where: { id_cabang: Number(pengurus.cabang) },
      select: { namacabang: true },
    }),
  ])
  return (
    <ApprovalV2Client
      items={items}
      namaCabang={cabang?.namacabang ?? (pengurus.isNasional ? 'Nasional' : pengurus.cabang)}
    />
  )
}
