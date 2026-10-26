'use client'
import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import type { EventSummary } from '@/lib/actions/event'
import { getPesertaById } from '@/lib/actions/peserta'
import { createRegistrasi, findRegistrasiId } from '@/lib/actions/registrasi'
import { USERLEVEL_LABEL } from '@/lib/pwa-member'
import {
  BTN_RED,
  EventThumb,
  Icon,
  PAGE_BG,
  Panel,
  PanelLabel,
  PlainBar,
  Sheet,
  SheetHead,
} from '@/components/pwa/ui'

const TARGET_ROLE: Record<string, string> = { ...USERLEVEL_LABEL, '5': 'Tim Nasional' }
const PENGURUS_ROLE: Record<string, string> = { '1': 'Admin LK', '2': 'BRIM' }

function roleNames(stored: string, map: Record<string, string>) {
  const codes = [...new Set(stored.split(',').map((s) => s.trim()).filter(Boolean))]
  codes.sort((a, b) => Number(a) - Number(b))
  return codes.map((v) => map[v] ?? v)
}

function Disabled({ children }: { children: ReactNode }) {
  return (
    <button disabled className="w-full py-3.5 rounded-xl bg-[#c9232c]/35 text-white text-[17px] font-bold">
      {children}
    </button>
  )
}

export function JoinClient({
  event,
  isRegistered,
  registrasiId: initialRegId,
  registered,
}: {
  event: EventSummary | null
  isRegistered: boolean
  registrasiId: number | null
  registered: number
}) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [more, setMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [regId, setRegId] = useState<number | null>(initialRegId)
  const [over, setOver] = useState(false)
  const [nama, setNama] = useState(session?.user?.name ?? '')
  const [email, setEmail] = useState(session?.user?.email ?? '')
  const mine = Boolean(regId) || isRegistered

  useEffect(() => {
    const idPeserta = session?.user?.idPeserta
    if (!idPeserta) return
    getPesertaById(idPeserta).then((p) => {
      if (p) {
        setNama(p.nama)
        setEmail(p.email)
      }
    })
    if (event && !regId) {
      findRegistrasiId(idPeserta, event.id_event).then((id) => {
        if (id) setRegId(id)
      })
    }
  }, [session?.user?.idPeserta, event, regId])

  if (!event) {
    return (
      <main className={`min-h-screen ${PAGE_BG} font-[family-name:var(--font-proto)]`}>
        <div className="mx-auto w-full max-w-[430px]">
          <PlainBar title="View Event" back={() => router.push('/events')} />
          <p className="p-6 text-sm text-slate-500">Event tidak ditemukan.</p>
        </div>
      </main>
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
      router.push(`/login?callbackUrl=${encodeURIComponent(`/join/${event.id_event}`)}`)
      return
    }
    if (session.user?.needsRegistration || !session.user?.idPeserta) {
      router.push(`/daftar?step=form&eventId=${event.id_event}`)
      return
    }
    setLoading(true)
    const peserta = await getPesertaById(session.user.idPeserta)
    if (!peserta?.nowa) {
      setLoading(false)
      router.push(`/daftar?step=form&eventId=${event.id_event}`)
      return
    }
    const ticket = await createRegistrasi(session.user.idPeserta, event.id_event)
    if ('full' in ticket) {
      setOver(true)
      setConfirmOpen(false)
      setLoading(false)
      return
    }
    setRegId(ticket.id)
    setConfirmOpen(false)
    setLoading(false)
    router.push(`/dashboard/tiket/${ticket.id}`)
  }

  const cta = mine && regId ? (
    <button
      type="button"
      onClick={() => router.push(`/dashboard/tiket/${regId}`)}
      className="w-full py-3.5 rounded-xl bg-white ring-2 ring-[#c9232c] text-[#c9232c] text-[17px] font-bold"
    >
      Lihat Tiket Saya
    </button>
  ) : closed ? (
    <Disabled>Registration Closed</Disabled>
  ) : full ? (
    <Disabled>Registration Full</Disabled>
  ) : (
    <button
      type="button"
      onClick={() => {
        if (status !== 'authenticated') {
          router.push(`/login?callbackUrl=${encodeURIComponent(`/join/${event.id_event}`)}`)
          return
        }
        setConfirmOpen(true)
      }}
      className={`w-full py-3.5 rounded-xl bg-[#c9232c] text-white text-[17px] font-bold shadow-[0_8px_20px_-6px_rgba(201,35,44,.6)] active:scale-[.99] transition`}
    >
      Get Ticket
    </button>
  )

  return (
    <main className={`min-h-screen ${PAGE_BG} font-[family-name:var(--font-proto)] text-slate-800`}>
      <div className="mx-auto w-full max-w-[430px] min-h-screen flex flex-col">
        <PlainBar title="View Event" back={() => router.push('/events')} />
        {event.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- full flyer, no cover crop
          <img src={event.posterUrl} alt="" className="w-full h-auto block shrink-0 bg-slate-200" />
        ) : (
          <EventThumb src="" className="w-full aspect-[16/10] shrink-0" />
        )}
        <div className="flex-1 px-5 pt-5 pb-6 space-y-4">
          <h1 className="text-[24px] font-extrabold text-[#3b1417] leading-tight">{event.nama_event}</h1>

          <Panel>
            <div className="px-5 pt-4 pb-4">
              <PanelLabel>Day &amp; Time</PanelLabel>
              <p className="text-[16px] text-slate-700 mt-1">{dayTime}</p>
              <div className="h-px bg-[#f1e7d6] my-4" />
              <PanelLabel>Location</PanelLabel>
              <p className="text-[16px] text-slate-700 mt-1 flex items-start gap-2">
                <Icon
                  name={event.jenisevent === 'Online' ? 'monitor' : 'pin'}
                  className="w-5 h-5 mt-0.5 shrink-0 text-[#c9232c]"
                />
                {event.alamatevent || (event.jenisevent === 'Online' ? 'Online' : '—')}
              </p>
              {more && (
                <dl className="mt-4 rounded-xl bg-[#faf7f2] ring-1 ring-[#f1e7d6] divide-y divide-[#f1e7d6] text-[14px]">
                  {extra.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3 px-3.5 py-2.5">
                      <dt className="text-slate-500">{k}</dt>
                      <dd className="font-medium text-slate-800 text-right">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
            <button
              type="button"
              onClick={() => setMore(!more)}
              className="w-full py-3.5 border-t border-[#f1e7d6] text-[15px] font-semibold text-[#c9232c]"
            >
              {more ? 'Hide Details' : 'View Details'}
            </button>
          </Panel>

          <Panel className="px-5 py-4">
            <PanelLabel>Eligibility</PanelLabel>
            <p className="flex items-center gap-2 text-[18px] font-semibold mt-1 text-emerald-600">
              <Icon name="check" className="w-5 h-5" sw={2.6} />
              Eligible to Register
            </p>
            <div className="h-px bg-[#f1e7d6] my-4" />
            <p className="text-[16px] font-semibold text-[#3b1417]">Role</p>
            <p className="text-[15px] text-slate-500 mt-1">
              {'• '}
              {targets.length
                ? `Terbuka untuk ${targets.join(', ')}.`
                : 'Terbuka untuk semua anggota.'}
            </p>
          </Panel>

          <Panel className="px-5 py-4">
            <PanelLabel>Registration</PanelLabel>
            <p className={`text-[18px] font-semibold mt-1 ${closed ? 'text-stone-500' : full ? 'text-[#96792a]' : 'text-[#c9232c]'}`}>
              {closed ? 'Closed' : full ? 'Full' : 'Open'}
            </p>
            <p className="text-[15px] text-slate-600 mt-1">{event.tglDisplay} (WIB)</p>
            {quota > 0 && (
              <>
                <div className="mt-3 h-1.5 rounded-full bg-[#f4ece0] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${full ? 'bg-[#b1953a]' : 'bg-[#c9232c]'}`}
                    style={{ width: `${filled}%` }}
                  />
                </div>
                <p className="text-[12.5px] text-slate-400 mt-1.5">{registered} dari {quota} tiket</p>
              </>
            )}
          </Panel>
        </div>

        <div className="sticky bottom-0 z-10 bg-white border-t border-[#f1e7d6] shadow-[0_-8px_24px_-12px_rgba(80,20,25,.25)] px-5 pt-3 pb-[max(env(safe-area-inset-bottom),16px)]">
          {cta}
        </div>
      </div>

      <Sheet open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <SheetHead title="Konfirmasi Pendaftaran" sub="Tiket dibuat atas nama akun yang sedang aktif" />
        <div className="flex gap-3 rounded-2xl bg-[#faf7f2] ring-1 ring-[#efe3cc] p-3">
          <EventThumb src={event.posterUrl} className="w-16 h-16 rounded-xl shrink-0" />
          <div className="min-w-0">
            <p className="font-bold text-[15px] text-[#3b1417] leading-snug">{event.nama_event}</p>
            <p className="text-[12.5px] text-slate-500 mt-0.5">{dayTime}</p>
          </div>
        </div>
        <dl className="mt-3 text-[13.5px] divide-y divide-slate-100">
          <div className="flex justify-between gap-3 py-2.5">
            <dt className="text-slate-500">Nama</dt>
            <dd className="font-semibold text-slate-800 text-right">{nama || '—'}</dd>
          </div>
          <div className="flex justify-between gap-3 py-2.5">
            <dt className="text-slate-500">Email</dt>
            <dd className="font-semibold text-slate-800 text-right truncate">{email || '—'}</dd>
          </div>
        </dl>
        <p className="text-[12px] text-slate-500 mt-2">
          Satu tiket untuk satu akun. Ajak temanmu ambil tiket dari akunnya sendiri.
        </p>
        <button type="button" disabled={loading} onClick={takeTicket} className={`mt-4 w-full py-3.5 ${BTN_RED}`}>
          {loading ? 'Mendaftar...' : 'Ambil Tiket'}
        </button>
      </Sheet>
    </main>
  )
}
