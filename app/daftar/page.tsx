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
import { fit, MemberCard } from '@/components/pwa/member-card'
import {
  ANTON,
  BTN,
  Chip,
  ERROR,
  IconButton,
  LABEL,
  LogoChip,
  MONO,
  PANEL,
  PAPER_INPUT,
  PaperField,
  PaperMain,
  PaperNote,
  PaperSection,
  ROWS,
  StickerLabel,
  Strip,
  TAPE,
  TORN_EDGE,
} from '@/components/pwa/paper-ui'
import { GoogleIcon, Icon, Sheet, SheetHead, type IconName } from '@/components/pwa/ui'

const STEPS = ['Login Google', 'Isi data', 'Kartu jadi']
const LEVEL_ICON: IconName[] = ['user', 'userPlus', 'users', 'sparkle']
const BLANK_CARD: MemberCardData = { no: 'LUP-••••', name: 'Namamu di sini', gender: 'L', pob: '—', dob: '—', church: '—', city: '—', tier: 'TAMU' }
const SUBLABEL = `${LABEL} text-[9.5px] font-bold text-[#57534e]`

function TopRow({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-3 min-h-11">{children}</div>
}

function BackButton({ onClick }: { onClick: () => void }) {
  return <IconButton icon="back" label="Kembali" onClick={onClick} className="-rotate-3" />
}

function Sticker({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-block ${ANTON} leading-none whitespace-nowrap tracking-[.03em] bg-[#ffd83d] text-[#161616] px-3 py-1.5 ${className}`} style={TORN_EDGE}>
      {children}
    </span>
  )
}

function Progress({ at }: { at: number }) {
  return (
    <div className="mt-3" role="progressbar" aria-label="Langkah pendaftaran" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={at + 1}>
      <div className="grid grid-cols-3 gap-1.5">
        {STEPS.map((s, i) => (
          <span key={s} className={`h-1.5 rounded-full ${i <= at ? 'bg-[#e02a2f]' : 'bg-[#161616]/15'}`} />
        ))}
      </div>
      <p className={`${MONO} mt-2 text-[11px] font-bold text-[#44403c]`}>
        Langkah {at + 1} dari {STEPS.length} · {STEPS[at]}
      </p>
    </div>
  )
}

function Headline({ sticker, title, sub }: { sticker: string; title: ReactNode; sub: ReactNode }) {
  return (
    <div className="mt-5">
      <Sticker className="-rotate-2 text-[14px]">{sticker}</Sticker>
      <h1 className={`${ANTON} mt-3 text-[#161616] text-[52px] leading-[1.03] tracking-[.01em] break-words`}>{title}</h1>
      <p className={`${MONO} mt-2 text-[12.5px] leading-relaxed text-[#44403c]`}>{sub}</p>
    </div>
  )
}

function CardPreview({ card, tag }: { card: MemberCardData; tag: string }) {
  return (
    <div className="relative -rotate-2">
      <MemberCard m={card} />
      <Sticker className="absolute -top-5 right-4 rotate-6 text-[12px]">{tag}</Sticker>
    </div>
  )
}

function LevelPath({ tag }: { tag: string }) {
  return (
    <ol aria-label="Jalur level anggota" className="mt-2 flex items-start pt-7">
      {LEVEL_STEPS.map(([, label], i) => (
        <Fragment key={label}>
          <li className="relative w-[60px] shrink-0 flex flex-col items-center gap-1.5">
            {i === 0 && <Sticker className="absolute -top-7 left-0 -rotate-6 text-[11px] px-2 py-1">{tag}</Sticker>}
            <span className={`w-10 h-10 rounded-full flex items-center justify-center ${i === 0 ? 'bg-[#e02a2f] text-white outline-2 outline-offset-2 outline-[#e02a2f]' : 'bg-[#161616]/[.07] text-[#161616]'}`}>
              <Icon name={LEVEL_ICON[i]} className="w-5 h-5" />
            </span>
            <span className={`${ANTON} mt-0.5 text-[12.5px] tracking-[.03em] ${i === 0 ? 'text-[#161616]' : 'text-[#57534e]'}`}>{label}</span>
          </li>
          {i < LEVEL_STEPS.length - 1 && <li aria-hidden className="flex-1 mt-5 border-t-2 border-dotted border-[#161616]/30" />}
        </Fragment>
      ))}
    </ol>
  )
}

function NextRow({ icon, chip, title, sub, onClick }: { icon: IconName; chip: string; title: string; sub: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="w-full flex items-center gap-3 py-3 text-left">
      <Chip name={icon} className={chip} />
      <span className="flex-1 min-w-0">
        <span className={`${ANTON} block text-[16px] leading-tight tracking-[.02em]`}>{title}</span>
        <span className={`${MONO} block mt-0.5 text-[11px] text-[#44403c]`}>{sub}</span>
      </span>
      <Icon name="chevron" className="w-5 h-5 shrink-0" sw={2} />
    </button>
  )
}

function Loading() {
  return (
    <PaperMain standalone>
      <p className={`${LABEL} m-auto text-[12px] text-[#57534e]`}>Memuat...</p>
    </PaperMain>
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
      <PaperField label="LevelUP Kota (opsional)">
        <button type="button" onClick={() => setOpen(true)} className={`${PAPER_INPUT} flex items-center gap-2 text-left ${selected ? '' : 'text-[#57534e]'}`}>
          <Icon name="pin" className={`w-[18px] h-[18px] shrink-0 ${selected ? 'text-[#c21f24]' : ''}`} />
          <span className="flex-1 min-w-0 truncate">{selected?.nama ?? 'Cari LevelUP kota...'}</span>
          <Icon name="search" className="w-4 h-4 shrink-0" />
        </button>
      </PaperField>
      <Sheet
        open={open}
        onClose={() => {
          setOpen(false)
          setQ('')
        }}
      >
        <SheetHead title="Pilih LevelUP Kota" sub="Ketik nama kota buat nyari lebih cepet" />
        <label className="flex items-center gap-2.5 rounded-full bg-[#efe8da]/50 ring-1 ring-[#161616]/15 px-4 py-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#161616] transition">
          <Icon name="search" className="w-5 h-5 shrink-0 text-[#c21f24]" sw={2.2} />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari kota..."
            autoFocus
            className="flex-1 min-w-0 bg-transparent outline-none text-[16px] text-[#161616] placeholder:text-[#57534e]/75"
          />
          {q && (
            <button type="button" onClick={() => setQ('')} aria-label="Hapus pencarian" className="text-[#57534e]">
              <Icon name="x" className="w-5 h-5" />
            </button>
          )}
        </label>
        <div className="mt-3 space-y-2 max-h-[50vh] overflow-y-auto -mx-1 px-1 py-0.5">
          {shown.length ? (
            shown.map((c) => {
              const on = c.id === value
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pick(c.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left transition ${on ? 'ring-2 ring-[#161616] bg-[#ffd83d]/25' : 'ring-1 ring-[#161616]/15 bg-white'}`}
                >
                  <Chip name="pin" className={on ? 'bg-[#ffd83d] text-[#161616]' : 'bg-[#161616]/[.07] text-[#161616]'} />
                  <span className="flex-1 min-w-0 font-bold text-[14.5px] text-[#161616] truncate">{c.nama}</span>
                  {on && <Icon name="check" className="w-5 h-5 text-[#161616] shrink-0" sw={2.6} />}
                </button>
              )
            })
          ) : (
            <p className={`${MONO} text-center text-[12px] text-[#57534e] py-8`}>Gak ketemu “{q.trim()}”</p>
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
    <PaperMain standalone>
      <header className="px-5 pt-4">
        <TopRow>
          <BackButton onClick={() => (window.history.length > 1 ? router.back() : router.push('/'))} />
          <LogoChip />
        </TopRow>
        <Progress at={0} />
        <Headline
          sticker="Gratis · cuma 1 menit"
          title={
            <>
              Gabung
              <br />
              Level <span className="inline-block text-[#e02a2f] text-[1.2em] -rotate-6">UP</span>
            </>
          }
          sub="Jadi bagian dari The Jeremiah Generation — anak muda yang jalan bareng di kotamu."
        />
      </header>
      <div className="px-5 mt-7 space-y-6 pb-[max(env(safe-area-inset-bottom),32px)]">
        <CardPreview card={BLANK_CARD} tag="kartumu nunggu nih" />
        <section aria-label="Cara daftar" className={`relative p-5 ${PANEL}`}>
          <span aria-hidden className={`${TAPE} -left-4 -top-1`} />
          <h2 className={`${ANTON} text-[24px] leading-none tracking-[.01em]`}>Gampang, 3 langkah doang</h2>
          <ol className="mt-5 space-y-4">
            {steps.map(([icon, t, d], n) => (
              <li key={t} className="flex gap-3">
                <span className="relative shrink-0">
                  <Chip name={icon} className={n === 0 ? 'bg-[#e02a2f] text-white' : 'bg-[#ffd83d] text-[#161616]'} />
                  <span className={`${ANTON} absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-[#161616] text-[#ffd83d] text-[11px] flex items-center justify-center`}>{n + 1}</span>
                </span>
                <span className="min-w-0">
                  <span className={`${ANTON} block text-[16px] leading-tight tracking-[.02em]`}>{t}</span>
                  <span className={`${MONO} block text-[11.5px] leading-snug text-[#44403c] mt-1`}>{d}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="my-5 border-t-2 border-dotted border-[#161616]/25" />
          <p className={SUBLABEL}>Jalur level kamu</p>
          <LevelPath tag="start" />
          <button type="button" onClick={() => signIn('google', { callbackUrl: '/daftar?step=form' })} className={`mt-6 ${BTN}`}>
            <Strip>
              <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                <GoogleIcon className="w-4 h-4" />
              </span>
              Gas, daftar pakai Google
            </Strip>
          </button>
        </section>
        <p className={`${MONO} text-center text-[12px] text-[#44403c]`}>
          Udah punya akun?{' '}
          <Link href="/login" className="font-bold text-[#c21f24] underline underline-offset-4 decoration-dotted">
            Masuk
          </Link>
        </p>
      </div>
    </PaperMain>
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
      <PaperMain standalone>
        <header className="px-5 pt-4">
          <TopRow>
            <LogoChip />
          </TopRow>
          <Progress at={2} />
          <Headline
            sticker="Resmi gabung!"
            title={
              <>
                Welcome,
                <br />
                <span className="text-[#e02a2f]" style={{ fontSize: fit(`${first}!`, 330, 52) }}>
                  {first}!
                </span>
              </>
            }
            sub={<>Kartu anggotamu udah jadi. Sekarang kamu bagian dari <b className="text-[#161616]">{city || 'LevelUP'}</b>.</>}
          />
        </header>
        <div className="px-5 mt-7 space-y-6 pb-[max(env(safe-area-inset-bottom),32px)]">
          <div className="motion-safe:animate-[proto-pop_.4s_ease]">
            <CardPreview card={card} tag="new member" />
          </div>
          <section aria-label="Level dan langkah berikutnya" className={`p-5 ${PANEL}`}>
            <p className={SUBLABEL}>Level kamu</p>
            <LevelPath tag="kamu di sini" />
            <div className="my-4 border-t-2 border-dotted border-[#161616]/25" />
            <p className={SUBLABEL}>Next up</p>
            <div className={`mt-1 ${ROWS}`}>
              {eventId ? (
                <NextRow icon="ticket" chip="bg-[#e02a2f] text-white" title="Tiketmu udah aman" sub="Cek QR-nya di menu Tiket" onClick={() => router.push('/dashboard/tiket')} />
              ) : (
                <NextRow icon="ticket" chip="bg-[#e02a2f] text-white" title="Cari event di kotamu" sub="Ambil tiket, dateng, scan QR" onClick={() => router.push('/events')} />
              )}
              <NextRow icon="userPlus" chip="bg-[#ffd83d] text-[#161616]" title="Naik ke Volunteer" sub="Tinggal klik Join Volunteer di Beranda" onClick={() => router.push('/dashboard')} />
            </div>
          </section>
          <button type="button" onClick={() => router.push('/dashboard')} className={BTN}>
            <Strip>Masuk ke Beranda</Strip>
          </button>
        </div>
      </PaperMain>
    )
  }

  return (
    <PaperMain standalone>
      <header className="px-5 pt-4">
        <TopRow>
          <BackButton onClick={() => router.push(eventId ? `/join/${eventId}` : '/login')} />
          <StickerLabel>Isi Data Diri</StickerLabel>
        </TopRow>
        <Progress at={1} />
        <Headline sticker="Hampir kelar" title="Kenalan dulu, yuk!" sub="Kartumu ke-update langsung pas kamu ngetik." />
      </header>
      <form onSubmit={handleSubmit} noValidate className="px-5 mt-7 space-y-5 pb-[max(env(safe-area-inset-bottom),32px)]">
        <CardPreview card={card} tag="live preview" />
        <PaperSection taped icon="user" chip="bg-[#e02a2f] text-white" title="Tentang kamu" sub="Nama & WA buat info event">
          {session?.user?.email && (
            <div className="flex items-center gap-3 rounded-[10px] border-2 border-dotted border-[#161616]/25 p-3">
              <GoogleIcon className="w-5 h-5 shrink-0" />
              <span className="min-w-0">
                <span className={`${SUBLABEL} block`}>Akun Google</span>
                <span className={`${MONO} block text-[12.5px] font-bold break-words`}>{session.user.email}</span>
              </span>
            </div>
          )}
          <PaperField label="Nama lengkap">
            <input className={PAPER_INPUT} autoComplete="name" placeholder="Nama lengkap" value={nama} onChange={(e) => setNama(e.target.value)} />
          </PaperField>
          <PaperField label="Nomor WA (opsional)">
            <input className={PAPER_INPUT} type="tel" inputMode="tel" autoComplete="tel" placeholder="08123456789" value={nowa} onChange={(e) => setNowa(e.target.value)} />
          </PaperField>
        </PaperSection>
        <PaperSection icon="pin" chip="bg-[#ffd83d] text-[#161616]" title="Komunitasmu" sub="Biar nyambung sama LevelUP kotamu">
          <KotaPicker cabangs={cabangs} value={kotalevelup} onChange={setKotalevelup} />
          <PaperField label="Gereja">
            <input className={PAPER_INPUT} placeholder="Nama gereja" value={gereja} onChange={(e) => setGereja(e.target.value)} />
          </PaperField>
          <PaperField label="Sekolah / Kampus / Tempat Kerja">
            <input className={`${PAPER_INPUT} placeholder:text-[13px]`} placeholder="cth: SMAN 1 Ngawi, UNIPMA, PT Maju Jaya" value={sekolah} onChange={(e) => setSekolah(e.target.value)} />
          </PaperField>
          <p className={`${MONO} -mt-2 text-[11px] leading-snug text-[#44403c]`}>Boleh nama lengkap atau singkatan — tipenya kedeteksi otomatis.</p>
        </PaperSection>
        {needsReg && (
          <PaperNote>
            Kamu mulai sebagai <b>Tamu</b>. Abis ini tinggal <b>Join Volunteer</b> di Beranda, terus ajukan <b>Squad</b> ke LevelUP kotamu.
          </PaperNote>
        )}
        {error && (
          <p role="alert" className={`${ERROR} rounded-[10px] bg-[#e02a2f]/10 px-4 py-3`}>
            {error}
          </p>
        )}
        <button type="submit" disabled={loading} className={BTN}>
          <Strip>{loading ? 'Lagi nyetak kartumu…' : eventId ? 'Daftar & ambil tiket' : needsReg ? 'Gas, bikin kartuku' : 'Simpan'}</Strip>
        </button>
      </form>
    </PaperMain>
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
