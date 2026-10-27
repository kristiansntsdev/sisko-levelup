'use client'
import { useRouter } from 'next/navigation'
import {
  GOLD_LINE,
  PAGE_BG,
  Pill,
  PlainBar,
  Qr,
  fCard,
  type PillTone,
} from '@/components/pwa/ui'
import { AbsenEventButton } from './absen-event-button'

type AbsenProps = {
  idRegistrasi: number
  tglSelesaiMs: number
  jamselesaievent: string
  alreadyAttended: boolean
}

const TONE: Record<string, PillTone> = {
  Terdaftar: 'gold',
  Hadir: 'green',
  'Tidak hadir': 'slate',
}

export function TicketDetailClient({
  missing,
  qrText,
  ticketCode,
  state,
  namaEvent,
  category,
  posterUrl,
  rows,
  alamat,
  isOnline,
  absen,
}: {
  missing: boolean
  qrText: string
  ticketCode: string
  state: string
  namaEvent: string
  category: string
  posterUrl: string | null
  rows: [string, string][]
  alamat: string
  isOnline: boolean
  absen: AbsenProps | null
}) {
  const router = useRouter()

  if (missing) {
    return (
      <main>
        <PlainBar title="Ticket" back={() => router.push('/dashboard/tiket')} />
        <p className="p-6 text-sm text-slate-500">Tiket tidak ditemukan.</p>
      </main>
    )
  }

  return (
    <main>
      <PlainBar title="Ticket" back={() => router.push('/dashboard/tiket')} />
      <div className="px-4 py-5 space-y-4 pb-8">
        <div className="bg-white rounded-[24px] shadow-[0_10px_30px_-14px_rgba(15,23,42,.35)] overflow-hidden">
          {posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- full flyer, no cover crop
            <img src={posterUrl} alt="" className="w-full h-auto block bg-slate-200" />
          ) : (
            <div className="w-full aspect-[16/9] bg-linear-to-br from-[#d73640] to-[#8a1620]" />
          )}
          <div className={GOLD_LINE} />
          <div className="px-5 pt-4 pb-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11.5px] font-bold tracking-[.14em] uppercase text-[#c9232c]">{category}</p>
              <Pill tone={TONE[state] ?? 'slate'}>{state}</Pill>
            </div>
            <p className="text-[21px] font-extrabold text-[#3b1417] leading-tight mt-1">{namaEvent}</p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 mt-4 text-[13px]">
              {rows.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[11.5px] text-slate-400">{k}</dt>
                  <dd className="font-semibold text-slate-800 mt-0.5">{v}</dd>
                </div>
              ))}
              <div className="col-span-2">
                <dt className="text-[11.5px] text-slate-400">Lokasi</dt>
                <dd className="font-semibold text-slate-800 mt-0.5">{alamat || '—'}</dd>
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

        {isOnline && absen && (
          <div className="space-y-2">
            <AbsenEventButton
              idRegistrasi={absen.idRegistrasi}
              tglSelesaiMs={absen.tglSelesaiMs}
              jamselesaievent={absen.jamselesaievent}
              alreadyAttended={absen.alreadyAttended}
            />
          </div>
        )}
      </div>
    </main>
  )
}
