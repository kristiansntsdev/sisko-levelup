'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ANTON, LABEL, MONO, PANEL, Poster, PRESS, ROWS, SectionHead } from '@/components/pwa/paper-ui'
import { AirBar, DropIcon, WATER } from './bar'
import { Icon, Sheet } from '@/components/pwa/ui'
import { fmtTanggal, urutKotaHaus, type KotaAir, type WwLaporan } from '@/lib/air-hidup'
import { ShareSheet, type ShareData } from './share-card'

export { fmtTanggal }

const shareDari = (l: WwLaporan): ShareData => ({ namaKota: l.namaKota, jumlah: l.jumlah, isi: l.isi, tanggal: l.tanggal, foto: l.foto })

export function NasionalCounter({ orang, kota }: { orang: number; kota: number }) {
  return (
    <div className={`relative px-4 py-4 ${PANEL}`}>
      <p className={`${LABEL} text-[10px] font-bold text-[#57534e]`}>30 hari terakhir</p>
      <p className={`${ANTON} mt-1 flex items-center gap-2 text-[30px] leading-none`}>
        <DropIcon className="w-7 h-7" />
        <span style={{ color: WATER }}>{orang}</span>
        <span className="text-[18px]">orang dari {kota} kota</span>
      </p>
      <p className={`${MONO} mt-1.5 text-[12px] text-[#44403c]`}>sudah minum Air Hidup bersama.</p>
    </div>
  )
}

function AminTombol({ l, onAmin }: { l: WwLaporan; onAmin?: (id: number) => void }) {
  return onAmin ? (
    <button
      type="button"
      aria-pressed={l.aminSaya}
      onClick={() => onAmin(l.id)}
      className={`${MONO} rounded-full px-3.5 py-1.5 text-[12px] font-bold ring-2 ring-[#161616] ${PRESS} ${l.aminSaya ? 'bg-[#161616] text-[#ffd83d]' : 'bg-[#fffdf7]'}`}
    >
      Amin · {l.amin}
    </button>
  ) : (
    <span className={`${MONO} text-[12px] font-bold`}>Amin · {l.amin}</span>
  )
}

export function LaporanCard({ l, onAmin, compact, editHref }: { l: WwLaporan; onAmin?: (id: number) => void; compact?: boolean; editHref?: string }) {
  const [detail, setDetail] = useState(false)
  const [share, setShare] = useState(false)
  // Kartu tetap pendek (3 baris); ketuk foto / teks = sheet detail berisi cerita lengkap.
  const teksRef = useRef<HTMLSpanElement>(null)
  const [terpotong, setTerpotong] = useState(false)
  useEffect(() => {
    const el = teksRef.current
    if (!el) return
    // ResizeObserver langsung memanggil sekali saat observe, lalu tiap lebar kartu berubah.
    const ro = new ResizeObserver(() => setTerpotong(el.scrollHeight > el.clientHeight + 1))
    ro.observe(el)
    return () => ro.disconnect()
  }, [l.isi])
  return (
    <article className={`flex flex-col overflow-hidden ${PANEL} ${compact ? 'h-full' : ''}`}>
      <button type="button" onClick={() => setDetail(true)} aria-label={`Buka laporan WW ${l.namaKota}`} className="block w-full">
        {l.foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={l.foto}
            alt=""
            // Kompak (Beranda): 4:3 dengan titik fokus pilihan PIC. Penuh (Aliran, dashboard PIC): tinggi alami.
            className={compact ? 'block aspect-[4/3] w-full bg-[#e02a2f] object-cover' : 'block h-auto max-h-[30rem] w-full bg-[#e02a2f] object-cover'}
            style={compact ? { objectPosition: `${l.fotoX}% ${l.fotoY}%` } : undefined}
          />
        ) : (
          <Poster src="" className={compact ? 'aspect-[4/3] w-full' : 'h-40 w-full'} />
        )}
      </button>
      <div className="flex flex-1 flex-col px-4 py-3.5">
        <p className={`${LABEL} text-[9.5px] text-[#57534e]`}>
          {fmtTanggal(l.tanggal)} · {l.jumlah} orang
        </p>
        <p className={`${ANTON} mt-1 text-[21px] leading-tight tracking-[.01em]`}>{l.namaKota}</p>
        <button type="button" onClick={() => setDetail(true)} className="mt-2 block w-full text-left">
          <span ref={teksRef} className={`${MONO} line-clamp-3 whitespace-pre-line break-words text-[13px] leading-relaxed`}>
            “{l.isi}”
          </span>
          {terpotong && (
            <span className={`${LABEL} mt-1.5 inline-block text-[10px] font-bold underline decoration-dotted underline-offset-4`}>Baca selengkapnya</span>
          )}
        </button>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className={`${LABEL} min-w-0 truncate text-[9.5px] text-[#57534e]`}>oleh {l.oleh}</span>
          <div className="flex shrink-0 items-center gap-2">
            {editHref && (
              <Link href={editHref} className={`${MONO} rounded-full px-3 py-1.5 text-[12px] font-bold ring-2 ring-[#161616]/40 ${PRESS}`}>
                Edit
              </Link>
            )}
            <button
              type="button"
              aria-label={`Bagikan kartu ${l.namaKota}`}
              onClick={() => setShare(true)}
              className={`flex h-[34px] w-[34px] items-center justify-center rounded-full ring-2 ring-[#161616] bg-[#fffdf7] ${PRESS}`}
            >
              <Icon name="share" className="h-4 w-4" />
            </button>
            <AminTombol l={l} onAmin={onAmin} />
          </div>
        </div>
      </div>
      <Sheet open={detail} onClose={() => setDetail(false)}>
        <p className={`${LABEL} text-[9.5px] text-[#57534e]`}>
          {fmtTanggal(l.tanggal)} · {l.jumlah} orang
        </p>
        <p className={`${ANTON} mt-1 text-[26px] leading-tight tracking-[.01em]`}>{l.namaKota}</p>
        {l.foto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={l.foto} alt="" className="mt-3 block h-auto max-h-[22rem] w-full rounded-[10px] bg-[#e02a2f] object-cover" />
        )}
        <p className={`${MONO} mt-3 whitespace-pre-line break-words text-[14px] leading-relaxed`}>“{l.isi}”</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <span className={`${LABEL} min-w-0 truncate text-[9.5px] text-[#57534e]`}>oleh {l.oleh}</span>
          <AminTombol l={l} onAmin={onAmin} />
        </div>
        <button
          type="button"
          onClick={() => {
            setDetail(false)
            setShare(true)
          }}
          className={`${MONO} mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#161616] py-2.5 text-[13px] font-bold text-[#ffd83d] ${PRESS}`}
        >
          <Icon name="share" className="h-4 w-4" />
          Bagikan Kartu
        </button>
        <button type="button" onClick={() => setDetail(false)} className={`${MONO} mt-2.5 w-full rounded-full py-2.5 text-[13px] font-bold ring-2 ring-[#161616] ${PRESS}`}>
          Tutup
        </button>
      </Sheet>
      {share && <ShareSheet data={shareDari(l)} onClose={() => setShare(false)} />}
    </article>
  )
}

