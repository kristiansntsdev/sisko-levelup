'use client'
import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { loginEmailPassword } from '@/lib/actions/pwa-auth'
import {
  ANTON,
  BTN,
  ERROR,
  LABEL,
  LogoChip,
  MONO,
  PANEL,
  PaperField,
  PaperHeader,
  PaperMain,
  PRESS,
  Strip,
  TAPE,
} from '@/components/pwa/paper-ui'
import { GoogleIcon, Icon } from '@/components/pwa/ui'

const LOGIN_INPUT =
  'w-full min-w-0 bg-transparent px-3.5 py-3 text-[16px] font-semibold text-[#161616] outline-none placeholder:font-medium placeholder:text-[#57534e]/70 ' +
  // Chrome autofill paints a blue rect that ignores parent radius — cover + clip via LOGIN_BOX
  'autofill:shadow-[inset_0_0_0_1000px_#f7f3ea] autofill:[-webkit-text-fill-color:#161616] ' +
  'focus:autofill:shadow-[inset_0_0_0_1000px_#fff]'
const LOGIN_BOX =
  'flex items-center overflow-hidden rounded-[10px] bg-[#efe8da]/50 ring-1 ring-[#161616]/15 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-[#161616]'

// Auth.js yang gagal balik ke /login?error=... tanpa callbackUrl. Tujuan login Google
// disimpan per tab supaya "coba lagi" tetap ke link semula (join/absen), bukan /dashboard.
const CALLBACK_KEY = 'levelup-login-callback'

function signInGoogle(callbackUrl: string) {
  try {
    sessionStorage.setItem(CALLBACK_KEY, callbackUrl)
  } catch {}
  void signIn('google', { callbackUrl })
}

function savedCallback(): string | null {
  try {
    const v = sessionStorage.getItem(CALLBACK_KEY)
    return v && v.startsWith('/') && !v.startsWith('//') && !v.startsWith('/\\') ? v : null
  } catch {
    return null
  }
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackParam = searchParams.get('callbackUrl')
  const callbackUrl = callbackParam ?? '/dashboard'
  const authError = searchParams.get('error')
  const auto = searchParams.get('auto') === '1'
  const redirected = useRef(false)
  // Dibaca saat tombol ditekan (sessionStorage tidak ada saat render server)
  const dest = () => callbackParam ?? (authError ? savedCallback() : null) ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [soon, setSoon] = useState(false)

  useEffect(() => {
    if (!auto || redirected.current) return
    redirected.current = true
    signInGoogle(callbackUrl)
  }, [auto, callbackUrl])

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.length >= 6

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid || loading) return
    setError('')
    setLoading(true)
    const to = dest()
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
        callbackUrl: to,
      })
      if (result?.error) {
        setError('Email atau password salah.')
        setLoading(false)
        return
      }
      router.push(to)
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
      <PaperMain standalone>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
          <LogoChip />
          <span className="w-7 h-7 rounded-full border-2 border-[#161616]/20 border-t-[#e02a2f] animate-spin" />
          <p className={`${LABEL} text-[11px] text-[#44403c]`}>Mengalihkan ke Google…</p>
        </div>
      </PaperMain>
    )
  }

  return (
    <PaperMain standalone>
      <PaperHeader title="Masuk" leading={<LogoChip />}>
        <p className={`${MONO} mt-1 text-[12px] leading-relaxed text-[#44403c]`}>Masuk dengan Google, atau email + password (peserta / pengurus)</p>
      </PaperHeader>

      <div className="px-5 mt-5 pb-[max(env(safe-area-inset-bottom),32px)]">
        <form onSubmit={onSubmit} className={`relative p-5 ${PANEL}`}>
          <span aria-hidden className={`${TAPE} -left-4 -top-1`} />
          {authError && (
            <div role="alert" className="mb-4 rounded-sm bg-[#e02a2f]/8 ring-1 ring-[#e02a2f]/30 px-3.5 py-3">
              <p className={ERROR}>Login belum berhasil, coba lagi.</p>
              <p className={`${MONO} mt-1 text-[11.5px] leading-relaxed text-[#44403c]`}>
                Tekan Masuk dengan Google sekali lagi. Kalau masih gagal, buka www.levelupgen.com langsung di Chrome atau Safari, bukan dari dalam WhatsApp / Instagram.
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={() => signInGoogle(dest())}
            className={`${ANTON} w-full py-3 rounded-sm ring-2 ring-[#161616] bg-white text-[17px] tracking-[.03em] flex items-center justify-center gap-2.5 ${PRESS}`}
          >
            <GoogleIcon />
            Masuk dengan Google
          </button>
          <div className={`${LABEL} flex items-center gap-3 my-5 text-[10px] font-bold text-[#57534e]`}>
            <span className="flex-1 border-t-2 border-dotted border-[#161616]/25" />
            atau email
            <span className="flex-1 border-t-2 border-dotted border-[#161616]/25" />
          </div>
          <div className="space-y-4">
            <PaperField label="Email">
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
            </PaperField>
            <PaperField label="Password">
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
                  className="shrink-0 w-11 h-11 mr-1 flex items-center justify-center rounded-full text-[#44403c]"
                >
                  <Icon name={show ? 'eyeOff' : 'eye'} className="w-5 h-5" />
                </button>
              </span>
            </PaperField>
          </div>
          <div className="flex justify-end mt-2">
            <button type="button" onClick={() => setSoon(true)} className={`${MONO} text-[11.5px] font-bold text-[#c21f24] py-1 underline underline-offset-4 decoration-dotted`}>
              Lupa password?
            </button>
          </div>
          {error && (
            <p role="alert" className={`${ERROR} mt-2`}>
              {error}
            </p>
          )}
          {soon && <p className={`${MONO} text-[11.5px] text-[#44403c] mt-2`}>Reset password segera tersedia.</p>}
          <button type="submit" disabled={!valid || loading} className={`mt-4 ${BTN}`}>
            <Strip>{loading ? 'Masuk…' : 'Masuk'}</Strip>
          </button>
        </form>

        <p className={`${MONO} text-center text-[12px] text-[#44403c] mt-6`}>
          Belum terdaftar anggota?{' '}
          <Link href="/daftar" className="font-bold text-[#c21f24] underline underline-offset-4 decoration-dotted">
            Pendaftaran Anggota
          </Link>
        </p>
        <Link href="/" className={`${MONO} mt-5 block text-center text-[12px] font-bold text-[#44403c]`}>
          ← Kembali
        </Link>
      </div>
    </PaperMain>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
