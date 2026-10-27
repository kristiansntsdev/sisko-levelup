'use client'
import { Fragment, Suspense, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import { getCabangs, type CabangOption } from '@/lib/actions/event'
import { upsertJobsPlace } from '@/lib/actions/jobs-place'
import { createRegistrasi, updatePesertaProfile } from '@/lib/actions/registrasi'
import { completeRegistration } from '@/lib/actions/pwa-auth'
import { getPesertaById } from '@/lib/actions/peserta'
import { LEVEL_STEPS, memberCardFromPeserta, type MemberCardData } from '@/lib/pwa-member'
import {
  BTN_RED,
  Field,
  FLD,
  GoogleIcon,
  Hero,
  Icon,
  Logo,
  MemberCard,
  PAGE_BG,
  PanelLabel,
  Sheet,
  SheetHead,
  TintIcon,
  type IconName,
} from '@/components/pwa/ui'
import { Note, Row, SectionCard } from '@/components/alk-v2/ui'

const MK = 'font-[family-name:var(--font-marker)]'
const BOX = 'bg-white rounded-3xl shadow-[0_18px_40px_-14px_rgba(80,20,25,.3)]'
const STEPS = ['Login Google', 'Isi data', 'Kartu jadi']
const LEVEL_ICON: IconName[] = ['user', 'userPlus', 'users', 'sparkle']
const BLANK_CARD: MemberCardData = { no: 'LUP-••••', name: 'Namamu di sini', gender: 'L', pob: '—', dob: '—', church: '—', city: '—', tier: 'TAMU' }

function Screen({ children }: { children: ReactNode }) {
  return (
    <section className={`min-h-screen ${PAGE_BG} pb-safe font-[family-name:var(--font-proto)] text-slate-800`}>
      <div className="max-w-[430px] mx-auto">{children}</div>
    </section>
  )
}

function TopBar({ back, children }: { back?: () => void; children: ReactNode }) {
  return (
    <div className="relative flex items-center justify-center h-11">
      {back && (
        <button type="button" onClick={back} aria-label="Kembali" className="absolute left-0 w-10 h-10 -ml-2 flex items-center justify-center rounded-full active:bg-white/10">
          <Icon name="back" className="w-6 h-6" sw={2.2} />
        </button>
      )}
      {children}
    </div>
  )
}

function Sticker({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-block ${MK} uppercase leading-none whitespace-nowrap bg-[#ffd83d] text-[#161616] px-2.5 py-1.5 shadow-[0_6px_14px_-6px_rgba(40,10,10,.55)] ${className}`}>
      {children}
    </span>
  )
}

function Progress({ at }: { at: number }) {
  return (
    <div className="mt-3" role="progressbar" aria-label="Langkah pendaftaran" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={at + 1}>
      <div className="grid grid-cols-3 gap-1.5">
        {STEPS.map((s, i) => (
          <span key={s} className={`h-1.5 rounded-full ${i <= at ? 'bg-[#ffd83d]' : 'bg-white/25'}`} />
        ))}
      </div>
      <p className="mt-2 text-[11.5px] font-semibold text-white/80">
        Langkah {at + 1} dari {STEPS.length} · {STEPS[at]}
      </p>
    </div>
  )
}

function Headline({ sticker, title, sub }: { sticker: string; title: ReactNode; sub: ReactNode }) {
  return (
    <div className="mt-6 text-center">
      <Sticker className="-rotate-3 text-[13px]">{sticker}</Sticker>
      <h1 className={`${MK} mt-3 text-[clamp(2.4rem,12vw,3.25rem)] leading-[.95] uppercase break-words`}>{title}</h1>
      <p className="mt-3 text-[14px] leading-relaxed text-white/85 max-w-[310px] mx-auto">{sub}</p>
    </div>
  )
}

function CardPreview({ card, tag }: { card: MemberCardData; tag: string }) {
  return (
    <div className="relative -rotate-2">
      <MemberCard m={card} />
      <Sticker className="absolute -top-3 right-4 rotate-6 text-[11px]">{tag}</Sticker>
    </div>
  )
}

function LevelPath({ tag }: { tag: string }) {
  return (
    <ol aria-label="Jalur level anggota" className="mt-2 flex items-start pt-7">
      {LEVEL_STEPS.map(([, label], i) => (
        <Fragment key={label}>
          <li className="relative w-14 shrink-0 flex flex-col items-center gap-1.5">
            {i === 0 && <Sticker className="absolute -top-7 left-0 -rotate-6 text-[10px] px-2 py-1">{tag}</Sticker>}
            <span
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                i === 0 ? 'bg-[#c9232c] text-white ring-4 ring-[#fbeceb]' : 'bg-[#f8f0dd] text-[#96792a] ring-1 ring-[#ecdcb3]'
              }`}
            >
              <Icon name={LEVEL_ICON[i]} className="w-5 h-5" />
            </span>
            <span className={`text-[11.5px] font-bold ${i === 0 ? 'text-[#c9232c]' : 'text-[#96792a]'}`}>{label}</span>
          </li>
          {i < LEVEL_STEPS.length - 1 && <li aria-hidden className="flex-1 mt-5 border-t-2 border-dashed border-[#e7d9b8]" />}
        </Fragment>
      ))}
    </ol>
  )
}

function Loading() {
  return (
    <main className={`min-h-screen ${PAGE_BG} flex items-center justify-center`}>
      <p className="text-sm text-slate-500">Memuat...</p>
    </main>
  )
}

function KotaPicker({
  cabangs,
  value,
  onChange,
}: {
  cabangs: CabangOption[]
  value: string
  onChange: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const selected = cabangs.find((c) => c.id === value)
  const needle = q.trim().toLowerCase()
  const shown = needle ? cabangs.filter((c) => c.nama.toLowerCase().includes(needle)) : cabangs

  function pick(id: string) {
    onChange(id)
    setOpen(false)
    setQ('')
  }

  return (
    <>
      <Field label="LevelUP Kota">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`${FLD} flex items-center gap-2 text-left ${selected ? 'text-slate-900' : 'text-slate-400'}`}
        >
          <Icon name="pin" className={`w-[18px] h-[18px] shrink-0 ${selected ? 'text-[#c9232c]' : 'text-slate-400'}`} />
          <span className="flex-1 min-w-0 truncate font-medium">{selected?.nama ?? 'Cari LevelUP kota...'}</span>
          <Icon name="search" className="w-4 h-4 text-slate-400 shrink-0" />
        </button>
      </Field>
      <Sheet
        open={open}
        onClose={() => {
          setOpen(false)
          setQ('')
        }}
      >
        <SheetHead title="Pilih LevelUP Kota" sub="Ketik nama kota buat nyari lebih cepet" />
        <label className="flex items-center gap-2.5 rounded-full bg-slate-50 ring-1 ring-slate-200 px-4 py-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#c9232c] transition">
          <Icon name="search" className="w-5 h-5 text-[#c9232c]" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari kota..."
            autoFocus
            className="flex-1 min-w-0 bg-transparent outline-none text-[16px] placeholder:text-slate-400"
          />
          {q && (
            <button type="button" onClick={() => setQ('')} aria-label="Hapus pencarian" className="text-slate-400 active:text-slate-600">
              <Icon name="x" className="w-5 h-5" />
            </button>
          )}
        </label>
        <div className="mt-3 space-y-2 max-h-[50vh] overflow-y-auto -mx-1 px-1">
          {shown.length ? (
            shown.map((c) => {
              const on = c.id === value
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pick(c.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left transition ${
                    on ? 'ring-2 ring-[#c9232c] bg-[#fbeceb]/60' : 'ring-1 ring-[#efe3cc] bg-white'
                  }`}
                >
                  <TintIcon name="pin" tint={on ? 'red' : 'gold'} size="w-9 h-9 rounded-xl" icon="w-[18px] h-[18px]" />
                  <span className={`flex-1 min-w-0 font-bold text-[14.5px] truncate ${on ? 'text-[#c9232c]' : 'text-[#3b1417]'}`}>{c.nama}</span>
                  {on && <Icon name="check" className="w-5 h-5 text-[#c9232c] shrink-0" sw={2.6} />}
                </button>
              )
            })
          ) : (
            <p className="text-center text-[13px] text-slate-400 py-8">Gak ketemu “{q.trim()}”</p>
          )}
        </div>
      </Sheet>
    </>
  )
}

