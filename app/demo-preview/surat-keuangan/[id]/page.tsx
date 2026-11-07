'use client'
// Demo version of app/surat-keuangan/[id]: same letter component, data from the localStorage store.
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useSyncExternalStore } from 'react'
import { buildSuratKeuangan, matchKorwil, SuratKeuanganPage } from '@/components/documents/surat-keuangan'
import { DEMO_KORWIL, snapshot, subscribe } from '@/components/demo-preview/db'
import { Loading } from '@/components/demo-preview/alk'

const ALK = '/demo-preview/dashboard/v2/kota/alk'

export default function DemoSuratKeuanganPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const db = useSyncExternalStore(subscribe, snapshot, () => null)
  const eventId = Number(id)
  const isAlk = !!db?.pengurus.find((p) => p.id_pengurus === db.session.idPengurus && p.divisi === 'alk')

  useEffect(() => {
    if (db && !isAlk) router.replace('/demo-preview/login')
  }, [db, isAlk, router])

  if (!db || !isAlk) return <Loading />
  const back = `${ALK}/event/${eventId}/dana`
  const event = db.event.find((e) => e.id_event === eventId)
  const reimburse = db.reimburse.find((r) => r.id_event === String(eventId))
  if (!event || !reimburse) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#efe8da] px-6 text-center">
        <p className="text-[15px] font-bold">Pengajuan dana untuk event ini belum ada</p>
        <a href={back} className="text-[13px] font-bold underline">← Kembali</a>
      </main>
    )
  }
  if (reimburse.ajukan !== 'Ajukan' || reimburse.approvenasional !== '1') {
    // Same rule as the real page: printable once the PIC LevelUP Pusat approved.
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#efe8da] px-6 text-center">
        <p className="text-[15px] font-bold">Surat tersedia setelah dana disetujui PIC LevelUP Pusat</p>
        <a href={back} className="text-[13px] font-bold underline">← Kembali</a>
      </main>
    )
  }

  const cabang = db.cabang.find((c) => String(c.id_cabang) === event.id_cabang) ?? null
  const hadir = new Set(db.absen.filter((a) => a.id_event === eventId).map((a) => a.id_peserta)).size
  const data = buildSuratKeuangan({
    event: {
      nama_event: event.nama_event,
      tglMulai: event.tglevent,
      tglSelesai: event.tgleventselesai,
      alamatevent: event.alamatevent,
      jenisevent: event.jenisevent,
    },
    cabang,
    reimburse,
    jumlahHadir: hadir,
  })
  return (
    <SuratKeuanganPage
      data={data}
      backHref={back}
      korwilOptions={DEMO_KORWIL}
      defaultKorwilId={matchKorwil(DEMO_KORWIL, cabang?.namacabang ?? '')}
      fixedKorwil={reimburse.korwil}
      approvals={{
        korwil: reimburse.approvepphtgd === '1' ? 'Disetujui via link' : null,
        pic: reimburse.approvenasional === '1' ? 'Disetujui via link' : null,
        keuangan: reimburse.approvekeuangan === '1' ? 'Sudah ditransfer' : null,
      }}
    />
  )
}
