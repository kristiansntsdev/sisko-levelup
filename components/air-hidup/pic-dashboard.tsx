'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ANTON, BTN, LABEL, LIFTED, MONO, PANEL, PAPER_INPUT, PRESS, ROWS, SectionHead, Strip } from '@/components/pwa/paper-ui'
import { Icon, type IconName } from '@/components/pwa/ui'
import { urutAnggotaHaus, type AirAnggota, type KotaAir, type WwLaporan } from '@/lib/air-hidup'
import { AirBar, DropIcon } from './bar'
import { LaporanCard } from './feed'

const SOON_TOOLS: { i: IconName; t: string }[] = [
  { i: 'users', t: 'Anggota' },
  { i: 'calendar', t: 'Event' },
  { i: 'chat', t: 'Kesaksian' },
]

const ANGGOTA_AWAL = 8

/** Air tiap anggota kota, terhaus dulu. Banyak anggota: hanya yang paling haus dulu + cari nama. */
function AirAnggotaKota({ anggota }: { anggota: AirAnggota[] }) {
  const [cari, setCari] = useState('')
  const [semua, setSemua] = useState(false)
  const urut = urutAnggotaHaus(anggota)
  const q = cari.trim().toLowerCase()
  const cocok = q ? urut.filter((a) => a.nama.toLowerCase().includes(q)) : urut
  const tampil = q || semua ? cocok : cocok.slice(0, ANGGOTA_AWAL)
  return (
    <section>
      <SectionHead title="Air Anggota Kota" count={anggota.length} />
      {anggota.length === 0 ? (
        <p className={`${LABEL} rounded-[14px] border-2 border-dotted border-[#161616]/30 px-4 py-7 text-center text-[11px] text-[#57534e]`}>Belum ada anggota di kotamu</p>
      ) : (
        <div className={`px-4 ${PANEL}`}>
          {anggota.length > ANGGOTA_AWAL && (
            <input value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari nama anggota" className={`${PAPER_INPUT} mt-4`} />
          )}
          <ul className={ROWS}>
            {tampil.map((a) => (
              <li key={a.id} className="py-3.5">
                <AirBar air={a} nama={a.nama} />
              </li>
            ))}
            {tampil.length === 0 && <li className={`${MONO} py-4 text-[12px] text-[#57534e]`}>Tidak ada yang cocok.</li>}
          </ul>
          {!q && cocok.length > ANGGOTA_AWAL && (
            <button type="button" onClick={() => setSemua((v) => !v)} className={`${MONO} w-full pb-4 text-[12px] font-bold underline decoration-dotted underline-offset-4`}>
              {semua ? 'Tampilkan yang paling haus saja' : `Lihat semua ${cocok.length} anggota`}
            </button>
          )}
        </div>
      )}
    </section>
  )
}

/** Dashboard PIC (userlevel 4). Satu-satunya alat aktif untuk sekarang: Pelaporan WW. */
export function PicDashboard({
  kota,
  anggota,
  laporanKota,
  laporHref,
  feedHref,
  onAmin,
  onSoon,
  editHref,
}: {
  kota: KotaAir
  anggota: AirAnggota[]
  laporanKota: WwLaporan[]
  laporHref: string
  feedHref: string
  onAmin: (id: number) => void
  onSoon: (t: string) => void
  /** Halaman edit laporan (PIC kota ini boleh mengubah laporan kotanya). */
  editHref: (idLaporan: number) => string
}) {
  return (
    <div className="flex flex-col gap-7">
      <section className={`px-4 py-5 ${PANEL}`}>
        <AirBar air={kota} nama={kota.namaKota} size="lg" catatan={kota.anggota ? `${kota.perluMinum} dari ${kota.anggota} anggota Haus / Kering` : 'belum ada anggota'} />
        <Link href={laporHref} className={`${BTN} mt-5`}>
          <Strip className="py-3.5 text-[21px]">
            <DropIcon className="h-5 w-5" />
            Lapor WW
          </Strip>
        </Link>
        <p className={`${MONO} mt-3 text-[11.5px] leading-relaxed text-[#57534e]`}>
          Tandai anggota yang ikut WW kotamu di laporan: airnya terisi penuh hari itu. Anggota yang absen di WW Online terisi sendiri. Tidak ada minimum peserta dan tidak perlu approval.
        </p>
      </section>

      <AirAnggotaKota anggota={anggota} />

      <section>
        <SectionHead title="Alat PIC" />
        <div className="grid grid-cols-2 gap-2.5">
          <Link href={laporHref} className={`relative flex h-[104px] flex-col items-center justify-center gap-2 rounded-[14px] bg-[#fffdf7] -rotate-1 ${LIFTED} ${PRESS}`}>
            <span className="flex h-11 w-11 -rotate-3 items-center justify-center rounded-[10px] bg-[#2f7fc1] text-white">
              <DropIcon className="h-[22px] w-[22px]" />
            </span>
            <span className={`${ANTON} text-[14.5px] leading-none tracking-[.02em]`}>Pelaporan WW</span>
          </Link>
          <Link href={feedHref} className={`relative flex h-[104px] flex-col items-center justify-center gap-2 rounded-[14px] bg-[#fffdf7] rotate-1 ${LIFTED} ${PRESS}`}>
            <span className="flex h-11 w-11 -rotate-3 items-center justify-center rounded-[10px] bg-[#161616] text-[#ffd83d]">
              <Icon name="megaphone" className="h-[22px] w-[22px]" />
            </span>
            <span className={`${ANTON} text-[14.5px] leading-none tracking-[.02em]`}>Aliran Air Hidup</span>
          </Link>
          {SOON_TOOLS.map((t) => (
            <button
              key={t.t}
              type="button"
              onClick={() => onSoon(t.t)}
              className={`relative flex h-[104px] flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dotted border-[#161616]/30 ${PRESS}`}
            >
              <span className="flex h-11 w-11 -rotate-3 items-center justify-center rounded-[10px] bg-[#161616]/[.07]">
                <Icon name={t.i} className="h-[22px] w-[22px]" />
              </span>
              <span className={`${ANTON} text-[14.5px] leading-none tracking-[.02em]`}>{t.t}</span>
              <span className={`${LABEL} absolute right-1.5 top-1.5 rotate-6 text-[8.5px] font-bold text-[#c21f24]`}>Soon</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <SectionHead title="Laporan Kota Kita" count={laporanKota.length} />
        {laporanKota.length === 0 ? (
          <p className={`${LABEL} rounded-[14px] border-2 border-dotted border-[#161616]/30 px-4 py-7 text-center text-[11px] text-[#57534e]`}>Belum ada laporan</p>
        ) : (
          <div className="space-y-4">
            {laporanKota.map((l) => (
              <LaporanCard key={l.id} l={l} onAmin={onAmin} editHref={editHref(l.id)} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
