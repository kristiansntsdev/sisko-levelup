'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { getRegistrasiByPeserta } from '@/lib/actions/registrasi'
import {
  BTN,
  IconButton,
  LABEL,
  MONO,
  PaperHeader,
  PaperMain,
  QR_STUB,
  QrStubLabel,
  StateStamp,
  Strip,
  TicketCard,
} from '@/components/pwa/paper-ui'
import { Icon } from '@/components/pwa/ui'

type Registrasi = Awaited<ReturnType<typeof getRegistrasiByPeserta>>[number]

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
    <PaperMain>
      <PaperHeader
        sticker={`Tiket milik ${nama || 'kamu'}`}
        title="My Tickets"
        action={<IconButton icon="calendar" label="Events" onClick={() => router.push('/events')} />}
      >
        <p className={`${MONO} mt-1 text-[12px] text-[#44403c]`}>Tunjukkan QR ke panitia saat absen.</p>
      </PaperHeader>

      <div className="px-5 pt-4 pb-6">
        <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-[#fffdf7] text-[#161616]">
          {(['aktif', 'riwayat'] as const).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={tab === k}
              onClick={() => setTab(k)}
              className={`${LABEL} py-2.5 rounded-full text-[11.5px] font-bold transition ${tab === k ? 'bg-[#161616] text-[#fbf6ec]' : ''}`}
            >
              {k === 'aktif' ? 'Aktif' : 'Riwayat'} <span className={tab === k ? 'text-[#ffd83d]' : 'text-[#c21f24]'}>{count(k === 'aktif')}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          {loading ? (
            <p className={`${LABEL} text-center text-[12px] text-[#57534e] py-10`}>Memuat...</p>
          ) : list.length ? (
            list.map((r) => (
              <TicketCard
                key={r.id_registrasi}
                href={`/dashboard/tiket/${r.id_registrasi}`}
                poster={r.posterUrl}
                label={`${r.category} · ${r.jenisevent || 'Event'}`}
                title={r.nama_event}
                meta={`${r.tglDisplay}${r.jamevent ? ` · ${r.jamevent} WIB` : ''}`}
                stamp={<StateStamp state={r.ticketState} />}
                stub={<QrStubLabel />}
                stubClassName={QR_STUB}
              />
            ))
          ) : (
            <div className="rounded-[14px] border-2 border-dotted border-[#161616]/30 text-center py-8 px-5">
              <Icon name="ticket" className="w-10 h-10 mx-auto text-[#c21f24]" sw={1.5} />
              <p className={`${LABEL} mt-2 text-[11px] text-[#57534e]`}>{tab === 'aktif' ? 'Belum ada tiket aktif' : 'Belum ada riwayat tiket'}</p>
            </div>
          )}
        </div>

        <Link href="/events" className={`${BTN} mt-6 -rotate-[.6deg]`}>
          <Strip>Cari event lain →</Strip>
        </Link>
      </div>
    </PaperMain>
  )
}
