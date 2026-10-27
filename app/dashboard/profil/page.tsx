'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { getPesertaById, getMemberCardForPeserta } from '@/lib/actions/peserta'
import { getActiveSessions, loginPengurusFromPwa, logoutPengurusKeepMember } from '@/lib/actions/pwa-auth'
import { USERLEVEL_LABEL, type MemberCardData } from '@/lib/pwa-member'
import {
  Avatar,
  BTN_RED,
  CARD,
  Field,
  Hero,
  Icon,
  LIFT,
  Sheet,
  SheetHead,
  TintIcon,
  fCard,
} from '@/components/pwa/ui'

const LOGIN_INPUT =
  'w-full min-w-0 bg-transparent px-4 py-3.5 text-[16px] font-semibold outline-none placeholder:font-medium placeholder:text-slate-300 ' +
  'autofill:shadow-[inset_0_0_0_1000px_#f8fafc] autofill:[-webkit-text-fill-color:#0f172a] ' +
  'focus:autofill:shadow-[inset_0_0_0_1000px_#fff]'
const LOGIN_BOX =
  'flex items-center overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-200 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-[#c9232c]'

export default function ProfilPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [level, setLevel] = useState('0')
  const [gender, setGender] = useState('L')
  const [nowa, setNowa] = useState('')
  const [gereja, setGereja] = useState('')
  const [card, setCard] = useState<MemberCardData | null>(null)
  const [pengurusOn, setPengurusOn] = useState(false)
  const [pengurusDest, setPengurusDest] = useState<string | null>(null)
  const [pengurusNama, setPengurusNama] = useState('')
  const [pengurusSheet, setPengurusSheet] = useState(false)
  const [pwEmail, setPwEmail] = useState('')
  const [pwPass, setPwPass] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [soon, setSoon] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=/dashboard/profil')
      return
    }
    const id = session?.user?.idPeserta
    if (!id) return
    Promise.all([getPesertaById(id), getMemberCardForPeserta(id), getActiveSessions()]).then(([p, c, s]) => {
      if (p) {
        setNama(p.nama)
        setEmail(p.email)
        setLevel(p.userlevel)
        setGender(p.gender === 'P' || p.gender === 'Perempuan' ? 'P' : 'L')
        setNowa(p.nowa)
        setGereja(p.gereja)
      }
      setCard(c)
      setPengurusOn(Boolean(s.pengurus))
      setPengurusDest(s.pengurus?.dest ?? null)
      setPengurusNama(s.pengurus?.nama ?? '')
    })
  }, [session, status, router])

  async function submitPengurus(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await loginPengurusFromPwa(pwEmail, pwPass)
    } catch (err) {
      const dig = err && typeof err === 'object' && 'digest' in err ? String((err as { digest: string }).digest) : ''
      if (dig.startsWith('NEXT_REDIRECT')) throw err
      setError('Email atau password salah.')
      setLoading(false)
    }
  }

  const infoRows: { icon: 'phone' | 'mail' | 'church' | 'pin' | 'shield'; k: string; v: string }[] = [
    { icon: 'phone', k: 'Telepon', v: nowa || '—' },
    { icon: 'mail', k: 'Email', v: email || session?.user?.email || '—' },
    { icon: 'church', k: 'Gereja', v: gereja || '—' },
    { icon: 'pin', k: 'LevelUP Kota', v: card?.city || '—' },
    { icon: 'shield', k: 'Level', v: USERLEVEL_LABEL[level] ?? 'Tamu' },
  ]

  const soonMenu: { icon: 'lock' | 'help'; t: string }[] = [
    { icon: 'lock', t: 'Privasi & Keamanan' },
    { icon: 'help', t: 'Bantuan' },
  ]

  return (
    <main>
      <Hero className="pt-6 md:pt-4 pb-20 rounded-b-[32px] text-center">
        <span className="relative block w-24 h-24 mx-auto">
          <span className="block w-24 h-24 rounded-full ring-4 ring-white/40 overflow-hidden bg-white/10">
            <Avatar g={gender} />
          </span>
        </span>
        <p className="font-extrabold text-lg mt-3">{nama || session?.user?.name}</p>
        <p className="text-sm text-white/80">{card?.city || '—'}</p>
        {card?.no && (
          <span className={`inline-block mt-2 ${fCard} font-semibold tracking-wider text-[13px] bg-white/15 ring-1 ring-white/25 px-3 py-1 rounded-full`}>
            {card.no}
          </span>
        )}
      </Hero>

      <div className="px-5 -mt-12 relative z-10 space-y-4 pb-4">
        <div className={`${LIFT} divide-y divide-slate-100 text-[14px]`}>
          {infoRows.map((r) => (
            <div key={r.k} className="flex items-center gap-3 px-4 py-3.5">
              <TintIcon name={r.icon} tint="red" size="w-9 h-9 rounded-xl" icon="w-[18px] h-[18px]" />
              <span className="text-slate-500 flex-1">{r.k}</span>
              <span className="font-semibold text-right text-slate-800 truncate max-w-[60%]">{r.v}</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            if (pengurusOn && pengurusDest) router.push(pengurusDest)
            else setPengurusSheet(true)
          }}
          className={`w-full ${CARD} p-4 flex items-center gap-3 text-left active:scale-[.99] transition`}
        >
          <TintIcon name="shield" tint="gold" />
          <span className="flex-1 min-w-0">
            <span className="block font-bold text-[14px] text-[#3b1417]">
              {pengurusOn ? 'Buka Akun Sekretariat' : 'Masuk sebagai Pengurus'}
            </span>
            <span className="block text-[12px] text-slate-500 truncate">
              {pengurusOn ? `Pengurus · ${pengurusNama}` : 'Email + password akun pengurus'}
            </span>
          </span>
          <Icon name="chevron" className="w-5 h-5 text-slate-300" sw={2} />
        </button>

        {pengurusOn && (
          <button
            type="button"
            onClick={() => void logoutPengurusKeepMember()}
            className="w-full text-left text-[13px] font-semibold text-[#c9232c] bg-[#fbeceb] ring-1 ring-[#f3d3d3] rounded-2xl px-4 py-3"
          >
            Keluar dari Akun Sekretariat (tetap di Kartu Saya)
          </button>
        )}

        <div className={`${CARD} divide-y divide-slate-100 text-[14px]`}>
          <button
            type="button"
            onClick={() => router.push('/dashboard/profil/edit')}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-slate-50"
          >
            <TintIcon name="edit" tint="slate" size="w-9 h-9 rounded-xl" icon="w-[18px] h-[18px]" />
            <span className="flex-1 font-semibold text-slate-800">Perubahan Data</span>
            <Icon name="chevron" className="w-5 h-5 text-slate-300" sw={2} />
          </button>
          {soonMenu.map((m) => (
            <button
              key={m.t}
              type="button"
              onClick={() => setSoon(m.t)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-slate-50"
            >
              <TintIcon name={m.icon} tint="slate" size="w-9 h-9 rounded-xl" icon="w-[18px] h-[18px]" />
              <span className="flex-1 font-semibold text-slate-800">{m.t}</span>
              <Icon name="chevron" className="w-5 h-5 text-slate-300" sw={2} />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => void signOut({ callbackUrl: pengurusOn && pengurusDest ? pengurusDest : '/login' })}
          className={`w-full ${CARD} px-4 py-3.5 flex items-center gap-3 text-left active:bg-rose-50`}
        >
          <TintIcon name="logout" tint="rose" size="w-9 h-9 rounded-xl" icon="w-[18px] h-[18px]" />
          <span className="flex-1 font-semibold text-[#c9232c]">Keluar akun anggota</span>
        </button>
      </div>

      <Sheet open={pengurusSheet} onClose={() => setPengurusSheet(false)}>
        <form onSubmit={submitPengurus}>
          <SheetHead
            title="Masuk sebagai Pengurus"
            sub="Akun peserta di HP ini tetap aktif. Pindah lewat ModeSwitch di Beranda."
          />
          <div className="space-y-4">
            <Field label="Email">
              <span className={LOGIN_BOX}>
                <input
                  type="email"
                  value={pwEmail}
                  onChange={(e) => setPwEmail(e.target.value.trim())}
                  placeholder="contoh@gmail.com"
                  className={LOGIN_INPUT}
                />
              </span>
            </Field>
            <Field label="Password">
              <span className={LOGIN_BOX}>
                <input
                  type={show ? 'text' : 'password'}
                  value={pwPass}
                  onChange={(e) => setPwPass(e.target.value)}
                  placeholder="••••••••"
                  className={LOGIN_INPUT}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="shrink-0 w-11 h-11 mr-1 flex items-center justify-center text-slate-400"
                >
                  <Icon name={show ? 'eyeOff' : 'eye'} className="w-5 h-5" />
                </button>
              </span>
            </Field>
          </div>
          {error && <p className="text-sm text-[#c9232c] mt-2">{error}</p>}
          <button
            type="submit"
            disabled={loading || !pwEmail || pwPass.length < 6}
            className={`mt-4 w-full py-3.5 ${BTN_RED}`}
          >
            {loading ? 'Masuk…' : 'Masuk'}
          </button>
        </form>
      </Sheet>

      <Sheet open={Boolean(soon)} onClose={() => setSoon(null)}>
        <SheetHead title={soon ?? ''} sub="Segera hadir." />
        <button type="button" onClick={() => setSoon(null)} className={`w-full py-3.5 ${BTN_RED}`}>
          Tutup
        </button>
      </Sheet>
    </main>
  )
}
