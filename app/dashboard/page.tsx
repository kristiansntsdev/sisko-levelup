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
import { getBetaAksesSaya } from '@/lib/actions/beta'
import { BETA_WEWORSHIP, WEWORSHIP_URL } from '@/lib/beta'
import { LEVEL_STEPS, USERLEVEL_LABEL, type MemberCardData } from '@/lib/pwa-member'
import { PEMURIDAN_AKTIF } from '@/lib/pemuridan'
import { ID_FONTS, MemberCard } from '@/components/pwa/member-card'
import {
  ANTON,
  BTN,
  IconButton,
  LABEL,
  LIFTED,
  MONO,
  PANEL,
  PaperHeader,
  PaperMain,
  PaperToast,
  PRESS,
  QR_STUB,
  QrStubLabel,
  SectionHead,
  Strip,
  TAPE,
  TicketCard,
} from '@/components/pwa/paper-ui'
import { Field, FLD, Icon, Sheet, SheetHead, type IconName } from '@/components/pwa/ui'

type Registrasi = Awaited<ReturnType<typeof getRegistrasiByPeserta>>[number]

/** `beta`: tile hanya terbuka untuk anggota yang punya baris beta_akses dengan fitur itu; anggota lain melihat Soon. */
const FEATURES: { i: IconName; t: string; href?: string; chip?: string; beta?: string }[] = [
  { i: 'ticket', t: 'My Ticket', href: '/dashboard/tiket', chip: 'bg-[#e02a2f] text-white' },
  PEMURIDAN_AKTIF
    ? { i: 'users', t: 'Pemuridan', href: '/dashboard/pemuridan', chip: 'bg-[#161616] text-[#ffd83d]' }
    : { i: 'users', t: 'Pemuridan' },
  { i: 'calendar', t: 'Event', href: '/events', chip: 'bg-[#ffd83d] text-[#161616]' },
  { i: 'book', t: 'DeeperWP' },
  { i: 'music', t: 'WeWorship', href: WEWORSHIP_URL, chip: 'bg-[#e02a2f] text-white', beta: BETA_WEWORSHIP },
  { i: 'chat', t: 'Kesaksian', href: '/dashboard/kesaksian', chip: 'bg-[#161616] text-[#ffd83d]' },
]

const TILT = ['-rotate-1', 'rotate-1', '-rotate-[.5deg]', 'rotate-[.5deg]', '-rotate-1', 'rotate-1']

