import Link from 'next/link'
import type { EventDetailFull } from '@/lib/actions/event'



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

interface EventDetailPageProps {
  event: EventDetailFull
  backUrl: string
}

export function EventDetailPage({ event, backUrl }: EventDetailPageProps) {
  const mapSrc = (() => {
    if (!event.longlatevent) return ''
    const parts = event.longlatevent.split(',').map(Number)
    if (parts.length < 2 || parts.some(isNaN)) return ''
    return `https://maps.google.com/maps?q=${parts[0]},${parts[1]}&z=15&output=embed`
  })()

  const isApproved = event.approvenasional === '1'
  const sameDates = event.tglDisplay === event.tglSelesaiDisplay

  const infoRows = [
    { label: 'Jenis Event', value: event.jenisevent },
    { label: 'Alamat', value: event.alamatevent },
    { label: 'Jam', value: `${event.jamevent} – ${event.jamselesaievent}` },
    { label: 'Dana', value: fmtRp(event.danaevent) },
    { label: 'Target Peserta', value: `${event.targetjumlah} orang` },
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
              {event.registrasi.length} peserta
            </span>
          </div>
          {event.registrasi.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-[13px] text-muted">Belum ada peserta.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {event.registrasi.map((r, i) => (
                <div key={r.id_registrasi} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-[12px] text-muted w-6 shrink-0 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-fg truncate">{r.nama}</p>
                    <p className="text-[11px] text-muted truncate">{r.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Presensi */}
        <div className="bg-surface border border-border rounded-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <p className="text-[13px] font-semibold text-fg">Presensi (Scan QR)</p>
            <span className="text-[11px] text-muted bg-bg px-2 py-0.5 rounded-full border border-border">
              {event.absen.length} hadir
            </span>
          </div>
          {event.absen.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-[13px] text-muted">Belum ada presensi.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {event.absen.map((a, i) => (
                <div key={a.id_absen} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-[12px] text-muted w-6 shrink-0 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-fg truncate">{a.nama}</p>
                    <p className="text-[11px] text-muted truncate">{a.email}</p>
                  </div>
                  <p className="text-[11px] text-muted shrink-0 text-right leading-tight">
                    {fmtTs(a.timestamp)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
