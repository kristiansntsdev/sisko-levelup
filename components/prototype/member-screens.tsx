'use client'
import { Fragment, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { useProto } from './context'
import type { ScreenId } from './screens'
import { BellIcon, GoogleIcon, Icon, type IconName } from './icons'
import {
  ACCOUNTS, CABANGS, DAILY_WORDS, HISTORY, LEVEL_STEPS, NEW_GOOGLE, NOTIFS, TESTIMONY_EVENTS, TODAY,
  type Account, type Attend, type Ev,
} from './data'
import {
  cabangName, dayTime, dd, detectJobsPlace, eligible, fmtShort, fmtStamp, inKota, isLengkap, memberVisible, mineAbsen, mon, onlinePhase, rangeFull, regState,
  registeredCount, soonLabel, ticketActive, ticketQr, ticketState, type RegState, type TicketState,
} from './logic'
import {
  Avatar, BTN_RED, CARD, Chevrons, DateBlock, Empty, FLD, Field, GOLD_LINE, H3, Hero, LIFT, Logo, MemberCard, ModeSwitch, Note, PAGE_BG,
  PageHero, Panel, PanelLabel, Pill, PlainBar, Poster, Qr, Rich, SheetHead, StatTriple, TicketCard, TintIcon, TopBar,
  fCard, ticketCode, type PillTone, type Tint,
} from './ui'

const ATTEND: Record<Attend, PillTone> = { Hadir: 'green', Terlambat: 'amber', 'Tidak hadir': 'slate' }
const TICKET_TONE: Record<TicketState, PillTone> = {
  Terdaftar: 'gold', Hadir: 'green', 'Hadir lengkap': 'green', 'Hadir sebagian': 'amber', 'Tidak hadir': 'slate',
}

// Tickets of the active account, soonest first
function useMyTickets() {
  const { me, events, regs, absen } = useProto()
  return regs
    .filter((r) => r.key === me.id)
    .flatMap((r) => {
      const e = events.find((x) => x.id === r.eventId)
      if (!e) return []
      const state = ticketState(e, me.id, absen)
      return [{ e, state, active: ticketActive(e, state) }]
    })
    .sort((a, b) => a.e.tgl.localeCompare(b.e.tgl))
}

// ---------------- Shared bits ----------------

export function BellButton() {
  const { sheet, notifUnread, readNotif } = useProto()
  return (
    <button
      onClick={() => { readNotif(); sheet(<NotifSheet />) }}
      aria-label="Notifikasi"
      className="w-11 h-11 shrink-0 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center relative ring-1 ring-white/25 active:scale-95 transition"
    >
      <BellIcon />
      {notifUnread && <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-[#f1dc9a] rounded-full ring-2 ring-[#d42f38]" />}
    </button>
  )
}

function NotifSheet() {
  return (
    <>
      <SheetHead title="Pengumuman" sub="Dari LevelUP Kota Medan & pusat" />
      <div className="divide-y divide-slate-100">
        {NOTIFS.map((n) => (
          <div key={n.t} className="flex gap-3 py-3">
            <TintIcon name="megaphone" tint="gold" />
            <div className="min-w-0">
              <p className="font-semibold text-[14px] text-slate-800">{n.t}</p>
              <p className="text-[12.5px] text-slate-500 mt-0.5">{n.s}</p>
              <p className="text-[11px] text-slate-400 mt-1">{n.when}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// ---------------- Login ----------------

const LOGIN_INPUT = 'w-full min-w-0 bg-transparent px-4 py-3.5 text-[16px] font-semibold outline-none placeholder:font-medium placeholder:text-slate-300'
const LOGIN_BOX = 'flex items-center rounded-2xl bg-slate-50 ring-1 ring-slate-200 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-[#c9232c]'

// Pengurus masuk dengan email + password (→ Sekretariat); anggota tetap lewat Google
function PengurusFields({ submitLabel = 'Masuk' }: { submitLabel?: string }) {
  const { soon } = useProto()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.length >= 6
  return (
    <>
      <div className="space-y-4">
        <Field label="Email">
          <span className={LOGIN_BOX}>
            <input type="email" inputMode="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value.trim())} placeholder="contoh@gmail.com" className={LOGIN_INPUT} />
          </span>
        </Field>
        <Field label="Password">
          <span className={LOGIN_BOX}>
            <input type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={LOGIN_INPUT} />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'} className="shrink-0 w-11 h-11 mr-1 flex items-center justify-center rounded-full text-slate-400 active:bg-slate-100">
              <Icon name={show ? 'eyeOff' : 'eye'} className="w-5 h-5" />
            </button>
          </span>
        </Field>
      </div>
      <div className="flex justify-end mt-2">
        <button type="button" onClick={() => soon('Reset password')} className="text-[12.5px] font-semibold text-[#c9232c] py-1">Lupa password?</button>
      </div>
      <button disabled={!valid} className={`mt-3 w-full py-3.5 ${BTN_RED}`}>{submitLabel}</button>
    </>
  )
}

function PengurusLoginSheet() {
  const { signInPengurus, go, toast } = useProto()
  return (
    <form onSubmit={(e) => { e.preventDefault(); signInPengurus(); go('k-home'); toast('Masuk sebagai pengurus') }}>
      <SheetHead title="Masuk sebagai Pengurus" sub="Akun peserta di HP ini tetap aktif. Pindah lewat tombol Kartu Saya / Akun Sekretariat." />
      <PengurusFields />
    </form>
  )
}

export function LoginScreen() {
  const { go, sheet, setDaftarStep, signInPengurus, toast } = useProto()
  return (
    <section>
      <Hero className="pt-16 md:pt-12 pb-28 text-center" decor="-right-8 top-4 w-44">
        <Chevrons className="-left-12 top-36 w-32 opacity-[.08]" />
        <Logo className="h-[92px] w-auto mx-auto drop-shadow-[0_6px_14px_rgba(60,0,5,.35)]" />
      </Hero>
      <div className="px-5 -mt-16 relative">
        <form
          onSubmit={(e) => { e.preventDefault(); signInPengurus(); go('k-home'); toast('Masuk sebagai pengurus') }}
          className="bg-white rounded-3xl shadow-[0_18px_40px_-14px_rgba(80,20,25,.3)] p-6"
        >
          <h2 className="font-extrabold text-[22px] text-[#3b1417]">Masuk</h2>
          <p className="text-[13.5px] text-slate-500 mt-1 mb-5">Pengurus masuk dengan email dan password akun LevelUP</p>
          <PengurusFields />
        </form>
        <div className="flex items-center gap-3 mt-7 text-[12px] text-slate-400">
          <span className="flex-1 h-px bg-slate-200" />Anggota LevelUP<span className="flex-1 h-px bg-slate-200" />
        </div>
        <button onClick={() => sheet(<GoogleSheet />)} className="mt-4 w-full py-3 rounded-2xl bg-white ring-1 ring-slate-200 font-semibold text-slate-700 flex items-center justify-center gap-2 active:bg-slate-50">
          <GoogleIcon />Masuk dengan Google
        </button>
        <p className="text-center text-[13px] text-slate-500 mt-5">
          Belum terdaftar anggota?{' '}
          <button onClick={() => { setDaftarStep('intro'); go('daftar') }} className="font-semibold text-[#c9232c]">Pendaftaran Anggota</button>
        </p>
      </div>
    </section>
  )
}

// ---------------- Google sign-in (sisko: login pertama membuat peserta baru) ----------------

export function GoogleSheet() {
  const { allAccounts, signIn, setDaftarStep, closeSheet, go } = useProto()
  const isNew = !allAccounts.some((a) => a.email === NEW_GOOGLE.email)
  const pick = (id: string) => { signIn(id); closeSheet(); go('home') }
  return (
    <>
      <p className="flex items-center gap-2 text-[13px] text-slate-500 mb-1"><GoogleIcon className="w-4 h-4" />Login dengan Google</p>
      <SheetHead title="Pilih akun" sub="untuk melanjutkan ke LevelUP" />
      <div className="divide-y divide-slate-100 rounded-2xl ring-1 ring-slate-200 overflow-hidden">
        {allAccounts.map((a) => (
          <button key={a.id} onClick={() => pick(a.id)} className="w-full flex items-center gap-3 px-3.5 py-3 text-left active:bg-slate-50">
            <span className="w-10 h-10 rounded-full overflow-hidden shrink-0"><Avatar g={a.g} /></span>
            <span className="flex-1 min-w-0">
              <span className="block font-semibold text-[14px] text-slate-800 truncate">{a.name}</span>
              <span className="block text-[12px] text-slate-500 truncate">{a.email}</span>
            </span>
            <Pill tone="green">Terdaftar</Pill>
          </button>
        ))}
        {isNew && (
          <button onClick={() => { closeSheet(); setDaftarStep('form'); go('daftar') }} className="w-full flex items-center gap-3 px-3.5 py-3 text-left active:bg-slate-50">
            <span className="w-10 h-10 rounded-full bg-[#3b1417] text-[#e6cd7e] font-bold flex items-center justify-center shrink-0">{NEW_GOOGLE.name[0]}</span>
            <span className="flex-1 min-w-0">
              <span className="block font-semibold text-[14px] text-slate-800 truncate">{NEW_GOOGLE.name}</span>
              <span className="block text-[12px] text-slate-500 truncate">{NEW_GOOGLE.email}</span>
            </span>
            <Pill tone="gold">Belum terdaftar</Pill>
          </button>
        )}
      </div>
      <p className="text-[12px] text-slate-500 mt-3">Akun yang belum terdaftar dibuatkan data anggota baru, lalu diminta mengisi data diri.</p>
    </>
  )
}

// ---------------- Pendaftaran anggota (= app/daftar sisko) ----------------

const KOTA_SELECT = 'w-full min-w-0 rounded-xl bg-slate-50 ring-1 ring-slate-200 px-3.5 py-3 text-[15px] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#c9232c]'

function DaftarIntro() {
  const { go, sheet } = useProto()
  const steps: [IconName, string, string][] = [
    ['user', 'Masuk dengan akun Google', 'Tanpa password. Login pertama otomatis membuat data anggota.'],
    ['edit', 'Isi data diri', 'Nama, nomor WA, LevelUP Kota, gereja, sekolah / kampus / tempat kerja.'],
    ['shield', 'Naik level', 'Mulai sebagai Tamu → Join Volunteer → ajukan Squad ke ALK kota kamu.'],
  ]
  return (
    <section>
      <Hero className="pt-4 md:pt-2 pb-24 text-center" decor="-right-8 top-6 w-44">
        <TopBar title="Pendaftaran Anggota" back={() => go('login')} />
        <Logo className="h-[64px] w-auto mx-auto mt-4 drop-shadow-[0_6px_14px_rgba(60,0,5,.35)]" />
      </Hero>
      <div className="px-5 -mt-14 relative space-y-4">
        <div className="bg-white rounded-3xl shadow-[0_18px_40px_-14px_rgba(80,20,25,.3)] p-6">
          <h2 className="font-extrabold text-[21px] text-[#3b1417]">Gabung LevelUP</h2>
          <p className="text-[13.5px] text-slate-500 mt-1">Tiga langkah untuk jadi anggota dan ikut event.</p>
          <ol className="mt-5 space-y-4">
            {steps.map(([i, t, d], n) => (
              <li key={t} className="flex gap-3">
                <span className="relative">
                  <TintIcon name={i} tint={n === 0 ? 'red' : 'gold'} size="w-10 h-10 rounded-xl" />
                  <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-[#3b1417] text-[#e6cd7e] text-[10.5px] font-bold flex items-center justify-center">{n + 1}</span>
                </span>
                <span className="min-w-0">
                  <span className="block font-bold text-[14.5px] text-[#3b1417]">{t}</span>
                  <span className="block text-[12.5px] text-slate-500 mt-0.5">{d}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-5 flex items-center gap-1.5 text-[11px] font-bold">
            {LEVEL_STEPS.map(([l, label], i) => (
              <Fragment key={l}>
                <span className={`px-2.5 py-1 rounded-full ${i === 0 ? 'bg-[#c9232c] text-white' : 'bg-[#f8f0dd] text-[#96792a]'}`}>{label}</span>
                {i < LEVEL_STEPS.length - 1 && <Icon name="chevron" className="w-3.5 h-3.5 text-[#d9c9a8]" sw={2.4} />}
              </Fragment>
            ))}
          </div>
          <button onClick={() => sheet(<GoogleSheet />)} className={`mt-6 w-full py-3.5 flex items-center justify-center gap-2 ${BTN_RED}`}>
            <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center"><GoogleIcon className="w-4 h-4" /></span>Daftar dengan Google
          </button>
        </div>
        <p className="text-center text-[13px] text-slate-500">
          Sudah punya akun? <button onClick={() => go('login')} className="font-semibold text-[#c9232c]">Masuk</button>
        </p>
      </div>
    </section>
  )
}

function DaftarForm() {
  const { register, setDaftarStep } = useProto()
  const [nama, setNama] = useState(NEW_GOOGLE.name)
  const [nowa, setNowa] = useState('')
  const [kota, setKota] = useState('')
  const [gereja, setGereja] = useState('')
  const [sekolah, setSekolah] = useState('')
  const [error, setError] = useState('')
  const tipe = detectJobsPlace(sekolah)

  // Same checks and order as app/daftar/page.tsx
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!nama.trim()) return setError('Nama wajib diisi.')
    if (!nowa.trim()) return setError('Nomor WA wajib diisi.')
    if (!kota) return setError('Pilih LevelUP kota kamu.')
    setError('')
    const d = nowa.replace(/\D/g, '').replace(/^(62|0)/, '')
    register({
      id: NEW_GOOGLE.id, pid: NEW_GOOGLE.pid, name: nama.trim(), first: nama.trim().split(/\s+/)[0], g: NEW_GOOGLE.g, gender: '—', level: 'Umum',
      no: `LUP-${NEW_GOOGLE.pid}`, pob: '—', dob: '—', dobShort: '—', church: gereja.trim() || '—', sinode: '—',
      city: cabangName(kota), kotalevelup: kota, since: '23-10-2026', email: NEW_GOOGLE.email,
      phone: `+62 ${[d.slice(0, 3), d.slice(3, 7), d.slice(7)].filter(Boolean).join('-')}`,
      education: '—', major: '—', job: sekolah.trim() ? `${sekolah.trim()}${tipe ? ` (${tipe})` : ''}` : '—', admin: false,
    })
    setDaftarStep('done')
  }

  return (
    <section>
      <Hero className="pt-4 md:pt-2 pb-20" decor="-right-6 top-10 w-40">
        <TopBar title="Isi Data Diri" back={() => setDaftarStep('intro')} />
        <p className="text-center text-[13px] text-white/80 mt-1">Lengkapi data sebelum mulai</p>
      </Hero>
      <form onSubmit={submit} className="px-5 -mt-12 relative space-y-4">
        <div className="bg-white rounded-3xl shadow-[0_18px_40px_-14px_rgba(80,20,25,.3)] p-5 space-y-4">
          <div className="flex items-center gap-3 rounded-2xl bg-[#faf7f2] ring-1 ring-[#efe3cc] p-3">
            <span className="w-10 h-10 rounded-full bg-[#3b1417] text-[#e6cd7e] font-bold flex items-center justify-center shrink-0">{NEW_GOOGLE.name[0]}</span>
            <span className="flex-1 min-w-0">
              <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-[.12em] uppercase text-[#96792a]"><GoogleIcon className="w-3.5 h-3.5" />Akun Google</span>
              <span className="block text-[13.5px] font-semibold text-slate-800 truncate">{NEW_GOOGLE.email}</span>
            </span>
          </div>
          <Field label="Nama"><input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama lengkap" className={FLD} /></Field>
          <Field label="Nomor WA"><input type="tel" inputMode="tel" value={nowa} onChange={(e) => setNowa(e.target.value)} placeholder="08123456789" className={FLD} /></Field>
          <Field label="LevelUP Kota">
            <select value={kota} onChange={(e) => setKota(e.target.value)} className={`${KOTA_SELECT} ${kota ? '' : 'text-slate-400'}`}>
              <option value="" disabled>Pilih LevelUP...</option>
              {CABANGS.map((c) => <option key={c.id} value={c.id} className="text-slate-900">{c.nama}</option>)}
            </select>
          </Field>
          <Field label="Gereja"><input value={gereja} onChange={(e) => setGereja(e.target.value)} placeholder="Nama gereja" className={FLD} /></Field>
          <Field label="Sekolah / Universitas / Tempat Kerja">
            <input value={sekolah} onChange={(e) => setSekolah(e.target.value)} placeholder="cth: SMAN 1 Medan, USU, PT Maju Jaya" className={FLD} />
          </Field>
          <p className="-mt-2 text-[12px] text-slate-500 flex flex-wrap items-center gap-1.5">
            Ketik nama lengkap atau singkatan — tipe akan terdeteksi otomatis
            {tipe && <Pill tone="gold">{tipe}</Pill>}
          </p>
        </div>
        {error && <p className="px-4 py-3 rounded-xl bg-rose-50 ring-1 ring-rose-200 text-[13px] text-rose-700 font-medium">{error}</p>}
        <Note>Kamu terdaftar sebagai <b>Tamu</b>. Setelah itu bisa <b>Join Volunteer</b> dari Beranda, lalu ajukan <b>Squad</b> ke ALK LevelUP Kota.</Note>
        <button className={`w-full py-3.5 ${BTN_RED}`}>Daftar Sekarang</button>
      </form>
    </section>
  )
}

function DaftarDone() {
  const { me, go } = useProto()
  const rows: [string, string][] = [['No. Anggota', me.no], ['Level', 'Tamu'], ['LevelUP Kota', me.city], ['Nomor WA', me.phone]]
  return (
    <section>
      <Hero className="pt-14 md:pt-10 pb-24 text-center" decor="-right-8 top-6 w-44">
        <span className="w-20 h-20 mx-auto rounded-full bg-white/15 ring-4 ring-white/25 flex items-center justify-center animate-[proto-pop_.35s_ease]">
          <Icon name="check" className="w-10 h-10" sw={2.6} />
        </span>
        <p className="font-extrabold text-[22px] mt-4">Selamat datang, {me.first}!</p>
        <p className="text-[13.5px] text-white/85 mt-1">Pendaftaran berhasil</p>
      </Hero>
      <div className="px-5 -mt-14 relative space-y-4">
        <div className="bg-white rounded-3xl shadow-[0_18px_40px_-14px_rgba(80,20,25,.3)] p-5">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
            {rows.map(([k, v]) => (
              <div key={k}><dt className="text-[11.5px] text-slate-400">{k}</dt><dd className="font-semibold text-[#3b1417] mt-0.5">{v}</dd></div>
            ))}
          </dl>
          <div className="h-px bg-[#f1e7d6] my-4" />
          <p className="text-[13px] font-bold text-[#3b1417]">Langkah berikutnya</p>
          <ul className="mt-2 space-y-2 text-[13px] text-slate-600">
            <li className="flex gap-2"><Icon name="ticket" className="w-[18px] h-[18px] text-[#c9232c] shrink-0" />Ambil tiket event di menu Event</li>
            <li className="flex gap-2"><Icon name="users" className="w-[18px] h-[18px] text-[#c9232c] shrink-0" />Join Volunteer dari kartu Level Anggota di Beranda</li>
          </ul>
        </div>
        <button onClick={() => go('home')} className={`w-full py-3.5 ${BTN_RED}`}>Masuk ke Beranda</button>
      </div>
    </section>
  )
}

export function DaftarScreen() {
  const { daftarStep } = useProto()
  if (daftarStep === 'form') return <DaftarForm />
  if (daftarStep === 'done') return <DaftarDone />
  return <DaftarIntro />
}

// ---------------- Level anggota (sisko dashboard: join volunteer / join squad) ----------------

function SquadSheet() {
  const { me, upgrades, joinSquad, closeSheet, toast } = useProto()
  const pending = upgrades.find((u) => u.key === me.id)
  const current = pending?.cabang ?? me.kotalevelup
  const [kota, setKota] = useState(current)
  return (
    <>
      <SheetHead
        title={pending ? 'Pengajuan Squad' : 'Ajukan Jadi Member Kota'}
        sub={pending
          ? `Pengajuan kamu ke ${cabangName(current)} sedang menunggu approval ALK. Salah kota? Pindahkan di sini.`
          : 'Pilih LevelUP kota tujuan. ALK kota itu yang akan approve kamu jadi squad.'}
      />
      <div className="space-y-4">
        <Field label="LevelUP Kota">
          <select value={kota} onChange={(e) => setKota(e.target.value)} className={KOTA_SELECT}>
            <option value="" disabled>Pilih LevelUP...</option>
            {CABANGS.map((c) => <option key={c.id} value={c.id}>{c.nama}</option>)}
          </select>
        </Field>
        <button
          disabled={!kota || Boolean(pending && kota === current)}
          onClick={() => { joinSquad(kota); closeSheet(); toast(pending ? `Pengajuan dipindah ke ${cabangName(kota)}` : `Pengajuan Squad terkirim ke ALK ${cabangName(kota)}`) }}
          className={`w-full py-3.5 ${BTN_RED}`}
        >
          {pending ? 'Pindahkan Pengajuan' : 'Ajukan'}
        </button>
      </div>
    </>
  )
}

function LevelCard() {
  const { me, upgrades, joinVolunteer, sheet, toast } = useProto()
  const at = LEVEL_STEPS.findIndex(([l]) => l === me.level)
  if (at < 0 || at >= 3) return null // Core ke atas: perjalanan selesai
  const pending = upgrades.find((u) => u.key === me.id)
  return (
    <div className="mx-5 mt-6 bg-white rounded-2xl ring-1 ring-[#f1e7d6] shadow-[0_10px_30px_-16px_rgba(80,20,25,.35)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-extrabold text-[15px] text-[#3b1417]">Level Anggota</p>
        <Pill tone="gold">{LEVEL_STEPS[at][1]}</Pill>
      </div>
      <div className="flex items-start mt-3">
        {LEVEL_STEPS.map(([l, label], i) => (
          <Fragment key={l}>
            <div className="flex flex-col items-center w-14 shrink-0">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${i < at ? 'bg-[#c3a54d] text-white' : i === at ? 'bg-[#c9232c] text-white ring-4 ring-[#fbeceb]' : 'bg-[#f4ece0] text-[#c4b08a]'}`}>
                {i < at ? <Icon name="check" className="w-4 h-4" sw={3} /> : i + 1}
              </span>
              <span className={`text-[10.5px] mt-1.5 font-semibold ${i === at ? 'text-[#c9232c]' : i < at ? 'text-[#96792a]' : 'text-slate-400'}`}>{label}</span>
            </div>
            {i < LEVEL_STEPS.length - 1 && <span className={`flex-1 h-0.5 mt-3.5 ${i < at ? 'bg-[#c3a54d]' : 'bg-[#f1e7d6]'}`} />}
          </Fragment>
        ))}
      </div>
      {me.level === 'Umum' && (
        <>
          <p className="text-[12.5px] text-slate-500 mt-3">Gabung jadi Volunteer untuk ikut melayani di event LevelUP.</p>
          <button onClick={() => { joinVolunteer(); toast('Kamu sekarang Volunteer') }} className={`mt-3 w-full py-3 ${BTN_RED}`}>Join Volunteer</button>
        </>
      )}
      {me.level === 'Volunteer' && !pending && (
        <>
          <p className="text-[12.5px] text-slate-500 mt-3">Ajukan jadi Squad di LevelUP kota kamu. ALK kota itu yang akan approve.</p>
          <button onClick={() => sheet(<SquadSheet />)} className={`mt-3 w-full py-3 ${BTN_RED}`}>Join Squad</button>
        </>
      )}
      {me.level === 'Volunteer' && pending && (
        <>
          <p className="mt-3 flex items-center gap-2 rounded-xl bg-[#f8f0dd] ring-1 ring-[#ecdcb3] px-3 py-2.5 text-[12.5px] text-[#6b551c]">
            <Icon name="clock" className="w-4 h-4 shrink-0 text-[#96792a]" />Menunggu approval ALK {cabangName(pending.cabang)}
          </p>
          <button onClick={() => sheet(<SquadSheet />)} className="mt-3 w-full py-3 rounded-2xl bg-white ring-2 ring-[#c9232c] text-[#c9232c] font-bold">Pindahkan Pengajuan</button>
        </>
      )}
      {me.level === 'Squad' && (
        <>
          <p className="text-[12.5px] text-slate-500 mt-3">Kamu sudah Squad. Pengajuan Core belum dibuka.</p>
          <button disabled className={`mt-3 w-full py-3 ${BTN_RED}`}>Join Core · Segera</button>
        </>
      )}
    </div>
  )
}

// ---------------- Beranda ----------------

interface Feature { i: IconName; t: string; tint: Tint; to?: ScreenId }

const FEATURES: Feature[] = [
  { i: 'ticket', t: 'My Ticket', tint: 'red', to: 'tickets' },
  { i: 'users', t: 'Pemuridan', tint: 'red' },
  { i: 'calendar', t: 'Event', tint: 'red', to: 'events' },
  { i: 'book', t: 'DeeperWP', tint: 'gold' },
  { i: 'gift', t: 'We-Worship', tint: 'gold' },
  { i: 'chat', t: 'Kesaksian', tint: 'red', to: 'kesaksian' },
  { i: 'megaphone', t: 'Pengumuman', tint: 'gold' },
  { i: 'grid', t: 'Lainnya', tint: 'slate' },
]

function UpcomingItem({ e }: { e: Ev }) {
  const { openViewEvent } = useProto()
  const soon = soonLabel(e.tgl)
  return (
    <button onClick={() => openViewEvent(e.id)} className={`w-full ${CARD} p-3.5 flex items-center gap-3.5 text-left active:scale-[.99] transition`}>
      <DateBlock d={dd(e.tgl)} m={mon(e.tgl)} tone={e.status === 'live' ? 'solid' : 'red'} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-bold text-[14px] text-[#3b1417] truncate">{e.name}</p>
          {soon && <span className="shrink-0 text-[10px] font-bold text-[#96792a] bg-[#f8f0dd] px-2 py-0.5 rounded-full">{soon}</span>}
        </div>
        <p className="text-[12px] text-slate-500 mt-0.5">{e.jam} WIB · {e.jenis}</p>
        <p className="text-[12px] text-slate-400 truncate">{e.alamat}</p>
      </div>
    </button>
  )
}

export function HomeScreen() {
  const { me, pengurusOn, photos, testimonies, events, go, soon, sheet, openTicket } = useProto()
  const [slide, setSlide] = useState(0)
  const track = useRef<HTMLDivElement>(null)
  const seeded = ACCOUNTS.some((a) => a.id === me.id) // riwayat dummy hanya milik akun contoh
  const month = seeded ? HISTORY.filter((h) => h.m === 'OKT') : []
  const attended = month.filter((h) => h.status !== 'Tidak hadir').length
  const next = useMyTickets().find((t) => t.active)
  const upcoming = events.filter((e) => memberVisible(e) && inKota(e, me.kotalevelup)).sort((a, b) => a.tgl.localeCompare(b.tgl))

  const toSlide = (i: number) => {
    const el = track.current
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
    setSlide(i)
  }
  const onScroll = () => {
    const el = track.current
    if (el) setSlide(Math.round(el.scrollLeft / el.clientWidth))
  }
  const onFeature = (f: Feature) => {
    if (f.to) go(f.to)
    else if (f.t === 'Pengumuman') sheet(<NotifSheet />)
    else soon(f.t === 'Lainnya' ? 'Layanan lainnya' : f.t)
  }

  return (
    <section>
      <Hero className="pt-5 md:pt-3 pb-14 rounded-b-[32px]" decor="-right-6 top-32 w-44">
        {pengurusOn && (
          <div className="mb-4">
            <ModeSwitch alk={false} onChange={(alk) => alk && go('k-home')} />
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="block w-12 h-12 shrink-0 rounded-full overflow-hidden ring-2 ring-[#e6cd7e]"><Avatar g={me.g} photo={photos[me.id]} /></span>
            <span className="leading-tight min-w-0">
              <span className="block text-[13px] text-white/80">Selamat datang</span>
              <span className="block font-bold text-[17px] truncate">{me.name}</span>
            </span>
          </div>
          <BellButton />
        </div>

        <div className="grid grid-cols-3 gap-2 mt-5 text-[13.5px]">
          {['Kartu', 'Tiket'].map((t, i) => (
            <button
              key={t}
              onClick={() => toSlide(i)}
              className={`py-2.5 rounded-full font-semibold transition ${slide === i ? 'bg-white text-[#c9232c] shadow' : 'bg-white/15 text-white ring-1 ring-white/25'}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div
          ref={track}
          onScroll={onScroll}
          className="-mx-5 mt-4 flex overflow-x-auto snap-x snap-mandatory pb-6 -mb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="w-full shrink-0 snap-center px-5"><MemberCard m={me} photo={photos[me.id]} onClick={() => go('detail')} /></div>
          <div className="w-full shrink-0 snap-center px-5">
            {next ? (
              <TicketCard e={next.e} a={me} state={next.state} onClick={() => openTicket(next.e.id, me.id)} />
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-white/40 bg-white/10 aspect-[352/232] flex flex-col items-center justify-center text-center px-6">
                <Icon name="ticket" className="w-10 h-10 text-[#f1dc9a]" sw={1.6} />
                <p className="font-bold mt-2">Belum ada tiket aktif</p>
                <button onClick={() => go('events')} className="mt-3 px-4 py-2 rounded-full bg-white text-[#c9232c] text-[13px] font-bold">Cari Event</button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 text-[14px]">
          <div className="flex items-center gap-1.5">
            {[0, 1].map((i) => (
              <button key={i} onClick={() => toSlide(i)} aria-label={`Slide ${i + 1}`} className={`h-2 rounded-full transition-all ${slide === i ? 'w-7 bg-[#e6cd7e]' : 'w-2 bg-white/45'}`} />
            ))}
          </div>
          {slide === 0 ? (
            <button className="font-medium text-white/95 flex items-center gap-1" onClick={() => go('detail')}>
              Lihat detail kartu<Icon name="chevron" className="w-4 h-4" sw={2.2} />
            </button>
          ) : (
            <button className="font-medium text-white/95 flex items-center gap-1" onClick={() => go('tickets')}>
              Semua tiket<Icon name="chevron" className="w-4 h-4" sw={2.2} />
            </button>
          )}
        </div>
      </Hero>

      {/* dark status strip, overlapping the hero */}
      <div className="relative z-10 mx-5 -mt-8 bg-[#2a1416] text-white rounded-2xl grid grid-cols-2 shadow-lg">
        <div className="py-3.5 pl-4 pr-8">
          <p className="text-[12px] text-white/70">Kehadiran Bulan Ini</p>
          <p className="font-bold mt-0.5 text-[#e6cd7e] whitespace-nowrap">{attended} dari {month.length} event</p>
        </div>
        <div className="py-3.5 pr-4 pl-8 text-right">
          <p className="text-[12px] text-white/70">Kesaksian</p>
          <p className="font-bold mt-0.5 text-[#e6cd7e]">{seeded ? testimonies.length : 0} terkirim</p>
        </div>
        <div className="absolute inset-y-0 left-1/2 w-px bg-white/15" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#b3202a] ring-[3px] ring-[#2a1416] flex items-center justify-center overflow-hidden">
          <Logo className="w-10 h-auto" />
        </div>
      </div>

      <LevelCard />

      <div className="px-5">
        <h3 className={`${H3} mt-7 mb-4`}>Layanan Digital LevelUP</h3>
        <div className="grid grid-cols-4 gap-y-5 gap-x-2">
          {FEATURES.map((f) => (
            <button key={f.t} onClick={() => onFeature(f)} className="flex flex-col items-center gap-2 active:scale-95 transition">
              <TintIcon name={f.i} tint={f.tint} size="w-[58px] h-[58px] rounded-[18px]" icon="w-7 h-7" />
              <span className="text-[11px] text-slate-700 font-bold uppercase tracking-wide leading-tight text-center">{f.t}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mt-8 mb-3">
          <h3 className={H3}>Event Mendatang</h3>
          <button onClick={() => go('events')} className="text-[13px] font-semibold text-[#c9232c] py-1 pl-3">Lihat semua</button>
        </div>
        <div className="space-y-3">{upcoming.slice(0, 2).map((e) => <UpcomingItem key={e.id} e={e} />)}</div>
      </div>
    </section>
  )
}

export function DailyWords({ onClose }: { onClose: () => void }) {
  const { toast } = useProto()
  const share = () => {
    const text = `“${DAILY_WORDS.verse}” — ${DAILY_WORDS.ref}`
    if (navigator.share) navigator.share({ title: 'Daily Words LevelUP', text }).catch(() => {})
    else navigator.clipboard?.writeText(text).then(() => toast('Ayat disalin'), () => toast('Gagal menyalin'))
  }
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[#2a1416]/60 animate-[proto-fade_.2s_ease]" onClick={onClose} />
      <div
        role="dialog"
        aria-label="Daily Words"
        className="relative w-full max-w-[340px] rounded-[28px] overflow-hidden shadow-2xl text-[#3b1417] animate-[proto-pop_.3s_ease]"
        style={{ background: 'linear-gradient(160deg, #ffd596 0%, #ffc175 42%, #f6a54c 100%)' }}
      >
        <svg className="absolute -right-8 top-16 w-44 opacity-[.08] pointer-events-none" viewBox="0 0 130 50" fill="none" stroke="#7c1219" strokeWidth="11" aria-hidden="true">
          <path d="M6 4l21 21-21 21M48 4l21 21-21 21M90 4l21 21-21 21" />
        </svg>
        <button onClick={onClose} aria-label="Tutup" className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/45 flex items-center justify-center">
          <Icon name="x" className="w-5 h-5" sw={2.2} />
        </button>
        <div className="relative px-6 pt-7 pb-6">
          <p className="flex items-center gap-2 text-[11px] font-bold tracking-[.18em] text-[#7c1219]">
            <Icon name="sparkle" className="w-4 h-4" />DAILY WORDS
          </p>
          <p className="text-[12.5px] text-[#7c1219]/70 mt-1">{DAILY_WORDS.date}</p>
          <p className={`${fCard} text-[72px] leading-none text-[#c9232c]/35 mt-3 -mb-8`}>“</p>
          <p className="text-[21px] font-extrabold leading-snug">{DAILY_WORDS.verse}</p>
          <p className="mt-3 font-bold text-[#7c1219]">— {DAILY_WORDS.ref}</p>
          <p className="mt-5 text-[13px] leading-relaxed text-[#5a2a10] bg-white/40 rounded-2xl p-3.5">{DAILY_WORDS.note}</p>
          <div className="grid grid-cols-5 gap-2 mt-5">
            <button onClick={onClose} className="col-span-3 py-3 rounded-2xl bg-[#3b1417] text-[#f1dc9a] font-bold active:scale-[.98] transition">Amin</button>
            <button onClick={share} className="col-span-2 py-3 rounded-2xl bg-white/55 font-bold flex items-center justify-center gap-1.5">
              <Icon name="share" className="w-4 h-4" />Bagikan
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------- Detail kartu ----------------

export function DetailScreen() {
  const { me, photos, go } = useProto()
  const fields: [string, string][] = [
    ['Jenis Kelamin', me.gender], ['Tempat, Tgl Lahir', `${me.pob}, ${me.dobShort}`],
    ['Gereja', me.church], ['Pendidikan', me.education],
    ['Sinode', me.sinode], ['Jurusan', me.major],
    ['Cabang', me.city], ['Pekerjaan', me.job],
  ]
  return (
    <section>
      <Hero className="pt-4 md:pt-2 pb-20" decor="-right-6 top-24 w-44">
        <TopBar title="Detail Kartu Anggota" back={() => go('home')} />
        <div className="mt-4"><MemberCard m={me} photo={photos[me.id]} /></div>
      </Hero>
      <div className="px-5 -mt-10 relative space-y-4">
        <div className="bg-white rounded-3xl shadow-[0_10px_30px_-10px_rgba(80,20,25,.25)] p-5">
          <p className="font-bold text-[#3b1417] mb-3">Data Anggota</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
            {fields.map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11.5px] text-slate-400">{k}</dt>
                <dd className="font-semibold text-slate-800 mt-0.5">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <button onClick={() => go('profile')} className={`w-full ${CARD} p-4 flex items-center gap-3 text-left`}>
          <TintIcon name="edit" tint="gold" />
          <span className="flex-1">
            <span className="block font-bold text-[14px] text-[#3b1417]">Data tidak sesuai?</span>
            <span className="block text-[12px] text-slate-500">Ajukan perubahan dari menu Profil</span>
          </span>
          <Icon name="chevron" className="w-5 h-5 text-slate-300" sw={2} />
        </button>
      </div>
    </section>
  )
}

// ---------------- Events (gaya JPCC) ----------------

// OPEN = brand red, FULL = gold, CLOSED = stone
const REG_TAB: Record<RegState, string> = { OPEN: 'bg-[#c9232c]', FULL: 'bg-[#b1953a]', CLOSED: 'bg-stone-400' }
const REG_TEXT: Record<RegState, [string, string]> = {
  OPEN: ['Open', 'text-[#c9232c]'], FULL: ['Full', 'text-[#96792a]'], CLOSED: ['Closed', 'text-stone-500'],
}

function EventCard({ e, state, onClick }: { e: Ev; state: RegState; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex h-[104px] rounded-[22px] overflow-hidden shadow-[0_12px_26px_-14px_rgba(80,20,25,.5)] text-left active:scale-[.99] transition ${REG_TAB[state]}`}>
      <Poster p={e.poster} className="w-[104px] h-full shrink-0" />
      <div className="flex-1 min-w-0 bg-white rounded-r-[20px] px-3.5 flex flex-col justify-center">
        <p className="text-[12px] font-semibold text-[#96792a] truncate">{e.category}<span className="font-medium text-stone-400"> · {cabangName(e.cabang)}</span></p>
        <p className="text-[15.5px] font-bold text-[#3b1417] truncate mt-0.5">{e.name}</p>
        <p className="text-[12.5px] text-slate-500 truncate mt-1">{rangeFull(e)}</p>
      </div>
      <div className="w-9 shrink-0 flex items-center justify-center">
        <span className="-rotate-90 text-white text-[12px] font-extrabold tracking-[.14em] whitespace-nowrap">{state}</span>
      </div>
    </button>
  )
}

function KotaSheet({ value, onPick }: { value: string; onPick: (cabang: string) => void }) {
  const { me, events, closeSheet } = useProto()
  const visible = events.filter(memberVisible)
  const count = (cabang: string) => visible.filter((e) => inKota(e, cabang)).length
  const options: [string, string][] = [['all', 'Semua Kota'], ...CABANGS.map((c): [string, string] => [c.id, c.nama])]
  return (
    <>
      <SheetHead title="Pilih LevelUP Kota" sub="Event nasional selalu tampil di semua kota" />
      <div className="space-y-2">
        {options.map(([id, nama]) => {
          const on = id === value
          return (
            <button
              key={id}
              onClick={() => { onPick(id); closeSheet() }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left transition ${on ? 'ring-2 ring-[#c9232c] bg-[#fbeceb]/60' : 'ring-1 ring-[#efe3cc] bg-white'}`}
            >
              <TintIcon name={id === 'all' ? 'grid' : 'pin'} tint={on ? 'red' : 'gold'} size="w-9 h-9 rounded-xl" icon="w-[18px] h-[18px]" />
              <span className="flex-1 min-w-0">
                <span className={`block font-bold text-[14.5px] truncate ${on ? 'text-[#c9232c]' : 'text-[#3b1417]'}`}>
                  {nama}{id === me.kotalevelup && <span className="text-[11px] font-semibold text-[#96792a]"> · Kota kamu</span>}
                </span>
                <span className="block text-[12px] text-slate-500">{count(id)} event</span>
              </span>
              {on && <Icon name="check" className="w-5 h-5 text-[#c9232c]" sw={2.6} />}
            </button>
          )
        })}
      </div>
    </>
  )
}

export function EventsScreen() {
  const { events, regs, eventKota, setEventKota, go, sheet, openViewEvent } = useProto()
  const [q, setQ] = useState('')
  const [venue, setVenue] = useState('All')
  const list = events.filter((e) => memberVisible(e) && inKota(e, eventKota)).sort((a, b) => a.tgl.localeCompare(b.tgl))
  const venues = ['All', ...new Set(list.map((e) => e.venue))]
  const needle = q.trim().toLowerCase()
  const shown = list.filter((e) => (venue === 'All' || e.venue === venue) && (!needle || `${e.name} ${e.category}`.toLowerCase().includes(needle)))
  const pickKota = (cabang: string) => { setEventKota(cabang); setVenue('All') }

  return (
    <section className={`flex-1 ${PAGE_BG}`}>
      <PlainBar
        title="Events"
        close={() => go('home')}
        right={(
          <button onClick={() => go('tickets')} aria-label="My Tickets" className="w-11 h-11 flex items-center justify-center rounded-full active:bg-white/10">
            <Icon name="ticket" className="w-7 h-7" sw={1.5} />
          </button>
        )}
      />
      <div className="px-4 pt-4 pb-6">
        <label className="flex items-center gap-2.5 rounded-full bg-white ring-1 ring-[#efe3cc] shadow-[0_6px_18px_-12px_rgba(80,20,25,.4)] px-4 py-3 focus-within:ring-2 focus-within:ring-[#c9232c] transition">
          <Icon name="search" className="w-5 h-5 text-[#c9232c]" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="flex-1 min-w-0 bg-transparent outline-none text-[16px] placeholder:text-stone-400" />
        </label>
        <button
          onClick={() => sheet(<KotaSheet value={eventKota} onPick={pickKota} />)}
          className="mt-3 w-full flex items-center gap-3 rounded-2xl bg-white ring-1 ring-[#efe3cc] shadow-[0_6px_18px_-12px_rgba(80,20,25,.4)] px-3.5 py-2.5 text-left active:scale-[.99] transition"
        >
          <TintIcon name="pin" tint="red" size="w-9 h-9 rounded-xl" icon="w-[18px] h-[18px]" />
          <span className="flex-1 min-w-0">
            <span className="block text-[10.5px] font-bold tracking-[.14em] uppercase text-[#96792a]">LevelUP Kota</span>
            <span className="block font-bold text-[15px] text-[#3b1417] truncate">{eventKota === 'all' ? 'Semua Kota' : cabangName(eventKota)}</span>
          </span>
          <span className="text-[12px] font-semibold text-[#c9232c] flex items-center gap-0.5">Ganti<Icon name="down" className="w-4 h-4" sw={2.4} /></span>
        </button>
        <div className="flex gap-3 mt-4 overflow-x-auto -mx-4 px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {venues.map((v) => (
            <button
              key={v}
              onClick={() => setVenue(v)}
              className={`shrink-0 h-10 px-5 rounded-full border-2 text-[14px] font-semibold tracking-wide transition ${v === venue ? 'border-[#c9232c] text-[#c9232c] bg-[#fbeceb]' : 'border-[#e7dccb] text-stone-500 bg-white'} ${v === 'All' ? '' : 'uppercase'}`}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="mt-5 space-y-4">
          {shown.length
            ? shown.map((e) => <EventCard key={e.id} e={e} state={regState(e, registeredCount(e, regs))} onClick={() => openViewEvent(e.id)} />)
            : <p className="text-center text-slate-400 text-[14px] py-10">{list.length ? 'Tidak ada event yang cocok' : `Belum ada event di ${cabangName(eventKota)}`}</p>}
        </div>
      </div>
    </section>
  )
}

function GetTicketSheet({ e }: { e: Ev }) {
  const { me, addReg, closeSheet, openTicket, toast } = useProto()
  const take = () => {
    addReg({ eventId: e.id, key: me.id })
    closeSheet()
    openTicket(e.id, me.id)
    toast('Tiket berhasil dibuat')
  }
  return (
    <>
      <SheetHead title="Konfirmasi Pendaftaran" sub="Tiket dibuat atas nama akun yang sedang aktif" />
      <div className="flex gap-3 rounded-2xl bg-[#faf7f2] ring-1 ring-[#efe3cc] p-3">
        <Poster p={e.poster} className="w-16 h-16 rounded-xl shrink-0" />
        <div className="min-w-0">
          <p className="font-bold text-[15px] text-[#3b1417] leading-snug">{e.name}</p>
          <p className="text-[12.5px] text-slate-500 mt-0.5">{dayTime(e)}</p>
        </div>
      </div>
      <dl className="mt-3 text-[13.5px] divide-y divide-slate-100">
        <div className="flex justify-between gap-3 py-2.5"><dt className="text-slate-500">Nama</dt><dd className="font-semibold text-slate-800 text-right">{me.name}</dd></div>
        <div className="flex justify-between gap-3 py-2.5"><dt className="text-slate-500">Email</dt><dd className="font-semibold text-slate-800 text-right truncate">{me.email}</dd></div>
      </dl>
      <p className="text-[12px] text-slate-500 mt-2">Satu tiket untuk satu akun. Ajak temanmu ambil tiket dari akunnya sendiri.</p>
      <button onClick={take} className={`mt-4 w-full py-3.5 ${BTN_RED}`}>Ambil Tiket</button>
    </>
  )
}

export function EventScreen() {
  const { events, viewEventId, me, regs, go, sheet, openTicket } = useProto()
  const [more, setMore] = useState(false)
  const e = events.find((x) => x.id === viewEventId) ?? events[0]
  const count = registeredCount(e, regs)
  const st = regState(e, count)
  const ok = eligible(e, me)
  const mine = regs.some((r) => r.eventId === e.id && r.key === me.id)
  const targets = [...e.target, ...e.targetPengurus]
  const extra: [string, string][] = [
    ['LevelUP Kota', cabangName(e.cabang)], ['Jenis Event', e.jenis], ['Kategori', e.category],
    ...(e.speaker ? [['Pembicara', e.speaker] as [string, string]] : []),
    ...(e.theme ? [['Tema', e.theme] as [string, string]] : []),
    ['Kuota', `${count} / ${e.quota} peserta`],
  ]

  const cta = mine
    ? <button onClick={() => openTicket(e.id, me.id)} className="w-full py-3.5 rounded-xl bg-white ring-2 ring-[#c9232c] text-[#c9232c] text-[17px] font-bold">Lihat Tiket Saya</button>
    : !ok ? <Disabled>Not Eligible to Get Ticket</Disabled>
      : st === 'FULL' ? <Disabled>Registration Full</Disabled>
        : st === 'CLOSED' ? <Disabled>Registration Closed</Disabled>
          : <button onClick={() => sheet(<GetTicketSheet e={e} />)} className="w-full py-3.5 rounded-xl bg-[#c9232c] text-white text-[17px] font-bold shadow-[0_8px_20px_-6px_rgba(201,35,44,.6)] active:scale-[.99] transition">Get Ticket</button>

  return (
    <section className={`flex-1 flex flex-col ${PAGE_BG}`}>
      <PlainBar title="View Event" back={() => go('events')} />
      <Poster p={e.poster} className="w-full aspect-[16/10] shrink-0" />
      <div className="flex-1 px-5 pt-5 pb-6 space-y-4">
        <h1 className="text-[24px] font-extrabold text-[#3b1417] leading-tight">{e.name}</h1>

        <Panel>
          <div className="px-5 pt-4 pb-4">
            <PanelLabel>Day &amp; Time</PanelLabel>
            <p className="text-[16px] text-slate-700 mt-1">{dayTime(e)}</p>
            <div className="h-px bg-[#f1e7d6] my-4" />
            <PanelLabel>Location</PanelLabel>
            <p className="text-[16px] text-slate-700 mt-1 flex items-start gap-2">
              <Icon name={e.jenis === 'Online' ? 'monitor' : 'pin'} className="w-5 h-5 mt-0.5 shrink-0 text-[#c9232c]" />{e.alamat}
            </p>
            {more && (
              <dl className="mt-4 rounded-xl bg-[#faf7f2] ring-1 ring-[#f1e7d6] divide-y divide-[#f1e7d6] text-[14px]">
                {extra.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 px-3.5 py-2.5"><dt className="text-slate-500">{k}</dt><dd className="font-medium text-slate-800 text-right">{v}</dd></div>
                ))}
                {e.sesi.length > 0 && (
                  <div className="px-3.5 py-2.5">
                    <dt className="text-slate-500">Sesi</dt>
                    {e.sesi.map((s) => <dd key={s.id} className="font-medium text-slate-800 mt-1">{s.nama} · {fmtShort(s.tanggal)} {s.mulai}–{s.selesai}{s.wajib ? '' : ' (opsional)'}</dd>)}
                  </div>
                )}
              </dl>
            )}
          </div>
          <button onClick={() => setMore(!more)} className="w-full py-3.5 border-t border-[#f1e7d6] text-[15px] font-semibold text-[#c9232c]">
            {more ? 'Hide Details' : 'View Details'}
          </button>
        </Panel>

        <Panel className="px-5 py-4">
          <PanelLabel>Eligibility</PanelLabel>
          <p className={`flex items-center gap-2 text-[18px] font-semibold mt-1 ${ok ? 'text-emerald-600' : 'text-[#c9232c]'}`}>
            <Icon name={ok ? 'check' : 'x'} className="w-5 h-5" sw={2.6} />{ok ? 'Eligible to Register' : 'Not Eligible to Register'}
          </p>
          <div className="h-px bg-[#f1e7d6] my-4" />
          <p className="text-[16px] font-semibold text-[#3b1417]">Role</p>
          <p className="text-[15px] text-slate-500 mt-1">
            {'• '}{ok
              ? targets.length && !e.target.includes('Umum') ? `Terbuka untuk ${targets.join(', ')}.` : 'Terbuka untuk semua anggota.'
              : 'Hanya peran tertentu yang diharapkan hadir di Event ini.'}
          </p>
          {!ok && <p className="text-[15px] text-slate-500">{'• '}Peran kamu: {me.level}</p>}
        </Panel>

        <Panel className="px-5 py-4">
          <PanelLabel>Registration</PanelLabel>
          <p className={`text-[18px] font-semibold mt-1 ${REG_TEXT[st][1]}`}>{REG_TEXT[st][0]}</p>
          <p className="text-[15px] text-slate-600 mt-1">{fmtStamp(e.regOpen)} - {fmtStamp(e.regClose)} (WIB)</p>
          <div className="mt-3 h-1.5 rounded-full bg-[#f4ece0] overflow-hidden">
            <div className={`h-full rounded-full ${st === 'FULL' ? 'bg-[#b1953a]' : 'bg-[#c9232c]'}`} style={{ width: `${Math.min(100, (count / e.quota) * 100)}%` }} />
          </div>
          <p className="text-[12.5px] text-slate-400 mt-1.5">{count} dari {e.quota} kursi terisi</p>
        </Panel>

        {e.desc.length > 0 && (
          <Panel className="px-5 py-4">
            <PanelLabel>Description</PanelLabel>
            <div className="mt-2 space-y-3 text-[15.5px] leading-relaxed text-slate-700">
              {e.desc.map((p) => <p key={p}><Rich text={p} /></p>)}
              <div className="space-y-1">
                <p className="flex items-start gap-2"><Icon name="calendar" className="w-5 h-5 mt-0.5 shrink-0 text-[#c9232c]" />{rangeFull(e)}</p>
                <p className="flex items-start gap-2"><Icon name="clock" className="w-5 h-5 mt-0.5 shrink-0 text-[#c9232c]" />{e.jam}–{e.jamSelesai} WIB</p>
                <p className="flex items-start gap-2"><Icon name={e.jenis === 'Online' ? 'monitor' : 'pin'} className="w-5 h-5 mt-0.5 shrink-0 text-[#c9232c]" />{e.alamat}</p>
              </div>
              {e.note && <p className="font-bold">{e.note}</p>}
            </div>
          </Panel>
        )}
      </div>

      <div className="sticky bottom-0 z-10 bg-white border-t border-[#f1e7d6] shadow-[0_-8px_24px_-12px_rgba(80,20,25,.25)] px-5 pt-3 pb-[max(env(safe-area-inset-bottom),16px)]">{cta}</div>
    </section>
  )
}

const Disabled = ({ children }: { children: ReactNode }) => (
  <button disabled className="w-full py-3.5 rounded-xl bg-[#c9232c]/35 text-white text-[17px] font-bold">{children}</button>
)

// ---------------- Tiket ----------------

function TicketRow({ e, state, onClick }: { e: Ev; state: TicketState; onClick: () => void }) {
  return (
    <button onClick={onClick} className="relative w-full flex bg-white rounded-[20px] ring-1 ring-[#f1e7d6] shadow-[0_12px_26px_-16px_rgba(80,20,25,.5)] text-left active:scale-[.99] transition">
      <Poster p={e.poster} className="w-[96px] h-[112px] rounded-l-[20px] shrink-0" />
      <div className="flex-1 min-w-0 px-3.5 py-3 flex flex-col justify-center">
        <p className="text-[12px] font-semibold text-[#96792a] truncate">{e.category} · {e.jenis}</p>
        <p className="text-[15px] font-bold text-[#3b1417] leading-snug line-clamp-2">{e.name}</p>
        <p className="text-[12px] text-slate-500 mt-0.5">{fmtShort(e.tgl)} · {e.jam} WIB</p>
        <div className="mt-1.5 flex"><Pill tone={TICKET_TONE[state]}>{state}</Pill></div>
      </div>
      <div className="w-[58px] shrink-0 border-l-2 border-dashed border-[#efd3d3] bg-[#fbeceb]/60 rounded-r-[20px] flex flex-col items-center justify-center text-[#c9232c]">
        <Icon name="qr" className="w-7 h-7" />
        <span className="text-[10px] font-bold tracking-wider mt-1">QR</span>
      </div>
      <span className={`absolute right-[51px] -top-2 w-4 h-4 rounded-full ${PAGE_BG}`} />
      <span className={`absolute right-[51px] -bottom-2 w-4 h-4 rounded-full ${PAGE_BG}`} />
    </button>
  )
}

export function TicketsScreen() {
  const { me, go, openTicket } = useProto()
  const [tab, setTab] = useState<'aktif' | 'riwayat'>('aktif')
  const tickets = useMyTickets()
  const shown = tickets.filter((t) => (tab === 'aktif' ? t.active : !t.active))
  const count = (active: boolean) => tickets.filter((t) => t.active === active).length
  return (
    <section className={`flex-1 ${PAGE_BG}`}>
      <PlainBar
        title="My Tickets"
        right={(
          <button onClick={() => go('events')} aria-label="Events" className="w-11 h-11 flex items-center justify-center rounded-full active:bg-white/10">
            <Icon name="calendar" className="w-6 h-6" sw={1.6} />
          </button>
        )}
      />
      <div className="px-4 pt-4">
        <p className="text-[13px] text-slate-500">Tiket milik <b className="text-slate-700">{me.name}</b>. Tunjukkan QR ke panitia saat absen.</p>
        <div className="grid grid-cols-2 p-1 rounded-full bg-white ring-1 ring-[#efe3cc] mt-3 text-[14px] font-semibold">
          {(['aktif', 'riwayat'] as const).map((k) => (
            <button key={k} onClick={() => setTab(k)} className={`py-2 rounded-full transition ${tab === k ? 'bg-[#3b1417] text-white shadow-sm' : 'text-slate-500'}`}>
              {k === 'aktif' ? 'Aktif' : 'Riwayat'} <span className={tab === k ? 'text-[#e6cd7e]' : 'text-slate-400'}>{count(k === 'aktif')}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-3.5">
          {shown.length ? shown.map((t) => <TicketRow key={t.e.id} e={t.e} state={t.state} onClick={() => openTicket(t.e.id, me.id)} />) : (
            <div className="text-center py-10">
              <Icon name="ticket" className="w-12 h-12 mx-auto text-[#e6cd7e]" sw={1.4} />
              <p className="text-[14px] text-slate-500 mt-2">{tab === 'aktif' ? 'Belum ada tiket aktif' : 'Belum ada riwayat tiket'}</p>
            </div>
          )}
        </div>
        <button onClick={() => go('events')} className="mt-4 w-full py-3 text-[14px] font-semibold text-[#c9232c]">Cari event lain →</button>
      </div>
    </section>
  )
}

function OnlineAbsen({ e, a }: { e: Ev; a: Account }) {
  const { absen, addAbsen, toast, tick } = useProto()
  if (mineAbsen(e, a.id, absen).length) {
    return <p className="rounded-2xl bg-emerald-50 ring-1 ring-emerald-200 text-emerald-700 text-[14px] font-semibold text-center py-3">Absen berhasil tercatat.</p>
  }
  const phase = onlinePhase(e)
  if (phase !== 'open') {
    return <p className="text-[12.5px] text-slate-500 text-center">{phase === 'too_early' ? 'Absen dibuka 15 menit sebelum acara selesai.' : 'Jendela absen sudah ditutup.'}</p>
  }
  return (
    <div>
      <button
        onClick={() => { addAbsen({ eventId: e.id, key: a.id, sesiId: null, date: TODAY, time: tick() }); toast('Absen berhasil') }}
        className={`w-full py-3.5 ${BTN_RED}`}
      >
        Absen Event
      </button>
      <p className="text-[11.5px] text-slate-400 text-center mt-2">Event online: absen mandiri dibuka 15 menit sebelum selesai, berlaku sampai akhir bulan.</p>
    </div>
  )
}

export function TicketScreen() {
  const { ticketId, events, allAccounts, absen, go } = useProto()
  const [eventId, key] = ticketId.split(':')
  const e = events.find((x) => x.id === eventId)
  const a = allAccounts.find((x) => x.id === key)
  if (!e || !a) {
    return (
      <section className={`flex-1 ${PAGE_BG}`}>
        <PlainBar title="Ticket" back={() => go('tickets')} />
        <p className="p-6 text-sm text-slate-500">Tiket tidak ditemukan.</p>
      </section>
    )
  }
  const state = ticketState(e, a.id, absen)
  const mine = mineAbsen(e, a.id, absen)
  const lengkap = isLengkap(e, a.id, absen)
  const rows: [string, string][] = [['Tanggal', rangeFull(e)], ['Waktu', `${e.jam}–${e.jamSelesai} WIB`], ['Peserta', a.name], ['No. Tiket', ticketCode(e, a)]]

  return (
    <section className={`flex-1 ${PAGE_BG}`}>
      <PlainBar title="Ticket" back={() => go('tickets')} />
      <div className="px-4 py-5 space-y-4">
        <div className="bg-white rounded-[24px] shadow-[0_10px_30px_-14px_rgba(15,23,42,.35)]">
          <Poster p={e.poster} className="w-full aspect-[16/9] rounded-t-[24px]" />
          <div className={GOLD_LINE} />
          <div className="px-5 pt-4 pb-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11.5px] font-bold tracking-[.14em] uppercase text-[#c9232c]">{e.category}</p>
              <Pill tone={TICKET_TONE[state]}>{state}</Pill>
            </div>
            <p className="text-[21px] font-extrabold text-[#3b1417] leading-tight mt-1">{e.name}</p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 mt-4 text-[13px]">
              {rows.map(([k, v]) => (
                <div key={k}><dt className="text-[11.5px] text-slate-400">{k}</dt><dd className="font-semibold text-slate-800 mt-0.5">{v}</dd></div>
              ))}
              <div className="col-span-2"><dt className="text-[11.5px] text-slate-400">Lokasi</dt><dd className="font-semibold text-slate-800 mt-0.5">{e.alamat}</dd></div>
            </dl>
          </div>
          <div className="relative h-6">
            <span className={`absolute -left-3 top-0 w-6 h-6 rounded-full ${PAGE_BG}`} />
            <span className={`absolute -right-3 top-0 w-6 h-6 rounded-full ${PAGE_BG}`} />
            <span className="absolute left-5 right-5 top-1/2 border-t-2 border-dashed border-[#ecdcb3]" />
          </div>
          <div className="px-5 pt-2 pb-6 text-center">
            <div className="relative w-[230px] mx-auto p-2.5">
              <span className="absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 border-[#b1953a] rounded-tl-xl" />
              <span className="absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 border-[#b1953a] rounded-tr-xl" />
              <span className="absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 border-[#b1953a] rounded-bl-xl" />
              <span className="absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 border-[#b1953a] rounded-br-xl" />
              <Qr text={ticketQr(e, a)} />
            </div>
            <p className={`${fCard} text-[15px] font-bold tracking-[.12em] text-[#3b1417] mt-3`}>{ticketCode(e, a)}</p>
            <p className="text-[12px] text-slate-500 leading-relaxed mt-2">Tunjukkan QR ini kepada panitia saat absen.<br />Jangan bagikan kepada orang lain.</p>
          </div>
        </div>

        {e.sesi.length > 0 && (
          <Panel className="px-5 py-4">
            <PanelLabel>Kehadiran per sesi</PanelLabel>
            <div className="mt-2 divide-y divide-[#f1e7d6]">
              {e.sesi.map((s) => {
                const hit = mine.find((m) => m.sesiId === s.id)
                return (
                  <div key={s.id} className="flex items-center gap-3 py-2.5">
                    <span className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center ${hit ? 'bg-emerald-500 text-white' : 'bg-[#f4ece0] text-[#d9c9a8]'}`}>
                      <Icon name="check" className="w-4 h-4" sw={3} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-[#3b1417] truncate">{s.nama}</p>
                      <p className="text-[12px] text-slate-500">{fmtShort(s.tanggal)} · {s.mulai}–{s.selesai} · {s.wajib ? 'wajib' : 'opsional'}</p>
                    </div>
                    <span className="text-[12px] font-semibold text-slate-500">{hit ? hit.time : '—'}</span>
                  </div>
                )
              })}
            </div>
            <p className={`mt-2 text-[13px] font-semibold ${lengkap ? 'text-emerald-600' : 'text-amber-600'}`}>
              {lengkap ? 'Hadir lengkap — semua sesi wajib tercatat' : 'Belum hadir lengkap (semua sesi wajib)'}
            </p>
          </Panel>
        )}

        {e.jenis === 'Online' && <OnlineAbsen e={e} a={a} />}
      </div>
    </section>
  )
}

// ---------------- Milestone (riwayat absensi) ----------------

export function HistoryScreen() {
  const { me } = useProto()
  const history = ACCOUNTS.some((a) => a.id === me.id) ? HISTORY : [] // riwayat dummy hanya milik akun contoh
  const count = (s: Attend) => history.filter((h) => h.status === s).length
  return (
    <section>
      <PageHero title="Milestone" sub={`Ibadah & kegiatan yang dihadiri ${me.first}`} />
      <div className="px-5 -mt-10 relative">
        <StatTriple items={[[count('Hadir'), 'Hadir', 'text-[#c9232c]'], [count('Terlambat'), 'Terlambat', 'text-amber-500'], [count('Tidak hadir'), 'Tidak hadir', 'text-slate-400']]} />
        <div className="mt-5 space-y-3">
          {!history.length && <Empty>Belum ada kehadiran. Ambil tiket event dan tunjukkan QR saat absen.</Empty>}
          {history.map((h) => (
            <div key={h.d + h.m} className={`${CARD} p-3.5 flex items-center gap-3.5`}>
              <DateBlock d={h.d} m={h.m} tone={h.status === 'Tidak hadir' ? 'slate' : 'red'} />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[14px] text-[#3b1417] truncate">{h.title}</p>
                <p className="text-[12px] text-slate-500 mt-0.5">{h.note}</p>
              </div>
              <Pill tone={ATTEND[h.status]}>{h.status}</Pill>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------- Kesaksian ----------------

function KesaksianSheet() {
  const { addTestimony, closeSheet, toast, testimonies } = useProto()
  const [ev, setEv] = useState('')
  const [text, setText] = useState('')
  const ok = ev && text.trim().length >= 10
  const submit = () => {
    addTestimony({ title: ev, meta: `#TK-${String(62 + testimonies.length).padStart(4, '0')} · ${fmtShort(TODAY)}`, status: 'Terkirim', text: text.trim() })
    closeSheet()
    toast('Kesaksian terkirim. Terima kasih!')
  }
  return (
    <>
      <SheetHead title="Buat Kesaksian" sub="Kesaksianmu dibaca tim pusat sebelum dibagikan" />
      <div className="space-y-4">
        <Field label="Kegiatan">
          <select value={ev} onChange={(e) => setEv(e.target.value)} className={FLD}>
            <option value="">Pilih kegiatan…</option>
            {TESTIMONY_EVENTS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Kesaksian">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} maxLength={1000} placeholder="Ceritakan apa yang Tuhan kerjakan lewat kegiatan ini…" className={FLD} />
        </Field>
        <button disabled={!ok} onClick={submit} className={`w-full py-3.5 flex items-center justify-center gap-2 ${BTN_RED}`}>
          <Icon name="send" className="w-[18px] h-[18px]" />Kirim Kesaksian
        </button>
      </div>
    </>
  )
}

export function KesaksianScreen() {
  const { testimonies, sheet } = useProto()
  return (
    <section>
      <PageHero title="Kesaksian Saya" sub="Bagikan karya Tuhan yang kamu alami" pb="pb-20" />
      <div className="px-5 -mt-12 relative">
        <button onClick={() => sheet(<KesaksianSheet />)} className={`w-full p-4 ${LIFT} flex items-center gap-3 text-left active:scale-[.99] transition`}>
          <span className="w-12 h-12 rounded-xl bg-[#c9232c] text-white flex items-center justify-center"><Icon name="plus" className="w-6 h-6" sw={2.2} /></span>
          <span className="flex-1">
            <span className="block font-bold text-[16px] text-[#3b1417]">Buat Kesaksian</span>
            <span className="block text-[12px] text-slate-500">Pilih kegiatan, lalu tulis kesaksianmu</span>
          </span>
          <Icon name="chevron" className="w-5 h-5 text-slate-400" sw={2} />
        </button>
        <p className={`${H3} mt-6 mb-3`}>Kesaksian Saya</p>
        <div className="space-y-3">
          {testimonies.map((t) => (
            <div key={t.meta} className={`${CARD} p-4`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-[14px] text-[#3b1417]">{t.title}</p>
                  <p className="text-[12px] text-slate-400 mt-0.5">{t.meta}</p>
                </div>
                <Pill tone={t.status === 'Dibaca' ? 'green' : 'amber'}>{t.status}</Pill>
              </div>
              <p className="mt-3 text-[12.5px] text-slate-600 bg-slate-50 rounded-xl px-3 py-2">{t.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------- Profil ----------------

export function ProfileScreen() {
  const { me, pengurusOn, pengurus, photos, setPhoto, push, setPush, logout, go, sheet, toast, soon } = useProto()
  const fileRef = useRef<HTMLInputElement>(null)

  const onPhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setPhoto(me.id, URL.createObjectURL(f))
    toast('Foto profil diperbarui')
    e.target.value = ''
  }

  const rows: [IconName, string, string][] = [
    ['phone', 'Telepon', me.phone], ['mail', 'Email', me.email], ['church', 'Gereja', me.church], ['pin', 'LevelUP Kota', me.city],
    ['shield', 'Level', LEVEL_STEPS.find(([l]) => l === me.level)?.[1] ?? (me.level === 'Leader' ? 'PIC' : me.level)],
  ]
  const menu: [IconName, string][] = [
    ['camera', 'Ganti Foto Profil'], ['edit', 'Perubahan Data'], ['lock', 'Privasi & Keamanan'], ['help', 'Bantuan'],
  ]

  return (
    <section>
      <Hero className="pt-6 md:pt-4 pb-20 rounded-b-[32px] text-center">
        <label className="relative block w-24 h-24 mx-auto cursor-pointer">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
          <span className="block w-24 h-24 rounded-full ring-4 ring-white/40 overflow-hidden"><Avatar g={me.g} photo={photos[me.id]} /></span>
          <span className="absolute -bottom-0.5 -right-0.5 w-8 h-8 rounded-full bg-white text-[#c9232c] shadow-md flex items-center justify-center">
            <Icon name="camera" className="w-[18px] h-[18px]" sw={2} />
          </span>
        </label>
        <p className="font-extrabold text-lg mt-3">{me.name}</p>
        <p className="text-sm text-white/80">{me.city}</p>
        <span className={`inline-block mt-2 ${fCard} font-semibold tracking-wider text-[13px] bg-white/15 ring-1 ring-white/25 px-3 py-1 rounded-full`}>{me.no}</span>
      </Hero>
      <div className="px-5 -mt-12 relative space-y-4">
        <div className={`${LIFT} divide-y divide-slate-100 text-[14px]`}>
          {rows.map(([i, k, v]) => (
            <div key={k} className="flex items-center gap-3 px-4 py-3.5">
              <TintIcon name={i} tint="red" size="w-9 h-9 rounded-xl" icon="w-[18px] h-[18px]" />
              <span className="text-slate-500 flex-1">{k}</span>
              <span className="font-semibold text-right text-slate-800 truncate max-w-[60%]">{v}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => (pengurusOn ? go('k-home') : sheet(<PengurusLoginSheet />))}
          className={`w-full ${CARD} p-4 flex items-center gap-3 text-left active:scale-[.99] transition`}
        >
          <TintIcon name="shield" tint="gold" />
          <span className="flex-1 min-w-0">
            <span className="block font-bold text-[14px] text-[#3b1417]">{pengurusOn ? 'Buka Akun Sekretariat' : 'Masuk sebagai Pengurus'}</span>
            <span className="block text-[12px] text-slate-500 truncate">{pengurusOn ? `Pengurus · ${pengurus.name}` : 'Email + password akun pengurus'}</span>
          </span>
          <Icon name="chevron" className="w-5 h-5 text-slate-300" sw={2} />
        </button>

        <div className={`${CARD} p-4 flex items-center gap-3`}>
          <TintIcon name="bell" tint="red" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[14px] text-slate-800">Notifikasi HP : {push ? 'Aktif' : 'Nonaktif'}</p>
            <p className="text-[12px] text-slate-500">{push ? 'Pengumuman & pengingat event masuk ke HP ini' : 'Aktifkan agar tidak ketinggalan pengumuman'}</p>
          </div>
          <button
            onClick={() => { setPush(!push); toast(push ? 'Notifikasi dimatikan' : 'Notifikasi diaktifkan') }}
            className={`shrink-0 px-4 py-2.5 rounded-xl text-[13px] font-bold ${push ? 'bg-slate-100 text-slate-600' : 'bg-[#c9232c] text-white shadow-[0_6px_14px_-6px_rgba(201,35,44,.7)]'}`}
          >
            {push ? 'Matikan' : 'Aktifkan'}
          </button>
        </div>

        <div className={`${CARD} divide-y divide-slate-100 text-[14px]`}>
          {menu.map(([i, t]) => (
            <button key={t} onClick={() => (i === 'camera' ? fileRef.current?.click() : soon(t))} className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-slate-50">
              <TintIcon name={i} tint="slate" size="w-9 h-9 rounded-xl" icon="w-[18px] h-[18px]" />
              <span className="flex-1 font-semibold text-slate-800">{t}</span>
              <Icon name="chevron" className="w-5 h-5 text-slate-300" sw={2} />
            </button>
          ))}
        </div>

        <button onClick={logout} className={`w-full py-3.5 ${CARD} text-rose-600 font-semibold flex items-center justify-center gap-2`}>
          <Icon name="logout" className="w-5 h-5" sw={2} />Keluar
        </button>
        <p className="text-center text-[11px] text-slate-400">LevelUP Anggota · 1 HP untuk 1 akun peserta + 1 akun pengurus</p>
      </div>
    </section>
  )
}