function LevelPanel({
  level,
  pendingSquad,
  joinLoading,
  onVolunteer,
  onSquad,
}: {
  level: string
  pendingSquad: boolean
  joinLoading: boolean
  onVolunteer: () => void
  onSquad: () => void
}) {
  const at = LEVEL_STEPS.findIndex(([l]) => l === level)
  const note = `${MONO} mt-4 text-[12px] leading-relaxed text-[#44403c]`
  return (
    <section aria-label="Level Anggota" className={`relative mt-4 px-4 pt-4 pb-5 ${PANEL}`}>
      <span className={`${LABEL} absolute right-4 -top-[22px] h-7 pt-1.5 px-3 rounded-t-[10px] bg-[#fffdf7] text-[10.5px] font-bold`}>
        Level – {USERLEVEL_LABEL[level] ?? 'Tamu'}
      </span>
      <span aria-hidden className={`${TAPE} -left-4 -top-1`} />
      <h2 className={`${ANTON} text-[24px] leading-none pb-3 border-b-2 border-dotted border-[#161616]/40`}>Level Anggota</h2>

      <ol aria-label="Jalur level anggota" className="mt-4 flex items-start">
        {LEVEL_STEPS.map(([l, label], i) => (
          <Fragment key={l}>
            <li aria-current={i === at ? 'step' : undefined} className="w-[60px] shrink-0 flex flex-col items-center">
              <span
                className={`w-9 h-9 rounded-full flex items-center justify-center ${ANTON} text-[17px] ${
                  i < at
                    ? 'bg-[#ffd83d]'
                    : i === at
                      ? 'bg-[#e02a2f] text-white outline-2 outline-offset-2 outline-[#e02a2f]'
                      : 'border-2 border-dotted border-[#161616]/40 text-[#57534e]'
                }`}
              >
                {i < at ? <Icon name="check" className="w-[18px] h-[18px]" sw={3} /> : i + 1}
              </span>
              <span className={`${ANTON} mt-2 text-[12.5px] tracking-[.03em] ${i <= at ? '' : 'text-[#57534e]'}`}>{label}</span>
            </li>
            {i < LEVEL_STEPS.length - 1 && (
              <li aria-hidden className={`flex-1 mt-[17px] border-t-2 ${i < at ? 'border-[#161616]' : 'border-dotted border-[#161616]/35'}`} />
            )}
          </Fragment>
        ))}
      </ol>

      {level === '0' && (
        <>
          <p className={note}>Gabung jadi Volunteer untuk ikut melayani di event LevelUP.</p>
          <button type="button" disabled={joinLoading} onClick={onVolunteer} className={`mt-3 ${BTN}`}>
            <Strip>Join Volunteer</Strip>
          </button>
        </>
      )}
      {level === '1' && !pendingSquad && (
        <>
          <p className={note}>Ajukan jadi Squad di LevelUP kota kamu.</p>
          <button type="button" onClick={onSquad} className={`mt-3 ${BTN}`}>
            <Strip>Join Squad</Strip>
          </button>
        </>
      )}
      {level === '1' && pendingSquad && (
        <>
          <p className={`${MONO} mt-4 flex items-center gap-2 rounded-[10px] border-2 border-dotted border-[#161616]/50 px-3 py-2.5 text-[12px] font-bold`}>
            <Icon name="clock" className="w-4 h-4 shrink-0" />
            Menunggu approval ALK
          </p>
          <button type="button" onClick={onSquad} className={`mt-3 w-full py-3 rounded-sm ring-2 ring-[#161616] ${ANTON} text-[19px] tracking-[.03em] ${PRESS}`}>
            Pindahkan Pengajuan
          </button>
        </>
      )}
      {level === '2' && (
        <>
          <p className={note}>Kamu sudah Squad. Pengajuan Core belum dibuka.</p>
          <button type="button" disabled className={`mt-3 ${BTN}`}>
            <Strip>Join Core · Segera</Strip>
          </button>
        </>
      )}
    </section>
  )
}

