'use client'
import { Loading, useAlk } from '@/components/demo-preview/alk'
import { LainnyaClient } from '@/components/demo-preview/clone/alk-v2/lainnya'

export default function AlkV2LainnyaPage() {
  const alk = useAlk()
  if (!alk) return <Loading />
  return <LainnyaClient nama={alk.nama} namaCabang={alk.namaCabang} username={alk.username} />
}
