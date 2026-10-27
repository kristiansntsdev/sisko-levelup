'use client'

import { Fragment, useMemo, useState, useTransition, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ajukanEvent, type EventDetailFull } from '@/lib/actions/event'
import type { ReimburseData } from '@/lib/actions/reimburse'
import { isEventFullyApproved } from '@/lib/event-approval'
import { NASIONAL_KHUSUS_VALUE } from '@/lib/event-cabang'
import { hadirPenuh, parseLocalDate, sesiWajibIds } from '@/lib/event-sesi'
import { FlyerQaSummary } from '@/components/kota/flyer-qa-summary'
import { BeritaAcaraQaSummary } from '@/components/kota/berita-acara-qa-summary'
import {
  ALK_BASE,
  ALK_EVENT_BASE,
  BTN_RED,
  CARD,
  DateBlock,
  fCard,
  Hero,
  Icon,
  Note,
  Pill,
  TopBar,
  type PillTone,
} from './ui'

const PAGE_SIZE = 10
const SCAN_HREF = `${ALK_BASE}/scan`

const TARGET_LABELS: Record<string, string> = {
  '0': 'Umum',
  '1': 'Volunteer',
  '2': 'Squad',
  '3': 'Core',
  '4': 'PIC',
  '5': 'LevelUP Pusat',
}
const TARGET_PENGURUS_LABELS: Record<string, string> = {
  '1': 'Admin LK',
  '2': 'BRIM',
}
const WWTYPE_LABEL: Record<string, string> = {
  bulanan: 'Bulanan',
  jfe: 'JFE',
  nasional: 'Nasional',
}
const USERLEVEL_LABEL: Record<string, string> = {
  '0': 'tamu',
  '1': 'volunteer',
  '2': 'squad',
  '3': 'core',
  '4': 'pic',
  '5': 'levelup pusat',
}

type Lifecycle = 'draft' | 'review' | 'rejected' | 'approved' | 'live' | 'done'

const EV_STATUS: Record<Lifecycle, [string, PillTone]> = {
  draft: ['Belum diajukan', 'slate'],
  review: ['Direview pusat', 'amber'],
  rejected: ['Ditolak', 'red'],
  approved: ['Disetujui', 'green'],
  live: ['Berlangsung', 'red'],
  done: ['Selesai', 'slate'],
}

const STEPS = ['Draft', 'Diajukan', 'Disetujui', 'Absensi', 'Selesai']
const STEP_AT: Record<Lifecycle, number> = {
  draft: 0,
  review: 1,
  rejected: 1,
  approved: 2,
  live: 3,
  done: 5,
}

function fmtRp(s: string) {
  const n = parseInt(s.replace(/\D/g, ''), 10)
  if (isNaN(n)) return s || '—'
  return `Rp ${n.toLocaleString('id-ID')}`
}

