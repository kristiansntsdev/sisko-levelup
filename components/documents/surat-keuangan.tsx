'use client'

import { useState } from 'react'
import { levelupKota } from '@/components/documents/_shared/document-header'
import { formatCurrency } from '@/lib/documents/form-data'

export type SuratKeuanganData = {
  namaKoordinator: string
  kota: string
  namaEvent: string
  tanggalEvent: string
  tempat: string
  jumlahPeserta: string
  pengajuanDana: string
  namabank: string
  norek: string
  namarek: string
}

export type KorwilOption = { id: number; nama: string; koordinator: string | null; kota: string | null }

export const SURAT_KEUANGAN = {
  kepada: ['Yth. Pdt. Himawan Leenardo', 'Pengurus PPHTGD Pusat', 'di tempat'],
  picPusat: { role: 'PIC LevelUP Pusat', nama: 'Steven Kusuma' },
  keuangan: { role: 'Keuangan PPHTGD', nama: '' },
} as const

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

function parts(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return { y, m: m - 1, d }
}

function dash(v: string | null | undefined) {
  return v && v.trim() ? v.trim() : '-'
}

/** "04 Juli 2026" or "14 – 15 Mei 2026" / "30 April – 1 Mei 2026" for ranges. Inputs are YYYY-MM-DD (date-only, no timezone shift). */
export function formatTanggalEvent(mulai: string, selesai: string): string {
  const a = parts(mulai)
  const b = parts(selesai || mulai)
  const dd = (n: number) => String(n).padStart(2, '0')
  if (a.y === b.y && a.m === b.m && a.d === b.d) return `${dd(a.d)} ${BULAN[a.m]} ${a.y}`
  if (a.y === b.y && a.m === b.m) return `${dd(a.d)} – ${dd(b.d)} ${BULAN[a.m]} ${a.y}`
  if (a.y === b.y) return `${dd(a.d)} ${BULAN[a.m]} – ${dd(b.d)} ${BULAN[b.m]} ${a.y}`
  return `${dd(a.d)} ${BULAN[a.m]} ${a.y} – ${dd(b.d)} ${BULAN[b.m]} ${b.y}`
}

function rp(raw: string): string {
  const n = Number(String(raw ?? '').replace(/\D/g, ''))
  return n > 0 ? formatCurrency(n) : '-'
}

export function buildSuratKeuangan(input: {
  event: { nama_event: string; tglMulai: string; tglSelesai: string; alamatevent: string; jenisevent: string }
  cabang: { namacabang: string; leadercabang: string } | null
  reimburse: { danausul: string; namabank: string; norek: string; namarek: string }
  jumlahHadir: number
}): SuratKeuanganData {
  const { event, cabang, reimburse } = input
  return {
    namaKoordinator: dash(cabang?.leadercabang),
    kota: cabang?.namacabang ? levelupKota(cabang.namacabang) : '-',
    namaEvent: dash(event.nama_event),
    tanggalEvent: formatTanggalEvent(event.tglMulai, event.tglSelesai),
    tempat: event.jenisevent === 'Online' ? 'Online' : dash(event.alamatevent),
    jumlahPeserta: String(input.jumlahHadir),
    pengajuanDana: rp(reimburse.danausul),
    namabank: dash(reimburse.namabank),
    norek: dash(reimburse.norek),
    namarek: dash(reimburse.namarek),
  }
}

function norm(s: string | null | undefined): string {
  return (s ?? '')
    .toLowerCase()
    .replace(/\b(level\s*up|korwil|kota|kabupaten|kab\.?)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Pre-selects the korwil whose name (then coordinator city) equals the LevelUP kota; null when nothing matches. */
export function matchKorwil(options: KorwilOption[], kotaName: string): number | null {
  const key = norm(kotaName)
  if (!key) return null
  const byName = options.find((o) => norm(o.nama) === key)
  if (byName) return byName.id
  const byKota = options.find((o) => norm(o.kota) === key)
  return byKota ? byKota.id : null
}

const SERIF = { fontFamily: "'Times New Roman', Times, serif" }

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="w-[40%] border border-black px-3 py-2">{label}</td>
      <td className="w-[3%] border border-black px-1 py-2 text-center">:</td>
      <td className="border border-black px-3 py-2">{value}</td>
    </tr>
  )
}

function Heading({ children }: { children: string }) {
  return (
    <tr>
      <td colSpan={3} className="border border-black px-3 py-2 font-bold">
        {children}
      </td>
    </tr>
  )
}

