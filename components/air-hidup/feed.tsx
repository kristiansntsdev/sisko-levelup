'use client'
import { ANTON, LABEL, MONO, PANEL, Poster, PRESS, ROWS, SectionHead } from '@/components/pwa/paper-ui'
import { AirBar, DropIcon, WATER } from './bar'
import { urutKotaHaus, type KotaAir, type WwLaporan } from '@/lib/air-hidup'

export function fmtTanggal(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

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

export function LaporanCard({ l, onAmin }: { l: WwLaporan; onAmin?: (id: number) => void }) {
  return (
    <article className={`overflow-hidden ${PANEL}`}>
      <Poster src={l.foto} className="h-40 w-full" />
      <div className="px-4 py-3.5">
        <p className={`${LABEL} text-[9.5px] text-[#57534e]`}>
          {fmtTanggal(l.tanggal)} · {l.jumlah} orang
        </p>
        <p className={`${ANTON} mt-1 text-[21px] leading-tight tracking-[.01em]`}>{l.namaKota}</p>
        <p className={`${MONO} mt-2 text-[13px] leading-relaxed`}>“{l.isi}”</p>
        {l.alirKe && (
          <p className={`${MONO} mt-2.5 flex items-start gap-1.5 text-[11.5px] font-bold`} style={{ color: WATER }}>
            <DropIcon className="mt-px h-3.5 w-3.5 shrink-0" />
            Mengalirkan Air Hidup ke {l.alirKe.namaKota}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className={`${LABEL} text-[9.5px] text-[#57534e]`}>oleh {l.oleh}</span>
          {onAmin ? (
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
          )}
        </div>
      </div>
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
  /** bar air tiap kota; hanya Core ke atas, kosong untuk anggota lain */
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
export function KabarTerbaru({ laporan, onAmin, action }: { laporan: WwLaporan[]; onAmin: (id: number) => void; action?: { href: string; label: string } }) {
  return (
    <section>
      <SectionHead title="Kabar Terbaru" action={action} />
      {laporan.length === 0 ? (
        <p className={`${LABEL} rounded-[14px] border-2 border-dotted border-[#161616]/30 py-7 px-4 text-center text-[11px] text-[#57534e]`}>Belum ada laporan</p>
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
