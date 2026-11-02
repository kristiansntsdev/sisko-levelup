'use client'
import { Loading, useAlk, useLoad } from '@/components/demo-preview/alk'
import { ApprovalV2Client } from '@/components/demo-preview/clone/alk-v2/approval'
import { getPendingVolunteerApprovals } from '@/components/demo-preview/shim/actions/upgrade'

// Demo-only screen: in the real app Join Volunteer is instant. Same ApprovalV2Client, different list.
export default function AlkV2ApprovalVolunteerPage() {
  const alk = useAlk()
  const items = useLoad(() => getPendingVolunteerApprovals())
  if (!alk || !items) return <Loading />
  return <ApprovalV2Client kind="volunteer" items={items} namaCabang={alk.namaCabang} />
}