export function SuratKeuanganDocument({ data, korwil }: { data: SuratKeuanganData; korwil: KorwilOption | null }) {
  const { picPusat, keuangan } = SURAT_KEUANGAN
  return (
    <div
      className="relative bg-white text-black"
      style={{ ...SERIF, width: '210mm', height: '297mm', fontSize: '11pt', lineHeight: 1.3, overflow: 'hidden' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/kop-keuangan.png" alt="" className="absolute inset-0 h-full w-full" />
      <div className="relative" style={{ padding: '38mm 18mm 0' }}>
        <h1 className="text-center text-[17pt] font-bold">Permohonan Pengajuan Support Dana</h1>
        <p className="mt-4">
          <strong>KEPADA :</strong>
          <br />
          <strong>{SURAT_KEUANGAN.kepada[0]}</strong>
          <br />
          {SURAT_KEUANGAN.kepada[1]}
          <br />
          {SURAT_KEUANGAN.kepada[2]}
        </p>
        <p className="mt-3">
          Salam Sejahtera,
          <br />
          Bersamaan dengan surat permohonan ini, kami sampaikan bahwa kami telah menyelesaikan pelayanan.
        </p>

        <table className="mt-3 w-full border-collapse text-[10.5pt]">
          <tbody>
            <Heading>Informasi Penanggung Jawab</Heading>
            <Row label="Nama Koordinator" value={data.namaKoordinator} />
            <Row label="LevelUP Kota" value={data.kota} />
            <Heading>Kegiatan Acara</Heading>
            <Row label="Nama Event" value={data.namaEvent} />
            <Row label="Tanggal Event" value={data.tanggalEvent} />
            <Row label="Tempat Pelaksanaan Event" value={data.tempat} />
            <Row label="Jumlah Peserta" value={data.jumlahPeserta} />
            <Row label="Pengajuan Dana" value={data.pengajuanDana} />
            <Row label="Bank Penerima" value={data.namabank} />
            <Row label="Nomor Rekening" value={data.norek} />
            <Row label="Nama Pemilik Rekening" value={data.namarek} />
          </tbody>
        </table>

        <p className="mt-3">
          Demikian surat pengajuan dana ini kami buat. Atas perhatian dan dukungan yang senantiasa diberikan kami
          ucapkan terima kasih. Tuhan Yesus Memberkati.
        </p>

        <table className="mt-4 w-full border-collapse text-[10.5pt]">
          <tbody>
            <tr>
              {['Korwil PPHTGD', picPusat.role, keuangan.role].map((r) => (
                <td key={r} className="w-1/3 border border-black px-2 py-2 text-center font-bold">
                  {r}
                </td>
              ))}
            </tr>
            <tr>
              {[0, 1, 2].map((i) => (
                <td key={i} className="border border-black" style={{ height: '28mm' }} />
              ))}
            </tr>
            <tr>
              <td className="border border-black px-2 py-2 text-center">
                <strong>{korwil?.koordinator ?? ''}</strong>
                {korwil ? <div className="text-[9pt]">{korwil.nama}</div> : null}
              </td>
              <td className="border border-black px-2 py-2 text-center font-bold">{picPusat.nama}</td>
              <td className="border border-black px-2 py-2 text-center font-bold">{keuangan.nama || ' '}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function SuratKeuanganPage({
  data,
  backHref,
  korwilOptions,
  defaultKorwilId,
  korwilError,
}: {
  data: SuratKeuanganData
  backHref: string
  korwilOptions: KorwilOption[]
  defaultKorwilId: number | null
  korwilError?: string | null
}) {
  const [korwilId, setKorwilId] = useState<number | null>(defaultKorwilId)
  const korwil = korwilOptions.find((o) => o.id === korwilId) ?? null
  const needsPick = korwilOptions.length > 0 && !korwil

  return (
    <div className="min-h-screen bg-[#ddd9d3] print:min-h-0 print:bg-white">
      <style>{'@media print{@page{size:A4;margin:0}}'}</style>
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-black/20 bg-[#efe8da] px-4 py-3 print:hidden">
        <a href={backHref} className="text-[13px] font-bold underline">
          ← Kembali
        </a>
        {korwilOptions.length > 0 ? (
          <label className="flex items-center gap-2 text-[13px]">
            <span className="font-bold">Korwil</span>
            <select
              value={korwilId ?? ''}
              onChange={(e) => setKorwilId(e.target.value ? Number(e.target.value) : null)}
              className="max-w-[240px] rounded border border-black/40 bg-white px-2 py-1.5 text-[16px] sm:text-[13px]"
            >
              <option value="">Pilih Korwil</option>
              {korwilOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nama}
                  {o.koordinator ? ` — ${o.koordinator}` : ''}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {korwilError ? (
          <span className="text-[12px] font-bold text-[#c21f24]">
            Data korwil PPHTGD tidak bisa dimuat — nama Korwil dikosongkan
          </span>
        ) : null}
        <button
          type="button"
          disabled={needsPick}
          onClick={() => window.print()}
          className="ml-auto rounded bg-[#161616] px-4 py-2 text-[13px] font-bold text-[#ffd83d] disabled:opacity-40"
        >
          Cetak / Simpan PDF
        </button>
      </div>
      <div className="overflow-x-auto px-2 py-4 print:p-0">
        <div className="mx-auto w-fit shadow-[0_4px_28px_rgba(0,0,0,.18)] print:shadow-none">
          <SuratKeuanganDocument data={data} korwil={korwil} />
        </div>
      </div>
    </div>
  )
}
