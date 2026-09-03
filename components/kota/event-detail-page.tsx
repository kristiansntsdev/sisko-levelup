'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { ajukanEvent, type EventDetailFull } from '@/lib/actions/event'
import { isEventFullyApproved } from '@/lib/event-approval'
import { FlyerQaSummary } from '@/components/kota/flyer-qa-summary'
import { BeritaAcaraQaSummary } from '@/components/kota/berita-acara-qa-summary'
import { hadirPenuh, sesiWajibIds } from '@/lib/event-sesi'

const PAGE_SIZE = 10

const USERLEVEL_LABEL: Record<string, string> = {
  '0': 'tamu',
  '1': 'volunteer',
  '2': 'squad',
  '3': 'core',
  '4': 'pic',
}

function fmtRp(s: string) {
  const n = parseInt(s.replace(/\D/g, ''), 10)
  if (isNaN(n)) return s
  return `Rp ${n.toLocaleString('id-ID')}`
}

function fmtTs(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function Pagination({
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  page: number
  totalPages: number
  onPrev: () => void
  onNext: () => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-t border-border gap-2">
      <button
        type="button"
        onClick={onPrev}
        disabled={page === 0}
        className="text-[13px] px-3 py-1 rounded-[10px] border border-border bg-bg cursor-pointer disabled:opacity-40"
      >
        ← Prev
      </button>
      <span className="text-[12px] text-muted">{page + 1} / {totalPages}</span>
      <button
        type="button"
        onClick={onNext}
        disabled={page >= totalPages - 1}
        className="text-[13px] px-3 py-1 rounded-[10px] border border-border bg-bg cursor-pointer disabled:opacity-40"
      >
        Next →
      </button>
    </div>
  )
}

interface EventDetailPageProps {
  event: EventDetailFull
  backUrl: string
}

function EventAjukanBar({
  eventId,
  flyerDiajukan,
  show,
}: {
  eventId: number
  flyerDiajukan: boolean
  show: boolean
}) {
  const [diajukan, setDiajukan] = useState(flyerDiajukan)
  const [msg, setMsg] = useState('')
  const [isPending, startTransition] = useTransition()
  if (!show) return null
  return (
    <div className="bg-surface border border-border rounded-card overflow-hidden px-4 py-4 flex flex-col gap-2">
      {diajukan ? (
        <p className="text-[13px] font-semibold text-green-dark">Sudah diajukan</p>
      ) : (
        <button
          type="button"
          onClick={() => {
            setMsg('')
            startTransition(async () => {
              const res = await ajukanEvent(eventId)
              if (!res.ok) {
                setMsg(res.error)
                return
              }
              setDiajukan(true)
            })
          }}
          disabled={isPending}
          className="w-full py-3 bg-accent text-white rounded-btn text-[14px] font-semibold disabled:opacity-60"
        >
          {isPending ? 'Mengajukan...' : 'Ajukan'}
        </button>
      )}
      {msg && <p className="text-[12px] text-red">{msg}</p>}
    </div>
  )
}

export function EventDetailPage({ event, backUrl }: EventDetailPageProps) {
  const [regPage, setRegPage] = useState(0)
  const [absenPage, setAbsenPage] = useState(0)
  const [sesiFilter, setSesiFilter] = useState<number | 'all'>('all')

  const mapSrc = (() => {
    if (!event.longlatevent) return ''
    const parts = event.longlatevent.split(',').map(Number)
    if (parts.length < 2 || parts.some(isNaN)) return ''
    return `https://maps.google.com/maps?q=${parts[0]},${parts[1]}&z=15&output=embed`
  })()

  const isApproved = isEventFullyApproved(event)
  const sameDates = event.tglDisplay === event.tglSelesaiDisplay
  const hasSesi = event.sesi.length > 0

  const totalRegistrasi = event.registrasi.length
  const regTotalPages = Math.max(1, Math.ceil(totalRegistrasi / PAGE_SIZE))
  const pagedReg = event.registrasi.slice(regPage * PAGE_SIZE, (regPage + 1) * PAGE_SIZE)

  const filteredAbsen = useMemo(() => {
    if (!hasSesi || sesiFilter === 'all') return event.absen
    return event.absen.filter((a) => a.id_sesi === sesiFilter)
  }, [event.absen, hasSesi, sesiFilter])

  const totalAbsen = filteredAbsen.length
  const absenTotalPages = Math.max(1, Math.ceil(totalAbsen / PAGE_SIZE))
  const pagedAbsen = filteredAbsen.slice(absenPage * PAGE_SIZE, (absenPage + 1) * PAGE_SIZE)

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

  function setFilter(next: number | 'all') {
    setSesiFilter(next)
    setAbsenPage(0)
  }

  const infoRows = [
    { label: 'Jenis Event', value: event.jenisevent },
    { label: 'Alamat', value: event.alamatevent },
    { label: 'Jam', value: `${event.jamevent} – ${event.jamselesaievent}` },
    { label: 'Dana', value: fmtRp(event.danaevent) },
    { label: 'Target Peserta', value: `${event.targetjumlah} orang` },
    { label: 'Total Registrasi', value: `${totalRegistrasi} orang` },
    ...(event.linkevent && event.linkevent !== '0' ? [{ label: 'Link', value: event.linkevent }] : []),
  ]

  return (
    <main className="min-h-screen bg-bg pb-10">
      {/* Sticky nav */}
      <nav className="sticky top-0 z-10 bg-surface border-b border-border">
        <div className="max-w-[480px] mx-auto px-5 pt-6 pb-4 flex items-center gap-3">
          <Link href={backUrl} className="text-sm text-muted hover:text-fg transition-colors shrink-0">
            ← Kembali
          </Link>
          <p className="text-[14px] font-semibold text-fg truncate flex-1 text-center">
            Detail Event
          </p>
          <Link
            href={`/dashboard/kota/alk/event/${event.id_event}/edit`}
            className="text-sm text-accent font-medium hover:opacity-80 transition-opacity shrink-0"
          >
            Edit
          </Link>
        </div>
      </nav>

      <div className="max-w-[480px] mx-auto px-4 pt-5 flex flex-col gap-4">

        {/* Header card */}
        <div className="bg-surface border border-border rounded-card p-4 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-[18px] font-bold text-fg leading-snug flex-1">{event.nama_event}</h1>
            <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
              isApproved ? 'bg-green-light text-green-dark' : 'bg-amber-light text-amber-dark'
            }`}>
              {isApproved ? 'Disetujui' : 'Belum Approve'}
            </span>
          </div>
          <p className="text-[13px] text-muted leading-relaxed">
            {event.tglDisplay}
            {!sameDates && <span> – {event.tglSelesaiDisplay}</span>}
          </p>
          {event.jamevent && (
            <p className="text-[12px] text-muted">
              {event.jamevent}{event.jamselesaievent ? ` – ${event.jamselesaievent}` : ''}
            </p>
          )}
        </div>

        {/* Poster */}
        {event.posterUrl && (
          <div className="rounded-card overflow-hidden border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.posterUrl}
              alt={`Poster ${event.nama_event}`}
              className="w-full object-cover"
            />
          </div>
        )}

        <FlyerQaSummary
          eventId={event.id_event}
          initial={event.flyerQa}
          editHref={`/dashboard/kota/alk/event/${event.id_event}/edit`}
        />
        <BeritaAcaraQaSummary
          eventId={event.id_event}
          initial={event.beritaAcaraQa}
        />
        <EventAjukanBar
          eventId={event.id_event}
          flyerDiajukan={Boolean(event.flyerQa?.diajukan || event.beritaAcaraQa?.diajukan)}
          show={Boolean(event.flyerQa || event.beritaAcaraQa)}
        />

        {/* Info table */}
        <div className="bg-surface border border-border rounded-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-[13px] font-semibold text-fg">Detail Event</p>
          </div>
          {infoRows.map((row, i) => (
            <div
              key={row.label}
              className={`flex gap-3 px-4 py-3 ${i > 0 ? 'border-t border-border' : ''}`}
            >
              <p className="text-[12px] text-muted w-28 shrink-0 pt-0.5">{row.label}</p>
              <p className="text-[13px] text-fg flex-1 break-words">{row.value}</p>
            </div>
          ))}
        </div>

        {/* Map */}
        {mapSrc && (
          <div className="rounded-card overflow-hidden border border-border">
            <div className="px-4 py-3 bg-surface border-b border-border">
              <p className="text-[13px] font-semibold text-fg">Lokasi Event</p>
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

        {/* Konfirmasi Kehadiran */}
        <div className="bg-surface border border-border rounded-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <p className="text-[13px] font-semibold text-fg">Konfirmasi Kehadiran</p>
            <span className="text-[11px] text-muted bg-bg px-2 py-0.5 rounded-full border border-border">
              Total {totalRegistrasi} registrasi
            </span>
          </div>
          {totalRegistrasi === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-[13px] text-muted">Belum ada peserta.</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-border">
                {pagedReg.map((r, i) => (
                  <div key={r.id_registrasi} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-[12px] text-muted w-6 shrink-0 text-right">
                      {regPage * PAGE_SIZE + i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-fg truncate">{r.nama}</p>
                      <p className="text-[11px] text-muted truncate">{r.email}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination
                page={regPage}
                totalPages={regTotalPages}
                onPrev={() => setRegPage((p) => p - 1)}
                onNext={() => setRegPage((p) => p + 1)}
              />
            </>
          )}
        </div>

        {/* Presensi */}
        <div className="bg-surface border border-border rounded-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <p className="text-[13px] font-semibold text-fg">Presensi (Scan QR)</p>
            <span className="text-[11px] text-muted bg-bg px-2 py-0.5 rounded-full border border-border">
              {hasSesi ? `${totalAbsen} scan` : `${totalAbsen} hadir`}
            </span>
          </div>

          {hasSesi && (
            <div className="px-4 py-3 border-b border-border flex flex-col gap-2.5">
              <div className="flex flex-col gap-1.5">
                {event.sesi.map((s) => (
                  <div key={s.id_sesi} className="flex items-center justify-between gap-2 text-[12px]">
                    <span className="text-fg truncate">
                      {s.nama}
                      <span className="text-muted">
                        {' '}· {s.wajib ? 'wajib' : 'opsional'}
                      </span>
                    </span>
                    <span className="text-muted shrink-0">{sesiCounts.get(s.id_sesi) ?? 0} hadir</span>
                  </div>
                ))}
              </div>
              <p className="text-[12px] font-medium text-fg">
                Hadir lengkap:{' '}
                <span className="text-accent">
                  {hadirLengkapCount} / {totalRegistrasi}
                </span>
                <span className="text-muted font-normal"> (semua sesi wajib)</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                    sesiFilter === 'all'
                      ? 'border-accent bg-accent-light text-accent-dark font-semibold'
                      : 'border-border text-muted'
                  }`}
                >
                  Semua
                </button>
                {event.sesi.map((s) => (
                  <button
                    key={s.id_sesi}
                    type="button"
                    onClick={() => setFilter(s.id_sesi)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors max-w-[140px] truncate ${
                      sesiFilter === s.id_sesi
                        ? 'border-accent bg-accent-light text-accent-dark font-semibold'
                        : 'border-border text-muted'
                    }`}
                  >
                    {s.nama}
                  </button>
                ))}
              </div>
            </div>
          )}

          {totalAbsen === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-[13px] text-muted">Belum ada presensi.</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-border">
                {pagedAbsen.map((a, i) => (
                  <div key={a.id_absen} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-[12px] text-muted w-6 shrink-0 text-right">
                      {absenPage * PAGE_SIZE + i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-fg truncate flex items-center gap-1.5">
                        <span className="truncate">{a.nama}</span>
                        {USERLEVEL_LABEL[a.userlevel] && (
                          <span className="shrink-0 text-[10px] font-semibold text-muted bg-bg px-1.5 py-0.5 rounded border border-border capitalize">
                            {USERLEVEL_LABEL[a.userlevel]}
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-muted truncate">
                        {a.sesiNama ? `${a.sesiNama} · ` : ''}{a.email}
                      </p>
                    </div>
                    <p className="text-[11px] text-muted shrink-0 text-right leading-tight">
                      {fmtTs(a.timestamp)}
                    </p>
                  </div>
                ))}
              </div>
              <Pagination
                page={absenPage}
                totalPages={absenTotalPages}
                onPrev={() => setAbsenPage((p) => p - 1)}
                onNext={() => setAbsenPage((p) => p + 1)}
              />
            </>
          )}
        </div>

      </div>
    </main>
  )
}