/** Aliran Air Hidup: penghitung nasional, bar tiap kota (terhaus dulu), lalu laporan terbaru. */
export function AirFeed({
  nasional,
  kota,
  laporan,
  onAmin,
}: {
  nasional: { orang: number; kota: number }
  /** bar air tiap kota; hanya LevelUP Pusat (userlevel 5), kosong untuk anggota lain */
  kota?: KotaAir[]
  laporan: WwLaporan[]
  onAmin: (id: number) => void
}) {
  return (
    <div className="flex flex-col gap-7">
      <NasionalCounter {...nasional} />
      {kota && (
      <section>
        <SectionHead title="Air Tiap Kota" count={kota.length} />
        <div className={`px-4 ${PANEL}`}>
          <ul className={ROWS}>
            {urutKotaHaus(kota).map((k) => (
              <li key={k.idCabang} className="py-3.5">
                <AirBar kota={k} />
              </li>
            ))}
          </ul>
        </div>
      </section>
      )}
      <KabarTerbaru laporan={laporan} onAmin={onAmin} />
    </div>
  )
}

/** Kabar Terbaru: laporan WW tiap kota + tombol Amin. Tampil di Beranda semua anggota (apa pun level) dan di aliran. */
export function KabarTerbaru({ laporan, onAmin, action, carousel }: { laporan: WwLaporan[]; onAmin: (id: number) => void; action?: { href: string; label: string }; carousel?: boolean }) {
  return (
    <section>
      <SectionHead title="Kabar Terbaru" action={action} />
      {laporan.length === 0 ? (
        <p className={`${LABEL} rounded-[14px] border-2 border-dotted border-[#161616]/30 py-7 px-4 text-center text-[11px] text-[#57534e]`}>Belum ada laporan</p>
      ) : carousel ? (
        // Beranda: geser ke samping; kartu berikutnya mengintip. -mx-5/px-5 = tembus ke tepi layar (kontainer halaman px-5).
        <div className="-mx-5 flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto px-5 pb-5 pt-1 -mb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {laporan.map((l) => (
            <div key={l.id} className={`shrink-0 snap-center first:snap-start ${laporan.length === 1 ? 'w-full' : 'w-[82%]'}`}>
              <LaporanCard l={l} onAmin={onAmin} compact />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {laporan.map((l) => (
            <LaporanCard key={l.id} l={l} onAmin={onAmin} />
          ))}
        </div>
      )}
    </section>
  )
}
