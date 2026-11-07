'use client'

import { useState } from 'react'
import {
  SURAT_KEUANGAN,
  type KorwilOption,
  type SuratApprovals,
  type SuratKeuanganData,
} from '@/lib/surat-keuangan-data'

// Data helpers live in lib/surat-keuangan-data.ts (server-callable); re-exported for client callers.
export {
  SURAT_KEUANGAN,
  buildSuratKeuangan,
  formatTanggalEvent,
  matchKorwil,
  type KorwilOption,
  type SuratApprovals,
  type SuratKeuanganData,
} from '@/lib/surat-keuangan-data'

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

function Approved({ text }: { text?: string | null }) {
  if (!text) return null
  return (
    <div className="flex h-full items-center justify-center px-2 text-center text-[9pt] font-bold italic text-[#1d4ed8]">
      {text}
    </div>
  )
}

export function SuratKeuanganDocument({
  data,
  korwil,
  approvals,
}: {
  data: SuratKeuanganData
  korwil: KorwilOption | null
  /** Persetujuan lewat link tanpa login, dicetak di kotak TTD */
  approvals?: SuratApprovals
}) {
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
              {[approvals?.korwil, approvals?.pic, approvals?.keuangan].map((text, i) => (
                <td key={i} className="border border-black" style={{ height: '28mm' }}>
                  <Approved text={text} />
                </td>
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
  fixedKorwil,
  approvals,
}: {
  data: SuratKeuanganData
  backHref: string
  korwilOptions: KorwilOption[]
  defaultKorwilId: number | null
  korwilError?: string | null
  /** Korwil yang dipilih ALK Kota saat submit (snapshot); kalau ada, picker disembunyikan */
  fixedKorwil?: KorwilOption | null
  approvals?: SuratApprovals
}) {
  const [korwilId, setKorwilId] = useState<number | null>(defaultKorwilId)
  const picked = korwilOptions.find((o) => o.id === korwilId) ?? null
  const korwil = fixedKorwil ?? picked
  const needsPick = !fixedKorwil && korwilOptions.length > 0 && !picked

  return (
    <div className="min-h-screen bg-[#ddd9d3] print:min-h-0 print:bg-white">
      <style>{'@media print{@page{size:A4;margin:0}}'}</style>
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-black/20 bg-[#efe8da] px-4 py-3 print:hidden">
        <a href={backHref} className="text-[13px] font-bold underline">
          ← Kembali
        </a>
        {fixedKorwil ? (
          <span className="text-[13px]">
            <span className="font-bold">Korwil</span> {fixedKorwil.nama}
            {fixedKorwil.koordinator ? ` — ${fixedKorwil.koordinator}` : ''}
          </span>
        ) : korwilOptions.length > 0 ? (
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
        {!fixedKorwil && korwilError ? (
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
          <SuratKeuanganDocument data={data} korwil={korwil} approvals={approvals} />
        </div>
      </div>
    </div>
  )
}
