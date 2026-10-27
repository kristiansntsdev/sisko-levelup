'use client'
import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { loginEmailPassword } from '@/lib/actions/pwa-auth'
import {
  BTN_RED,
  Chevrons,
  Field,
  GoogleIcon,
  Hero,
  Icon,
  Logo,
  PAGE_BG,
} from '@/components/pwa/ui'

const LOGIN_INPUT =
  'w-full min-w-0 bg-transparent px-4 py-3.5 text-[16px] font-semibold outline-none placeholder:font-medium placeholder:text-slate-300 ' +
  // Chrome autofill paints a blue rect that ignores parent radius — cover + clip via LOGIN_BOX
  'autofill:shadow-[inset_0_0_0_1000px_#f8fafc] autofill:[-webkit-text-fill-color:#0f172a] ' +
  'focus:autofill:shadow-[inset_0_0_0_1000px_#fff]'
const LOGIN_BOX =
  'flex items-center overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-200 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-[#c9232c]'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard'
  const auto = searchParams.get('auto') === '1'
  const redirected = useRef(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [soon, setSoon] = useState(false)

  useEffect(() => {
    if (!auto || redirected.current) return
    redirected.current = true
    void signIn('google', { callbackUrl })
  }, [auto, callbackUrl])

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.length >= 6

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid || loading) return
    setError('')
    setLoading(true)
    try {
      const res = await loginEmailPassword(email, password)
      if ('error' in res) {
        setError(res.error)
        setLoading(false)
        return
      }
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      })
      if (result?.error) {
        setError('Email atau password salah.')
        setLoading(false)
        return
      }
      router.push(callbackUrl)
      router.refresh()
    } catch (err) {
      // pengurus path: server action redirect()
      const dig = err && typeof err === 'object' && 'digest' in err ? String((err as { digest: string }).digest) : ''
      if (dig.startsWith('NEXT_REDIRECT')) throw err
      setError('Gagal masuk. Coba lagi.')
      setLoading(false)
    }
  }

  if (auto) {
    return (
      <main className={`min-h-screen ${PAGE_BG} flex flex-col items-center justify-center gap-4 px-6 font-[family-name:var(--font-proto)]`}>
        <Logo className="h-12 w-auto" />
        <span className="w-7 h-7 rounded-full border-2 border-slate-200 border-t-[#c9232c] animate-spin" />
        <p className="text-sm text-slate-500">Mengalihkan ke Google…</p>
      </main>
    )
  }

  return (
    <main className={`min-h-screen ${PAGE_BG} pb-safe font-[family-name:var(--font-proto)]`}>
      <Hero className="pt-16 md:pt-12 pb-28 text-center" decor="-right-8 top-4 w-44">
        <Chevrons className="-left-12 top-36 w-32 opacity-[.08]" />
        <Logo className="h-[92px] w-auto mx-auto drop-shadow-[0_6px_14px_rgba(60,0,5,.35)]" />
      </Hero>
      <div className="px-5 -mt-16 relative max-w-[430px] mx-auto">
        <form
          onSubmit={onSubmit}
          className="bg-white rounded-3xl shadow-[0_18px_40px_-14px_rgba(80,20,25,.3)] p-6"
        >
          <h2 className="font-extrabold text-[22px] text-[#3b1417]">Masuk</h2>
          <p className="text-[13.5px] text-slate-500 mt-1 mb-5">
            Email + password (peserta atau pengurus), atau masuk dengan Google
          </p>
          <div className="space-y-4">
            <Field label="Email">
              <span className={LOGIN_BOX}>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  placeholder="contoh@gmail.com"
                  className={LOGIN_INPUT}
                />
              </span>
            </Field>
            <Field label="Password">
              <span className={LOGIN_BOX}>
                <input
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={LOGIN_INPUT}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="shrink-0 w-11 h-11 mr-1 flex items-center justify-center rounded-full text-slate-400 active:bg-slate-100"
                >
                  <Icon name={show ? 'eyeOff' : 'eye'} className="w-5 h-5" />
                </button>
              </span>
            </Field>
          </div>
          <div className="flex justify-end mt-2">
            <button
              type="button"
              onClick={() => setSoon(true)}
              className="text-[12.5px] font-semibold text-[#c9232c] py-1"
            >
              Lupa password?
            </button>
          </div>
          {error && <p className="text-sm text-[#c9232c] font-medium mt-2">{error}</p>}
          {soon && <p className="text-[12.5px] text-slate-500 mt-2">Reset password segera tersedia.</p>}
          <button type="submit" disabled={!valid || loading} className={`mt-3 w-full py-3.5 ${BTN_RED}`}>
            {loading ? 'Masuk…' : 'Masuk'}
          </button>
        </form>

        <div className="flex items-center gap-3 mt-7 text-[12px] text-slate-400">
          <span className="flex-1 h-px bg-slate-200" />
          Anggota LevelUP
          <span className="flex-1 h-px bg-slate-200" />
        </div>
        <button
          type="button"
          onClick={() => signIn('google', { callbackUrl })}
          className="mt-4 w-full py-3 rounded-2xl bg-white ring-1 ring-slate-200 font-semibold text-slate-700 flex items-center justify-center gap-2 active:bg-slate-50"
        >
          <GoogleIcon />
          Masuk dengan Google
        </button>
        <p className="text-center text-[13px] text-slate-500 mt-5">
          Belum terdaftar anggota?{' '}
          <Link href="/daftar" className="font-semibold text-[#c9232c]">
            Pendaftaran Anggota
          </Link>
        </p>
        <Link
          href="/"
          className="mt-6 w-full text-center text-sm text-slate-400 block"
        >
          ← Kembali
        </Link>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
