import type { Metadata } from 'next'
import { loadDanaByVerifikasi } from '@/lib/dana-approval'
import { buildSuratVerifikasi } from '@/lib/surat-verifikasi'
import { SuratVerifikasiPage, SuratVerifikasiTidakAda } from '@/components/dana/surat-verifikasi'

// Publik (dibuka dari QR di surat cetak). Kode tidak bisa ditebak, tapi tetap jangan diindeks / dikirim sebagai Referer.
export const metadata: Metadata = {
  title: 'Verifikasi Dokumen LevelUP',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

export default async function VerifikasiPage({ params }: { params: Promise<{ kode: string }> }) {
  const { kode } = await params
  const view = await loadDanaByVerifikasi(kode)
  if (!view) return <SuratVerifikasiTidakAda />
  return <SuratVerifikasiPage data={buildSuratVerifikasi(view)} />
}
