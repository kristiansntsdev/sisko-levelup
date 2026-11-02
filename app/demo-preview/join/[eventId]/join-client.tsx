/* eslint-disable */
// GENERATED from app/join/[eventId]/join-client.tsx by scripts/gen-demo-preview.mjs — do not edit; change the source or the generator and re-run.
'use client'
import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/components/demo-preview/shim/session'
import type { EventSummary } from '@/components/demo-preview/shim/actions/event'
import { getPesertaById } from '@/components/demo-preview/shim/actions/peserta'
import { createRegistrasi, findRegistrasiMine } from '@/components/demo-preview/shim/actions/registrasi'
import { USERLEVEL_LABEL } from '@/lib/pwa-member'
import { needsNasionalTicketApproval } from '@/lib/registrasi-status'
import {
  ANTON,
  BackBar,
  BTN,
  InfoRow,
  LABEL,
  LIFTED,
  MONO,
  PANEL,
  PaperMain,
  Poster,
  REG_TONE,
  ROWS,
  Strip,
} from '@/components/pwa/paper-ui'
import { Icon, Sheet, SheetHead } from '@/components/pwa/ui'

const TARGET_ROLE: Record<string, string> = USERLEVEL_LABEL
const PENGURUS_ROLE: Record<string, string> = { '1': 'Admin LK', '2': 'BRIM' }

function roleNames(stored: string, map: Record<string, string>) {
  const codes = [...new Set(stored.split(',').map((s) => s.trim()).filter(Boolean))]
  codes.sort((a, b) => Number(a) - Number(b))
  return codes.map((v) => map[v] ?? v)
}

function Disabled({ children }: { children: ReactNode }) {
  return (
    <button disabled className="block w-full">
      <Strip tone="muted">{children}</Strip>
    </button>
  )
}