function DaftarIntro() {
  const router = useRouter()
  const steps: [IconName, string, string][] = [
    ['user', 'Login pakai Google', 'Gak perlu bikin password, sekali klik beres.'],
    ['edit', 'Isi data singkat', 'Nama, WA, kota, gereja, sekolah / kampus. Kurang dari semenit.'],
    ['card', 'Kartu anggota langsung jadi', 'Mulai sebagai Tamu, terus naik level bareng LevelUP kotamu.'],
  ]
  return (
    <Screen>
      <Hero className="pt-3 pb-32" decor="-right-10 top-16 w-44">
        <TopBar back={() => (window.history.length > 1 ? router.back() : router.push('/'))}>
          <Logo className="h-7 w-auto" />
        </TopBar>
        <Progress at={0} />
        <Headline
          sticker="Gratis · cuma 1 menit"
          title={
            <>
              Gabung
              <br />
              Level <span className="inline-block text-[#ffd83d] text-[1.2em] -rotate-6">UP</span>
            </>
          }
          sub="Jadi bagian dari The Jeremiah Generation — anak muda yang jalan bareng di kotamu."
        />
      </Hero>
      <div className="px-5 -mt-24 relative space-y-6">
        <CardPreview card={BLANK_CARD} tag="kartumu nunggu nih" />
        <div className={`${BOX} p-6`}>
          <h2 className="font-extrabold text-[19px] text-[#3b1417]">Gampang, 3 langkah doang</h2>
          <ol className="mt-5 space-y-4">
            {steps.map(([icon, t, d], n) => (
              <li key={t} className="flex gap-3">
                <span className="relative">
                  <TintIcon name={icon} tint={n === 0 ? 'red' : 'gold'} />
                  <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-[#3b1417] text-[#ffd83d] text-[10.5px] font-bold flex items-center justify-center">
                    {n + 1}
                  </span>
                </span>
                <span className="min-w-0">
                  <span className="block font-bold text-[14.5px] text-[#3b1417]">{t}</span>
                  <span className="block text-[12.5px] text-slate-500 mt-0.5">{d}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="h-px bg-[#f1e7d6] my-5" />
          <PanelLabel>Jalur level kamu</PanelLabel>
          <LevelPath tag="start" />
          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl: '/daftar?step=form' })}
            className={`mt-6 w-full py-3.5 flex items-center justify-center gap-2 ${BTN_RED}`}
          >
            <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
              <GoogleIcon className="w-4 h-4" />
            </span>
            Gas, daftar pakai Google
          </button>
        </div>
        <p className="text-center text-[13px] text-slate-500">
          Udah punya akun?{' '}
          <Link href="/login" className="font-semibold text-[#c9232c]">
            Masuk
          </Link>
        </p>
      </div>
    </Screen>
  )
}

function DaftarFormInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = Number(searchParams.get('eventId')) || 0
  const { data: session, status, update } = useSession()

  const [nama, setNama] = useState('')
  const [nowa, setNowa] = useState('')
  const [kotalevelup, setKotalevelup] = useState('')
  const [cabangs, setCabangs] = useState<CabangOption[]>([])
  const [gereja, setGereja] = useState('')
  const [sekolah, setSekolah] = useState('')
  const [base, setBase] = useState<Partial<MemberCardData>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const needsReg = Boolean(session?.user?.needsRegistration) || (!session?.user?.idPeserta && Boolean(session?.user?.authUserId))
  const city = cabangs.find((c) => c.id === kotalevelup)?.nama ?? ''
  const card: MemberCardData = {
    ...BLANK_CARD,
    ...base,
    name: nama.trim() || BLANK_CARD.name,
    church: gereja.trim() || '—',
    city: city || '—',
    // ponytail: no photo until upload exists — illustration avatar only
    photo: undefined,
  }

  useEffect(() => {
    getCabangs().then(setCabangs)
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      // Intro handles no session; form requires Google first
      return
    }
    const idPeserta = session?.user?.idPeserta
    if (!idPeserta) {
      if (session?.user?.name) setNama(session.user.name)
      return
    }
    getPesertaById(idPeserta).then((p) => {
      if (!p) return
      setBase(memberCardFromPeserta({ ...p, kotaName: '' }))
      setNama(p.nama)
      if (p.nowa) {
        setNowa(p.nowa)
        setKotalevelup(p.kotalevelup)
      }
      if (p.gereja) setGereja(p.gereja)
      if (p.pekerjaan) setSekolah(p.pekerjaan)
    })
  }, [session, status])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nama.trim()) {
      setError('Nama wajib diisi.')
      return
    }
    if (!nowa.trim()) {
      setError('Nomor WA wajib diisi.')
      return
    }
    if (!kotalevelup) {
      setError('Pilih LevelUP kota kamu.')
      return
    }

    setError('')
    setLoading(true)
    try {
      const idTempatKerja = sekolah.trim() ? await upsertJobsPlace(sekolah.trim()) : null
      let idPeserta = session?.user?.idPeserta ?? null

      if (needsReg || !idPeserta) {
        const res = await completeRegistration({
          nama: nama.trim(),
          nowa: nowa.trim(),
          kotalevelup,
          gereja: gereja.trim(),
          sekolah: sekolah.trim(),
          idTempatKerja,
        })
        if ('error' in res) {
          setError(res.error)
          setLoading(false)
          return
        }
        idPeserta = res.idPeserta
        setBase((b) => ({ ...b, no: `LUP-${res.idPeserta}` }))
        await update({ idPeserta: res.idPeserta, needsRegistration: false })
      } else {
        await updatePesertaProfile(idPeserta, {
          nama: nama.trim(),
          nowa: nowa.trim(),
          kotalevelup,
          gereja: gereja.trim(),
          sekolah: sekolah.trim(),
          idTempatKerja,
        })
      }

      if (eventId && idPeserta) {
        const ticket = await createRegistrasi(idPeserta, eventId)
        if ('full' in ticket) {
          setError('Kuota tiket sudah penuh.')
          setLoading(false)
          return
        }
      }
      setDone(true)
      setLoading(false)
    } catch {
      setError('Terjadi kesalahan. Coba lagi.')
      setLoading(false)
    }
  }

  if (status === 'loading') return <Loading />
  if (status === 'unauthenticated') return <DaftarIntro />

  if (done) {
    const first = nama.trim().split(/\s+/)[0] || 'teman'
    return (
      <Screen>
        <Hero className="pt-3 pb-32" decor="-right-10 top-16 w-44">
          <TopBar>
            <Logo className="h-7 w-auto" />
          </TopBar>
          <Progress at={2} />
          <Headline
            sticker="Resmi gabung!"
            title={
              <>
                Welcome,
                <br />
                <span className="text-[#ffd83d]">{first}!</span>
              </>
            }
            sub={<>Kartu anggotamu udah jadi. Sekarang kamu bagian dari <b className="text-white">{city || 'LevelUP'}</b>.</>}
          />
        </Hero>
        <div className="px-5 -mt-24 relative space-y-6">
          <div className="motion-safe:animate-[proto-pop_.4s_ease]">
            <CardPreview card={card} tag="new member" />
          </div>
          <div className={`${BOX} p-5`}>
            <PanelLabel>Level kamu</PanelLabel>
            <LevelPath tag="kamu di sini" />
            <div className="h-px bg-[#f1e7d6] my-4" />
            <PanelLabel>Next up</PanelLabel>
            <div className="-mx-4 mt-1 divide-y divide-slate-100">
              {eventId ? (
                <Row icon="ticket" title="Tiketmu udah aman" sub="Cek QR-nya di menu Tiket" onClick={() => router.push('/dashboard/tiket')} />
              ) : (
                <Row icon="ticket" title="Cari event di kotamu" sub="Ambil tiket, dateng, scan QR" onClick={() => router.push('/events')} />
              )}
              <Row icon="userPlus" tint="gold" title="Naik ke Volunteer" sub="Tinggal klik Join Volunteer di Beranda" onClick={() => router.push('/dashboard')} />
            </div>
          </div>
          <button type="button" onClick={() => router.push('/dashboard')} className={`w-full py-3.5 ${BTN_RED}`}>
            Masuk ke Beranda
          </button>
        </div>
      </Screen>
    )
  }

  return (
    <Screen>
      <Hero className="pt-3 pb-32" decor="-right-10 top-16 w-44">
        <TopBar back={() => router.push(eventId ? `/join/${eventId}` : '/login')}>
          <h2 className="font-bold text-[17px]">Isi Data Diri</h2>
        </TopBar>
        <Progress at={1} />
        <Headline sticker="Hampir kelar" title="Kenalan dulu, yuk!" sub="Kartumu ke-update langsung pas kamu ngetik." />
      </Hero>
      <form onSubmit={handleSubmit} noValidate className="px-5 -mt-24 relative space-y-5">
        <CardPreview card={card} tag="live preview" />
        <SectionCard lift icon="user" tint="red" title="Tentang kamu" sub="Nama & WA buat info event">
          {session?.user?.email && (
            <div className="flex items-center gap-3 rounded-2xl bg-[#faf7f2] ring-1 ring-[#efe3cc] p-3">
              <GoogleIcon className="w-5 h-5 shrink-0" />
              <span className="min-w-0">
                <span className="block text-[11px] font-bold tracking-[.12em] uppercase text-[#96792a]">Akun Google</span>
                <span className="block text-[13.5px] font-semibold text-slate-800 truncate">{session.user.email}</span>
              </span>
            </div>
          )}
          <Field label="Nama lengkap">
            <input className={FLD} autoComplete="name" placeholder="Nama lengkap" value={nama} onChange={(e) => setNama(e.target.value)} />
          </Field>
          <Field label="Nomor WA">
            <input className={FLD} type="tel" inputMode="tel" autoComplete="tel" placeholder="08123456789" value={nowa} onChange={(e) => setNowa(e.target.value)} />
          </Field>
        </SectionCard>
        <SectionCard icon="pin" tint="gold" title="Komunitasmu" sub="Biar nyambung sama LevelUP kotamu">
          <KotaPicker cabangs={cabangs} value={kotalevelup} onChange={setKotalevelup} />
          <Field label="Gereja">
            <input className={FLD} placeholder="Nama gereja" value={gereja} onChange={(e) => setGereja(e.target.value)} />
          </Field>
          <Field label="Sekolah / Kampus / Tempat Kerja">
            <input className={FLD} placeholder="cth: SMAN 1 Ngawi, UNIPMA, PT Maju Jaya" value={sekolah} onChange={(e) => setSekolah(e.target.value)} />
          </Field>
          <p className="-mt-2 text-[12px] text-slate-500">Boleh nama lengkap atau singkatan — tipenya kedeteksi otomatis.</p>
        </SectionCard>
        {needsReg && (
          <Note>
            Kamu mulai sebagai <b>Tamu</b>. Abis ini tinggal <b>Join Volunteer</b> di Beranda, terus ajukan <b>Squad</b> ke LevelUP kotamu.
          </Note>
        )}
        {error && (
          <p role="alert" className="px-4 py-3 rounded-xl bg-rose-50 ring-1 ring-rose-200 text-[13px] text-rose-700 font-medium">
            {error}
          </p>
        )}
        <button type="submit" disabled={loading} className={`w-full py-3.5 ${BTN_RED}`}>
          {loading ? 'Lagi nyetak kartumu…' : eventId ? 'Daftar & ambil tiket' : needsReg ? 'Gas, bikin kartuku' : 'Simpan'}
        </button>
      </form>
    </Screen>
  )
}

function DaftarGate() {
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const step = searchParams.get('step')
  const eventId = searchParams.get('eventId')

  if (status === 'loading') return <Loading />

  // Google callback or explicit form / event profile
  if (session && (step === 'form' || eventId || session.user.needsRegistration || session.user.idPeserta)) {
    return <DaftarFormInner />
  }

  return <DaftarIntro />
}

export default function DaftarPage() {
  return (
    <Suspense>
      <DaftarGate />
    </Suspense>
  )
}
