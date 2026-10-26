'use client'
import { useRouter } from 'next/navigation'
import { AbsenEventButton } from './absen-event-button'
import {
  GOLD_LINE,
  PAGE_BG,
  Pill,
  PlainBar,
  Qr,
  fCard,
  type PillTone,
} from '@/components/pwa/ui'

type Detail = {
  id_registrasi: number
  id_peserta: number
  id_event: number
  status: string
  nama_event: string
  posterUrl: string | null
  jenisevent: string
  tglDisplay: string
  tglSelesaiDisplay: string
  jamevent: string
  jamselesaievent: string
  alamatevent: string
  pesertaNama: string
  usercode: string
  tglSelesaiMs: number
}

function statusTone(status: string): { label: string; tone: PillTone } {
  if (status === 'attend') return { label: 'Hadir', tone: 'green' }
  if (status === 'absence') return { label: 'Tidak hadir', tone: 'slate' }
  return { label: 'Terdaftar', tone: 'gold' }
}

export function TicketView({
  detail,
  email,
}: {
  detail: Detail
  email: string
}) {
  const router = useRouter()
  const qrText = JSON.stringify({
    p: String(detail.id_peserta),
    e: email,
    ev: String(detail.id_event),
  })
  const ticketCode = `EV${detail.id_event}-${detail.usercode || detail.id_peserta}`
  const st = statusTone(detail.status)
  const isOnline = detail.jenisevent === 'Online'
  const alreadyAttended = detail.status === 'attend'
  const tglLabel =
    detail.tglDisplay && detail.tglSelesaiDisplay && detail.tglDisplay !== detail.tglSelesaiDisplay
      ? `${detail.tglDisplay} – ${detail.tglSelesaiDisplay}`
      : detail.tglDisplay
  const jamLabel = [detail.jamevent, detail.jamselesaievent].filter(Boolean).join('–')
  const rows: [string, string][] = [
    ['Tanggal', tglLabel || '—'],
    ['Waktu', jamLabel ? `${jamLabel} WIB` : '—'],
    ['Peserta', detail.pesertaNama || '—'],
    ['No. Tiket', ticketCode],
  ]

  return (
    <section className={`min-h-screen ${PAGE_BG}`}>
      <PlainBar title="Ticket" back={() => router.push('/dashboard/tiket')} />
      <div className="px-4 py-5 space-y-4 pb-safe">
        <div className="bg-white rounded-[24px] shadow-[0_10px_30px_-14px_rgba(15,23,42,.35)] overflow-hidden">
          {detail.posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={detail.posterUrl} alt="" className="w-full aspect-[16/9] object-cover object-top" />
          ) : (
            <div className="w-full aspect-[16/9] bg-linear-to-br from-[#d73640] to-[#8a1620]" />
          )}
          <div className={GOLD_LINE} />
          <div className="px-5 pt-4 pb-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11.5px] font-bold tracking-[.14em] uppercase text-[#c9232c]">
                {detail.jenisevent || 'Event'}
              </p>
              <Pill tone={st.tone}>{st.label}</Pill>
            </div>
            <p className="text-[21px] font-extrabold text-[#3b1417] leading-tight mt-1">{detail.nama_event}</p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 mt-4 text-[13px]">
              {rows.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[11.5px] text-slate-400">{k}</dt>
                  <dd className="font-semibold text-slate-800 mt-0.5">{v}</dd>
                </div>
              ))}
              <div className="col-span-2">
                <dt className="text-[11.5px] text-slate-400">Lokasi</dt>
                <dd className="font-semibold text-slate-800 mt-0.5">{detail.alamatevent || '—'}</dd>
              </div>
            </dl>
          </div>
          <div className="relative h-6">
            <span className={`absolute -left-3 top-0 w-6 h-6 rounded-full ${PAGE_BG}`} />
            <span className={`absolute -right-3 top-0 w-6 h-6 rounded-full ${PAGE_BG}`} />
            <span className="absolute left-5 right-5 top-1/2 border-t-2 border-dashed border-[#ecdcb3]" />
          </div>
          <div className="px-5 pt-2 pb-6 text-center">
            <div className="relative w-[230px] mx-auto p-2.5">
              <span className="absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 border-[#b1953a] rounded-tl-xl" />
              <span className="absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 border-[#b1953a] rounded-tr-xl" />
              <span className="absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 border-[#b1953a] rounded-bl-xl" />
              <span className="absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 border-[#b1953a] rounded-br-xl" />
              <Qr text={qrText} />
            </div>
            <p className={`${fCard} text-[15px] font-bold tracking-[.12em] text-[#3b1417] mt-3`}>{ticketCode}</p>
            <p className="text-[12px] text-slate-500 leading-relaxed mt-2">
              Tunjukkan QR ini kepada panitia saat absen.
              <br />
              Jangan bagikan kepada orang lain.
            </p>
          </div>
        </div>

        {isOnline && (
          <AbsenEventButton
            idRegistrasi={detail.id_registrasi}
            tglSelesaiMs={detail.tglSelesaiMs}
            jamselesaievent={detail.jamselesaievent}
            alreadyAttended={alreadyAttended}
          />
        )}
      </div>
    </section>
  )
}
