'use client'
// Same screen as app/login/page.tsx. The only additions: phone numbers are accepted, "Masuk dengan Google" picks a demo
// account, and the demo accounts are listed under the form so a visitor can enter any flow with one tap.
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ANTON, BTN, ERROR, LABEL, LogoChip, MONO, PANEL, PaperField, PaperHeader, PaperMain, PRESS, Strip, TAPE } from '@/components/pwa/paper-ui'
import { GoogleIcon, Icon, Sheet, SheetHead } from '@/components/pwa/ui'
import { DEMO_HOME, findAccount, loginAs } from '@/components/demo-preview/auth'
import { DEMO_ACCOUNTS, DEMO_PASSWORD, getDb, type DemoAccount } from '@/components/demo-preview/db'

const LOGIN_INPUT =
  'w-full min-w-0 bg-transparent px-3.5 py-3 text-[16px] font-semibold text-[#161616] outline-none placeholder:font-medium placeholder:text-[#57534e]/70 ' +
  'autofill:shadow-[inset_0_0_0_1000px_#f7f3ea] autofill:[-webkit-text-fill-color:#161616] focus:autofill:shadow-[inset_0_0_0_1000px_#fff]'
const LOGIN_BOX =
  'flex items-center overflow-hidden rounded-[10px] bg-[#efe8da]/50 ring-1 ring-[#161616]/15 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-[#161616]'

function AccountRow({ a, onPick }: { a: DemoAccount; onPick: (a: DemoAccount) => void }) {
  return (
    <button type="button" onClick={() => onPick(a)} className={`flex w-full items-center gap-3 rounded-[10px] bg-[#efe8da]/50 px-3.5 py-3 text-left ring-1 ring-[#161616]/15 ${PRESS}`}>
      <span className="min-w-0 flex-1">
        <span className={`${ANTON} block text-[17px] leading-tight tracking-[.02em]`}>{a.label}</span>
        <span className={`${MONO} mt-0.5 block text-[10.5px] leading-snug text-[#44403c]`}>{a.note}</span>
        <span className={`${MONO} mt-1 block break-all text-[10.5px] font-bold text-[#161616]`}>
          {a.email} · {a.phone}
        </span>
      </span>
      <Icon name="chevron" className="h-5 w-5 shrink-0" sw={2} />
    </button>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? DEMO_HOME
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [soon, setSoon] = useState(false)
  const [googleOpen, setGoogleOpen] = useState(searchParams.get('google') === '1')

  const valid = email.trim().length >= 6 && password.length >= 6

  function enter(a: DemoAccount) {
    router.push(loginAs(a, callbackUrl))
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    getDb()
    const a = findAccount(email)
    if (!a || a.kind === 'google-new' || password.trim() !== a.password) {
      setError('Email/No. HP atau password salah. Pilih salah satu akun demo di bawah.')
      return
    }
    setError('')
    enter(a)
  }

  return (
    <PaperMain standalone>
      <PaperHeader title="Masuk" leading={<LogoChip />}>
        <p className={`${MONO} mt-1 text-[12px] leading-relaxed text-[#44403c]`}>Masuk dengan Google, atau email + password (peserta / pengurus)</p>
      </PaperHeader>

      <div className="mt-5 px-5 pb-[max(env(safe-area-inset-bottom),32px)]">
        <form onSubmit={onSubmit} className={`relative p-5 ${PANEL}`}>
          <span aria-hidden className={`${TAPE} -left-4 -top-1`} />
          <button
            type="button"
            onClick={() => setGoogleOpen(true)}
            className={`${ANTON} flex w-full items-center justify-center gap-2.5 rounded-sm bg-white py-3 text-[17px] tracking-[.03em] ring-2 ring-[#161616] ${PRESS}`}
          >
            <GoogleIcon />
            Masuk dengan Google
          </button>
          <div className={`${LABEL} my-5 flex items-center gap-3 text-[10px] font-bold text-[#57534e]`}>
            <span className="flex-1 border-t-2 border-dotted border-[#161616]/25" />
            atau email
            <span className="flex-1 border-t-2 border-dotted border-[#161616]/25" />
          </div>
          <div className="space-y-4">
            <PaperField label="Email atau No. HP">
              <span className={LOGIN_BOX}>
                <input
                  type="text"
                  inputMode="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  placeholder="contoh@gmail.com / 0812…"
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
                  className="mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#44403c]"
                >
                  <Icon name={show ? 'eyeOff' : 'eye'} className="h-5 w-5" />
                </button>
              </span>
            </PaperField>
          </div>
          <div className="mt-2 flex justify-end">
            <button type="button" onClick={() => setSoon(true)} className={`${MONO} py-1 text-[11.5px] font-bold text-[#c21f24] underline decoration-dotted underline-offset-4`}>
              Lupa password?
            </button>
          </div>
          {error && (
            <p role="alert" className={`${ERROR} mt-2`}>
              {error}
            </p>
          )}
          {soon && <p className={`${MONO} mt-2 text-[11.5px] text-[#44403c]`}>Reset password segera tersedia.</p>}
          <button type="submit" disabled={!valid} className={`mt-4 ${BTN}`}>
            <Strip>Masuk</Strip>
          </button>
        </form>

        <section className={`relative mt-6 p-5 ${PANEL}`}>
          <h2 className={`${ANTON} border-b-2 border-dotted border-[#161616]/40 pb-3 text-[24px] leading-none`}>Akun Demo</h2>
          <p className={`${MONO} mt-3 text-[11.5px] leading-relaxed text-[#44403c]`}>
            Tap untuk masuk. Password semua akun: <b>{DEMO_PASSWORD}</b>. Data tersimpan di browser ini saja.
          </p>
          <div className="mt-3 space-y-2.5">
            {DEMO_ACCOUNTS.map((a) => (
              <AccountRow key={a.key} a={a} onPick={enter} />
            ))}
          </div>
        </section>

        <p className={`${MONO} mt-6 text-center text-[12px] text-[#44403c]`}>
          Belum terdaftar anggota?{' '}
          <Link href="/demo-preview/daftar" className="font-bold text-[#c21f24] underline decoration-dotted underline-offset-4">
            Pendaftaran Anggota
          </Link>
        </p>
      </div>

      <Sheet open={googleOpen} onClose={() => setGoogleOpen(false)}>
        <SheetHead title="Pilih akun Google" sub="Akun Google baru akan diarahkan ke Pendaftaran." />
        <div className="space-y-2.5">
          {DEMO_ACCOUNTS.filter((a) => a.kind !== 'pengurus').map((a) => (
            <AccountRow key={a.key} a={a} onPick={enter} />
          ))}
        </div>
      </Sheet>
    </PaperMain>
  )
}

export default function DemoLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
