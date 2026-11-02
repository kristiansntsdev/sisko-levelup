/* eslint-disable */
// GENERATED from app/dashboard/tiket/[id]/ticket-detail-client.tsx by scripts/gen-demo-preview.mjs — do not edit; change the source or the generator and re-run.
'use client'
import { useRouter } from 'next/navigation'
import { ANTON, BackBar, LABEL, MONO, PANEL, PaperMain, Poster, StateStamp } from '@/components/pwa/paper-ui'
import { Qr } from '@/components/pwa/ui'
import { AbsenEventButton } from './absen-event-button'

type AbsenProps = {
  idRegistrasi: number
  tglSelesaiMs: number
  jamselesaievent: string
  alreadyAttended: boolean
}

const DT = `${LABEL} text-[9.5px] text-[#57534e]`
const DD = `${MONO} mt-0.5 text-[12.5px] font-bold leading-snug break-words`
const BRACKET = 'absolute w-7 h-7 border-[#e02a2f]'

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
  const back = () => router.push('/demo-preview/dashboard/tiket')

  if (missing) {
    return (
      <PaperMain>
        <BackBar title="Ticket" onBack={back} />
        <p className={`${LABEL} m-5 rounded-[14px] border-2 border-dotted border-[#161616]/30 text-center text-[11px] text-[#57534e] py-8 px-5`}>
          Tiket tidak ditemukan.
        </p>
      </PaperMain>
    )
  }

  return (
    <PaperMain>
      <BackBar title="Ticket" onBack={back} />
      <div className="px-4 pt-5 pb-8 space-y-4">
        <div className="relative">
          <span aria-hidden className="absolute z-10 -top-2.5 left-1/2 -translate-x-1/2 -rotate-3 w-20 h-5 bg-[#ffd83d]/85" />
          <div className={`overflow-hidden ${PANEL}`}>
            {posterUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- full flyer, no cover crop
              <img src={posterUrl} alt="" className="w-full h-auto block bg-[#d6d0c4]" />
            ) : (
              <Poster src="" className="w-full aspect-[16/9]" />
            )}
            <div className="h-1.5 bg-[#ffd83d]" />
            <div className="px-5 pt-4 pb-4">
              <div className="flex items-center justify-between gap-3">
                <p className={`${LABEL} text-[10.5px] font-bold text-[#c21f24]`}>{category}</p>
                <StateStamp state={state} />
              </div>
              <h1 className={`${ANTON} mt-2 text-[30px] leading-[1.08] tracking-[.01em] break-words`}>{namaEvent}</h1>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 mt-4">
                {rows.map(([k, v]) => (
                  <div key={k} className="min-w-0">
                    <dt className={DT}>{k}</dt>
                    <dd className={DD}>{v}</dd>
                  </div>
                ))}
                <div className="col-span-2">
                  <dt className={DT}>Lokasi</dt>
                  <dd className={DD}>{alamat || '—'}</dd>
                </div>
              </dl>
            </div>
            <div aria-hidden className="relative h-6">
              <span className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-[#efe8da]" />
              <span className="absolute -right-3 top-0 w-6 h-6 rounded-full bg-[#efe8da]" />
              <span className="absolute left-5 right-5 top-1/2 border-t-2 border-dashed border-[#161616]/30" />
            </div>
            <div className="px-5 pt-2 pb-6 text-center">
              {/* Must stay scannable: straight, on solid white. Keep the page's tilt and texture away from it. */}
              <div className="relative w-[230px] mx-auto p-2.5 bg-white rounded-xl" style={{ colorScheme: 'only light', forcedColorAdjust: 'none' }}>
                <span className={`${BRACKET} top-0 left-0 border-t-4 border-l-4 rounded-tl-xl`} />
                <span className={`${BRACKET} top-0 right-0 border-t-4 border-r-4 rounded-tr-xl`} />
                <span className={`${BRACKET} bottom-0 left-0 border-b-4 border-l-4 rounded-bl-xl`} />
                <span className={`${BRACKET} bottom-0 right-0 border-b-4 border-r-4 rounded-br-xl`} />
                <Qr text={qrText} />
              </div>
              <p className={`${MONO} mt-3 text-[15px] font-bold tracking-[.12em]`}>{ticketCode}</p>
              <p className={`${MONO} mt-2 text-[11.5px] leading-relaxed text-[#44403c]`}>
                Tunjukkan QR ini kepada panitia saat absen.
                <br />
                Jangan bagikan kepada orang lain.
              </p>
            </div>
          </div>
        </div>

        {isOnline && absen && (
          <AbsenEventButton
            idRegistrasi={absen.idRegistrasi}
            tglSelesaiMs={absen.tglSelesaiMs}
            jamselesaievent={absen.jamselesaievent}
            alreadyAttended={absen.alreadyAttended}
          />
        )}
      </div>
    </PaperMain>
  )
}