function FeatureTile({
  f,
  tilt,
  beta,
  onSoon,
}: {
  f: (typeof FEATURES)[number]
  tilt: string
  beta: string[]
  onSoon: (t: string) => void
}) {
  const base = `relative h-[104px] rounded-[14px] flex flex-col items-center justify-center gap-2 text-[#161616] ${tilt} ${PRESS}`
  const label = <span className={`${ANTON} text-[14.5px] leading-none tracking-[.02em] text-center`}>{f.t}</span>
  if (f.href && (!f.beta || beta.includes(f.beta))) {
    const body = (
      <>
        <span className={`w-11 h-11 rounded-[10px] -rotate-3 flex items-center justify-center ${f.chip}`}>
          <Icon name={f.i} className="w-[22px] h-[22px]" />
        </span>
        {label}
        {f.beta && <span className={`${LABEL} absolute right-1.5 top-1.5 rotate-6 text-[8.5px] font-bold text-[#c21f24]`}>Beta</span>}
      </>
    )
    // Situs luar dibuka di tab baru (PWA terpasang: in-app browser), jadi Beranda tetap terbuka di belakangnya.
    return f.href.startsWith('http') ? (
      <a href={f.href} target="_blank" rel="noopener" className={`${base} bg-[#fffdf7] ${LIFTED}`}>
        {body}
      </a>
    ) : (
      <Link href={f.href} className={`${base} bg-[#fffdf7] ${LIFTED}`}>
        {body}
      </Link>
    )
  }
  return (
    <button type="button" onClick={() => onSoon(f.t)} className={`${base} border-2 border-dotted border-[#161616]/30`}>
      <span className="w-11 h-11 rounded-[10px] bg-[#161616]/[.07] -rotate-3 flex items-center justify-center">
        <Icon name={f.i} className="w-[22px] h-[22px]" />
      </span>
      {label}
      <span className={`${LABEL} absolute right-1.5 top-1.5 rotate-6 text-[8.5px] font-bold text-[#c21f24]`}>Soon</span>
    </button>
  )
}

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
  const [beta, setBeta] = useState<string[]>([])

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
      getBetaAksesSaya(),
    ]).then(([regs, p, c, pending, cabs, sessions, fitur]) => {
      setBeta(fitur)
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

  function flash(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2400)
  }

  async function handleVolunteer() {
    if (joinLoading) return
    setJoinLoading(true)
    const res = await joinVolunteer()
    if (res.ok) {
      setUserLevel('1')
      flash('Kamu sekarang Volunteer')
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
      flash('Pengajuan Squad terkirim')
    }
    setJoinLoading(false)
  }

  if (status === 'loading' || loading) {
    return (
      <main className={`${ID_FONTS} min-h-screen flex items-center justify-center`}>
        <p className={`${LABEL} text-[12px] text-[#57534e]`}>Memuat...</p>
      </main>
    )
  }

  const first = nama.trim().split(/\s+/)[0] || 'teman'
  const at = LEVEL_STEPS.findIndex(([l]) => l === userLevel)
  const upcoming = registrasi.filter((r) => r.active).slice(0, 3)

  return (
    <PaperMain>
      <PaperHeader
        sticker="Selamat datang,"
        title={first}
        action={<IconButton icon="bell" label="Notifikasi" onClick={() => setSoon('Pengumuman')} />}
      >
        {pengurusDest && (
          <div className="mt-4 grid grid-cols-2 gap-1 p-1 rounded-full bg-[#fffdf7] text-[13px] font-semibold text-[#161616]">
            <span aria-current="true" className="flex items-center justify-center gap-1.5 py-2 rounded-full bg-[#161616] text-[#ffd83d]">
              <Icon name="card" className="w-4 h-4" />
              Kartu Saya
            </span>
            <button type="button" onClick={() => router.push(pengurusDest)} className="flex items-center justify-center gap-1.5 py-2 rounded-full">
              <Icon name="shield" className="w-4 h-4" />
              Akun Sekretariat
            </button>
          </div>
        )}
      </PaperHeader>

      <div className="px-5 mt-4 flex flex-col gap-7">
        {card && <MemberCard m={card} onClick={() => router.push('/dashboard/kartu')} />}

        {at >= 0 && at < 3 && userLevel && (
          <LevelPanel
            level={userLevel}
            pendingSquad={pendingSquad}
            joinLoading={joinLoading}
            onVolunteer={handleVolunteer}
            onSquad={() => setSquadOpen(true)}
          />
        )}

        <div className="grid grid-cols-3 gap-2.5">
          {FEATURES.map((f, i) => (
            <FeatureTile key={f.t} f={f} tilt={TILT[i]} beta={beta} onSoon={setSoon} />
          ))}
        </div>

        <section>
          <SectionHead title="Tiket Aktif" action={{ href: '/dashboard/tiket', label: 'Semua' }} />
          {upcoming.length === 0 ? (
            <p className={`${LABEL} rounded-[14px] border-2 border-dotted border-[#161616]/30 text-center text-[11px] text-[#57534e] py-7 px-4`}>
              Belum ada tiket bulan ini
            </p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((r) => (
                <TicketCard
                  key={r.id_registrasi}
                  href={`/dashboard/tiket/${r.id_registrasi}`}
                  poster={r.posterUrl}
                  label={`${r.category} · ${r.jenisevent || 'Event'}`}
                  title={r.nama_event}
                  meta={`${r.tglDisplay}${r.jamevent ? ` · ${r.jamevent}` : ''}`}
                  stub={<QrStubLabel />}
                  stubClassName={QR_STUB}
                />
              ))}
            </div>
          )}
        </section>

        <Link href="/events" className={`${BTN} -rotate-[.6deg]`}>
          <Strip className="py-3.5 text-[21px]">
            <Icon name="calendar" className="w-5 h-5" />
            Lihat Semua Event
          </Strip>
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
        <button type="button" disabled={!kotalevelup || joinLoading} onClick={() => handleSquad(kotalevelup)} className={`mt-4 ${BTN}`}>
          <Strip>{pendingSquad ? 'Pindahkan Pengajuan' : 'Ajukan'}</Strip>
        </button>
      </Sheet>

      <Sheet open={Boolean(soon)} onClose={() => setSoon(null)}>
        <SheetHead title={soon ?? ''} sub="Fitur ini segera hadir." />
        <button type="button" onClick={() => setSoon(null)} className={BTN}>
          <Strip>Tutup</Strip>
        </button>
      </Sheet>

      <PaperToast msg={toast} />
    </PaperMain>
  )
}
