'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { getRegistrasiByPeserta } from '@/lib/actions/registrasi'
import { EventThumb, Icon, PAGE_BG, Pill, PlainBar, type PillTone } from '@/components/pwa/ui'

type Registrasi = Awaited<ReturnType<typeof getRegistrasiByPeserta>>[number]

const TICKET_TONE: Record<Registrasi['ticketState'], PillTone> = {
  Terdaftar: 'gold',
  Hadir: 'green',
  'Tidak hadir': 'slate',
}

function TicketRow({ r, onClick }: { r: Registrasi; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-full flex bg-white rounded-[20px] ring-1 ring-[#f1e7d6] shadow-[0_12px_26px_-16px_rgba(80,20,25,.5)] text-left active:scale-[.99] transition"
    >
      <EventThumb src={r.posterUrl} className="w-[96px] h-[112px] rounded-l-[20px] shrink-0" />
      <div className="flex-1 min-w-0 px-3.5 py-3 flex flex-col justify-center">
        <p className="text-[12px] font-semibold text-[#96792a] truncate">
          {r.category} · {r.jenisevent || 'Event'}
        </p>
        <p className="text-[15px] font-bold text-[#3b1417] leading-snug line-clamp-2">{r.nama_event}</p>
        <p className="text-[12px] text-slate-500 mt-0.5">
          {r.tglDisplay}
          {r.jamevent ? ` · ${r.jamevent} WIB` : ''}
        </p>
        <div className="mt-1.5 flex">
          <Pill tone={TICKET_TONE[r.ticketState]}>{r.ticketState}</Pill>
        </div>
      </div>
      <div className="w-[58px] shrink-0 border-l-2 border-dashed border-[#efd3d3] bg-[#fbeceb]/60 rounded-r-[20px] flex flex-col items-center justify-center text-[#c9232c]">
        <Icon name="qr" className="w-7 h-7" />
        <span className="text-[10px] font-bold tracking-wider mt-1">QR</span>
      </div>
      <span className={`absolute right-[51px] -top-2 w-4 h-4 rounded-full ${PAGE_BG}`} />
      <span className={`absolute right-[51px] -bottom-2 w-4 h-4 rounded-full ${PAGE_BG}`} />
    </button>
  )
}

export default function TiketListPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [regs, setRegs] = useState<Registrasi[]>([])
  const [tab, setTab] = useState<'aktif' | 'riwayat'>('aktif')
  const [loading, setLoading] = useState(true)
  const [nama, setNama] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=/dashboard/tiket')
      return
    }
    const id = session?.user?.idPeserta
    if (!id) return
    setNama(session.user?.name?.split(/\s+/)[0] ?? '')
    getRegistrasiByPeserta(id).then((r) => {
      setRegs(r)
      setLoading(false)
    })
  }, [session, status, router])

  const aktif = regs.filter((r) => r.active)
  const riwayat = regs.filter((r) => !r.active)
  const list = tab === 'aktif' ? aktif : riwayat
  const count = (active: boolean) => regs.filter((r) => r.active === active).length

  return (
    <main>
      <PlainBar
        title="My Tickets"
        right={
          <button
            type="button"
            onClick={() => router.push('/events')}
            aria-label="Events"
            className="w-11 h-11 flex items-center justify-center rounded-full active:bg-white/10"
          >
            <Icon name="calendar" className="w-6 h-6" sw={1.6} />
          </button>
        }
      />
      <div className="px-4 pt-4 pb-6">
        <p className="text-[13px] text-slate-500">
          Tiket milik <b className="text-slate-700">{nama || 'kamu'}</b>. Tunjukkan QR ke panitia saat absen.
        </p>
        <div className="grid grid-cols-2 p-1 rounded-full bg-white ring-1 ring-[#efe3cc] mt-3 text-[14px] font-semibold">
          {(['aktif', 'riwayat'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`py-2 rounded-full transition ${tab === k ? 'bg-[#3b1417] text-white shadow-sm' : 'text-slate-500'}`}
            >
              {k === 'aktif' ? 'Aktif' : 'Riwayat'}{' '}
              <span className={tab === k ? 'text-[#e6cd7e]' : 'text-slate-400'}>{count(k === 'aktif')}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3.5">
          {loading ? (
            <p className="text-center text-sm text-slate-400 py-10">Memuat...</p>
          ) : list.length ? (
            list.map((r) => (
              <TicketRow key={r.id_registrasi} r={r} onClick={() => router.push(`/dashboard/tiket/${r.id_registrasi}`)} />
            ))
          ) : (
            <div className="text-center py-10">
              <Icon name="ticket" className="w-12 h-12 mx-auto text-[#e6cd7e]" sw={1.4} />
              <p className="text-[14px] text-slate-500 mt-2">
                {tab === 'aktif' ? 'Belum ada tiket aktif' : 'Belum ada riwayat tiket'}
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => router.push('/events')}
          className="mt-4 w-full py-3 text-[14px] font-semibold text-[#c9232c]"
        >
          Cari event lain →
        </button>
      </div>
    </main>
  )
}
