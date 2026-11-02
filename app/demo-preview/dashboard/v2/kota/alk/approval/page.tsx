'use client'
import { Loading, useAlk, useLoad } from '@/components/demo-preview/alk'
import { ApprovalV2Client } from '@/components/demo-preview/clone/alk-v2/approval'
import { getPendingSquadApprovals } from '@/components/demo-preview/shim/actions/upgrade'

export default function AlkV2ApprovalPage() {
  const alk = useAlk()
  const items = useLoad(() => getPendingSquadApprovals())
  if (!alk || !items) return <Loading />
  return <ApprovalV2Client items={items} namaCabang={alk.namaCabang} />
}