function fmtTs(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function parseTargetLabels(stored: string, labelsMap: Record<string, string>): string {
  const labels = stored
    .split(',')
    .filter(Boolean)
    .map((v) => labelsMap[v.trim()])
    .filter(Boolean)
  return labels.length ? labels.join(', ') : '—'
}

function monDay(raw: string): { d: string; m: string } {
  if (!raw) return { d: '—', m: '—' }
  const d = parseLocalDate(raw)
  return {
    d: String(d.getUTCDate()).padStart(2, '0'),
    m: d
      .toLocaleDateString('id-ID', { month: 'short', timeZone: 'UTC' })
      .replace('.', '')
      .toUpperCase()
      .slice(0, 3),
  }
}

function lifecycleOf(event: EventDetailFull): Lifecycle {
  const rejected = event.approvenasional !== '1' && event.notenasional.trim() !== ''
  if (rejected) return 'rejected'

  const fully = isEventFullyApproved(event)
  const dayMs = 24 * 60 * 60 * 1000
  const startMs = event.tglRaw ? parseLocalDate(event.tglRaw).getTime() : 0
  const endMs = event.tglSelesaiRaw
    ? parseLocalDate(event.tglSelesaiRaw).getTime()
    : startMs
  const now = Date.now()

  if (fully) {
    if (endMs && endMs + dayMs < now) return 'done'
    if (startMs && startMs <= now) return 'live'
    return 'approved'
  }

  const diajukan = Boolean(event.flyerQa?.diajukan || event.beritaAcaraQa?.diajukan)
  if (diajukan) return 'review'
  return 'draft'
}

function ListCard({ title, pill, children }: { title: string; pill: string; children: ReactNode }) {
  return (
    <div className={`${CARD} overflow-hidden`}>
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2">
        <p className="text-[14px] font-bold text-[#3b1417]">{title}</p>
        <span className="text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full ring-1 ring-slate-200">
          {pill}
        </span>
      </div>
      {children}
    </div>
  )
}

function ListPager({
  page,
  total,
  onPage,
}: {
  page: number
  total: number
  onPage: (p: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100">
      <button
        type="button"
        onClick={() => onPage(page - 1)}
        disabled={page === 0}
        className="text-[13px] px-3 py-1 rounded-lg ring-1 ring-slate-200 disabled:opacity-40"
      >
        ← Prev
      </button>
      <span className="text-[12px] text-slate-500">
        {page + 1} / {pages}
      </span>
      <button
        type="button"
        onClick={() => onPage(page + 1)}
        disabled={page >= pages - 1}
        className="text-[13px] px-3 py-1 rounded-lg ring-1 ring-slate-200 disabled:opacity-40"
      >
        Next →
      </button>
    </div>
  )
}

function Stepper({ status }: { status: Lifecycle }) {
  const at = STEP_AT[status]
  const rejected = status === 'rejected'
  return (
    <div className="flex items-start">
      {STEPS.map((s, i) => {
        const done = i < at
        const cur = i === at
        return (
          <Fragment key={s}>
            <div className="flex flex-col items-center w-12 shrink-0">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold ${
                  done
                    ? 'bg-[#c3a54d] text-white'
                    : cur
                      ? rejected
                        ? 'bg-rose-500 text-white ring-4 ring-rose-100'
                        : 'bg-[#c9232c] text-white ring-4 ring-[#fbeceb]'
                      : 'bg-slate-100 text-slate-400'
                }`}
              >
                {done ? (
                  <Icon name="check" className="w-4 h-4" sw={3} />
                ) : cur && rejected ? (
                  <Icon name="x" className="w-4 h-4" sw={3} />
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={`text-[10.5px] mt-1.5 font-semibold ${
                  done
                    ? 'text-[#96792a]'
                    : cur
                      ? rejected
                        ? 'text-rose-600'
                        : 'text-[#c9232c]'
                      : 'text-slate-400'
                }`}
              >
                {cur && rejected ? 'Ditolak' : s}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span className={`flex-1 h-0.5 mt-3.5 ${done ? 'bg-[#c3a54d]' : 'bg-slate-200'}`} />
            )}
          </Fragment>
        )
      })}
    </div>
  )
}

function DanaRow({
  eventId,
  reimburse,
  eventBasePath,
}: {
  eventId: number
  reimburse?: ReimburseData | null
  eventBasePath: string
}) {
  const status =
    reimburse?.approvenasional === '1'
      ? ({ label: 'Disetujui', tone: 'green' } as const)
      : reimburse?.approvenasional === '0'
        ? ({ label: 'Ditolak', tone: 'red' } as const)
        : reimburse
          ? ({ label: 'Menunggu', tone: 'amber' } as const)
          : null

  return (
    <Link
      href={`${eventBasePath}/${eventId}/dana`}
      className={`w-full ${CARD} px-4 py-3.5 flex items-center justify-between gap-3 active:scale-[.99] transition`}
    >
      <span className="text-[13.5px] font-semibold text-slate-800">Pengajuan Support Dana</span>
      {status ? (
        <Pill tone={status.tone}>{status.label}</Pill>
      ) : (
        <span className="text-[12.5px] font-semibold text-[#c9232c]">Ajukan →</span>
      )}
    </Link>
  )
}

function AjukanButton({ eventId, already }: { eventId: number; already: boolean }) {
  const router = useRouter()
  const [diajukan, setDiajukan] = useState(already)
  const [msg, setMsg] = useState('')
  const [pending, startTransition] = useTransition()

  if (diajukan) {
    return <p className="text-[13px] font-semibold text-emerald-700 text-center py-1">Sudah diajukan</p>
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setMsg('')
          startTransition(async () => {
            const res = await ajukanEvent(eventId)
            if (!res.ok) {
              setMsg(res.error)
              return
            }
            setDiajukan(true)
            router.refresh()
          })
        }}
        className={`w-full py-3.5 ${BTN_RED} disabled:opacity-60`}
      >
        {pending ? 'Mengajukan...' : 'Ajukan'}
      </button>
      {msg && <p className="text-[12px] text-rose-600">{msg}</p>}
    </div>
  )
}

export function EventDetailV2Client({
  event,
  reimburse,
  backUrl = `${ALK_BASE}/event`,
  eventBasePath = ALK_EVENT_BASE,
}: {
  event: EventDetailFull
  reimburse?: ReimburseData | null
  backUrl?: string
  eventBasePath?: string
}) {
  const router = useRouter()
  const [regPage, setRegPage] = useState(0)
  const [absenPage, setAbsenPage] = useState(0)
  const [sesiFilter, setSesiFilter] = useState<number | 'all'>('all')

  const status = lifecycleOf(event)
  const { d, m } = monDay(event.tglRaw)
  const sameDates = event.tglDisplay === event.tglSelesaiDisplay
  const hasSesi = event.sesi.length > 0
  const totalReg = event.registrasi.length
  const attendees = event.absen.length
  const editHref = `${eventBasePath}/${event.id_event}/edit`
  const showQa = Boolean(event.flyerQa || event.beritaAcaraQa)
  const alreadyDiajukan = Boolean(event.flyerQa?.diajukan || event.beritaAcaraQa?.diajukan)
  const showPeserta =
    status === 'approved' ||
    status === 'live' ||
    status === 'done' ||
    totalReg > 0 ||
    attendees > 0

  const mapSrc = (() => {
    if (event.jenisevent === 'Online' || !event.longlatevent) return ''
    const parts = event.longlatevent.split(',').map(Number)
    if (parts.length < 2 || parts.some(isNaN)) return ''
    return `https://maps.google.com/maps?q=${parts[0]},${parts[1]}&z=15&output=embed`
  })()

  const filteredAbsen = useMemo(() => {
    if (!hasSesi || sesiFilter === 'all') return event.absen
    return event.absen.filter((a) => a.id_sesi === sesiFilter)
  }, [event.absen, hasSesi, sesiFilter])

  const sesiCounts = useMemo(() => {
    const map = new Map<number, number>()
    for (const a of event.absen) {
      if (a.id_sesi == null) continue
      map.set(a.id_sesi, (map.get(a.id_sesi) ?? 0) + 1)
    }
    return map
  }, [event.absen])

  const hadirLengkapCount = useMemo(() => {
    if (!hasSesi) return 0
    const wajib = sesiWajibIds(event.sesi)
    const byPeserta = new Map<number, number[]>()
    for (const a of event.absen) {
      if (a.id_peserta == null || a.id_sesi == null) continue
      const list = byPeserta.get(a.id_peserta) ?? []
      list.push(a.id_sesi)
      byPeserta.set(a.id_peserta, list)
    }
    let n = 0
    for (const r of event.registrasi) {
      if (hadirPenuh(byPeserta.get(r.id_peserta) ?? [], wajib)) n++
    }
    return n
  }, [event.absen, event.registrasi, event.sesi, hasSesi])

  const ww =
    WWTYPE_LABEL[event.wwtype] ?? event.wwtype
  const scope =
    event.khusus === NASIONAL_KHUSUS_VALUE || event.khusus === '1'
      ? 'Event Khusus'
      : event.wwtype === 'nasional'
        ? 'Event Seluruh Kota'
        : ''

  const info: [string, string][] = [
    ['Jenis Event', event.jenisevent || '—'],
    ['Tipe', scope ? `${ww} · ${scope}` : ww || '—'],
    ['Alamat', event.alamatevent || '—'],
    [
      'Tanggal',
      sameDates ? event.tglDisplay : `${event.tglDisplay} – ${event.tglSelesaiDisplay}`,
    ],
    ['Jam', `${event.jamevent || '—'} – ${event.jamselesaievent || '—'}`],
    ['Dana', fmtRp(event.danaevent)],
    ['Target Peserta', parseTargetLabels(event.target, TARGET_LABELS)],
    ['Target Pengurus', parseTargetLabels(event.targetpengurus, TARGET_PENGURUS_LABELS)],
    ['Target Jumlah', `${event.targetjumlah} orang`],
    ['Total Registrasi', `${totalReg} orang`],
    ...(event.suratpemberitahuan
      ? ([['Surat', event.suratpemberitahuan]] as [string, string][])
      : []),
    ...(event.linkevent && event.linkevent !== '0'
      ? ([['Link', event.linkevent]] as [string, string][])
      : []),
  ]

  function setFilter(next: number | 'all') {
    setSesiFilter(next)
    setAbsenPage(0)
  }

  return (
    <section className="min-h-screen pb-24">
      <Hero className="pt-4 md:pt-2 pb-16" decor="-right-6 top-16 w-40">
        <div className="flex items-center gap-1">
          <div className="flex-1 min-w-0">
            <TopBar title="Detail Event" back={() => router.push(backUrl)} />
          </div>
          <Link
            href={editHref}
            className="shrink-0 text-[13px] font-semibold text-white/90 px-2 py-1.5 rounded-lg active:bg-white/10"
          >
            Edit
          </Link>
        </div>
        <div className="mt-3 flex items-center gap-3.5">
          <DateBlock d={d} m={m} tone="glass" />
          <div className="min-w-0">
            <p className="font-extrabold text-[20px] leading-tight">{event.nama_event}</p>
            <p className="text-[13px] text-white/80 mt-0.5">
              {event.tglDisplay}
              {!sameDates ? ` – ${event.tglSelesaiDisplay}` : ''}
              {event.jamevent
                ? ` · ${event.jamevent}${event.jamselesaievent ? `–${event.jamselesaievent}` : ''} WIB`
                : ''}
            </p>
          </div>
        </div>
      </Hero>

      <div className="px-5 -mt-10 relative space-y-4">
        <div className="bg-white rounded-3xl shadow-[0_18px_40px_-14px_rgba(80,20,25,.3)] p-5">
          <Stepper status={status} />

          {(status === 'live' || status === 'done') && (
            <div className="flex items-end justify-between mt-5">
              <div>
                <p
                  className={`${fCard} font-bold text-[48px] leading-none ${
                    status === 'live' ? 'text-[#c9232c]' : 'text-[#3b1417]'
                  }`}
                >
                  {hasSesi ? hadirLengkapCount || attendees : attendees}
                </p>
                <p className="text-[12px] text-slate-500 mt-1">
                  anggota hadir
                  {hasSesi ? ` · ${hadirLengkapCount} hadir lengkap` : ''}
                </p>
              </div>
              {status === 'live' ? (
                <p className="flex items-center gap-1.5 text-[12px] font-bold text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Absensi dibuka
                </p>
              ) : (
                <p className="text-[12px] font-bold text-slate-400">Kegiatan selesai</p>
              )}
            </div>
          )}

          <div className="mt-4 space-y-2">
            {status === 'live' && (
              <Link
                href={SCAN_HREF}
                className="w-full py-3 rounded-xl bg-[#c9232c] text-white font-bold text-[14px] flex items-center justify-center gap-2 shadow-[0_8px_20px_-6px_rgba(201,35,44,.6)]"
              >
                <Icon name="qr" className="w-5 h-5" />
                Mulai Absensi
              </Link>
            )}
            {status === 'approved' && (
              <>
                <Note tone="sky">
                  Disetujui pusat (ALK + Brim Nasional). Peserta sudah bisa ambil tiket; scan
                  absensi dibuka saat acara.
                </Note>
                <Link
                  href={SCAN_HREF}
                  className="w-full py-3 rounded-xl bg-[#f8f0dd] text-[#96792a] ring-1 ring-[#ecdcb3] font-bold text-[14px] flex items-center justify-center gap-2"
                >
                  <Icon name="qr" className="w-5 h-5" />
                  Buka Scanner
                </Link>
              </>
            )}
            {status === 'review' && (
              <Note>
                Sedang direview <b>Pusat</b> (QA flyer / berita acara). Kamu akan menerima
                notifikasi setelah diputuskan.
              </Note>
            )}
            {status === 'rejected' && (
              <>
                <Note tone="rose">
                  <b>Alasan penolakan:</b> {event.notenasional.trim() || '—'}
                </Note>
                <Link
                  href={editHref}
                  className={`w-full py-3.5 ${BTN_RED} flex items-center justify-center`}
                >
                  Ubah &amp; Ajukan Ulang
                </Link>
              </>
            )}
            {status === 'draft' && (
              <>
                <Note>
                  Belum diajukan — lengkapi flyer atau link surat pemberitahuan, lalu ajukan.
                </Note>
                {showQa && (
                  <AjukanButton eventId={event.id_event} already={alreadyDiajukan} />
                )}
              </>
            )}
          </div>
        </div>

        {event.posterUrl ? (
          <div className="rounded-2xl overflow-hidden ring-1 ring-slate-100 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.posterUrl}
              alt={`Poster ${event.nama_event}`}
              className="w-full object-cover"
            />
          </div>
        ) : null}

        {showQa && (
          <div className="space-y-3">
            <FlyerQaSummary
              eventId={event.id_event}
              initial={event.flyerQa}
              editHref={editHref}
            />
            <BeritaAcaraQaSummary
              eventId={event.id_event}
              initial={event.beritaAcaraQa}
            />
          </div>
        )}

        <ListCard title="Detail Event" pill={EV_STATUS[status][0]}>
          {info.map(([k, v], i) => (
            <div
              key={k}
              className={`flex gap-3 px-4 py-2.5 ${i ? 'border-t border-slate-100' : ''}`}
            >
              <p className="text-[12px] text-slate-400 w-28 shrink-0 pt-0.5">{k}</p>
              <p className="text-[13px] text-slate-800 flex-1 break-words">{v}</p>
            </div>
          ))}
        </ListCard>

        <DanaRow
          eventId={event.id_event}
          reimburse={reimburse}
          eventBasePath={eventBasePath}
        />

        {mapSrc && (
          <div className={`${CARD} overflow-hidden`}>
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-[14px] font-bold text-[#3b1417]">Lokasi Event</p>
            </div>
            <iframe
              src={mapSrc}
              width="100%"
              height="240"
              style={{ border: 0, display: 'block' }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Lokasi Event"
            />
          </div>
        )}

        {showPeserta && (
          <>
            <ListCard title="Konfirmasi Kehadiran" pill={`Total ${totalReg} registrasi`}>
              {totalReg === 0 ? (
                <p className="px-4 py-8 text-center text-[13px] text-slate-400">
                  Belum ada peserta.
                </p>
              ) : (
                <>
                  <div className="divide-y divide-slate-100">
                    {event.registrasi
                      .slice(regPage * PAGE_SIZE, (regPage + 1) * PAGE_SIZE)
                      .map((r, i) => (
                        <div
                          key={r.id_registrasi}
                          className="flex items-center gap-3 px-4 py-2.5"
                        >
                          <span className="text-[12px] text-slate-400 w-5 text-right shrink-0">
                            {regPage * PAGE_SIZE + i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13.5px] font-semibold text-slate-800 truncate">
                              {r.nama}
                              {r.kota ? (
                                <span className="font-normal text-slate-400"> – {r.kota}</span>
                              ) : null}
                            </p>
                            <p className="text-[11.5px] text-slate-400 truncate">{r.email}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                  <ListPager page={regPage} total={totalReg} onPage={setRegPage} />
                </>
              )}
            </ListCard>

            <ListCard
              title="Presensi (Scan QR)"
              pill={hasSesi ? `${filteredAbsen.length} scan` : `${filteredAbsen.length} hadir`}
            >
              {hasSesi && (
                <div className="px-4 py-3 border-b border-slate-100 space-y-2.5">
                  <div className="space-y-1.5">
                    {event.sesi.map((s) => (
                      <div
                        key={s.id_sesi}
                        className="flex items-center justify-between gap-2 text-[12.5px]"
                      >
                        <span className="text-slate-800 truncate">
                          {s.nama}
                          <span className="text-slate-400">
                            {' '}
                            · {s.wajib ? 'wajib' : 'opsional'}
                          </span>
                        </span>
                        <span className="text-slate-500 shrink-0">
                          {sesiCounts.get(s.id_sesi) ?? 0} hadir
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[12.5px] font-semibold text-slate-800">
                    Hadir lengkap:{' '}
                    <span className="text-[#c9232c]">
                      {hadirLengkapCount} / {totalReg}
                    </span>
                    <span className="font-normal text-slate-400"> (semua sesi wajib)</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFilter('all')}
                      className={`text-[11.5px] px-2.5 py-1 rounded-full ring-1 transition ${
                        sesiFilter === 'all'
                          ? 'ring-[#c9232c] bg-[#fbeceb] text-[#c9232c] font-semibold'
                          : 'ring-slate-200 text-slate-500'
                      }`}
                    >
                      Semua
                    </button>
                    {event.sesi.map((s) => (
                      <button
                        key={s.id_sesi}
                        type="button"
                        onClick={() => setFilter(s.id_sesi)}
                        className={`text-[11.5px] px-2.5 py-1 rounded-full ring-1 transition max-w-[150px] truncate ${
                          sesiFilter === s.id_sesi
                            ? 'ring-[#c9232c] bg-[#fbeceb] text-[#c9232c] font-semibold'
                            : 'ring-slate-200 text-slate-500'
                        }`}
                      >
                        {s.nama}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {filteredAbsen.length === 0 ? (
                <p className="px-4 py-8 text-center text-[13px] text-slate-400">
                  Belum ada presensi.
                </p>
              ) : (
                <>
                  <div className="divide-y divide-slate-100">
                    {filteredAbsen
                      .slice(absenPage * PAGE_SIZE, (absenPage + 1) * PAGE_SIZE)
                      .map((a, i) => (
                        <div key={a.id_absen} className="flex items-center gap-3 px-4 py-2.5">
                          <span className="text-[12px] text-slate-400 w-5 text-right shrink-0">
                            {absenPage * PAGE_SIZE + i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13.5px] font-semibold text-slate-800 truncate flex items-center gap-1.5">
                              <span className="truncate">{a.nama}</span>
                              {USERLEVEL_LABEL[a.userlevel] && (
                                <span className="shrink-0 text-[10px] font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded ring-1 ring-slate-200 capitalize">
                                  {USERLEVEL_LABEL[a.userlevel]}
                                </span>
                              )}
                            </p>
                            <p className="text-[11.5px] text-slate-400 truncate">
                              {a.sesiNama ? `${a.sesiNama} · ` : ''}
                              {a.email}
                            </p>
                          </div>
                          <p className="text-[11px] text-slate-400 shrink-0 text-right leading-tight whitespace-pre-line">
                            {fmtTs(a.timestamp).replace(', ', '\n')}
                          </p>
                        </div>
                      ))}
                  </div>
                  <ListPager
                    page={absenPage}
                    total={filteredAbsen.length}
                    onPage={setAbsenPage}
                  />
                </>
              )}
            </ListCard>
          </>
        )}
      </div>
    </section>
  )
}
