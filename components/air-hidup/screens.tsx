'use client'
// Layar Air Hidup: data, action, dan path datang lewat props, jadi halaman asli dan /demo-preview memakai berkas yang sama.
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BackBar, BTN, PaperHeader, PaperMain, Strip } from '@/components/pwa/paper-ui'
import { Sheet, SheetHead } from '@/components/pwa/ui'
import type { AirAnggota, AliranData, EditData, PicData, WwLaporan } from '@/lib/air-hidup'
import { AirFeed, KabarTerbaru } from './feed'
import { LaporForm } from './lapor-form'
import { PicDashboard } from './pic-dashboard'

export type AminResult = { ok: true; amin: number; aminSaya: boolean } | { ok: false }
export type ToggleAmin = (idLaporan: number) => Promise<AminResult>
export type LaporSubmit = (fd: FormData) => Promise<{ ok: true; id: number } | { ok: false; error: string }>
export type EditSubmit = (idLaporan: number, fd: FormData) => Promise<{ ok: true; id: number } | { ok: false; error: string }>

/** Amin berubah seketika, lalu memakai angka dari server; gagal = kembali seperti semula. */
function useAmin(initial: WwLaporan[], toggle: ToggleAmin) {
  const [src, setSrc] = useState(initial)
  const [list, setList] = useState(initial)
  if (src !== initial) {
    setSrc(initial)
    setList(initial)
  }
  const ubah = (id: number, f: (l: WwLaporan) => WwLaporan) => setList((cur) => cur.map((l) => (l.id === id ? f(l) : l)))
  async function onAmin(id: number) {
    ubah(id, (l) => ({ ...l, aminSaya: !l.aminSaya, amin: l.amin + (l.aminSaya ? -1 : 1) }))
    let r: AminResult
    try {
      r = await toggle(id)
    } catch {
      r = { ok: false }
    }
    if (r.ok) ubah(id, (l) => ({ ...l, amin: r.amin, aminSaya: r.aminSaya }))
    else ubah(id, (l) => ({ ...l, aminSaya: !l.aminSaya, amin: l.amin + (l.aminSaya ? -1 : 1) }))
  }
  return { list, onAmin }
}

/** Kabar Terbaru di Beranda semua anggota. */
export function KabarBeranda({ laporan, feedHref, toggleAmin }: { laporan: WwLaporan[]; feedHref: string; toggleAmin: ToggleAmin }) {
  const { list, onAmin } = useAmin(laporan, toggleAmin)
  if (!list.length) return null
  return <KabarTerbaru laporan={list} onAmin={onAmin} action={{ href: feedHref, label: 'Semua' }} carousel />
}

export function PicScreen({ data, berandaHref, laporHref, feedHref, editHref, toggleAmin }: { data: PicData; berandaHref: string; laporHref: string; feedHref: string; editHref: (idLaporan: number) => string; toggleAmin: ToggleAmin }) {
  const router = useRouter()
  const { list, onAmin } = useAmin(data.laporanKota, toggleAmin)
  const [soon, setSoon] = useState<string | null>(null)
  return (
    <PaperMain>
      <BackBar title="Dashboard PIC" onBack={() => router.push(berandaHref)} />
      <PaperHeader sticker="Dashboard PIC" title={data.namaKota} />
      <div className="mt-4 px-5 pb-8">
        <PicDashboard kota={data.kota} anggota={data.anggota} laporanKota={list} laporHref={laporHref} feedHref={feedHref} onAmin={onAmin} onSoon={setSoon} editHref={editHref} />
      </div>
      <Sheet open={Boolean(soon)} onClose={() => setSoon(null)}>
        <SheetHead title={soon ?? ''} sub="Alat ini segera hadir." />
        <button type="button" onClick={() => setSoon(null)} className={BTN}>
          <Strip>Tutup</Strip>
        </button>
      </Sheet>
    </PaperMain>
  )
}

export function LaporScreen({ namaKota, today, anggota, picHref, onSubmit }: { namaKota: string; today: string; anggota: AirAnggota[]; picHref: string; onSubmit: LaporSubmit }) {
  const router = useRouter()
  return (
    <PaperMain>
      <BackBar title="Lapor WW" onBack={() => router.push(picHref)} />
      <PaperHeader sticker="Pelaporan WW" title={namaKota} />
      <div className="mt-4 px-5 pb-8">
        <LaporForm
          namaKota={namaKota}
          today={today}
          anggota={anggota}
          onSubmit={async (fd) => {
            const r = await onSubmit(fd)
            if (r.ok) router.refresh() // Dashboard PIC + Aliran dibaca ulang
            return r
          }}
          onDone={() => router.push(picHref)}
        />
      </div>
    </PaperMain>
  )
}

export function EditLaporScreen({ data, picHref, onSubmit }: { data: EditData; picHref: string; onSubmit: EditSubmit }) {
  const router = useRouter()
  return (
    <PaperMain>
      <BackBar title="Edit Laporan WW" onBack={() => router.push(picHref)} />
      <PaperHeader sticker="Edit laporan" title={data.namaKota} />
      <div className="mt-4 px-5 pb-8">
        <LaporForm
          namaKota={data.namaKota}
          today={data.today}
          anggota={data.anggota}
          awal={data.laporan}
          onSubmit={async (fd) => {
            const r = await onSubmit(data.laporan.id, fd)
            if (r.ok) router.refresh()
            return r
          }}
          onDone={() => router.push(picHref)}
        />
      </div>
    </PaperMain>
  )
}

export function AliranScreen({ data, berandaHref, toggleAmin }: { data: AliranData; berandaHref: string; toggleAmin: ToggleAmin }) {
  const router = useRouter()
  const { list, onAmin } = useAmin(data.laporan, toggleAmin)
  return (
    <PaperMain>
      <BackBar title="Air Hidup" onBack={() => router.push(berandaHref)} />
      <PaperHeader sticker="Kabar dari kota-kota" title="Aliran Air Hidup" />
      <div className="mt-4 px-5 pb-8">
        <AirFeed nasional={data.nasional} kota={data.kota} laporan={list} onAmin={onAmin} />
      </div>
    </PaperMain>
  )
}