export function JoinClient({
  event,
  isRegistered,
  registrasiId: initialRegId,
  pendingApproval: initialPending,
  registered,
}: {
  event: EventSummary | null
  isRegistered: boolean
  registrasiId: number | null
  pendingApproval: boolean
  registered: number
}) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [more, setMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [regId, setRegId] = useState<number | null>(initialRegId)
  const [awaitingApproval, setAwaitingApproval] = useState(initialPending)
  const [over, setOver] = useState(false)
  const [nama, setNama] = useState(session?.user?.name ?? '')
  const [email, setEmail] = useState(session?.user?.email ?? '')
  const mine = Boolean(regId) || isRegistered
  const needsApproval = needsNasionalTicketApproval(event?.wwtype)

  useEffect(() => {
    const idPeserta = session?.user?.idPeserta
    if (!idPeserta) return
    getPesertaById(idPeserta).then((p) => {
      if (p) {
        setNama(p.nama)
        setEmail(p.email)
      }
    })
    if (event && !regId && !awaitingApproval) {
      findRegistrasiMine(idPeserta, event.id_event).then((row) => {
        if (!row) return
        if (row.status === 'pending') setAwaitingApproval(true)
        else setRegId(row.id)
      })
    }
  }, [session?.user?.idPeserta, event, regId, awaitingApproval])

  if (!event) {
    return (
      <PaperMain standalone>
        <BackBar title="View Event" onBack={() => router.push('/demo-preview/events')} />
        <p className={`${LABEL} m-5 rounded-[14px] border-2 border-dotted border-[#161616]/30 text-center text-[11px] text-[#57534e] py-8 px-5`}>
          Event tidak ditemukan.
        </p>
      </PaperMain>
    )
  }

  const closed = Date.now() >= event.tglSelesaiMs + 86400000
  const quota = event.targetjumlah
  const full = quota > 0 && (over || registered >= quota)
  const filled = quota > 0 ? Math.min(100, (registered / quota) * 100) : 0
  const dayTime =
    event.tglDisplay === event.tglSelesaiDisplay || !event.tglSelesaiDisplay
      ? `${event.tglDisplay} ${event.jamevent || '--:--'}${event.jamselesaievent ? ` - ${event.jamselesaievent}` : ''} (WIB)`
      : `${event.tglDisplay} - ${event.tglSelesaiDisplay} ${event.jamevent || '--:--'}${event.jamselesaievent ? ` - ${event.jamselesaievent}` : ''} (WIB)`

  const targets = [
    ...roleNames(event.target, TARGET_ROLE),
    ...roleNames(event.targetpengurus, PENGURUS_ROLE),
  ]
  const extra: [string, string][] = [
    ['LevelUP Kota', event.cabangName],
    ['Jenis Event', event.jenisevent || '—'],
    ['Kategori', event.category],
    ['Kuota', event.targetjumlah ? `${registered} / ${event.targetjumlah} tiket` : '—'],
  ]

  async function takeTicket() {
    if (!event || loading) return
    if (status !== 'authenticated' || !session) {
      router.push(`/demo-preview/login?callbackUrl=${encodeURIComponent(`/demo-preview/join/${event.id_event}`)}`)
      return
    }
    if (session.user?.needsRegistration || !session.user?.idPeserta) {
      router.push(`/demo-preview/daftar?step=form&eventId=${event.id_event}`)
      return
    }
    setLoading(true)
    const peserta = await getPesertaById(session.user.idPeserta)
    if (!peserta?.nowa) {
      setLoading(false)
      router.push(`/demo-preview/daftar?step=form&eventId=${event.id_event}`)
      return
    }
    const ticket = await createRegistrasi(session.user.idPeserta, event.id_event)
    if ('full' in ticket) {
      setOver(true)
      setConfirmOpen(false)
      setLoading(false)
      return
    }
    setConfirmOpen(false)
    setLoading(false)
    if (ticket.pending) {
      setAwaitingApproval(true)
      return
    }
    setRegId(ticket.id)
    router.push(`/demo-preview/dashboard/tiket/${ticket.id}`)
  }

  const regState = closed ? 'CLOSED' : full ? 'FULL' : 'OPEN'

  const cta = mine && regId ? (
    <button type="button" onClick={() => router.push(`/demo-preview/dashboard/tiket/${regId}`)} className={BTN}>
      <Strip tone="ink">Lihat Tiket Saya</Strip>
    </button>
  ) : awaitingApproval ? (
    <Disabled>Menunggu Approval Sekretariat</Disabled>
  ) : status === 'loading' ? (
    // Until the session resolves, a tap would read as "logged out" and bounce a logged-in member to /login
    <Disabled>Memuat…</Disabled>
  ) : closed ? (
    <Disabled>Registration Closed</Disabled>
  ) : full ? (
    <Disabled>Registration Full</Disabled>
  ) : (
    <button
      type="button"
      onClick={() => {
        if (status !== 'authenticated') {
          router.push(`/demo-preview/login?callbackUrl=${encodeURIComponent(`/demo-preview/join/${event.id_event}`)}`)
          return
        }
        setConfirmOpen(true)
      }}
      className={BTN}
    >
      <Strip>{needsApproval ? 'Ajukan Tiket' : 'Get Ticket'}</Strip>
    </button>
  )

  return (
    <PaperMain standalone>
      <BackBar title="View Event" onBack={() => router.push('/demo-preview/events')} />
      <figure className={`relative mx-4 mt-5 p-1.5 rounded-[6px] bg-[#fffdf7] -rotate-[.6deg] ${LIFTED}`}>
        <span aria-hidden className="absolute z-10 -top-2.5 left-1/2 -translate-x-1/2 -rotate-3 w-20 h-5 bg-[#ffd83d]/85" />
        {event.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- full flyer, no cover crop
          <img src={event.posterUrl} alt="" className="w-full h-auto block bg-[#d6d0c4]" />
        ) : (
          <Poster src="" className="w-full aspect-[16/10]" />
        )}
      </figure>
      <div className="flex-1 px-5 pt-5 pb-6 space-y-4">
        <h1 className={`${ANTON} text-[34px] leading-[1.05] tracking-[.01em] break-words`}>{event.nama_event}</h1>

        <section aria-label="Waktu dan lokasi" className={PANEL}>
          <div className={`px-4 ${ROWS}`}>
            <InfoRow icon="calendar" label="Day & Time">
              {dayTime}
            </InfoRow>
            <InfoRow icon={event.jenisevent === 'Online' ? 'monitor' : 'pin'} label="Location">
              {event.alamatevent || (event.jenisevent === 'Online' ? 'Online' : '—')}
            </InfoRow>
            {more && (
              <dl className={`${ROWS} text-[12px]`}>
                {extra.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 py-2.5">
                    <dt className={`${LABEL} shrink-0 text-[9.5px] leading-[18px] text-[#57534e]`}>{k}</dt>
                    <dd className={`${MONO} min-w-0 font-bold text-right break-words`}>{v}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
          <button
            type="button"
            aria-expanded={more}
            onClick={() => setMore(!more)}
            className={`${ANTON} w-full py-3 border-t-2 border-dotted border-[#161616]/20 text-[16px] tracking-[.03em] text-[#c21f24]`}
          >
            {more ? 'Hide Details' : 'View Details'}
          </button>
        </section>

        <section aria-label="Eligibility" className={`px-4 py-4 ${PANEL}`}>
          <p className={`${LABEL} text-[9.5px] text-[#57534e]`}>Eligibility</p>
          <p className={`${ANTON} flex items-center gap-2 mt-1.5 text-[22px] leading-none tracking-[.01em]`}>
            <Icon name="check" className="w-5 h-5 shrink-0 text-[#c21f24]" sw={3} />
            Eligible to Register
          </p>
          <div className="my-3 border-t-2 border-dotted border-[#161616]/20" />
          <p className={`${LABEL} text-[9.5px] text-[#57534e]`}>Role</p>
          <p className={`${MONO} mt-1 text-[13px] font-bold leading-snug`}>
            {targets.length ? `Terbuka untuk ${targets.join(', ')}.` : 'Terbuka untuk semua anggota.'}
          </p>
        </section>

        <section aria-label="Registration" className={`px-4 py-4 ${PANEL}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={`${LABEL} text-[9.5px] text-[#57534e]`}>Registration</p>
              <p className={`${MONO} mt-1.5 text-[13px] font-bold`}>{event.tglDisplay} (WIB)</p>
            </div>
            <span className={`${ANTON} shrink-0 -rotate-6 rounded-[4px] px-3 py-1 text-[22px] leading-none tracking-[.03em] ${REG_TONE[regState]}`}>{regState}</span>
          </div>
          {quota > 0 && (
            <>
              <div className="mt-3 h-3 rounded-full border-2 border-[#161616] overflow-hidden">
                <div className={`h-full ${full ? 'bg-[#ffd83d]' : 'bg-[#e02a2f]'}`} style={{ width: `${filled}%` }} />
              </div>
              <p className={`${MONO} mt-1.5 text-[11px] font-bold text-[#44403c]`}>
                {registered} dari {quota} tiket
              </p>
            </>
          )}
        </section>
      </div>

      <div className="sticky bottom-0 z-10 bg-[#efe8da] border-t-2 border-dotted border-[#161616]/25 px-5 pt-3 pb-[max(env(safe-area-inset-bottom),16px)]">{cta}</div>

      <Sheet open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <SheetHead
          title={needsApproval ? 'Ajukan Tiket Nasional' : 'Konfirmasi Pendaftaran'}
          sub={
            needsApproval
              ? 'Pengajuan dicek Sekretariat Nasional sebelum tiket aktif'
              : 'Tiket dibuat atas nama akun yang sedang aktif'
          }
        />
        <div className="flex gap-3 rounded-[14px] bg-[#efe8da]/70 p-3">
          <Poster src={event.posterUrl} className="w-16 h-16 rounded-[10px] shrink-0" />
          <div className="min-w-0">
            <p className={`${ANTON} text-[18px] text-[#161616] leading-[1.12] tracking-[.01em] break-words`}>{event.nama_event}</p>
            <p className={`${MONO} text-[11px] font-bold text-[#44403c] mt-1 leading-snug`}>{dayTime}</p>
          </div>
        </div>
        <dl className={`mt-3 text-[12.5px] text-[#161616] ${ROWS}`}>
          <div className="flex justify-between gap-3 py-2.5">
            <dt className={`${LABEL} shrink-0 text-[9.5px] leading-[20px] text-[#57534e]`}>Nama</dt>
            <dd className={`${MONO} min-w-0 font-bold text-right break-words`}>{nama || '—'}</dd>
          </div>
          <div className="flex justify-between gap-3 py-2.5">
            <dt className={`${LABEL} shrink-0 text-[9.5px] leading-[20px] text-[#57534e]`}>Email</dt>
            <dd className={`${MONO} min-w-0 font-bold text-right break-words`}>{email || '—'}</dd>
          </div>
        </dl>
        <p className="text-[12px] text-[#57534e] mt-2">
          {needsApproval
            ? 'Setelah disetujui, tiket muncul di My Tickets dan bisa dipakai absen / masuk event.'
            : 'Satu tiket untuk satu akun. Ajak temanmu ambil tiket dari akunnya sendiri.'}
        </p>
        <button type="button" disabled={loading} onClick={takeTicket} className={`mt-4 ${BTN}`}>
          <Strip>{loading ? 'Mengirim...' : needsApproval ? 'Kirim Pengajuan' : 'Ambil Tiket'}</Strip>
        </button>
      </Sheet>
    </PaperMain>
  )
}
