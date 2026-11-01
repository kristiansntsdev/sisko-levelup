'use client'

import {
  Fragment,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode'
import { ajukanEvent, type EventDetailFull } from '@/lib/actions/event'
import type { ReimburseData } from '@/lib/actions/reimburse'
import { isEventFullyApproved } from '@/lib/event-approval'
import { NASIONAL_KHUSUS_VALUE } from '@/lib/event-cabang'
import { eventEntryPath, isOnlineEvent } from '@/lib/event-link'
import { hadirPenuh, parseLocalDate, sesiWajibIds } from '@/lib/event-sesi'
import { FlyerQaSummary } from '@/components/kota/flyer-qa-summary'
import { BeritaAcaraQaSummary } from '@/components/kota/berita-acara-qa-summary'
import {
  ANTON,
  BTN,
  BTN_OUTLINE,
  BTN_SHELL,
  ERROR,
  IconButton,
  LABEL,
  LIFTED,
  MONO,
  PANEL,
  PaperMain,
  PRESS,
  StickerLabel,
  Strip,
} from '@/components/pwa/paper-ui'
import {
  ALK_BASE,
  ALK_EVENT_BASE,
  DateBlock,
  Icon,
  Note,
  Pill,
  Qr,
  Sheet,
  SheetHead,
  Toast,
  type PillTone,
} from './ui'

const PAGE_SIZE = 10

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

const PERSON_ROWS = 'divide-y-2 divide-dotted divide-[#161616]/15'
const PERSON_NO = `${MONO} text-[11px] text-[#57534e] w-5 text-right shrink-0`
const PERSON_NAME = `${ANTON} text-[15px] leading-tight tracking-[.02em]`
const PERSON_SUB = `${MONO} text-[10.5px] text-[#44403c] truncate mt-0.5`
const sesiChip = (on: boolean) =>
  `${MONO} text-[10.5px] font-bold px-2.5 py-1 rounded-full ${PRESS} ${on ? 'bg-[#161616] text-[#ffd83d]' : 'ring-1 ring-[#161616]/25 text-[#161616]'}`

function ListCard({ title, pill, tone = 'gold', children }: { title: string; pill: string; tone?: PillTone; children: ReactNode }) {
  return (
    <section aria-label={title} className={`${PANEL} overflow-hidden`}>
      <div className="px-4 py-3 border-b-2 border-dotted border-[#161616]/25 flex items-center justify-between gap-2">
        <h2 className={`${ANTON} text-[20px] leading-none tracking-[.01em]`}>{title}</h2>
        <span className="shrink-0">
          <Pill tone={tone}>{pill}</Pill>
        </span>
      </div>
      {children}
    </section>
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
  const btn = `${LABEL} text-[10.5px] font-bold px-3 py-1.5 rounded-full ring-1 ring-[#161616]/25 disabled:opacity-40 ${PRESS}`
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-t-2 border-dotted border-[#161616]/20">
      <button type="button" onClick={() => onPage(page - 1)} disabled={page === 0} className={btn}>
        ← Prev
      </button>
      <span className={`${MONO} text-[11px] font-bold text-[#44403c]`}>
        {page + 1} / {pages}
      </span>
      <button type="button" onClick={() => onPage(page + 1)} disabled={page >= pages - 1} className={btn}>
        Next →
      </button>
    </div>
  )
}

function Stepper({ status }: { status: Lifecycle }) {
  const at = STEP_AT[status]
  const rejected = status === 'rejected'
  return (
    <ol aria-label="Status event" className="flex items-start">
      {STEPS.map((s, i) => {
        const done = i < at
        const cur = i === at
        return (
          <Fragment key={s}>
            <li aria-current={cur ? 'step' : undefined} className="flex flex-col items-center w-12 shrink-0">
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center ${ANTON} text-[15px] ${
                  done
                    ? 'bg-[#ffd83d] text-[#161616]'
                    : cur
                      ? 'bg-[#e02a2f] text-white outline-2 outline-offset-2 outline-[#e02a2f]'
                      : 'border-2 border-dotted border-[#161616]/40 text-[#57534e]'
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
              <span className={`${ANTON} text-[11px] tracking-[.02em] mt-2 ${cur ? 'text-[#c21f24]' : done ? 'text-[#161616]' : 'text-[#57534e]'}`}>
                {cur && rejected ? 'Ditolak' : s}
              </span>
            </li>
            {i < STEPS.length - 1 && (
              <li aria-hidden className={`flex-1 mt-[15px] border-t-2 ${done ? 'border-[#161616]' : 'border-dotted border-[#161616]/35'}`} />
            )}
          </Fragment>
        )
      })}
    </ol>
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
    <Link href={`${eventBasePath}/${eventId}/dana`} className={`w-full px-4 py-3.5 flex items-center justify-between gap-3 ${PANEL} ${PRESS}`}>
      <span className={`${ANTON} text-[16px] tracking-[.02em]`}>Pengajuan Support Dana</span>
      {status ? (
        <Pill tone={status.tone}>{status.label}</Pill>
      ) : (
        <span className={`${LABEL} shrink-0 text-[10.5px] font-bold text-[#c21f24]`}>Ajukan →</span>
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
    return <p className={`${MONO} text-[12px] font-bold text-center py-1`}>Sudah diajukan</p>
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
        className={BTN}
      >
        <Strip>{pending ? 'Mengajukan...' : 'Ajukan'}</Strip>
      </button>
      {msg && <p role="alert" className={ERROR}>{msg}</p>}
    </div>
  )
}

function JoinQrSheet({
  open,
  onClose,
  eventId,
  nama,
  jenisevent,
}: {
  open: boolean
  onClose: () => void
  eventId: number
  nama: string
  jenisevent: string
}) {
  const [origin, setOrigin] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const online = isOnlineEvent(jenisevent)
  const joinUrl = origin ? `${origin}${eventEntryPath(eventId, jenisevent)}` : ''

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  function flash(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  async function copyLink() {
    if (!joinUrl) return
    try {
      await navigator.clipboard.writeText(joinUrl)
      flash('Link disalin')
    } catch {
      flash('Gagal menyalin')
    }
  }

  async function downloadPng() {
    if (!joinUrl) return
    try {
      const dataUrl = await QRCode.toDataURL(joinUrl, {
        width: 512,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#0f172a', light: '#ffffff' },
      })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `qr-event-${eventId}.png`
      a.click()
      flash('QR diunduh')
    } catch {
      flash('Gagal unduh QR')
    }
  }

  return (
    <>
      <Sheet open={open} onClose={onClose}>
        <SheetHead
          title="QR Join Event"
          sub={
            online
              ? 'Peserta scan → daftar + absen langsung (Online)'
              : 'Peserta scan → ambil tiket event (Offline)'
          }
        />
        <p className={`${ANTON} text-[17px] tracking-[.01em] text-[#161616] truncate mb-3`}>{nama}</p>
        {joinUrl ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-[220px] rounded-2xl bg-white p-3 ring-1 ring-[#161616]/15 shadow-sm">
              <Qr text={joinUrl} />
            </div>
            <p className={`${MONO} text-[11px] text-[#57534e] break-all text-center px-1`}>{joinUrl}</p>
            <p className={`${MONO} text-[11.5px] text-[#44403c] text-center`}>
              Unduh PNG buat ditempel di flyer, atau salin link.
            </p>
            <div className="grid grid-cols-2 gap-2.5 w-full mt-1">
              <button
                type="button"
                onClick={copyLink}
                className={BTN_OUTLINE}
              >
                <Icon name="link" className="w-4 h-4" />
                Salin
              </button>
              <button
                type="button"
                onClick={downloadPng}
                className={BTN}
              >
                <Strip className="text-[16px]">
                  <Icon name="down" className="w-4 h-4" />
                  Unduh PNG
                </Strip>
              </button>
            </div>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${nama}\n${joinUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={BTN_OUTLINE}
            >
              <Icon name="whatsapp" className="w-4 h-4" />
              Bagikan WA
            </a>
          </div>
        ) : (
          <p className={`${LABEL} text-[11px] text-[#57534e] text-center py-8`}>Menyiapkan QR…</p>
        )}
      </Sheet>
      <Toast msg={toast} />
    </>
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
  const [showJoinQr, setShowJoinQr] = useState(false)

  const status = lifecycleOf(event)
  const { d, m } = monDay(event.tglRaw)
  const sameDates = event.tglDisplay === event.tglSelesaiDisplay
  const hasSesi = event.sesi.length > 0
  const totalReg = event.registrasi.length
  const attendees = event.absen.length
  const editHref = `${eventBasePath}/${event.id_event}/edit`
  const scanHref = `${ALK_BASE}/scanner?eventId=${event.id_event}`
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
    ...(event.lokasi.length > 0
      ? ([['Lokasi Scan', event.lokasi.map((l) => `${l.nama} (${l.radius} m)`).join(' · ')]] as [string, string][])
      : []),
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
    <PaperMain>
      <header className="px-5 pt-4">
        <div className="flex items-center justify-between gap-3 min-h-11">
          <div className="flex items-center gap-3 min-w-0">
            <IconButton icon="chevronLeft" label="Kembali" onClick={() => router.push(backUrl)} className="-rotate-3" />
            <StickerLabel>Detail Event</StickerLabel>
          </div>
          <Link href={editHref} className={`shrink-0 rotate-2 ${BTN_SHELL}`}>
            <Strip tone="ink" className="px-4 py-2 text-[15px]">
              <Icon name="edit" className="w-4 h-4" sw={2.2} />
              Edit
            </Strip>
          </Link>
        </div>
        <div className="mt-3 flex items-start gap-3.5">
          <DateBlock d={d} m={m} />
          <div className="min-w-0">
            <h1 className={`${ANTON} text-[30px] leading-[1.06] tracking-[.01em] break-words`}>{event.nama_event}</h1>
            <p className={`${MONO} text-[11.5px] font-bold text-[#44403c] mt-1.5 leading-snug`}>
              {event.tglDisplay}
              {!sameDates ? ` – ${event.tglSelesaiDisplay}` : ''}
              {event.jamevent
                ? ` · ${event.jamevent}${event.jamselesaievent ? `–${event.jamselesaievent}` : ''} WIB`
                : ''}
            </p>
          </div>
        </div>
      </header>

      <div className="px-5 mt-5 pb-10 space-y-4">
        <section aria-label="Status" className={`p-4 ${PANEL}`}>
          <Stepper status={status} />

          {(status === 'live' || status === 'done') && (
            <div className="flex items-end justify-between gap-3 mt-5">
              <div>
                <p className={`${ANTON} text-[52px] leading-none ${status === 'live' ? 'text-[#c21f24]' : 'text-[#161616]'}`}>
                  {hasSesi ? hadirLengkapCount || attendees : attendees}
                </p>
                <p className={`${MONO} text-[11px] text-[#44403c] mt-1.5`}>
                  anggota hadir
                  {hasSesi ? ` · ${hadirLengkapCount} hadir lengkap` : ''}
                </p>
              </div>
              {status === 'live' ? (
                <p className={`${LABEL} flex items-center gap-1.5 text-[10px] font-bold text-[#c21f24]`}>
                  <span className="w-2 h-2 rounded-full bg-[#e02a2f] animate-pulse" />
                  Absensi dibuka
                </p>
              ) : (
                <p className={`${LABEL} text-[10px] font-bold text-[#57534e]`}>Kegiatan selesai</p>
              )}
            </div>
          )}

          <div className="mt-4 space-y-2.5">
            {status === 'live' && (
              <Link href={scanHref} className={BTN}>
                <Strip>
                  <Icon name="qr" className="w-5 h-5" />
                  Mulai Absensi
                </Strip>
              </Link>
            )}
            {status === 'approved' && (
              <>
                <Note tone="sky">
                  Disetujui pusat (ALK + Brim Nasional). Peserta sudah bisa ambil tiket; scan
                  absensi dibuka saat acara.
                </Note>
                <Link href={scanHref} className={BTN}>
                  <Strip tone="ink">
                    <Icon name="scan" className="w-5 h-5" />
                    Buka Scanner
                  </Strip>
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
                <Link href={editHref} className={BTN}>
                  <Strip>Ubah &amp; Ajukan Ulang</Strip>
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
            <button type="button" onClick={() => setShowJoinQr(true)} className={BTN_OUTLINE}>
              <Icon name="qr" className="w-5 h-5" />
              Generate QR Join
            </button>
          </div>
        </section>

        {event.posterUrl ? (
          <figure className={`relative -mx-1 p-1.5 rounded-[6px] bg-[#fffdf7] -rotate-[.6deg] ${LIFTED}`}>
            <span aria-hidden className="absolute z-10 -top-2.5 left-1/2 -translate-x-1/2 -rotate-3 w-20 h-5 bg-[#ffd83d]/85" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={event.posterUrl} alt={`Poster ${event.nama_event}`} className="w-full h-auto block bg-[#d6d0c4]" />
          </figure>
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

        <ListCard title="Detail Event" pill={EV_STATUS[status][0]} tone={EV_STATUS[status][1]}>
          {info.map(([k, v], i) => (
            <div key={k} className={`flex gap-3 px-4 py-2.5 ${i ? 'border-t-2 border-dotted border-[#161616]/15' : ''}`}>
              <p className={`${LABEL} text-[9.5px] leading-[18px] text-[#57534e] w-24 shrink-0`}>{k}</p>
              <p className={`${MONO} text-[12px] font-bold flex-1 min-w-0 break-words`}>{v}</p>
            </div>
          ))}
        </ListCard>

        <DanaRow
          eventId={event.id_event}
          reimburse={reimburse}
          eventBasePath={eventBasePath}
        />

        {mapSrc && (
          <section aria-label="Lokasi Event" className={`${PANEL} overflow-hidden`}>
            <div className="px-4 py-3 border-b-2 border-dotted border-[#161616]/25">
              <h2 className={`${ANTON} text-[20px] leading-none tracking-[.01em]`}>Lokasi Event</h2>
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
          </section>
        )}

        {showPeserta && (
          <>
            <ListCard title="Konfirmasi Kehadiran" pill={`Total ${totalReg} registrasi`}>
              {totalReg === 0 ? (
                <p className={`${LABEL} px-4 py-8 text-center text-[11px] text-[#57534e]`}>Belum ada peserta.</p>
              ) : (
                <>
                  <div className={PERSON_ROWS}>
                    {event.registrasi
                      .slice(regPage * PAGE_SIZE, (regPage + 1) * PAGE_SIZE)
                      .map((r, i) => (
                        <div key={r.id_registrasi} className="flex items-center gap-3 px-4 py-2.5">
                          <span className={PERSON_NO}>{regPage * PAGE_SIZE + i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`${PERSON_NAME} truncate`}>
                              {r.nama}
                              {r.kota ? <span className="text-[#57534e]"> – {r.kota}</span> : null}
                            </p>
                            {r.gereja ? <p className={PERSON_SUB}>{r.gereja}</p> : null}
                            <p className={PERSON_SUB}>{r.email}</p>
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
                <div className="px-4 py-3 border-b-2 border-dotted border-[#161616]/20 space-y-2.5">
                  <div className="space-y-1.5">
                    {event.sesi.map((s) => (
                      <div key={s.id_sesi} className={`${MONO} flex items-center justify-between gap-2 text-[11.5px]`}>
                        <span className="min-w-0 font-bold truncate">
                          {s.nama}
                          <span className="font-normal text-[#57534e]">
                            {' '}
                            · {s.wajib ? 'wajib' : 'opsional'}
                            {s.id_lokasi != null
                              ? ` · @ ${event.lokasi.find((l) => l.id_lokasi === s.id_lokasi)?.nama ?? 'lokasi'}`
                              : ''}
                          </span>
                        </span>
                        <span className="text-[#44403c] shrink-0">{sesiCounts.get(s.id_sesi) ?? 0} hadir</span>
                      </div>
                    ))}
                  </div>
                  <p className={`${MONO} text-[11.5px] font-bold`}>
                    Hadir lengkap:{' '}
                    <span className="text-[#c21f24]">
                      {hadirLengkapCount} / {totalReg}
                    </span>
                    <span className="font-normal text-[#57534e]"> (semua sesi wajib)</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <button type="button" aria-pressed={sesiFilter === 'all'} onClick={() => setFilter('all')} className={sesiChip(sesiFilter === 'all')}>
                      Semua
                    </button>
                    {event.sesi.map((s) => (
                      <button
                        key={s.id_sesi}
                        type="button"
                        aria-pressed={sesiFilter === s.id_sesi}
                        onClick={() => setFilter(s.id_sesi)}
                        className={`${sesiChip(sesiFilter === s.id_sesi)} max-w-[150px] truncate`}
                      >
                        {s.nama}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {filteredAbsen.length === 0 ? (
                <p className={`${LABEL} px-4 py-8 text-center text-[11px] text-[#57534e]`}>Belum ada presensi.</p>
              ) : (
                <>
                  <div className={PERSON_ROWS}>
                    {filteredAbsen
                      .slice(absenPage * PAGE_SIZE, (absenPage + 1) * PAGE_SIZE)
                      .map((a, i) => (
                        <div key={a.id_absen} className="flex items-center gap-3 px-4 py-2.5">
                          <span className={PERSON_NO}>{absenPage * PAGE_SIZE + i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`${PERSON_NAME} flex items-center gap-1.5`}>
                              <span className="truncate">{a.nama}</span>
                              {USERLEVEL_LABEL[a.userlevel] && <Pill tone="gold">{USERLEVEL_LABEL[a.userlevel]}</Pill>}
                            </p>
                            {a.gereja ? <p className={PERSON_SUB}>{a.gereja}</p> : null}
                            <p className={PERSON_SUB}>{[a.sesiNama, a.email].filter(Boolean).join(' · ')}</p>
                          </div>
                          <p className={`${MONO} text-[10px] text-[#57534e] shrink-0 text-right leading-tight whitespace-pre-line`}>
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

      <JoinQrSheet
        open={showJoinQr}
        onClose={() => setShowJoinQr(false)}
        eventId={event.id_event}
        nama={event.nama_event}
        jenisevent={event.jenisevent}
      />
    </PaperMain>
  )
}
