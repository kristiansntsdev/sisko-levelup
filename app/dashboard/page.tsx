'use client'
import { Fragment, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { getCabangs, type CabangOption } from '@/lib/actions/event'
import { getMemberCardForPeserta, getPesertaById } from '@/lib/actions/peserta'
import { getRegistrasiByPeserta } from '@/lib/actions/registrasi'
import { getPendingSquadForMe, joinSquad, joinVolunteer } from '@/lib/actions/upgrade'
import { getActiveSessions } from '@/lib/actions/pwa-auth'
import { LEVEL_STEPS, USERLEVEL_LABEL, type MemberCardData } from '@/lib/pwa-member'
import {
  BTN_RED,
  Field,
  FLD,
  Hero,
  Icon,
  MemberCard,
  ModeSwitch,
  PAGE_BG,
  Pill,
  Sheet,
  SheetHead,
  TintIcon,
  Toast,
  type IconName,
  type Tint,
} from '@/components/pwa/ui'

type Registrasi = Awaited<ReturnType<typeof getRegistrasiByPeserta>>[number]

const FEATURES: { i: IconName; t: string; tint: Tint; href?: string }[] = [
  { i: 'ticket', t: 'My Ticket', tint: 'red', href: '/dashboard/tiket' },
  { i: 'users', t: 'Pemuridan', tint: 'red' },
  { i: 'calendar', t: 'Event', tint: 'red', href: '/events' },
  { i: 'book', t: 'DeeperWP', tint: 'gold' },
  { i: 'gift', t: 'Birthday', tint: 'gold' },
  { i: 'chat', t: 'Kesaksian', tint: 'gold', href: '/dashboard/kesaksian' },
]

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [registrasi, setRegistrasi] = useState<Registrasi[]>([])
  const [nama, setNama] = useState('')
  const [userLevel, setUserLevel] = useState<string | null>(null)
  const [card, setCard] = useState<MemberCardData | null>(null)
  const [pendingSquad, setPendingSquad] = useState(false)
  const [kotalevelup, setKotalevelup] = useState('')
  const [cabangs, setCabangs] = useState<CabangOption[]>([])
  const [squadOpen, setSquadOpen] = useState(false)
  const [joinLoading, setJoinLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pengurusDest, setPengurusDest] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [soon, setSoon] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=/dashboard')
      return
    }
    if (session?.user?.needsRegistration || (session && !session.user.idPeserta && session.user.authUserId)) {
      router.replace('/daftar?step=form')
      return
    }
  }, [session, status, router])

  useEffect(() => {
    const idPeserta = session?.user?.idPeserta
    if (!idPeserta) return
    setLoading(true)
    Promise.all([
      getRegistrasiByPeserta(idPeserta),
      getPesertaById(idPeserta),
      getMemberCardForPeserta(idPeserta),
      getPendingSquadForMe(),
      getCabangs(),
      getActiveSessions(),
    ]).then(([regs, p, c, pending, cabs, sessions]) => {
      setRegistrasi(regs)
      setPendingSquad(pending)
      setCabangs(cabs)
      setCard(c)
      if (p) {
        setNama(p.nama)
        setUserLevel(p.userlevel)
        setKotalevelup(p.kotalevelup)
      }
      setPengurusDest(sessions.pengurus?.dest ?? null)
      setLoading(false)
    })
  }, [session?.user?.idPeserta])

  async function handleVolunteer() {
    if (joinLoading) return
    setJoinLoading(true)
    const res = await joinVolunteer()
    if (res.ok) {
      setUserLevel('1')
      setToast('Kamu sekarang Volunteer')
    }
    setJoinLoading(false)
  }

  async function handleSquad(kota: string) {
    if (!kota || joinLoading) return
    setJoinLoading(true)
    const res = await joinSquad(kota)
    if (res.ok) {
      setPendingSquad(true)
      setKotalevelup(kota)
      setSquadOpen(false)
      setToast('Pengajuan Squad terkirim')
    }
    setJoinLoading(false)
  }

  function flash(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2400)
  }

  if (status === 'loading' || loading) {
    return (
      <main className={`min-h-screen ${PAGE_BG} flex items-center justify-center`}>
        <p className="text-sm text-slate-500">Memuat...</p>
      </main>
    )
  }

  const first = nama.trim().split(/\s+/)[0] || 'teman'
  const at = LEVEL_STEPS.findIndex(([l]) => l === userLevel)
  const upcoming = registrasi.filter((r) => r.active).slice(0, 3)

  return (
    <main>
      <Hero className="pt-5 pb-20 rounded-b-[32px]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-white/80 text-[13px]">Selamat datang,</p>
            <h1 className="font-extrabold text-[24px] leading-tight">{first}</h1>
          </div>
          <button
            type="button"
            aria-label="Notifikasi"
            onClick={() => setSoon('Pengumuman')}
            className="w-11 h-11 shrink-0 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center relative ring-1 ring-white/25"
          >
            <Icon name="bell" className="w-5 h-5" />
          </button>
        </div>
        {pengurusDest && (
          <div className="mt-4">
            <ModeSwitch
              alk={false}
              onChange={(alk) => {
                if (alk) router.push(pengurusDest)
              }}
            />
          </div>
        )}
      </Hero>

      <div className="px-5 -mt-12 relative z-10 space-y-5">
        {card && (
          <MemberCard m={card} onClick={() => router.push('/dashboard/kartu')} />
        )}

        {at >= 0 && at < 3 && (
          <div className="bg-white rounded-2xl ring-1 ring-[#f1e7d6] shadow-[0_10px_30px_-16px_rgba(80,20,25,.35)] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-extrabold text-[15px] text-[#3b1417]">Level Anggota</p>
              <Pill tone="gold">{USERLEVEL_LABEL[userLevel ?? '0'] ?? 'Tamu'}</Pill>
            </div>
            <div className="flex items-start mt-3">
              {LEVEL_STEPS.map(([l, label], i) => (
                <Fragment key={l}>
                  <div className="flex flex-col items-center w-14 shrink-0">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${
                        i < at
                          ? 'bg-[#c3a54d] text-white'
                          : i === at
                            ? 'bg-[#c9232c] text-white ring-4 ring-[#fbeceb]'
                            : 'bg-[#f4ece0] text-[#c4b08a]'
                      }`}
                    >
                      {i < at ? <Icon name="check" className="w-4 h-4" sw={3} /> : i + 1}
                    </span>
                    <span className={`text-[10.5px] mt-1.5 font-semibold ${i === at ? 'text-[#c9232c]' : i < at ? 'text-[#96792a]' : 'text-slate-400'}`}>
                      {label}
                    </span>
                  </div>
                  {i < LEVEL_STEPS.length - 1 && (
                    <span className={`flex-1 h-0.5 mt-3.5 ${i < at ? 'bg-[#c3a54d]' : 'bg-[#f1e7d6]'}`} />
                  )}
                </Fragment>
              ))}
            </div>
            {userLevel === '0' && (
              <>
                <p className="text-[12.5px] text-slate-500 mt-3">Gabung jadi Volunteer untuk ikut melayani di event LevelUP.</p>
                <button type="button" disabled={joinLoading} onClick={handleVolunteer} className={`mt-3 w-full py-3 ${BTN_RED}`}>
                  Join Volunteer
                </button>
              </>
            )}
            {userLevel === '1' && !pendingSquad && (
              <>
                <p className="text-[12.5px] text-slate-500 mt-3">Ajukan jadi Squad di LevelUP kota kamu.</p>
                <button type="button" onClick={() => setSquadOpen(true)} className={`mt-3 w-full py-3 ${BTN_RED}`}>
                  Join Squad
                </button>
              </>
            )}
            {userLevel === '1' && pendingSquad && (
              <>
                <p className="mt-3 flex items-center gap-2 rounded-xl bg-[#f8f0dd] ring-1 ring-[#ecdcb3] px-3 py-2.5 text-[12.5px] text-[#6b551c]">
                  <Icon name="clock" className="w-4 h-4 shrink-0 text-[#96792a]" />
                  Menunggu approval ALK
                </p>
                <button type="button" onClick={() => setSquadOpen(true)} className="mt-3 w-full py-3 rounded-2xl bg-white ring-2 ring-[#c9232c] text-[#c9232c] font-bold">
                  Pindahkan Pengajuan
                </button>
              </>
            )}
            {userLevel === '2' && (
              <>
                <p className="text-[12.5px] text-slate-500 mt-3">Kamu sudah Squad. Pengajuan Core belum dibuka.</p>
                <button type="button" disabled className={`mt-3 w-full py-3 ${BTN_RED}`}>
                  Join Core · Segera
                </button>
              </>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2.5">
          {FEATURES.map((f) =>
            f.href ? (
              <Link
                key={f.t}
                href={f.href}
                className="bg-white rounded-2xl ring-1 ring-slate-100 p-3 flex flex-col items-center gap-2 active:scale-[.98] transition"
              >
                <TintIcon name={f.i} tint={f.tint} />
                <span className="text-[11.5px] font-semibold text-slate-700 text-center">{f.t}</span>
              </Link>
            ) : (
              <button
                key={f.t}
                type="button"
                onClick={() => {
                  setSoon(f.t)
                  flash(`${f.t} segera hadir`)
                }}
                className="bg-white rounded-2xl ring-1 ring-slate-100 p-3 flex flex-col items-center gap-2 active:scale-[.98] transition"
              >
                <TintIcon name={f.i} tint={f.tint} />
                <span className="text-[11.5px] font-semibold text-slate-700 text-center">{f.t}</span>
              </button>
            ),
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2 px-0.5">
            <h3 className="font-extrabold text-[16px] text-[#3b1417]">Tiket Aktif</h3>
            <Link href="/dashboard/tiket" className="text-[12.5px] font-semibold text-[#c9232c]">
              Semua
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="bg-white rounded-2xl ring-1 ring-slate-100 text-center text-[13px] text-slate-400 py-6">
              Belum ada tiket bulan ini
            </p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((r) => (
                <Link
                  key={r.id_registrasi}
                  href={`/dashboard/tiket/${r.id_registrasi}`}
                  className="relative flex bg-white rounded-[20px] ring-1 ring-[#f1e7d6] shadow-[0_12px_26px_-16px_rgba(80,20,25,.5)] active:scale-[.99] transition"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.posterUrl || '/prototype/levelup-logo.png'}
                    alt=""
                    className="w-[88px] h-[100px] object-cover rounded-l-[20px] shrink-0 bg-slate-100"
                  />
                  <span className="flex-1 min-w-0 px-3.5 py-3 flex flex-col justify-center">
                    <span className="block text-[12px] font-semibold text-[#96792a] truncate">
                      {r.category} · {r.jenisevent || 'Event'}
                    </span>
                    <span className="block text-[14.5px] font-bold text-[#3b1417] leading-snug line-clamp-2">{r.nama_event}</span>
                    <span className="block text-[12px] text-slate-500 mt-0.5">
                      {r.tglDisplay}
                      {r.jamevent ? ` · ${r.jamevent}` : ''}
                    </span>
                  </span>
                  <span className="w-[52px] shrink-0 border-l-2 border-dashed border-[#efd3d3] bg-[#fbeceb]/60 rounded-r-[20px] flex flex-col items-center justify-center text-[#c9232c]">
                    <Icon name="qr" className="w-6 h-6" />
                    <span className="text-[9px] font-bold tracking-wider mt-0.5">QR</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <Link
          href="/events"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-white ring-1 ring-slate-200 font-semibold text-slate-700"
        >
          <Icon name="calendar" className="w-5 h-5 text-[#c9232c]" />
          Lihat Semua Event
        </Link>
      </div>

      <Sheet open={squadOpen} onClose={() => setSquadOpen(false)}>
        <SheetHead
          title={pendingSquad ? 'Pengajuan Squad' : 'Ajukan Jadi Member Kota'}
          sub={pendingSquad ? 'Salah kota? Pindahkan pengajuan di sini.' : 'Pilih LevelUP kota tujuan.'}
        />
        <Field label="LevelUP Kota">
          <select className={FLD} value={kotalevelup} onChange={(e) => setKotalevelup(e.target.value)}>
            <option value="" disabled>
              Pilih LevelUP...
            </option>
            {cabangs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nama}
              </option>
            ))}
          </select>
        </Field>
        <button
          type="button"
          disabled={!kotalevelup || joinLoading}
          onClick={() => handleSquad(kotalevelup)}
          className={`mt-4 w-full py-3.5 ${BTN_RED}`}
        >
          {pendingSquad ? 'Pindahkan Pengajuan' : 'Ajukan'}
        </button>
      </Sheet>

      <Sheet open={Boolean(soon)} onClose={() => setSoon(null)}>
        <SheetHead title={soon ?? ''} sub="Fitur ini segera hadir." />
        <button type="button" onClick={() => setSoon(null)} className={`w-full py-3.5 ${BTN_RED}`}>
          Tutup
        </button>
      </Sheet>

      <Toast msg={toast} />
    </main>
  )
}
