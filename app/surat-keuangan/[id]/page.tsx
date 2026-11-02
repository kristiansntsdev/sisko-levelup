import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireAlkPengurus } from '@/lib/alk-auth'
import { loadSuratKeuangan } from '@/lib/surat-keuangan'
import { listKorwilPphtgd } from '@/lib/pphtgd-korwil'
import { matchKorwil, SuratKeuanganPage } from '@/components/documents/surat-keuangan'
import { ALK_BASE, ALK_EVENT_BASE } from '@/components/alk-v2/paths'

export const metadata: Metadata = { title: 'Surat Keuangan', robots: { index: false, follow: false } }

export default async function SuratKeuanganRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const eventId = Number(id)
  const pengurus = await requireAlkPengurus()
  if (!Number.isInteger(eventId)) redirect(ALK_BASE)

  const res = await loadSuratKeuangan(eventId)
  if (res.status === 'not_found') redirect(ALK_BASE)
  if (res.status === 'ok' && !pengurus.isNasional && pengurus.cabang !== res.idCabang) redirect(ALK_BASE)

  const back = `${ALK_EVENT_BASE}/${eventId}/dana`
  if (res.status === 'not_ready') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#efe8da] px-6 text-center">
        <p className="text-[15px] font-bold">Surat tersedia setelah dana disetujui Sekretariat Nasional</p>
        <a href={back} className="text-[13px] font-bold underline">← Kembali</a>
      </main>
    )
  }

  const korwil = await listKorwilPphtgd()
  const options = korwil.ok ? korwil.korwil : []
  return (
    <SuratKeuanganPage
      data={res.data}
      backHref={back}
      korwilOptions={options}
      defaultKorwilId={matchKorwil(options, res.namaCabang)}
      korwilError={korwil.ok ? null : korwil.error}
    />
  )
}
