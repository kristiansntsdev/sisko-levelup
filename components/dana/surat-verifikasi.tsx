'use client'
// Halaman publik dari QR tanda tangan Surat Keuangan: informasi dokumen + status tiap penanda tangan.
// Dipakai /verifikasi/{kode} dan /demo-preview/verifikasi/{id}. Client component karena memakai kit paper-ui.
import type { ReactNode } from 'react'
import type { PenandaStatus, SuratVerifikasi } from '@/lib/surat-verifikasi'
import { ANTON, LABEL, LogoChip, MONO, PANEL, PaperMain, ROWS } from '@/components/pwa/paper-ui'

const STATUS: Record<PenandaStatus, { id: string; en: string; cls: string }> = {
  signed: { id: '✓ Telah ditandatangani', en: 'signed', cls: 'text-[#15803d]' },
  transferred: { id: '✓ Sudah ditransfer', en: 'transferred', cls: 'text-[#15803d]' },
  pending: { id: 'Menunggu', en: 'pending', cls: 'text-[#57534e]' },
  rejected: { id: '✕ Ditolak', en: 'rejected', cls: 'text-[#c21f24]' },
}

function Label({ id, en }: { id: string; en: string }) {
  return (
    <p className="text-[15px] font-bold leading-tight text-[#161616]">
      {id} :<span className="block text-[12px] font-normal italic text-[#57534e]">{en}</span>
    </p>
  )
}

function Field({ id, en, children }: { id: string; en: string; children: ReactNode }) {
  return (
    <div>
      <Label id={id} en={en} />
      <div className="mt-1 text-[15px] leading-snug break-words">{children}</div>
    </div>
  )
}

const initials = (nama: string) =>
  nama
    .replace(/^(pdt|pnt|ev|dr|ir)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

export function SuratVerifikasiPage({ data }: { data: SuratVerifikasi }) {
  return (
    <PaperMain standalone>
      <div className="px-4 py-6">
        <article className={`${PANEL} overflow-hidden`}>
          <header className="px-5 pt-6 pb-4 border-b-2 border-dotted border-[#161616]/15">
            <LogoChip />
          </header>

          <div className="mx-5 mt-5 bg-[#e02a2f] px-4 py-6 text-center text-white">
            <h1 className={`${ANTON} text-[30px] leading-none tracking-[.01em]`}>Informasi Dokumen</h1>
            <p className="mt-2 text-[15px] italic">Document Information</p>
          </div>

          {data.penanda.some((p) => p.status === 'rejected') ? (
            <p className={`${MONO} mx-5 mt-3 rounded-[6px] bg-[#c21f24]/10 px-3 py-2 text-center text-[12px] font-bold text-[#c21f24]`}>
              ✕ Pengajuan ini ditolak, surat tidak berlaku
            </p>
          ) : (
            <p className={`${MONO} mx-5 mt-3 rounded-[6px] bg-[#15803d]/10 px-3 py-2 text-center text-[12px] font-bold text-[#15803d]`}>
              ✓ Dokumen asli, tercatat di SISKO LevelUP
            </p>
          )}

          <div className="px-5 pt-5 grid grid-cols-2 gap-x-4 gap-y-5">
            <Field id="Nomor Dokumen" en="Document number">
              <span className={MONO}>{data.idDokumen}</span>
            </Field>
            <Field id="Tanggal buat" en="Created date">
              {data.diajukan ?? '-'}
            </Field>
          </div>

          <div className="px-5 pt-5">
            <Field id="Surat" en="Document">
              <span className="font-bold">{data.judul}</span>
            </Field>
          </div>

          <div className="px-5 pt-5">
            <Label id="Isi dokumen" en="Contents" />
            <dl className={`mt-1 ${ROWS}`}>
              {data.isi.map((r) => (
                <div key={r.label} className="py-2">
                  <dt className={`${LABEL} text-[10px] font-bold text-[#57534e]`}>{r.label}</dt>
                  <dd className="mt-0.5 text-[15px] font-semibold break-words">{r.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="px-5 pt-4 pb-6">
            <Field id="Dibuat oleh" en="Produced by">
              {data.dibuatOleh}
            </Field>
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-4 bg-[#161616]/[.08] px-5 py-3">
            <Label id="Rincian" en="Details" />
            <div className="w-[128px]">
              <Label id="Status" en="Status" />
            </div>
          </div>

          <ul className={ROWS}>
            {data.penanda.map((p) => {
              const st = STATUS[p.status]
              return (
                <li key={p.key} className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      aria-hidden
                      className={`${MONO} flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#161616] text-[13px] font-bold text-[#ffd83d]`}
                    >
                      {initials(p.nama)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[15px] font-bold leading-tight break-words">{p.nama}</p>
                      <p className="mt-0.5 text-[13px] text-[#44403c] break-words">{p.peran}</p>
                      {p.at ? <p className={`${MONO} mt-0.5 text-[11px] text-[#57534e]`}>{p.at}</p> : null}
                    </div>
                  </div>
                  <p className={`w-[128px] text-center text-[14px] font-bold leading-tight ${st.cls}`}>
                    {st.id}
                    <span className="block text-[12px] font-normal italic">{st.en}</span>
                  </p>
                </li>
              )
            })}
          </ul>
        </article>

        <p className={`${MONO} mt-4 px-2 text-center text-[11px] leading-relaxed text-[#57534e]`}>
          Halaman ini dibuka dari QR tanda tangan Surat Permohonan Pengajuan Support Dana. Cocokkan isi dokumen di
          atas dengan surat yang Anda terima.
        </p>
      </div>
    </PaperMain>
  )
}

export function SuratVerifikasiTidakAda() {
  return (
    <PaperMain standalone>
      <header className="px-5 pt-5">
        <LogoChip />
      </header>
      <div className="px-5 pt-8 space-y-4">
        <h1 className={`${ANTON} text-[34px] leading-[1.05]`}>Dokumen tidak ditemukan</h1>
        <p className="text-[17px] leading-snug text-[#44403c]">
          QR ini tidak cocok dengan dokumen di SISKO LevelUP, atau pengajuannya sudah diubah sehingga surat lama tidak
          berlaku lagi. Minta surat terbaru ke pengaju LevelUP Kota.
        </p>
      </div>
    </PaperMain>
  )
}
