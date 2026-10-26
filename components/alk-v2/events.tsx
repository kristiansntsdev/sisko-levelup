'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { EventDashboard } from '@/lib/actions/event'
import {
  ALK_BASE,
  ALK_EVENT_BASE,
  CARD,
  DateBlock,
  Empty,
  H3,
  PageHero,
  Pill,
  StatTriple,
  type PillTone,
} from './ui'

function eventStatus(e: EventDashboard): { label: string; tone: PillTone; bucket: 'open' | 'done' } {
  const end = e.tglMs
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  if (e.approvenasional === '0' && e.notenasional) return { label: 'Ditolak', tone: 'red', bucket: 'open' }
  if (e.approvenasional !== '1') return { label: 'Review', tone: 'amber', bucket: 'open' }
  if (end && end + dayMs < now) return { label: 'Selesai', tone: 'slate', bucket: 'done' }
  if (end && end <= now && end + dayMs >= now) return { label: 'Berlangsung', tone: 'green', bucket: 'open' }
  return { label: 'Terjadwal', tone: 'sky', bucket: 'open' }
}

function monDay(tglMs: number): { d: string; m: string } {
  if (!tglMs) return { d: '—', m: '—' }
  const d = new Date(tglMs)
  return {
    d: String(d.getUTCDate()).padStart(2, '0'),
    m: d.toLocaleDateString('id-ID', { month: 'short', timeZone: 'UTC' }).toUpperCase().slice(0, 3),
  }
}

function EventItem({ e }: { e: EventDashboard }) {
  const st = eventStatus(e)
  const { d, m } = monDay(e.tglMs)
  return (
    <Link
      href={`${ALK_EVENT_BASE}/${e.id_event}`}
      className={`w-full ${CARD} p-3.5 flex items-center gap-3.5 text-left active:scale-[.99] transition`}
    >
      <DateBlock d={d} m={m} tone={st.bucket === 'done' ? 'slate' : st.label === 'Berlangsung' ? 'solid' : 'red'} />
      <div className="min-w-0 flex-1">
        <p className="font-bold text-[14px] text-[#3b1417] truncate">{e.nama_event}</p>
        <p className="text-[12px] text-slate-500 truncate mt-0.5">
          {e.jamevent} · {e.alamatevent || e.jenisevent}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <Pill tone={st.tone}>{st.label}</Pill>
          {e.jenisevent && <Pill tone="gold">{e.jenisevent}</Pill>}
        </div>
      </div>
    </Link>
  )
}

export function EventsListClient({
  events,
  isNasional,
}: {
  events: EventDashboard[]
  isNasional: boolean
}) {
  const router = useRouter()
  const open = events.filter((e) => eventStatus(e).bucket === 'open').sort((a, b) => a.tglMs - b.tglMs)
  const done = events.filter((e) => eventStatus(e).bucket === 'done').sort((a, b) => b.tglMs - a.tglMs)
  const terjadwal = events.filter((e) => {
    const s = eventStatus(e)
    return s.label === 'Terjadwal' || s.label === 'Berlangsung'
  }).length
  const review = events.filter((e) => eventStatus(e).label === 'Review' || eventStatus(e).label === 'Ditolak').length

  return (
    <section>
      <PageHero
        title="Pengajuan Event"
        sub={isNasional ? 'Semua kota · jadwal & absensi' : 'Jadwal, absensi & sesi kegiatan'}
        action={{ label: 'Buat Event', onClick: () => router.push(`${ALK_EVENT_BASE}/new`) }}
        pb="pb-20"
      />
      <div className="px-5 -mt-12 relative pb-4">
        <StatTriple
          items={[
            [terjadwal, 'Terjadwal', 'text-[#c9232c]'],
            [review, 'Belum approve', 'text-amber-500'],
            [done.length, 'Selesai', 'text-slate-400'],
          ]}
        />
        <h3 className={`${H3} mt-6 mb-3`}>Berlangsung &amp; Mendatang</h3>
        <div className="space-y-3">
          {open.length ? open.map((e) => <EventItem key={e.id_event} e={e} />) : <Empty>Belum ada kegiatan</Empty>}
        </div>
        {done.length > 0 && (
          <>
            <h3 className={`${H3} mt-6 mb-3`}>Selesai</h3>
            <div className="space-y-3">{done.map((e) => <EventItem key={e.id_event} e={e} />)}</div>
          </>
        )}
        {isNasional && (
          <p className="mt-4 text-[12px] text-slate-500 text-center">
            Approve event: buka detail → tombol Approve (nasional).
          </p>
        )}
        <Link href={ALK_BASE} className="sr-only">
          Beranda
        </Link>
      </div>
    </section>
  )
}
