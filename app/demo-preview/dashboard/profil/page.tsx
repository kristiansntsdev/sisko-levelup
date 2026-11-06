/* eslint-disable */
// GENERATED from app/dashboard/profil/page.tsx by scripts/gen-demo-preview.mjs — do not edit; change the source or the generator and re-run.
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, useSession } from '@/components/demo-preview/shim/session'
import { getPesertaById, getMemberCardForPeserta } from '@/components/demo-preview/shim/actions/peserta'
import { getActiveSessions, loginPengurusFromPwa, logoutPengurusKeepMember } from '@/components/demo-preview/shim/actions/pwa-auth'
import { USERLEVEL_LABEL, type MemberCardData } from '@/lib/pwa-member'
import { ANTON, BTN, Chip, InfoRow, LABEL, LIFTED, MONO, PANEL, PaperMain, PRESS, ROWS, StickerLabel, Strip } from '@/components/pwa/paper-ui'
import { ProfilePhotoPicker } from '@/components/pwa/profile-photo'
import { Field, Icon, Sheet, SheetHead, type IconName } from '@/components/pwa/ui'

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
      router.replace('/demo-preview/login?callbackUrl=/demo-preview/dashboard/profil')
      return
    }
    const id = session?.user?.idPeserta
    if (!id) return
    Promise.all([getPesertaById(id), getMemberCardForPeserta(id), getActiveSessions()]).then(([p, c, s]) => {
      if (p) {
        setNama(p.nama)
        setEmail(p.email)
        setLevel(p.userlevel)
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

  const infoRows: { icon: IconName; k: string; v: string }[] = [
    { icon: 'phone', k: 'Telepon', v: nowa || '—' },
    { icon: 'mail', k: 'Email', v: email || session?.user?.email || '—' },
    { icon: 'church', k: 'Gereja', v: gereja || '—' },
    { icon: 'pin', k: 'LevelUP Kota', v: card?.city || '—' },
    { icon: 'shield', k: 'Level', v: USERLEVEL_LABEL[level] ?? 'Tamu' },
  ]

  const soonMenu: { icon: IconName; t: string }[] = [
    { icon: 'lock', t: 'Privasi & Keamanan' },
    { icon: 'help', t: 'Bantuan' },
  ]

  return (
    <PaperMain>
      <header className="px-5 pt-6 flex items-center gap-5">
        <ProfilePhotoPicker card={card} onSaved={(url) => setCard((c) => (c ? { ...c, photo: url } : c))} />
        <div className="min-w-0 flex-1">
          {card?.no && <StickerLabel>ID – {card.no}</StickerLabel>}
          <h1 className={`${ANTON} mt-2 text-[#161616] text-[30px] leading-[1.08] tracking-[.01em] break-words`}>{nama || session?.user?.name}</h1>
          <p className={`${ANTON} mt-1 -skew-x-12 origin-bottom-left text-[#c21f24] text-[18px] leading-tight tracking-[.01em]`}>{card?.city || '—'}</p>
        </div>
      </header>

      <div className="px-5 mt-6 space-y-4 pb-4">
        <section aria-label="Data anggota" className={`px-4 ${ROWS} ${PANEL}`}>
          {infoRows.map((r) => (
            <InfoRow key={r.k} icon={r.icon} label={r.k}>
              {r.v}
            </InfoRow>
          ))}
        </section>

        <button
          type="button"
          onClick={() => {
            if (pengurusOn && pengurusDest) router.push(pengurusDest)
            else setPengurusSheet(true)
          }}
          className={`w-full rounded-[14px] bg-[#161616] text-[#fbf6ec] p-4 flex items-center gap-3 text-left ${LIFTED} ${PRESS}`}
        >
          <Chip name="shield" className="bg-[#ffd83d] text-[#161616]" />
          <span className="flex-1 min-w-0">
            <span className={`${ANTON} block text-[18px] leading-tight tracking-[.02em]`}>
              {pengurusOn ? 'Buka Akun Sekretariat' : 'Masuk sebagai Pengurus'}
            </span>
            <span className={`${MONO} block text-[11px] text-[#fbf6ec]/75 truncate`}>
              {pengurusOn ? `Pengurus · ${pengurusNama}` : 'Email + password akun pengurus'}
            </span>
          </span>
          <Icon name="chevron" className="w-5 h-5 shrink-0 text-[#ffd83d]" sw={2} />
        </button>

        {pengurusOn && (
          <button
            type="button"
            onClick={() => void logoutPengurusKeepMember()}
            className={`${MONO} w-full text-left text-[12px] font-bold text-[#c21f24] rounded-[14px] border-2 border-dotted border-[#c21f24]/60 px-4 py-3 ${PRESS}`}
          >
            Keluar dari Akun Sekretariat (tetap di Kartu Saya)
          </button>
        )}

        <section aria-label="Pengaturan" className={`px-4 ${ROWS} ${PANEL}`}>
          <button
            type="button"
            onClick={() => router.push('/demo-preview/dashboard/profil/edit')}
            className="w-full flex items-center gap-3 py-3 text-left"
          >
            <Chip name="edit" className="bg-[#e02a2f] text-white" />
            <span className={`${ANTON} flex-1 text-[16px] tracking-[.02em]`}>Perubahan Data</span>
            <Icon name="chevron" className="w-5 h-5 shrink-0" sw={2} />
          </button>
          <button
            type="button"
            onClick={() => router.push('/demo-preview/dashboard/profil/feedback')}
            className="w-full flex items-center gap-3 py-3 text-left"
          >
            <Chip name="chat" className="bg-[#ffd83d] text-[#161616]" />
            <span className={`${ANTON} flex-1 text-[16px] tracking-[.02em]`}>Feedback App</span>
            <Icon name="chevron" className="w-5 h-5 shrink-0" sw={2} />
          </button>
          {soonMenu.map((m) => (
            <button
              key={m.t}
              type="button"
              onClick={() => setSoon(m.t)}
              className="w-full flex items-center gap-3 py-3 text-left"
            >
              <Chip name={m.icon} className="bg-[#161616]/[.07]" />
              <span className={`${ANTON} flex-1 text-[16px] tracking-[.02em]`}>{m.t}</span>
              <span className={`${LABEL} rotate-6 text-[8.5px] font-bold text-[#c21f24]`}>Soon</span>
            </button>
          ))}
        </section>

        <button
          type="button"
          onClick={() => void signOut({ callbackUrl: pengurusOn && pengurusDest ? pengurusDest : '/demo-preview/login' })}
          className={`w-full px-4 py-3 flex items-center gap-3 text-left ${PANEL} ${PRESS}`}
        >
          <Chip name="logout" className="ring-2 ring-[#c21f24] text-[#c21f24]" />
          <span className={`${ANTON} flex-1 text-[16px] tracking-[.02em] text-[#c21f24]`}>Keluar akun anggota</span>
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
          <button type="submit" disabled={loading || !pwEmail || pwPass.length < 6} className={`mt-4 ${BTN}`}>
            <Strip>{loading ? 'Masuk…' : 'Masuk'}</Strip>
          </button>
        </form>
      </Sheet>

      <Sheet open={Boolean(soon)} onClose={() => setSoon(null)}>
        <SheetHead title={soon ?? ''} sub="Segera hadir." />
        <button type="button" onClick={() => setSoon(null)} className={BTN}>
          <Strip>Tutup</Strip>
        </button>
      </Sheet>
    </PaperMain>
  )
}
