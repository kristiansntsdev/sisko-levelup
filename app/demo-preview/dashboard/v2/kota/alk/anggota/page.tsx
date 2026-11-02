'use client'
import { Loading, useAlk, useLoad } from '@/components/demo-preview/alk'
import { PesertaListClient } from '@/components/demo-preview/clone/alk-v2/anggota'
import { listPesertaKota } from '@/components/demo-preview/shim/actions/pengurus-kota'

export default function AlkV2AnggotaPage() {
  const alk = useAlk()
  const peserta = useLoad(() => listPesertaKota())
  if (!alk || !peserta) return <Loading />
  return <PesertaListClient peserta={peserta} namaCabang={alk.namaCabang} />
}
