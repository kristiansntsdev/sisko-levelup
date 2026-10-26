'use client'
import { Fragment, Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import { getCabangs, type CabangOption } from '@/lib/actions/event'
import { upsertJobsPlace } from '@/lib/actions/jobs-place'
import { createRegistrasi, updatePesertaProfile } from '@/lib/actions/registrasi'
import { completeRegistration } from '@/lib/actions/pwa-auth'
import { getPesertaById } from '@/lib/actions/peserta'
import { LEVEL_STEPS } from '@/lib/pwa-member'
import {
  BTN_RED,
  Field,
  FLD,
  GoogleIcon,
  Hero,
  Icon,
  Logo,
  PAGE_BG,
  Pill,
} from '@/components/pwa/ui'

function TopBar({ title, back }: { title: string; back?: () => void }) {
  return (
    <div className="relative flex items-center h-11">
      {back && (
        <button type="button" onClick={back} aria-label="Kembali" className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full active:bg-white/10">
          <Icon name="back" className="w-6 h-6" sw={2.2} />
        </button>
      )}
      <h2 className="absolute left-1/2 -translate-x-1/2 font-bold text-[17px] whitespace-nowrap">{title}</h2>
    </div>
  )
}

function DaftarIntro() {
  const router = useRouter()
  const steps: [Parameters<typeof Icon>[0]['name'], string, string][] = [
    ['user', 'Masuk dengan akun Google', 'Login pertama mengarahkan ke isi data diri jika belum terdaftar.'],
    ['edit', 'Isi data diri', 'Nama, nomor WA, LevelUP Kota, gereja, sekolah / kampus / tempat kerja.'],
    ['shield', 'Naik level', 'Mulai sebagai Tamu → Join Volunteer → ajukan Squad ke ALK kota kamu.'],
  ]
  return (
    <section className={`min-h-screen ${PAGE_BG} pb-safe font-[family-name:var(--font-proto)]`}>
      <Hero className="pt-4 md:pt-2 pb-24 text-center" decor="-right-8 top-6 w-44">
        <TopBar title="Pendaftaran Anggota" back={() => router.push('/login')} />
        <Logo className="h-[64px] w-auto mx-auto mt-4 drop-shadow-[0_6px_14px_rgba(60,0,5,.35)]" />
      </Hero>
      <div className="px-5 -mt-14 relative space-y-4 max-w-[430px] mx-auto">
        <div className="bg-white rounded-3xl shadow-[0_18px_40px_-14px_rgba(80,20,25,.3)] p-6">
          <h2 className="font-extrabold text-[21px] text-[#3b1417]">Gabung LevelUP</h2>
          <p className="text-[13.5px] text-slate-500 mt-1">Tiga langkah untuk jadi anggota dan ikut event.</p>
          <ol className="mt-5 space-y-4">
            {steps.map(([i, t, d], n) => (
              <li key={t} className="flex gap-3">
                <span className="relative">
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${n === 0 ? 'text-[#c9232c] bg-[#fbeceb] ring-1 ring-[#f3d3d3]' : 'text-[#96792a] bg-[#f8f0dd] ring-1 ring-[#ecdcb3]'}`}>
                    <Icon name={i} className="w-5 h-5" />
                  </span>
                  <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-[#3b1417] text-[#e6cd7e] text-[10.5px] font-bold flex items-center justify-center">
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
          <div className="mt-5 flex items-center gap-1.5 text-[11px] font-bold flex-wrap">
            {LEVEL_STEPS.map(([, label], i) => (
              <Fragment key={label}>
                <span className={`px-2.5 py-1 rounded-full ${i === 0 ? 'bg-[#c9232c] text-white' : 'bg-[#f8f0dd] text-[#96792a]'}`}>
                  {label}
                </span>
                {i < LEVEL_STEPS.length - 1 && <Icon name="chevron" className="w-3.5 h-3.5 text-[#d9c9a8]" sw={2.4} />}
              </Fragment>
            ))}
          </div>
          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl: '/daftar?step=form' })}
            className={`mt-6 w-full py-3.5 flex items-center justify-center gap-2 ${BTN_RED}`}
          >
            <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
              <GoogleIcon className="w-4 h-4" />
            </span>
            Daftar dengan Google
          </button>
        </div>
        <p className="text-center text-[13px] text-slate-500">
          Sudah punya akun?{' '}
          <Link href="/login" className="font-semibold text-[#c9232c]">
            Masuk
          </Link>
        </p>
      </div>
    </section>
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const needsReg = Boolean(session?.user?.needsRegistration) || (!session?.user?.idPeserta && Boolean(session?.user?.authUserId))

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
      setNama(p.nama)
      if (p.nowa) {
        setNowa(p.nowa)
        setKotalevelup(p.kotalevelup)
      }
      if (p.gereja) setGereja(p.gereja)
      if (p.pekerjaan) setSekolah(p.pekerjaan)
    })
  }, [session, status])

  async function handleSubmit() {
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

  if (status === 'loading') {
    return (
      <main className={`min-h-screen ${PAGE_BG} flex items-center justify-center`}>
        <p className="text-sm text-slate-500">Memuat...</p>
      </main>
    )
  }

  if (status === 'unauthenticated') {
    return <DaftarIntro />
  }

  if (done) {
    const first = nama.trim().split(/\s+/)[0] || 'teman'
    return (
      <section className={`min-h-screen ${PAGE_BG} pb-safe font-[family-name:var(--font-proto)]`}>
        <Hero className="pt-14 md:pt-10 pb-24 text-center" decor="-right-8 top-6 w-44">
          <span className="w-20 h-20 mx-auto rounded-full bg-white/15 ring-4 ring-white/25 flex items-center justify-center">
            <Icon name="check" className="w-10 h-10" sw={2.6} />
          </span>
          <p className="font-extrabold text-[22px] mt-4">Selamat datang, {first}!</p>
          <p className="text-[13.5px] text-white/85 mt-1">Pendaftaran berhasil</p>
        </Hero>
        <div className="px-5 -mt-14 relative space-y-4 max-w-[430px] mx-auto">
          <div className="bg-white rounded-3xl shadow-[0_18px_40px_-14px_rgba(80,20,25,.3)] p-5">
            <p className="text-[13px] font-bold text-[#3b1417]">Langkah berikutnya</p>
            <ul className="mt-2 space-y-2 text-[13px] text-slate-600">
              <li className="flex gap-2">
                <Icon name="ticket" className="w-[18px] h-[18px] text-[#c9232c] shrink-0" />
                Ambil tiket event di menu Event
              </li>
              <li className="flex gap-2">
                <Icon name="users" className="w-[18px] h-[18px] text-[#c9232c] shrink-0" />
                Join Volunteer dari kartu Level Anggota di Beranda
              </li>
            </ul>
          </div>
          <button type="button" onClick={() => router.push('/dashboard')} className={`w-full py-3.5 ${BTN_RED}`}>
            Masuk ke Beranda
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className={`min-h-screen ${PAGE_BG} pb-safe font-[family-name:var(--font-proto)]`}>
      <Hero className="pt-4 pb-8 rounded-b-[28px]">
        <TopBar title="Isi Data Diri" back={() => router.push(eventId ? `/join/${eventId}` : '/login')} />
      </Hero>
      <div className="max-w-[430px] mx-auto px-5 py-5 flex flex-col gap-4">
        <Field label="Nama">
          <input className={FLD} placeholder="Nama lengkap" value={nama} onChange={(e) => setNama(e.target.value)} />
        </Field>
        <Field label="Nomor WA">
          <input className={FLD} placeholder="08123456789" type="tel" value={nowa} onChange={(e) => setNowa(e.target.value)} />
        </Field>
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
        <Field label="Gereja">
          <input className={FLD} placeholder="Nama gereja" value={gereja} onChange={(e) => setGereja(e.target.value)} />
        </Field>
        <Field label="Sekolah / Universitas / Tempat Kerja">
          <input
            className={FLD}
            placeholder="cth: SMAN 1 Ngawi, UNIPMA, PT Maju Jaya"
            value={sekolah}
            onChange={(e) => setSekolah(e.target.value)}
          />
        </Field>
        <p className="text-[12px] text-slate-500 -mt-2">Ketik nama lengkap atau singkatan — tipe akan terdeteksi otomatis</p>
        {needsReg && (
          <p className="text-[12.5px] text-[#6b551c] bg-[#f8f0dd] ring-1 ring-[#ecdcb3] rounded-xl px-3 py-2">
            Kamu terdaftar sebagai <b>Tamu</b> setelah submit.
          </p>
        )}
        {error && <p className="text-sm text-[#c9232c] font-medium">{error}</p>}
        <button type="button" disabled={loading} onClick={handleSubmit} className={`w-full py-3.5 ${BTN_RED}`}>
          {loading ? 'Menyimpan…' : eventId ? 'Daftar Sekarang' : 'Simpan & Lanjut'}
        </button>
        {!needsReg && session?.user?.email && <Pill tone="green">{session.user.email}</Pill>}
      </div>
    </section>
  )
}

function DaftarGate() {
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const step = searchParams.get('step')
  const eventId = searchParams.get('eventId')

  if (status === 'loading') {
    return (
      <main className={`min-h-screen ${PAGE_BG} flex items-center justify-center`}>
        <p className="text-sm text-slate-500">Memuat...</p>
      </main>
    )
  }

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
