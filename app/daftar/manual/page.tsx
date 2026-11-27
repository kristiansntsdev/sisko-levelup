'use client'
import { Suspense, useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { getCabangs, type CabangOption } from '@/lib/actions/event'
import { registerManual } from '@/lib/actions/pwa-auth'
import { KotaPicker } from '@/components/pwa/kota-picker'
import {
  BTN,
  ERROR,
  LogoChip,
  MONO,
  PANEL,
  PAPER_INPUT,
  PaperField,
  PaperHeader,
  PaperMain,
  Strip,
  TAPE,
} from '@/components/pwa/paper-ui'
import { Icon } from '@/components/pwa/ui'

function ManualForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackParam = searchParams.get('callbackUrl')
  // Hanya path internal (cegah open redirect)
  const to = callbackParam && callbackParam.startsWith('/') && !callbackParam.startsWith('//') && !callbackParam.startsWith('/\\') ? callbackParam : '/dashboard'

  const [cabangs, setCabangs] = useState<CabangOption[]>([])
  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [kota, setKota] = useState('')
  const [gereja, setGereja] = useState('')
  const [nowa, setNowa] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getCabangs().then(setCabangs)
  }, [])

  const valid =
    nama.trim() !== '' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    password.length >= 6 &&
    kota !== '' &&
    gereja.trim() !== ''

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!valid || loading) return
    setError('')
    setLoading(true)
    try {
      const res = await registerManual({ nama, email, password, kotalevelup: kota, gereja, nowa })
      if ('error' in res) {
        setError(res.error)
        setLoading(false)
        return
      }
      const result = await signIn('credentials', { email, password, redirect: false, callbackUrl: to })
      if (result?.error) {
        // Akun sudah jadi, hanya login otomatis yang gagal
        router.push('/login')
        return
      }
      router.push(to)
      router.refresh()
    } catch {
      setError('Gagal mendaftar. Coba lagi.')
      setLoading(false)
    }
  }

  return (
    <PaperMain standalone>
      <PaperHeader title="Daftar" leading={<LogoChip />}>
        <p className={`${MONO} mt-1 text-[12px] leading-relaxed text-[#44403c]`}>
          Daftar manual tanpa Google. Akunmu langsung jadi <b>Guest</b>.
        </p>
      </PaperHeader>

      <div className="px-5 mt-5 pb-[max(env(safe-area-inset-bottom),32px)]">
        <form onSubmit={onSubmit} className={`relative p-5 ${PANEL}`}>
          <span aria-hidden className={`${TAPE} -left-4 -top-1`} />
          <div className="space-y-4">
            <PaperField label="Nama lengkap">
              <input className={PAPER_INPUT} autoComplete="name" placeholder="Nama lengkap" value={nama} onChange={(e) => setNama(e.target.value)} />
            </PaperField>
            <PaperField label="Email">
              <input
                className={PAPER_INPUT}
                type="email"
                inputMode="email"
                autoComplete="username"
                placeholder="contoh@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
              />
            </PaperField>
            <PaperField label="Password (min. 6 karakter)">
              <span className="relative block">
                <input
                  className={`${PAPER_INPUT} pr-12`}
                  type={show ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full text-[#44403c]"
                >
                  <Icon name={show ? 'eyeOff' : 'eye'} className="w-5 h-5" />
                </button>
              </span>
            </PaperField>
            <KotaPicker label="LevelUP Kota" cabangs={cabangs} value={kota} onChange={setKota} />
            <PaperField label="Nama gereja">
              <input className={PAPER_INPUT} placeholder="Nama gereja" value={gereja} onChange={(e) => setGereja(e.target.value)} />
            </PaperField>
            <PaperField label="Nomor HP (opsional)">
              <input className={PAPER_INPUT} type="tel" inputMode="tel" autoComplete="tel" placeholder="08123456789" value={nowa} onChange={(e) => setNowa(e.target.value)} />
            </PaperField>
          </div>
          {error && (
            <p role="alert" className={`${ERROR} mt-3`}>
              {error}
            </p>
          )}
          <button type="submit" disabled={!valid || loading} className={`mt-5 ${BTN}`}>
            <Strip>{loading ? 'Mendaftar…' : 'Daftar'}</Strip>
          </button>
        </form>

        <p className={`${MONO} text-center text-[12px] text-[#44403c] mt-6`}>
          Sudah punya akun?{' '}
          <Link href="/login" className="font-bold text-[#c21f24] underline underline-offset-4 decoration-dotted">
            Masuk
          </Link>
        </p>
        <Link href="/login" className={`${MONO} mt-5 block text-center text-[12px] font-bold text-[#44403c]`}>
          ← Kembali
        </Link>
      </div>
    </PaperMain>
  )
}

export default function DaftarManualPage() {
  return (
    <Suspense>
      <ManualForm />
    </Suspense>
  )
}
