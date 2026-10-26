'use client'
import { Fragment, useRef, useState, type ChangeEvent, type FormEvent, type MouseEvent, type ReactNode } from 'react'
import { useProto } from './context'
import { Icon, type IconName } from './icons'
import {
  KOTA, NASIONAL_CABANG, NOW_STAMP, REG_LINK, TARGET_OPTIONS, TARGET_PENGURUS_OPTIONS, TODAY, WWTYPE_LABEL, capW, rp,
  type Absen, type Ev, type EventStatus, type KMember, type Level, type PengurusRole, type Person, type ReimbStatus, type WwType,
} from './data'
import {
  attendeeKeys, cabangName, currentSesi, dd, defaultPoster, fmtLong, fmtShort, isLengkap, mineAbsen, mon, ownEvent, rangeFull, sesiLabel,
} from './logic'
import { BellButton } from './member-screens'
import {
  Avatar, BTN_RED, CARD, Chevrons, DateBlock, Empty, FLD, Field, H3, Hero, LIFT, ModeSwitch, Note, PageHero, Pill, Poster, Row,
  SectionCard, SheetHead, StatTriple, TINT, TintIcon, TopBar, fCard, type PillTone, type Tint,
} from './ui'

const EV_STATUS: Record<EventStatus, [string, PillTone]> = {
  draft: ['Belum diajukan', 'slate'], review: ['Direview pusat', 'amber'], rejected: ['Ditolak', 'red'],
  approved: ['Disetujui', 'green'], live: ['Berlangsung', 'red'], done: ['Selesai', 'slate'],
}
const RB_STATUS: Record<ReimbStatus, [string, PillTone]> = {
  belum: ['Belum diajukan', 'red'], diajukan: ['Diajukan', 'sky'], direview: ['Direview pusat', 'amber'], cair: ['Dana cair', 'green'],
}

// ---------------- Shared bits ----------------

// Admin can't scan their own QR with their own phone — record self attendance for the running sesi instead
function SelfRow({ e, dark }: { e: Ev; dark?: boolean }) {
  const { pengurus, photos, absen, addAbsen, tick, toast } = useProto()
  const me = pengurus
  const sesi = currentSesi(e)
  const hit = mineAbsen(e, me.key, absen).find((a) => a.sesiId === (sesi?.id ?? null))
  const box = `mt-2 w-full flex items-center gap-3 rounded-xl px-3 py-2.5 ring-1 text-left ${dark ? 'bg-white/10 ring-white/15' : hit ? 'bg-emerald-50 ring-emerald-200' : 'bg-slate-50 ring-slate-200'}`
  const avatar = <span className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-white/60 shrink-0"><Avatar g={me.g} photo={photos[me.key]} /></span>
  if (hit) {
    return (
      <div className={box}>
        {avatar}
        <span className={`flex-1 min-w-0 text-[13.5px] font-semibold ${dark ? 'text-white/90' : 'text-emerald-700'}`}>
          Kamu sudah hadir<span className={`block text-[11.5px] font-medium ${dark ? 'text-white/55' : 'text-emerald-600/80'}`}>{sesi ? `${sesi.nama} · ` : ''}{hit.time}</span>
        </span>
        <Icon name="check" className={`w-5 h-5 ${dark ? 'text-emerald-300' : 'text-emerald-600'}`} sw={2.4} />
      </div>
    )
  }
  return (
    <button onClick={() => { addAbsen({ eventId: e.id, key: me.key, sesiId: sesi?.id ?? null, date: TODAY, time: tick() }); toast('Kehadiranmu tercatat') }} className={box}>
      {avatar}
      <span className={`flex-1 text-[13.5px] font-semibold ${dark ? 'text-white/90' : 'text-slate-700'}`}>Catat kehadiran saya{sesi ? ` · ${sesi.nama}` : ''}</span>
      <Icon name="chevron" className={`w-5 h-5 ${dark ? 'text-white/60' : 'text-slate-300'}`} sw={2} />
    </button>
  )
}

function Seg<T extends string>({ options, value, onChange }: { options: [T, string][]; value: T | ''; onChange: (v: T) => void }) {
  return (
    <div className="grid grid-flow-col auto-cols-fr p-1 gap-1 rounded-xl bg-slate-100 text-[13.5px] font-semibold">
      {options.map(([v, l]) => (
        <button type="button" key={v} onClick={() => onChange(v)} className={`py-2 rounded-lg transition ${value === v ? 'bg-white text-[#c9232c] shadow-sm' : 'text-slate-500'}`}>{l}</button>
      ))}
    </div>
  )
}

function ToggleChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`px-3 py-1.5 rounded-full text-[13px] font-semibold ring-1 transition ${active ? 'bg-[#c9232c] text-white ring-[#c9232c]' : 'bg-slate-50 text-slate-600 ring-slate-200'}`}>
      {label}
    </button>
  )
}

function RegLinkSheet() {
  const { closeSheet, toast } = useProto()
  const copy = () => {
    navigator.clipboard?.writeText(REG_LINK).then(() => toast('Link disalin'), () => toast('Gagal menyalin'))
    closeSheet()
  }
  return (
    <>
      <SheetHead title="Link Pendaftaran" sub="Calon anggota mengisi data sendiri, lalu diajukan ke pusat" />
      <p className="rounded-xl bg-slate-50 ring-1 ring-slate-200 px-3.5 py-3 text-[13px] font-mono break-all text-slate-700">{REG_LINK}</p>
      <div className="grid grid-cols-2 gap-3 mt-4">
        <button onClick={copy} className="py-3 rounded-xl bg-[#f8f0dd] text-[#96792a] font-bold text-[14px] flex items-center justify-center gap-2"><Icon name="link" className="w-4 h-4" />Salin</button>
        <a href={`https://wa.me/?text=${encodeURIComponent(`Daftar anggota LevelUP: ${REG_LINK}`)}`} target="_blank" rel="noopener noreferrer" className="py-3 rounded-xl bg-[#c9232c] text-white font-bold text-[14px] flex items-center justify-center gap-2">
          <Icon name="whatsapp" className="w-4 h-4" />Bagikan
        </a>
      </div>
    </>
  )
}

function MemberSheet({ m }: { m: KMember }) {
  const { closeSheet, toast, updateMember } = useProto()
  const [email, setEmail] = useState(m.email)
  const [password, setPassword] = useState(m.password)
  const valid = email.trim().includes('@') && password.length >= 4

  const save = (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return
    updateMember(m.key, { email: email.trim(), password })
    closeSheet()
    toast(`Login ${m.name} diperbarui`)
  }

  return (
    <form onSubmit={save}>
      <div className="flex items-center gap-4 mb-4">
        <span className="w-16 h-16 rounded-full overflow-hidden shrink-0"><Avatar g={m.g} /></span>
        <div className="min-w-0">
          <p className="font-extrabold text-[18px] text-[#3b1417] leading-tight">{m.name}</p>
          <p className="text-[13px] text-slate-500">{m.role} · {m.church}</p>
        </div>
      </div>
      <div className="space-y-3">
        <Field label="Email"><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className={FLD} placeholder="nama@levelup.id" autoComplete="off" /></Field>
        <Field label="Password"><input value={password} onChange={(e) => setPassword(e.target.value)} type="text" className={FLD} placeholder="Minimal 4 karakter" autoComplete="off" /></Field>
      </div>
      <div className="mt-3"><Note>Email + password dipakai login Sekretariat. Tidak ada status aktif/nonaktif.</Note></div>
      <button type="submit" disabled={!valid} className={`w-full mt-4 py-3.5 ${BTN_RED}`}>Simpan</button>
    </form>
  )
}

// ---------------- Beranda Sekretariat ----------------

function LiveCard({ e }: { e: Ev }) {
  const { openEvent, openScan, absen } = useProto()
  const sesi = currentSesi(e)
  return (
    <div className="relative overflow-hidden rounded-3xl p-5 text-white bg-linear-to-br from-[#2a1416] via-[#4a1015] to-[#7c1219] shadow-[0_18px_40px_-14px_rgba(60,8,12,.6)]">
      <Chevrons className="-right-6 top-6 w-36 opacity-[.07]" />
      <div className="relative flex items-center gap-2 text-[11px] font-bold tracking-[.14em] text-emerald-300">
        <span className="relative flex w-2 h-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-400" />
        </span>
        ABSENSI DIBUKA · HARI INI
      </div>
      <p className="relative font-extrabold text-[20px] mt-2 leading-snug uppercase">{e.name}</p>
      <p className="relative text-[13px] text-white/70 mt-0.5">{e.jam}–{e.jamSelesai} WIB · {e.alamat}</p>
      {sesi && (
        <p className="relative mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#f1dc9a] bg-white/10 rounded-full px-2.5 py-1">
          <Icon name="clock" className="w-3.5 h-3.5" />Sesi berjalan: {sesi.nama} ({sesi.mulai}–{sesi.selesai})
        </p>
      )}
      <div className="relative flex items-end justify-between mt-4">
        <div>
          <p className={`${fCard} font-bold text-[46px] leading-none text-[#e6cd7e]`}>{attendeeKeys(e, absen).length}</p>
          <p className="text-[12px] text-white/60 mt-1">anggota hadir</p>
        </div>
        <button onClick={() => openEvent(e.id)} className="text-[13px] font-semibold text-white/85 flex items-center gap-0.5">Detail<Icon name="chevron" className="w-4 h-4" sw={2.2} /></button>
      </div>
      <button onClick={() => openScan(e.id)} className="relative w-full mt-4 py-3 rounded-xl bg-[#c9232c] font-bold text-[14px] flex items-center justify-center gap-2 shadow-lg active:scale-[.98] transition">
        <Icon name="qr" className="w-5 h-5" />Mulai Absen!
      </button>
      <div className="relative"><SelfRow e={e} dark /></div>
    </div>
  )
}

export function KHomeScreen() {
  const { pengurus, photos, go, toKartu, events: all, upgrades, openEvent, openScan, scanEventId, soon } = useProto()
  const events = all.filter(ownEvent)
  const pct = KOTA.members ? Math.round((KOTA.core / KOTA.members) * 100) : 0
  const live = events.find((e) => e.status === 'live')

  const stats: [IconName, string, number][] = [
    ['users', 'Total LevelUP Kota', KOTA.members], ['check', 'Total CORE', KOTA.core],
    ['church', 'Gereja', KOTA.churches], ['book', 'Sinode', KOTA.sinodes],
    ['calendar', 'Jumlah Event', events.length], ['userPlus', 'Volunteer', KOTA.volunteers],
  ]

  const todos: { i: IconName; tint: Tint; t: string; s: string; act: () => void }[] = []
  const squad = upgrades.filter((u) => u.cabang === KOTA.cabang).length
  if (squad) todos.push({ i: 'userPlus', tint: 'gold', t: `${squad} pengajuan Squad menunggu approval`, s: `Approval Member · ${KOTA.name}`, act: () => go('k-approval') })
  events.filter((e) => e.status === 'rejected').forEach((e) => todos.push({ i: 'alert', tint: 'rose', t: `${e.name} ditolak pusat`, s: 'Lihat alasan & ajukan ulang', act: () => openEvent(e.id) }))
  events.filter((e) => e.status === 'review').forEach((e) => todos.push({ i: 'calendar', tint: 'amber', t: `${e.name} sedang direview`, s: fmtLong(e.tgl), act: () => openEvent(e.id) }))
  todos.push({ i: 'shield', tint: 'gold', t: 'Pengajuan Set Role', s: '1 pengurus menunggu penetapan peran', act: () => soon('Set Role') })

  const menu: { i: IconName; t: string; tint: Tint; act: () => void; soon?: boolean; badge?: number }[] = [
    { i: 'qr', t: 'Scan Absensi', tint: 'red', act: () => openScan(live?.id ?? scanEventId) },
    { i: 'userPlus', t: 'Tambah Pengurus', tint: 'gold', act: () => go('k-member-new') },
    { i: 'users', t: 'Approval Member', tint: 'red', act: () => go('k-approval'), badge: squad },
    { i: 'calPlus', t: 'Buat Event', tint: 'red', act: () => go('k-event-new') },
    { i: 'receipt', t: 'Reimburse', tint: 'gold', act: () => go('k-reimburse') },
    { i: 'shield', t: 'Set Role', tint: 'red', act: () => soon('Set Role'), soon: true },
    { i: 'grid', t: 'Lainnya', tint: 'slate', act: () => go('k-more') },
  ]

  return (
    <section>
      <Hero className="pt-5 md:pt-3 pb-28 rounded-b-[32px]" decor="-right-6 top-28 w-44">
        <div className="mb-4"><ModeSwitch alk onChange={(alk) => !alk && toKartu()} /></div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-12 h-12 shrink-0 rounded-full overflow-hidden ring-2 ring-[#e6cd7e]"><Avatar g={pengurus.g} photo={photos[pengurus.key]} /></span>
            <div className="leading-tight min-w-0">
              <p className="text-[13px] text-white/80">Sekretariat · {KOTA.short}</p>
              <p className="font-bold text-[17px] truncate">{pengurus.name}</p>
            </div>
          </div>
          <BellButton />
        </div>
      </Hero>

      <div className="px-5 -mt-20 relative">
        <div className="bg-white rounded-3xl shadow-[0_18px_40px_-14px_rgba(80,20,25,.3)] p-2.5 grid grid-cols-2 gap-2">
          {stats.map(([i, l, v], idx) => (
            <div key={l} className="rounded-2xl bg-[#faf7f2] p-3.5">
              <div className="flex items-center gap-1.5 text-[12px] text-slate-500 font-medium">
                <span className="text-[#c9232c]"><Icon name={i} className="w-4 h-4" sw={2} /></span>{l}
              </div>
              <div className="flex items-end justify-between mt-1.5">
                <p className={`${fCard} font-bold text-[30px] leading-none text-[#3b1417]`}>{v}</p>
                {idx === 1 && <span className="text-[11px] font-bold text-emerald-700">{pct}%</span>}
              </div>
              {idx === 1 && <div className="mt-2 h-1.5 rounded-full bg-slate-200 overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} /></div>}
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 mt-5 space-y-7">
        {live && <LiveCard e={live} />}
        <div>
          <h3 className={`${H3} mb-3`}>Perlu Tindakan</h3>
          <div className={`${CARD} divide-y divide-slate-100 overflow-hidden`}>
            {todos.map((t) => <Row key={t.t} icon={t.i} tint={t.tint} title={t.t} sub={t.s} onClick={t.act} />)}
          </div>
        </div>
        <div>
          <h3 className={`${H3} mb-4`}>Menu Sekretariat</h3>
          <div className="grid grid-cols-4 gap-y-5 gap-x-2">
            {menu.map((x) => (
              <button key={x.t} onClick={x.act} className="flex flex-col items-center gap-2 active:scale-95 transition">
                <span className={`relative w-[58px] h-[58px] rounded-[18px] flex items-center justify-center ${TINT[x.tint]}`}>
                  <span className={x.soon ? 'opacity-50' : ''}><Icon name={x.i} className="w-7 h-7" /></span>
                  {x.soon && <span className="absolute -top-1.5 -right-2.5 text-[9px] font-bold tracking-wide bg-[#3b1417] text-[#f1dc9a] px-1.5 py-0.5 rounded-full">Segera</span>}
                  {!!x.badge && <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-[#c9232c] text-white text-[10.5px] font-bold flex items-center justify-center ring-2 ring-[#faf7f2]">{x.badge}</span>}
                </span>
                <span className="text-[12px] text-slate-700 font-medium leading-tight text-center">{x.t}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-end mt-2">
            <button onClick={() => go('k-more')} className="text-[13px] font-semibold text-[#c9232c] py-1 pl-3">Semua</button>
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------- LevelUP Kota (pengurus — email + password, tanpa status) ----------------

export function KMembersScreen() {
  const { members, go, sheet } = useProto()
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  const list = members.filter((m) => !needle || `${m.name} ${m.email} ${m.role}`.toLowerCase().includes(needle))

  return (
    <section>
      <PageHero
        title="LevelUP Kota"
        sub={`${KOTA.short} · ${members.length} pengurus`}
        action={{ label: 'Tambah', onClick: () => go('k-member-new') }}
        pb="pb-20"
      />
      <div className="px-5 -mt-12 relative">
        <label className={`flex items-center gap-2.5 ${LIFT} px-4 py-3.5`}>
          <Icon name="search" className="w-5 h-5 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} type="search" placeholder="Cari nama atau email" enterKeyHint="search" className="flex-1 min-w-0 outline-none text-[15px] bg-transparent" />
        </label>
        <div className="mt-4 space-y-2.5">
          {list.length ? list.map((m) => (
            <button key={m.key} onClick={() => sheet(<MemberSheet m={m} />)} className={`w-full flex items-center gap-3 ${CARD} p-3 text-left active:scale-[.99] transition`}>
              <span className="w-11 h-11 shrink-0 rounded-full overflow-hidden"><Avatar g={m.g} /></span>
              <span className="flex-1 min-w-0">
                <span className="block font-bold text-[14px] text-[#3b1417] truncate">
                  {m.name}{m.me && <span className="text-[11px] font-semibold text-[#96792a]"> · Kamu</span>}
                </span>
                <span className="block text-[12px] text-slate-500 truncate">{m.email}</span>
              </span>
              <span className="shrink-0 text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded-full ring-1 ring-slate-200">{m.role}</span>
            </button>
          )) : <Empty>Tidak ada pengurus yang cocok</Empty>}
        </div>
      </div>
    </section>
  )
}

export function KMemberNewScreen() {
  const { go, addMember, toast } = useProto()
  const [f, setF] = useState({ name: '', g: '' as '' | 'L' | 'P', role: 'Admin LK' as PengurusRole, email: '', password: '', church: 'GBI Kasih Karunia', city: 'Kota Medan' })
  const set = (k: keyof typeof f) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value })
  const valid = f.name.trim().length >= 3 && f.g && f.email.trim().includes('@') && f.password.length >= 4

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!valid || !f.g) return
    const name = f.name.trim()
    addMember({ key: `new-${Date.now()}`, name, g: f.g, church: f.church, city: f.city, email: f.email.trim(), password: f.password, role: f.role })
    go('k-members')
    toast(`${name} ditambahkan`)
  }

  return (
    <section>
      <Hero className="pt-4 md:pt-2 pb-16">
        <TopBar title="Tambah Pengurus" back={() => go('k-members')} />
      </Hero>
      <form onSubmit={submit} className="px-5 -mt-10 relative space-y-4">
        <SectionCard lift icon="userPlus" tint="red" title="Pengurus" sub="Langsung bisa login — tanpa approval pusat">
          <Field group label="Peran"><Seg options={[['Admin LK', 'Admin LK'], ['BRIM', 'BRIM']]} value={f.role} onChange={(role) => setF({ ...f, role })} /></Field>
          <Field label="Nama"><input value={f.name} onChange={set('name')} className={FLD} placeholder="Nama lengkap" maxLength={255} /></Field>
          <Field group label="Jenis Kelamin"><Seg options={[['L', 'Laki-laki'], ['P', 'Perempuan']]} value={f.g} onChange={(g) => setF({ ...f, g })} /></Field>
        </SectionCard>

        <SectionCard icon="shield" tint="gold" title="Login" sub="Email + password untuk masuk Sekretariat">
          <Field label="Email"><input value={f.email} onChange={set('email')} type="email" className={FLD} placeholder="nama@levelup.id" autoComplete="off" /></Field>
          <Field label="Password"><input value={f.password} onChange={set('password')} type="text" className={FLD} placeholder="Minimal 4 karakter" autoComplete="off" /></Field>
        </SectionCard>

        <Note>Peserta tidak ditambah di sini — mereka daftar lewat PWA lalu Join Squad.</Note>
        <button disabled={!valid} className={`w-full py-3.5 flex items-center justify-center gap-2 ${BTN_RED}`}><Icon name="check" className="w-[18px] h-[18px]" />Simpan Pengurus</button>
      </form>
    </section>
  )
}

// ---------------- Approval Member (= app/dashboard/kota/alk/approval) ----------------

// Pengajuan Squad dari peserta yang memilih kota ini; approve = userlevel 2 (Squad). Core belum ada.
export function KApprovalScreen() {
  const { upgrades, people, approveUpgrade, go, toast } = useProto()
  const list = upgrades.filter((u) => u.cabang === KOTA.cabang)
  return (
    <section>
      <Hero className="pt-4 md:pt-2 pb-20 rounded-b-[32px]" decor="-right-6 top-14 w-40">
        <TopBar title="Approval Member" back={() => go('k-home')} />
        <p className="text-center text-sm text-white/80 mt-2">{list.length} menunggu approve squad</p>
      </Hero>
      <div className="px-5 -mt-12 relative space-y-3">
        {list.length === 0 ? (
          <div className={`${LIFT} px-4 py-10 text-center`}>
            <TintIcon name="check" tint="gold" size="w-12 h-12 mx-auto rounded-2xl" icon="w-6 h-6" />
            <p className="text-[13.5px] text-slate-500 mt-3">Tidak ada pengajuan.</p>
          </div>
        ) : list.map((u, i) => {
          const p = people.find((x) => x.key === u.key)
          return (
            <div key={u.id} className={`${i === 0 ? LIFT : CARD} p-3.5 flex items-center gap-3`}>
              <span className="w-11 h-11 rounded-full overflow-hidden shrink-0"><Avatar g={p?.g ?? 'L'} /></span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[14.5px] text-[#3b1417] truncate">{p?.name ?? u.key}</p>
                <p className={`text-[12px] text-[#96792a] font-semibold ${fCard} tracking-wider`}>{u.usercode} · VOLUNTEER → SQUAD</p>
                <p className="text-[12px] text-slate-500 truncate">{p?.church}</p>
              </div>
              <button
                onClick={() => { approveUpgrade(u.id); toast(`${p?.name ?? 'Peserta'} sekarang Squad`) }}
                className="shrink-0 px-4 py-2 rounded-xl bg-[#c9232c] text-white text-[13px] font-bold shadow-[0_6px_14px_-6px_rgba(201,35,44,.7)] active:scale-95 transition"
              >
                Approve
              </button>
            </div>
          )
        })}
        <Note tone="sky">Hanya pengajuan yang memilih <b>{KOTA.name}</b> yang tampil di sini. Peserta bisa memindahkan pengajuannya ke kota lain selama belum di-approve.</Note>
      </div>
    </section>
  )
}

// ---------------- Event ----------------

function EventItem({ e }: { e: Ev }) {
  const { openEvent } = useProto()
  return (
    <button onClick={() => openEvent(e.id)} className={`w-full ${CARD} p-3.5 flex items-center gap-3.5 text-left active:scale-[.99] transition`}>
      <DateBlock d={dd(e.tgl)} m={mon(e.tgl)} tone={e.status === 'live' ? 'solid' : e.status === 'done' ? 'slate' : 'red'} />
      <div className="min-w-0 flex-1">
        <p className="font-bold text-[14px] text-[#3b1417] truncate">{e.name}</p>
        <p className="text-[12px] text-slate-500 truncate mt-0.5">{e.jam}–{e.jamSelesai} · {e.venue}</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <Pill tone={EV_STATUS[e.status][1]}>{EV_STATUS[e.status][0]}</Pill>
          {e.sesi.length > 0 && <Pill tone="gold">{e.sesi.length} sesi</Pill>}
        </div>
      </div>
    </button>
  )
}

export function KEventsScreen() {
  const { events: all, go } = useProto()
  const events = all.filter(ownEvent)
  const open = events.filter((e) => e.status !== 'done').sort((a, b) => a.tgl.localeCompare(b.tgl))
  const done = events.filter((e) => e.status === 'done').sort((a, b) => b.tgl.localeCompare(a.tgl))
  const count = (...s: EventStatus[]) => events.filter((e) => s.includes(e.status)).length
  return (
    <section>
      <PageHero title="Pengajuan Event" sub="Jadwal, absensi & sesi kegiatan" action={{ label: 'Buat Event', onClick: () => go('k-event-new') }} pb="pb-20" />
      <div className="px-5 -mt-12 relative">
        <StatTriple items={[[count('approved', 'live'), 'Terjadwal', 'text-[#c9232c]'], [count('review', 'draft'), 'Belum approve', 'text-amber-500'], [done.length, 'Selesai', 'text-slate-400']]} />
        <h3 className={`${H3} mt-6 mb-3`}>Berlangsung &amp; Mendatang</h3>
        <div className="space-y-3">{open.length ? open.map((e) => <EventItem key={e.id} e={e} />) : <Empty>Belum ada kegiatan</Empty>}</div>
        {done.length > 0 && (
          <>
            <h3 className={`${H3} mt-6 mb-3`}>Selesai</h3>
            <div className="space-y-3">{done.map((e) => <EventItem key={e.id} e={e} />)}</div>
          </>
        )}
      </div>
    </section>
  )
}

const STEPS = ['Draft', 'Diajukan', 'Disetujui', 'Absensi', 'Selesai']
const STEP_AT: Record<EventStatus, number> = { draft: 0, review: 1, rejected: 1, approved: 2, live: 3, done: 5 }

function Stepper({ status }: { status: EventStatus }) {
  const at = STEP_AT[status]
  const rejected = status === 'rejected'
  return (
    <div className="flex items-start">
      {STEPS.map((s, i) => {
        const done = i < at, cur = i === at
        return (
          <Fragment key={s}>
            <div className="flex flex-col items-center w-12 shrink-0">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold ${done ? 'bg-[#c3a54d] text-white' : cur ? (rejected ? 'bg-rose-500 text-white ring-4 ring-rose-100' : 'bg-[#c9232c] text-white ring-4 ring-[#fbeceb]') : 'bg-slate-100 text-slate-400'}`}>
                {done ? <Icon name="check" className="w-4 h-4" sw={3} /> : cur && rejected ? <Icon name="x" className="w-4 h-4" sw={3} /> : i + 1}
              </span>
              <span className={`text-[10.5px] mt-1.5 font-semibold ${done ? 'text-[#96792a]' : cur ? (rejected ? 'text-rose-600' : 'text-[#c9232c]') : 'text-slate-400'}`}>
                {cur && rejected ? 'Ditolak' : s}
              </span>
            </div>
            {i < STEPS.length - 1 && <span className={`flex-1 h-0.5 mt-3.5 ${done ? 'bg-[#c3a54d]' : 'bg-slate-200'}`} />}
          </Fragment>
        )
      })}
    </div>
  )
}

// sisko-style list card with a header pill
function ListCard({ title, pill, children }: { title: string; pill: string; children: ReactNode }) {
  return (
    <div className={`${CARD} overflow-hidden`}>
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2">
        <p className="text-[14px] font-bold text-[#3b1417]">{title}</p>
        <span className="text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full ring-1 ring-slate-200">{pill}</span>
      </div>
      {children}
    </div>
  )
}

const PAGE = 5

function Pager({ page, total, onPage }: { page: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / PAGE))
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100">
      <button type="button" onClick={() => onPage(page - 1)} disabled={page === 0} className="text-[13px] px-3 py-1 rounded-lg ring-1 ring-slate-200 disabled:opacity-40">← Prev</button>
      <span className="text-[12px] text-slate-500">{page + 1} / {pages}</span>
      <button type="button" onClick={() => onPage(page + 1)} disabled={page >= pages - 1} className="text-[13px] px-3 py-1 rounded-lg ring-1 ring-slate-200 disabled:opacity-40">Next →</button>
    </div>
  )
}

export function KEventScreen() {
  const { events, eventId, go, regs, absen, people, reimburse, setEventStatus, openScan, toast } = useProto()
  const [regPage, setRegPage] = useState(0)
  const [absenPage, setAbsenPage] = useState(0)
  const [sesiFilter, setSesiFilter] = useState<number | 'all'>('all')
  const e = events.find((x) => x.id === eventId) ?? events[0]
  const person = (k: string) => people.find((p) => p.key === k)
  const registrants = regs.filter((r) => r.eventId === e.id).map((r) => person(r.key)).filter((p): p is Person => !!p)
  const totalReg = e.booked + registrants.length
  const hasSesi = e.sesi.length > 0
  const rows = absen.filter((a) => a.eventId === e.id).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
  const filtered = hasSesi && sesiFilter !== 'all' ? rows.filter((a) => a.sesiId === sesiFilter) : rows
  const lengkap = registrants.filter((p) => isLengkap(e, p.key, absen)).length
  const attendees = attendeeKeys(e, absen).length
  const rb = reimburse.find((r) => r.eventId === e.id)
  const showPeserta = e.status === 'approved' || e.status === 'live' || e.status === 'done'

  const info: [string, string][] = [
    ['LevelUP Kota', cabangName(e.cabang)],
    ['Jenis Event', e.jenis],
    ['Tipe', `${WWTYPE_LABEL[e.wwtype]}${e.scope ? ` · ${e.scope === 'khusus' ? 'Event Khusus' : 'Event Seluruh Kota'}` : ''}`],
    ['Alamat', e.alamat],
    ['Tanggal', rangeFull(e)],
    ['Jam', `${e.jam || '—'} – ${e.jamSelesai || '—'}`],
    ['Dana', rp(e.dana)],
    ['Target Peserta', e.target.join(', ') || '—'],
    ['Target Pengurus', e.targetPengurus.join(', ') || '—'],
    ['Target Jumlah', `${e.quota} orang`],
    ['Total Registrasi', `${totalReg} orang`],
    ...(e.surat ? [['Surat', e.surat] as [string, string]] : []),
  ]
  const setStatus = (s: EventStatus, msg: string) => { setEventStatus(e.id, s); toast(msg) }

  return (
    <section>
      <Hero className="pt-4 md:pt-2 pb-16" decor="-right-6 top-16 w-40">
        <TopBar title="Detail Event" back={() => go('k-events')} />
        <div className="mt-3 flex items-center gap-3.5">
          <DateBlock d={dd(e.tgl)} m={mon(e.tgl)} tone="glass" />
          <div className="min-w-0">
            <p className="font-extrabold text-[20px] leading-tight">{e.name}</p>
            <p className="text-[13px] text-white/80 mt-0.5">{fmtLong(e.tgl)}{e.tglSelesai !== e.tgl ? ` – ${fmtShort(e.tglSelesai)}` : ''} · {e.jam}–{e.jamSelesai} WIB</p>
          </div>
        </div>
      </Hero>
      <div className="px-5 -mt-10 relative space-y-4">
        <div className="bg-white rounded-3xl shadow-[0_18px_40px_-14px_rgba(80,20,25,.3)] p-5">
          <Stepper status={e.status} />

          {(e.status === 'live' || e.status === 'done') && (
            <div className="flex items-end justify-between mt-5">
              <div>
                <p className={`${fCard} font-bold text-[48px] leading-none ${e.status === 'live' ? 'text-[#c9232c]' : 'text-[#3b1417]'}`}>{attendees}</p>
                <p className="text-[12px] text-slate-500 mt-1">anggota hadir{hasSesi ? ` · ${lengkap} hadir lengkap` : ''}</p>
              </div>
              {e.status === 'live'
                ? <p className="flex items-center gap-1.5 text-[12px] font-bold text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />Absensi dibuka</p>
                : <p className="text-[12px] font-bold text-slate-400">Kegiatan selesai</p>}
            </div>
          )}

          <div className="mt-4 space-y-2">
            {e.status === 'live' && (
              <>
                <button onClick={() => openScan(e.id)} className="w-full py-3 rounded-xl bg-[#c9232c] text-white font-bold text-[14px] flex items-center justify-center gap-2 shadow-[0_8px_20px_-6px_rgba(201,35,44,.6)]">
                  <Icon name="qr" className="w-5 h-5" />Mulai Absensi
                </button>
                <SelfRow e={e} />
              </>
            )}
            {e.status === 'approved' && (
              <>
                <Note tone="sky">Disetujui pusat (ALK + Brim Nasional). Peserta sudah bisa ambil tiket; scan absensi dibuka saat acara.</Note>
                <button onClick={() => openScan(e.id)} className="w-full py-3 rounded-xl bg-[#f8f0dd] text-[#96792a] ring-1 ring-[#ecdcb3] font-bold text-[14px] flex items-center justify-center gap-2">
                  <Icon name="qr" className="w-5 h-5" />Buka Scanner
                </button>
              </>
            )}
            {e.status === 'review' && (
              <>
                <Note>Sedang direview <b>Pusat</b> (QA flyer / berita acara). Kamu akan menerima notifikasi setelah diputuskan.</Note>
                <button onClick={() => setStatus('approved', 'Event disetujui pusat — tampil di Events anggota')} className="w-full py-3 rounded-2xl border-2 border-dashed border-[#ecdcb3] text-[13.5px] font-semibold text-[#96792a]">
                  Simulasi: Pusat menyetujui
                </button>
              </>
            )}
            {e.status === 'rejected' && (
              <>
                <Note tone="rose"><b>Alasan penolakan:</b> {e.reason}</Note>
                <button onClick={() => setStatus('review', 'Event diajukan ulang ke pusat')} className={`w-full py-3.5 ${BTN_RED}`}>Ubah &amp; Ajukan Ulang</button>
              </>
            )}
            {e.status === 'draft' && (
              <>
                <Note>Belum diajukan — lengkapi flyer atau link surat pemberitahuan, lalu ajukan.</Note>
                <button onClick={() => setStatus('review', 'Event diajukan')} className={`w-full py-3.5 ${BTN_RED}`}>Ajukan</button>
              </>
            )}
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden ring-1 ring-slate-100 shadow-sm"><Poster p={e.poster} className="w-full aspect-[16/10]" /></div>

        <ListCard title="Detail Event" pill={EV_STATUS[e.status][0]}>
          {info.map(([k, v], i) => (
            <div key={k} className={`flex gap-3 px-4 py-2.5 ${i ? 'border-t border-slate-100' : ''}`}>
              <p className="text-[12px] text-slate-400 w-28 shrink-0 pt-0.5">{k}</p>
              <p className="text-[13px] text-slate-800 flex-1 break-words">{v}</p>
            </div>
          ))}
        </ListCard>

        <button onClick={() => go('k-reimburse')} className={`w-full ${CARD} px-4 py-3.5 flex items-center justify-between gap-3`}>
          <span className="text-[13.5px] font-semibold text-slate-800">Pengajuan Support Dana</span>
          {rb && rb.status !== 'belum' ? <Pill tone={RB_STATUS[rb.status][1]}>{RB_STATUS[rb.status][0]}</Pill> : <span className="text-[12.5px] font-semibold text-[#c9232c]">Ajukan →</span>}
        </button>

        {showPeserta && (
          <>
            <ListCard title="Konfirmasi Kehadiran" pill={`Total ${totalReg} registrasi`}>
              {registrants.length === 0 ? <p className="px-4 py-8 text-center text-[13px] text-slate-400">Belum ada peserta.</p> : (
                <>
                  <div className="divide-y divide-slate-100">
                    {registrants.slice(regPage * PAGE, (regPage + 1) * PAGE).map((p, i) => (
                      <div key={p.key} className="flex items-center gap-3 px-4 py-2.5">
                        <span className="text-[12px] text-slate-400 w-5 text-right shrink-0">{regPage * PAGE + i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13.5px] font-semibold text-slate-800 truncate">{p.name} <span className="font-normal text-slate-400">– {p.city}</span></p>
                          <p className="text-[11.5px] text-slate-400 truncate">{p.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Pager page={regPage} total={registrants.length} onPage={setRegPage} />
                  {e.booked > 0 && <p className="px-4 py-2.5 border-t border-slate-100 text-[12px] text-slate-400">+ {e.booked} peserta lainnya</p>}
                </>
              )}
            </ListCard>

            <ListCard title="Presensi (Scan QR)" pill={hasSesi ? `${filtered.length} scan` : `${filtered.length} hadir`}>
              {hasSesi && (
                <div className="px-4 py-3 border-b border-slate-100 space-y-2.5">
                  <div className="space-y-1.5">
                    {e.sesi.map((s) => (
                      <div key={s.id} className="flex items-center justify-between gap-2 text-[12.5px]">
                        <span className="text-slate-800 truncate">{s.nama}<span className="text-slate-400"> · {s.wajib ? 'wajib' : 'opsional'}</span></span>
                        <span className="text-slate-500 shrink-0">{rows.filter((a) => a.sesiId === s.id).length} hadir</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[12.5px] font-semibold text-slate-800">
                    Hadir lengkap: <span className="text-[#c9232c]">{lengkap} / {totalReg}</span><span className="font-normal text-slate-400"> (semua sesi wajib)</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {([['all', 'Semua'], ...e.sesi.map((s) => [s.id, s.nama])] as [number | 'all', string][]).map(([k, l]) => (
                      <button
                        key={String(k)}
                        onClick={() => { setSesiFilter(k); setAbsenPage(0) }}
                        className={`text-[11.5px] px-2.5 py-1 rounded-full ring-1 transition max-w-[150px] truncate ${sesiFilter === k ? 'ring-[#c9232c] bg-[#fbeceb] text-[#c9232c] font-semibold' : 'ring-slate-200 text-slate-500'}`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {filtered.length === 0 ? <p className="px-4 py-8 text-center text-[13px] text-slate-400">Belum ada presensi.</p> : (
                <>
                  <div className="divide-y divide-slate-100">
                    {filtered.slice(absenPage * PAGE, (absenPage + 1) * PAGE).map((a, i) => <PresensiRow key={`${a.key}-${a.sesiId}`} n={absenPage * PAGE + i + 1} a={a} e={e} p={person(a.key)} />)}
                  </div>
                  <Pager page={absenPage} total={filtered.length} onPage={setAbsenPage} />
                </>
              )}
            </ListCard>
          </>
        )}
      </div>
    </section>
  )
}

function PresensiRow({ n, a, e, p }: { n: number; a: Absen; e: Ev; p?: Person }) {
  const sesi = e.sesi.find((s) => s.id === a.sesiId)
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <span className="text-[12px] text-slate-400 w-5 text-right shrink-0">{n}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold text-slate-800 truncate flex items-center gap-1.5">
          <span className="truncate">{p?.name ?? a.key}</span>
          {p && <span className="shrink-0 text-[10px] font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded ring-1 ring-slate-200">{p.level}</span>}
        </p>
        <p className="text-[11.5px] text-slate-400 truncate">{sesi ? `${sesi.nama} · ` : ''}{p?.email}</p>
      </div>
      <p className="text-[11px] text-slate-400 shrink-0 text-right leading-tight">{fmtShort(a.date)}<br />{a.time}</p>
    </div>
  )
}

// ---------------- Buat Event (field = components/kota/event-form.tsx) ----------------

/** Force HH:mm 24h (strips AM/PM if pasted from locale UI). */
function normalizeJam24(raw: string): string {
  const s = raw.trim()
  const m = s.match(/^(\d{1,2})[:.](\d{2})(?:\s*(AM|PM))?$/i)
  if (!m) return s
  let h = Number(m[1])
  const min = m[2]
  const ap = m[3]?.toUpperCase()
  if (ap === 'PM' && h < 12) h += 12
  if (ap === 'AM' && h === 12) h = 0
  if (h > 23 || Number(min) > 59) return s
  return `${String(h).padStart(2, '0')}:${min}`
}

const fmtRp = (raw: string) => (raw ? Number(raw).toLocaleString('id-ID') : '')

// Map placeholder around Medan — click sets the pin (sisko uses Google Maps here)
const MAP = { north: 3.65, south: 3.53, west: 98.6, east: 98.74 }
const MAP_BG =
  'linear-gradient(35deg, transparent 47%, #fde68a 47%, #fde68a 50%, transparent 50%),' +
  'linear-gradient(-18deg, transparent 61%, #fde68a 61%, #fde68a 63.5%, transparent 63.5%),' +
  'radial-gradient(circle at 72% 28%, #c7e8c4 0 13%, transparent 14%),' +
  'radial-gradient(circle at 22% 78%, #bfdcf0 0 10%, transparent 11%),' +
  'linear-gradient(90deg, rgba(255,255,255,.85) 2px, transparent 2px) 0 0 / 46px 46px,' +
  'linear-gradient(rgba(255,255,255,.85) 2px, transparent 2px) 0 0 / 46px 46px,' +
  '#e7edf2'

interface SesiRow { key: string; nama: string; tanggal: string; mulai: string; selesai: string; wajib: boolean }

export function KEventNewScreen() {
  const { events, addEvent, openEvent, go, toast } = useProto()
  const sesiSeq = useRef(0)
  const [scope, setScope] = useState<'seluruh_kota' | 'khusus'>('seluruh_kota')
  const [form, setForm] = useState({
    nama: '', jenis: 'Offline' as 'Offline' | 'Online', wwtype: 'bulanan' as WwType, target: [] as Level[], targetPengurus: [] as string[],
    targetJumlah: '', tgl: '', tglSelesai: '', jam: '', jamSelesai: '', alamat: '', radius: '500', surat: '',
  })
  const [sesi, setSesi] = useState<SesiRow[]>([])
  const [latLng, setLatLng] = useState<{ lat: number; lng: number } | null>(null)
  const [danaRaw, setDanaRaw] = useState('')
  const [danaDisplay, setDanaDisplay] = useState('')
  const [flyer, setFlyer] = useState('')
  const [error, setError] = useState('')
  const isOnline = form.jenis === 'Online'

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm({ ...form, [k]: v })
  const toggle = <T extends string>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])
  const patchSesi = (key: string, patch: Partial<SesiRow>) => setSesi(sesi.map((s) => (s.key === key ? { ...s, ...patch } : s)))
  const addSesi = () => { sesiSeq.current += 1; setSesi([...sesi, { key: `s${sesiSeq.current}`, nama: '', tanggal: form.tglSelesai || form.tgl, mulai: '', selesai: '', wajib: true }]) }

  const review = form.wwtype !== 'nasional' && Boolean(form.surat.trim() || flyer)
  const submitLabel = review ? 'Simpan & Review' : 'Buat Event'

  const pickMap = (ev: MouseEvent<HTMLDivElement>) => {
    const r = ev.currentTarget.getBoundingClientRect()
    const x = (ev.clientX - r.left) / r.width
    const y = (ev.clientY - r.top) / r.height
    setLatLng({ lat: MAP.north - y * (MAP.north - MAP.south), lng: MAP.west + x * (MAP.east - MAP.west) })
  }
  const pin = latLng && { x: (latLng.lng - MAP.west) / (MAP.east - MAP.west), y: (MAP.north - latLng.lat) / (MAP.north - MAP.south) }

  const onFlyer = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    // Vercel rejects request bodies > 4.5 MB before the server action runs (same rule as sisko)
    if (file && file.size > 4 * 1024 * 1024) {
      e.target.value = ''
      setFlyer('')
      setError(`Flyer maksimal 4 MB (file ini ${(file.size / 1024 / 1024).toFixed(1)} MB). Kompres dulu lalu upload ulang.`)
      return
    }
    setError('')
    setFlyer(file ? URL.createObjectURL(file) : '')
  }

  const submit = (ev: FormEvent) => {
    ev.preventDefault()
    setError('')
    if (!form.nama.trim()) return setError('Nama event wajib diisi.')
    if (!form.tgl) return setError('Tanggal event wajib diisi.')
    const name = form.nama.trim()
    const jam = normalizeJam24(form.jam)
    const no = Math.max(...events.map((x) => x.no)) + 1
    const id = `ev-${no}`
    addEvent({
      id, no, name,
      cabang: form.wwtype === 'nasional' ? NASIONAL_CABANG : KOTA.cabang,
      category: form.wwtype === 'jfe' ? 'WW JFE' : form.wwtype === 'nasional' ? 'Nasional' : 'WW Bulanan',
      jenis: form.jenis, wwtype: form.wwtype, scope,
      target: form.target, targetPengurus: form.targetPengurus,
      quota: parseInt(form.targetJumlah, 10) || 0, booked: 0,
      tgl: form.tgl, tglSelesai: form.tglSelesai || form.tgl, jam, jamSelesai: normalizeJam24(form.jamSelesai),
      venue: isOnline ? 'Online' : form.alamat.split(',')[0].trim() || 'Lokasi belum diisi',
      alamat: form.alamat.trim() || (isOnline ? 'Online' : '—'),
      latlng: isOnline || !latLng ? '' : `${latLng.lat},${latLng.lng}`,
      radius: isOnline ? 0 : parseInt(form.radius, 10) || 0,
      dana: parseInt(danaRaw, 10) || 0, surat: form.surat.trim(),
      status: review ? 'review' : 'draft',
      regOpen: NOW_STAMP, regClose: `${form.tgl} ${jam || '23:59'}`,
      desc: [],
      sesi: sesi.filter((s) => s.nama.trim()).map((s, i) => ({
        id: no * 100 + i + 1, nama: s.nama.trim(), tanggal: s.tanggal || form.tgl,
        mulai: normalizeJam24(s.mulai), selesai: normalizeJam24(s.selesai), wajib: s.wajib,
      })),
      poster: flyer ? { ...defaultPoster(name, form.tgl), img: flyer } : defaultPoster(name, form.tgl),
    })
    openEvent(id)
    toast(review ? 'Event disimpan & diajukan untuk review' : 'Event dibuat')
  }

  const jamInput = (k: 'jam' | 'jamSelesai', placeholder: string) => (
    <input
      type="text" inputMode="numeric" placeholder={placeholder} pattern="^([01]\d|2[0-3]):[0-5]\d$" title="Format 24 jam, contoh 09:00 atau 21:30"
      value={form[k]} onChange={(e) => set(k, e.target.value)} onBlur={(e) => set(k, normalizeJam24(e.target.value))} className={FLD}
    />
  )

  return (
    <section>
      <Hero className="pt-4 md:pt-2 pb-20" decor="-right-6 top-10 w-40">
        <TopBar title="Buat Event" back={() => go('k-events')} />
        <p className="text-center text-[13px] text-white/80 mt-1">Sekretariat · data sama dengan form event sisko</p>
      </Hero>
      <form onSubmit={submit} className="px-5 -mt-12 relative space-y-4">
        <SectionCard lift icon="calendar" tint="red" title="Info Dasar" sub="Tipe, target, dan kuota">
          <Field group label="Tipe Event Nasional">
            <div className="space-y-2">
              {([['seluruh_kota', 'Event Seluruh Kota', 'Event nasional untuk semua kota'], ['khusus', 'Event Khusus', 'Event khusus nasional (mis. WW Online)']] as const).map(([v, l, hint]) => (
                <button key={v} type="button" onClick={() => setScope(v)} className={`w-full text-left px-3.5 py-3 rounded-xl ring-1 transition ${scope === v ? 'ring-2 ring-[#c9232c] bg-[#fbeceb]/60' : 'ring-slate-200 bg-white'}`}>
                  <p className={`text-[14px] font-semibold ${scope === v ? 'text-[#c9232c]' : 'text-slate-800'}`}>{l}</p>
                  <p className="text-[12px] text-slate-500 mt-0.5">{hint}</p>
                </button>
              ))}
            </div>
          </Field>
          <Field label="Nama Event"><input value={form.nama} onChange={(e) => set('nama', e.target.value)} className={FLD} placeholder="Nama event" /></Field>
          <Field label="Jenis Event">
            <select value={form.jenis} onChange={(e) => set('jenis', e.target.value as 'Offline' | 'Online')} className={FLD}>
              {['Offline', 'Online'].map((j) => <option key={j}>{j}</option>)}
            </select>
          </Field>
          <Field label="Tipe">
            <select value={form.wwtype} onChange={(e) => set('wwtype', e.target.value as WwType)} className={FLD}>
              {(Object.keys(WWTYPE_LABEL) as WwType[]).map((k) => <option key={k} value={k}>{WWTYPE_LABEL[k]}</option>)}
            </select>
          </Field>
          <Field group label="Target Peserta">
            <div className="flex flex-wrap gap-2">
              {TARGET_OPTIONS.map((o) => <ToggleChip key={o} label={o} active={form.target.includes(o)} onClick={() => set('target', toggle(form.target, o))} />)}
            </div>
          </Field>
          <Field group label="Target Pengurus">
            <div className="flex flex-wrap gap-2">
              {TARGET_PENGURUS_OPTIONS.map((o) => <ToggleChip key={o} label={o} active={form.targetPengurus.includes(o)} onClick={() => set('targetPengurus', toggle(form.targetPengurus, o))} />)}
            </div>
          </Field>
          <Field label="Target Jumlah Peserta"><input type="number" min={0} value={form.targetJumlah} onChange={(e) => set('targetJumlah', e.target.value)} className={FLD} placeholder="0" /></Field>
        </SectionCard>

        <SectionCard icon="clock" tint="gold" title="Waktu" sub="Jam dalam format 24 jam (WIB)">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tanggal Mulai"><input type="date" value={form.tgl} onChange={(e) => set('tgl', e.target.value)} className={`${FLD} block appearance-none min-h-12`} /></Field>
            <Field label="Tanggal Selesai"><input type="date" value={form.tglSelesai} onChange={(e) => set('tglSelesai', e.target.value)} className={`${FLD} block appearance-none min-h-12`} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Jam Mulai">{jamInput('jam', '09:00')}</Field>
            <Field label="Jam Selesai">{jamInput('jamSelesai', '21:00')}</Field>
          </div>
        </SectionCard>

        <SectionCard icon="qr" tint="red" title="Sesi Absen" sub="Absensi per sesi (Sekretariat)">
          <p className="text-[12px] text-slate-500 -mt-1">Opsional. Kosong = absen sekali per event. Toggle wajib off untuk sesi paralel.</p>
          {sesi.length === 0 ? <p className="text-[13px] text-slate-400 text-center py-1">Belum ada sesi.</p> : (
            <div className="space-y-3">
              {sesi.map((row, idx) => (
                <div key={row.key} className="rounded-xl ring-1 ring-slate-200 bg-slate-50/60 p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-semibold text-slate-500">Sesi {idx + 1}</p>
                    <button type="button" onClick={() => setSesi(sesi.filter((s) => s.key !== row.key))} aria-label="Hapus sesi" className="text-[20px] leading-none text-slate-400 hover:text-rose-600">×</button>
                  </div>
                  <input value={row.nama} onChange={(e) => patchSesi(row.key, { nama: e.target.value })} placeholder="Nama sesi" className={FLD} />
                  <input type="date" value={row.tanggal || form.tgl} onChange={(e) => patchSesi(row.key, { tanggal: e.target.value })} className={`${FLD} block appearance-none min-h-12`} />
                  <div className="grid grid-cols-2 gap-2">
                    <input inputMode="numeric" placeholder="Jam mulai" value={row.mulai} onChange={(e) => patchSesi(row.key, { mulai: e.target.value })} onBlur={(e) => patchSesi(row.key, { mulai: normalizeJam24(e.target.value) })} className={FLD} />
                    <input inputMode="numeric" placeholder="Jam selesai" value={row.selesai} onChange={(e) => patchSesi(row.key, { selesai: e.target.value })} onBlur={(e) => patchSesi(row.key, { selesai: normalizeJam24(e.target.value) })} className={FLD} />
                  </div>
                  <label className="flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer select-none">
                    <input type="checkbox" checked={row.wajib} onChange={(e) => patchSesi(row.key, { wajib: e.target.checked })} className="size-4 accent-[#c9232c]" />
                    Wajib (hitung kehadiran lengkap)
                  </label>
                </div>
              ))}
            </div>
          )}
          <button type="button" onClick={addSesi} className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 text-[13px] font-semibold text-slate-600 hover:border-[#c9232c] hover:text-[#c9232c] transition">+ Tambah sesi</button>
        </SectionCard>

        <SectionCard icon="pin" tint="gold" title="Lokasi" sub={isOnline ? 'Event online — tanpa peta & radius' : 'Titik peta untuk cek radius absen'}>
          <Field label="Alamat Event"><input value={form.alamat} onChange={(e) => set('alamat', e.target.value)} className={FLD} placeholder="Cari atau ketik alamat..." autoComplete="off" /></Field>
          {!isOnline && (
            <>
              <div>
                <p className="text-[12px] font-semibold text-slate-600 mb-1.5">Peta — klik untuk set lokasi</p>
                <div onClick={pickMap} className="relative w-full h-[220px] rounded-xl overflow-hidden ring-1 ring-slate-200 cursor-crosshair" style={{ background: MAP_BG }}>
                  {pin && (
                    <span className="absolute -translate-x-1/2 -translate-y-full text-[#c9232c] drop-shadow" style={{ left: `${pin.x * 100}%`, top: `${pin.y * 100}%` }}>
                      <Icon name="pin" className="w-9 h-9" sw={2.2} />
                    </span>
                  )}
                  <span className="absolute bottom-2 left-2 text-[10.5px] bg-white/85 rounded px-1.5 py-0.5 text-slate-500">Peta simulasi · Medan</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(['lat', 'lng'] as const).map((k) => (
                  <div key={k} className="px-3 py-2.5 bg-slate-50 rounded-xl ring-1 ring-slate-200">
                    <p className="text-[10px] text-slate-400">{k === 'lat' ? 'Latitude' : 'Longitude'}</p>
                    <p className="text-[13px] text-slate-800 font-mono">{latLng ? latLng[k].toFixed(7) : '—'}</p>
                  </div>
                ))}
              </div>
              <Field label="Radius Absen (meter)"><input type="number" min={0} value={form.radius} onChange={(e) => set('radius', e.target.value)} className={FLD} placeholder="500" /></Field>
            </>
          )}
        </SectionCard>

        <SectionCard icon="receipt" tint="red" title="Lainnya" sub="Dana, surat pemberitahuan, dan flyer">
          <Field label="Dana Event (Rp)">
            <input
              type="text" inputMode="numeric" value={danaDisplay} placeholder="0" className={FLD}
              onChange={(e) => { const raw = e.target.value.replace(/\D/g, ''); setDanaRaw(raw); setDanaDisplay(raw) }}
              onBlur={() => setDanaDisplay(fmtRp(danaRaw))}
              onFocus={() => setDanaDisplay(danaRaw)}
            />
          </Field>
          <Field label="Link Surat Pemberitahuan"><input value={form.surat} onChange={(e) => set('surat', e.target.value)} className={FLD} placeholder="https://..." /></Field>
          <Field label="Flyer Event">
            {form.wwtype === 'jfe' && form.tgl && (
              <div className="mb-3 rounded-xl ring-1 ring-slate-200 overflow-hidden">
                <p className="px-3 py-2 text-[12px] text-slate-500">Flyer pusat WW JFE / WFE. Sesuaikan hanya: foto pembicara, tanggal, tempat, tema, logo kota.</p>
                <Poster p={events.find((x) => x.wwtype === 'jfe')?.poster ?? defaultPoster('WW JFE', form.tgl)} className="w-full aspect-[16/10]" />
              </div>
            )}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onFlyer} className="text-[13px] text-slate-700 file:mr-3 file:px-3 file:py-1.5 file:rounded-full file:border-0 file:bg-[#c9232c] file:text-white file:text-[13px] file:font-semibold" />
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob URL preview */}
            {flyer && <img src={flyer} alt="Preview flyer" className="mt-2 w-full rounded-xl ring-1 ring-slate-200 object-cover" />}
          </Field>
        </SectionCard>

        {error && <p className="px-4 py-3 rounded-xl bg-rose-50 text-[13px] text-rose-700 font-medium">{error}</p>}
        {review && <Note>Ada flyer / link surat — event langsung masuk <b>review pusat</b> (QA flyer & berita acara).</Note>}
        <button className={`w-full py-4 text-[16px] ${BTN_RED}`}>{submitLabel}</button>
      </form>
    </section>
  )
}

// ---------------- Reimburse ----------------

function ReimburseSheet({ eventId }: { eventId?: string }) {
  const { events, reimburse, submitReimburse, closeSheet, toast } = useProto()
  // Kegiatan yang sudah/sedang berjalan dan belum punya pengajuan
  const options = events.filter((e) => ownEvent(e) && (e.status === 'live' || e.status === 'done') && !reimburse.some((r) => r.eventId === e.id && r.status !== 'belum'))
  const [id, setId] = useState(eventId ?? options[0]?.id ?? '')
  const [amount, setAmount] = useState(0)
  const [file, setFile] = useState('')

  if (!options.length) return (<><SheetHead title="Ajukan Reimburse" /><Empty>Semua kegiatan sudah diajukan</Empty></>)

  return (
    <>
      <SheetHead title="Ajukan Reimburse" sub="Dana dicairkan setelah disetujui pusat" />
      <div className="space-y-4">
        <Field label="Kegiatan">
          <select value={id} onChange={(e) => setId(e.target.value)} className={FLD}>
            {options.map((e) => <option key={e.id} value={e.id}>{e.name} · {+dd(e.tgl)} {capW(mon(e.tgl))}</option>)}
          </select>
        </Field>
        <Field label="Nominal">
          <div className="flex items-center rounded-xl bg-slate-50 ring-1 ring-slate-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#c9232c] transition">
            <span className="pl-3.5 pr-2.5 py-3 font-semibold text-slate-600 border-r border-slate-200">Rp</span>
            <input value={amount ? amount.toLocaleString('id-ID') : ''} onChange={(e) => setAmount(Number(e.target.value.replace(/\D/g, '').slice(0, 10)))} inputMode="numeric" placeholder="0" className="flex-1 min-w-0 bg-transparent px-3 py-3 text-[15px] font-semibold outline-none placeholder:text-slate-400" />
          </div>
        </Field>
        <Field label="Nota / Bukti">
          <span className="flex items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 px-3.5 py-3 text-[13px] text-slate-500 cursor-pointer">
            <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0]?.name ?? '')} />
            <Icon name="image" className="w-5 h-5 text-slate-400" />
            <span className="truncate">{file || 'Pilih foto atau PDF nota'}</span>
          </span>
        </Field>
        <button disabled={!id || !amount} onClick={() => { submitReimburse(id, amount); closeSheet(); toast('Reimburse diajukan ke pusat') }} className={`w-full py-3.5 ${BTN_RED}`}>
          Ajukan Reimburse{amount ? ` · ${rp(amount)}` : ''}
        </button>
      </div>
    </>
  )
}

export function KReimburseScreen() {
  const { reimburse, events, sheet, openEvent } = useProto()
  const ev = (id: string) => events.find((e) => e.id === id)
  const count = (s: ReimbStatus) => reimburse.filter((r) => r.status === s).length
  const item = (r: (typeof reimburse)[number]) => {
    const e = ev(r.eventId)
    if (!e) return null
    return (
      <button key={r.id} onClick={() => (r.status === 'belum' ? sheet(<ReimburseSheet eventId={e.id} />) : openEvent(e.id))} className={`w-full ${CARD} p-3.5 flex items-center gap-3.5 text-left active:scale-[.99] transition`}>
        <DateBlock d={dd(e.tgl)} m={mon(e.tgl)} tone={r.status === 'cair' ? 'slate' : 'red'} />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-[14px] text-[#3b1417] truncate">{e.name}</p>
          <p className="text-[12px] text-slate-500 truncate mt-0.5">{r.amount ? `${rp(r.amount)} · ` : ''}{r.note}</p>
          <div className="mt-1.5 flex"><Pill tone={RB_STATUS[r.status][1]}>{RB_STATUS[r.status][0]}</Pill></div>
        </div>
      </button>
    )
  }
  return (
    <section>
      <PageHero title="Pengajuan Reimburse" sub="Dana operasional per kegiatan kota" action={{ label: 'Ajukan', onClick: () => sheet(<ReimburseSheet />) }} pb="pb-20" />
      <div className="px-5 -mt-12 relative">
        <StatTriple items={[[count('diajukan'), 'Diajukan', 'text-[#c9232c]'], [count('direview'), 'Direview', 'text-amber-500'], [count('cair'), 'Cair', 'text-slate-400']]} />
        <h3 className={`${H3} mt-6 mb-3`}>Dalam Proses</h3>
        <div className="space-y-3">{reimburse.filter((r) => r.status !== 'cair').map(item)}</div>
        <h3 className={`${H3} mt-6 mb-3`}>Selesai</h3>
        <div className="space-y-3">{reimburse.filter((r) => r.status === 'cair').map(item)}</div>
      </div>
    </section>
  )
}

// ---------------- Scan absensi (alur = app/alk/scanner/scanner-client.tsx) ----------------

function EventPickSheet({ events, value, onPick }: { events: Ev[]; value: string; onPick: (id: string) => void }) {
  const { closeSheet } = useProto()
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  const list = needle
    ? events.filter((x) =>
      `#${x.no} ${x.name} ${x.venue} ${x.alamat} ${fmtLong(x.tgl)} ${EV_STATUS[x.status][0]}`.toLowerCase().includes(needle))
    : events
  return (
    <>
      <SheetHead title="Pilih Event" sub="Cari nama, nomor, atau tanggal" />
      <label className={`flex items-center gap-2.5 ${CARD} px-3.5 py-3 mb-3`}>
        <Icon name="search" className="w-5 h-5 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="search"
          placeholder="Cari event..."
          enterKeyHint="search"
          autoFocus
          className="flex-1 min-w-0 outline-none text-[15px] bg-transparent"
        />
      </label>
      <div className="space-y-2 max-h-[50vh] overflow-y-auto">
        {list.length === 0 && <Empty>Tidak ada event cocok</Empty>}
        {list.map((x) => {
          const on = x.id === value
          return (
            <button
              key={x.id}
              onClick={() => { onPick(x.id); closeSheet() }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left transition ${on ? 'ring-2 ring-[#c9232c] bg-[#fbeceb]/60' : 'ring-1 ring-[#efe3cc] bg-white'}`}
            >
              <DateBlock d={dd(x.tgl)} m={mon(x.tgl)} tone={x.status === 'live' ? 'solid' : 'red'} />
              <span className="flex-1 min-w-0">
                <span className={`block font-bold text-[14.5px] truncate ${on ? 'text-[#c9232c]' : 'text-[#3b1417]'}`}>{x.name}</span>
                <span className="block text-[12px] text-slate-500 truncate">#{x.no} · {x.jam}–{x.jamSelesai} · {EV_STATUS[x.status][0]}</span>
              </span>
              {on && <Icon name="check" className="w-5 h-5 text-[#c9232c]" sw={2.6} />}
            </button>
          )
        })}
      </div>
    </>
  )
}

export function KScanScreen() {
  const { events, regs, absen, people, pengurus, addAbsen, scanEventId, setScanEventId, tick, sheet } = useProto()
  const scannable = events.filter((e) => ownEvent(e) && (e.status === 'live' || e.status === 'approved'))
  const e = scannable.find((x) => x.id === scanEventId) ?? scannable[0]
  const [sesiId, setSesiId] = useState<number | null>(() => (e ? currentSesi(e)?.id ?? null : null))
  const [cam, setCam] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [done, setDone] = useState<string | null>(null)

  if (!e) {
    return <section><PageHero title="Scan Absensi" sub="Belum ada event yang bisa diabsen" /></section>
  }

  const hasSesi = e.sesi.length > 0
  const sesi = e.sesi.find((s) => s.id === sesiId) ?? null
  const person = (k: string) => people.find((p) => p.key === k)
  const registrants = regs.filter((r) => r.eventId === e.id).map((r) => r.key)
  const already = (key: string) => absen.some((a) => a.eventId === e.id && a.key === key && a.sesiId === (hasSesi ? sesiId : null))
  const recent = absen.filter((a) => a.eventId === e.id).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)).slice(0, 5)
  const reset = () => { setPreview(null); setError(''); setDone(null) }

  const changeEvent = (id: string) => {
    const next = scannable.find((x) => x.id === id)
    setScanEventId(id)
    setSesiId(next ? currentSesi(next)?.id ?? null : null)
    reset()
  }
  // Simulates a camera read: the next registrant not yet absen in this sesi, else a duplicate
  const simulate = () => {
    reset()
    const key = registrants.find((k) => k !== pengurus.key && !already(k)) ?? registrants.find(already)
    if (!key) return setError('Belum ada peserta terdaftar di event ini.')
    setPreview(key)
  }
  const wrongEvent = () => {
    reset()
    const other = events.find((x) => x.id !== e.id && x.status === 'approved')
    setError(`QR ini untuk event lain (event #${other?.no ?? 0}), bukan event #${e.no}.`)
  }
  const confirm = () => {
    if (!preview) return
    if (hasSesi && sesiId == null) return setError('Pilih sesi absen dulu.')
    if (already(preview)) return setError('Peserta ini sudah diabsen di sesi ini.')
    addAbsen({ eventId: e.id, key: preview, sesiId: hasSesi ? sesiId : null, date: TODAY, time: tick() })
    setDone(person(preview)?.name ?? preview)
    setPreview(null)
  }
  const p = preview ? person(preview) : undefined

  return (
    <section>
      <Hero className="pt-6 md:pt-4 pb-36 text-center" decor="-left-6 top-10 w-40">
        <h2 className="font-extrabold text-[22px]">Scan Absensi</h2>
        <p className="text-[13px] text-white/90 mt-2 font-semibold">
          {e.name} · <span className="text-[#f1dc9a]">{attendeeKeys(e, absen).length} hadir</span>
        </p>
      </Hero>

      <div className="px-5 -mt-28 relative space-y-4">
        <div className="bg-white rounded-3xl shadow-[0_18px_40px_-14px_rgba(80,20,25,.35)] p-4">
          <div className="space-y-3">
            <Field label="Event" group>
              <button
                type="button"
                onClick={() => sheet(<EventPickSheet events={scannable} value={e.id} onPick={changeEvent} />)}
                className={`${FLD} flex items-center gap-2 text-left`}
              >
                <span className="flex-1 truncate">#{e.no} · {e.name} ({+dd(e.tgl)} {capW(mon(e.tgl))})</span>
                <Icon name="chevron" className="w-5 h-5 text-slate-400 shrink-0" sw={2} />
              </button>
            </Field>
            {hasSesi && (
              <Field label="Sesi absen">
                <select value={sesiId ?? ''} onChange={(ev) => { setSesiId(Number(ev.target.value) || null); reset() }} className={FLD}>
                  {e.sesi.map((s) => <option key={s.id} value={s.id}>{sesiLabel(s)}</option>)}
                </select>
              </Field>
            )}
            <p className={`flex items-center gap-1.5 text-[12px] font-semibold ${e.jenis === 'Online' ? 'text-slate-500' : 'text-emerald-600'}`}>
              <Icon name={e.jenis === 'Online' ? 'monitor' : 'pin'} className="w-4 h-4" />
              {e.jenis === 'Online' ? 'Event online — tanpa cek lokasi' : `Dalam radius event (120 m dari titik, batas ${e.radius} m)`}
            </p>

            {p ? (
              <div className="rounded-2xl ring-1 ring-slate-200 p-4 space-y-3 animate-[proto-pop_.2s_ease]">
                <div>
                  <p className="text-[11px] text-slate-400 uppercase tracking-wider">Peserta ditemukan</p>
                  <p className="text-[18px] font-bold text-slate-800">{p.name}</p>
                  <p className="text-[13px] text-slate-500">{p.church} · {p.city}</p>
                </div>
                <p className="flex items-center gap-1.5 text-[12px] text-emerald-600 font-semibold"><Icon name="check" className="w-4 h-4" sw={2.6} />Event #{e.no} sesuai</p>
                {sesi && <p className="text-[12.5px] text-slate-500">Sesi: <b className="text-slate-800">{sesi.nama}</b></p>}
                {error && <p className="text-[13px] text-rose-600 font-semibold">{error}</p>}
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={simulate} className="py-3 rounded-xl ring-1 ring-slate-200 text-slate-700 font-bold text-[14px]">Scan Ulang</button>
                  <button onClick={confirm} disabled={hasSesi && sesiId == null} className="py-3 rounded-xl bg-[#c9232c] text-white font-bold text-[14px] disabled:opacity-50">Absen Peserta</button>
                </div>
              </div>
            ) : (
              <>
                <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-[#1a0d0f]">
                  {cam ? (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,#3a2a24,#120a0b_75%)] flex items-end justify-center pb-4">
                      <div className="absolute left-[12%] right-[12%] h-0.5 bg-linear-to-r from-transparent via-[#e6cd7e] to-transparent shadow-[0_0_12px_#e6cd7e] animate-[proto-scan_2.2s_ease-in-out_infinite]" />
                      <p className="relative text-[12px] text-white/60">Arahkan kamera ke QR Code tiket</p>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 text-white/80">
                      <Icon name="camera" className="w-10 h-10 text-[#e6cd7e]" />
                      <p className="text-[13px] mt-3">Scan QR di tiket peserta</p>
                      <button onClick={() => setCam(true)} className="mt-4 px-5 py-2.5 rounded-full bg-[#c9232c] text-white font-bold text-[14px]">Nyalakan Kamera</button>
                    </div>
                  )}
                  <span className="pointer-events-none absolute top-4 left-4 w-9 h-9 border-t-4 border-l-4 border-[#e6cd7e] rounded-tl-xl" />
                  <span className="pointer-events-none absolute top-4 right-4 w-9 h-9 border-t-4 border-r-4 border-[#e6cd7e] rounded-tr-xl" />
                  <span className="pointer-events-none absolute bottom-4 left-4 w-9 h-9 border-b-4 border-l-4 border-[#e6cd7e] rounded-bl-xl" />
                  <span className="pointer-events-none absolute bottom-4 right-4 w-9 h-9 border-b-4 border-r-4 border-[#e6cd7e] rounded-br-xl" />
                </div>
                {error && <p className="rounded-xl bg-rose-50 ring-1 ring-rose-200 px-3 py-2.5 text-[13px] text-rose-700 font-medium">{error}</p>}
                {cam && (
                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                    <button onClick={simulate} className="px-4 py-2 rounded-full bg-[#c9232c] text-white text-[13px] font-bold">Simulasikan scan</button>
                    <button onClick={wrongEvent} className="text-[13px] font-semibold text-[#96792a]">QR event lain</button>
                    <button onClick={() => { setCam(false); reset() }} className="text-[13px] font-semibold text-slate-500">Stop Kamera</button>
                  </div>
                )}
              </>
            )}
            <SelfRow e={e} />
          </div>
        </div>

        {done && (
          <div key={done} className="rounded-2xl bg-emerald-50 ring-1 ring-emerald-200 p-4 flex items-center gap-3 animate-[proto-pop_.25s_ease]">
            <span className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center"><Icon name="check" className="w-6 h-6" sw={2.4} /></span>
            <p className="text-[13.5px] text-emerald-800"><b>{done}</b><br />tercatat hadir{sesi ? ` · ${sesi.nama}` : ''}</p>
          </div>
        )}

        {hasSesi && (
          <div className="flex gap-2 overflow-x-auto -mx-5 px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {e.sesi.map((s) => (
              <span key={s.id} className={`shrink-0 rounded-xl px-3 py-2 text-[12px] ring-1 ${s.id === sesiId ? 'bg-[#fbeceb] ring-[#f3d3d3] text-[#c9232c]' : 'bg-white ring-slate-200 text-slate-600'}`}>
                <b>{absen.filter((a) => a.eventId === e.id && a.sesiId === s.id).length}</b> · {s.nama}
              </span>
            ))}
          </div>
        )}
        <div>
          <p className="font-bold text-[#3b1417] mb-2 px-1">Baru saja tercatat</p>
          {recent.length ? (
            <div className={`${CARD} divide-y divide-slate-100`}>
              {recent.map((a) => {
                const r = person(a.key)
                return (
                  <div key={`${a.key}-${a.sesiId}`} className="flex items-center gap-3 px-4 py-3">
                    <span className="w-10 h-10 rounded-full overflow-hidden shrink-0"><Avatar g={r?.g ?? 'L'} /></span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[14px] text-slate-800 truncate">{r?.name ?? a.key}</p>
                      <p className="text-[12px] text-slate-500 truncate">{r?.church}{a.sesiId != null ? ` · ${e.sesi.find((s) => s.id === a.sesiId)?.nama}` : ''}</p>
                    </div>
                    <span className="text-[12px] font-semibold text-slate-400">{a.time}</span>
                    <Icon name="check" className="w-5 h-5 text-emerald-500" sw={2.4} />
                  </div>
                )
              })}
            </div>
          ) : <Empty>Belum ada presensi</Empty>}
        </div>
      </div>
    </section>
  )
}

// ---------------- Lainnya ----------------

export function KMoreScreen() {
  const { pengurus, photos, go, toKartu, soon, sheet, tickets, logoutPengurus } = useProto()
  const unread = tickets.filter((t) => t.unread).length
  return (
    <section>
      <Hero className="pt-6 md:pt-4 pb-24 rounded-b-[32px]">
        <div className="flex items-center gap-4">
          <span className="w-16 h-16 shrink-0 rounded-full overflow-hidden ring-4 ring-white/30"><Avatar g={pengurus.g} photo={photos[pengurus.key]} /></span>
          <div className="min-w-0">
            <p className="font-extrabold text-lg truncate">{KOTA.name}</p>
            <p className="text-[13px] text-white/80 truncate">Sekretariat · {pengurus.name}</p>
          </div>
        </div>
      </Hero>
      <div className="px-5 -mt-16 relative space-y-4">
        <div className={`${LIFT} divide-y divide-slate-100 overflow-hidden`}>
          <Row icon="box" title="Nama PIC" sub="Alokasi stok & klaim" right={<Pill tone="gold">Segera</Pill>} onClick={() => soon('Alokasi stok & klaim')} />
          <Row icon="receipt" title="ALK" sub="Status dana per kegiatan" right={<Pill tone="gold">Segera</Pill>} onClick={() => soon('Status dana per kegiatan')} />
          <Row icon="link" title="VOL" sub="Pendaftaran anggota baru" onClick={() => sheet(<RegLinkSheet />)} />
          <Row icon="chat" title="Pengaduan ke Pusat" sub="Laporkan kendala ke admin pusat" right={unread ? <Pill tone="red">{unread} balasan baru</Pill> : undefined} onClick={() => go('k-tickets')} />
        </div>
        <button onClick={toKartu} className={`w-full flex items-center gap-3 p-4 ${CARD} text-left`}>
          <TintIcon name="card" tint="red" />
          <span className="flex-1">
            <span className="block font-bold text-[15px] text-[#3b1417]">Beralih ke Kartu Saya</span>
            <span className="block text-[12px] text-slate-500">Kartu anggota &amp; tiket pribadi</span>
          </span>
          <Icon name="chevron" className="w-5 h-5 text-slate-300" sw={2} />
        </button>
        <button onClick={logoutPengurus} className={`w-full py-3.5 ${CARD} text-rose-600 font-semibold flex items-center justify-center gap-2`}>
          <Icon name="logout" className="w-5 h-5" sw={2} />Keluar dari akun pengurus
        </button>
        <p className="text-center text-[11px] text-slate-400">LevelUP Sekretariat · {pengurus.email}</p>
      </div>
    </section>
  )
}

// ---------------- Pengaduan ke Pusat ----------------

const TICKET_TONE: Record<string, PillTone> = { Dibalas: 'red', Menunggu: 'amber', Selesai: 'green' }

function TicketSheet() {
  const { tickets, addTicket, closeSheet, toast } = useProto()
  const [subject, setSubject] = useState('')
  const [msg, setMsg] = useState('')
  const submit = () => {
    const id = Math.max(...tickets.map((t) => t.id)) + 1
    addTicket({ id, subject: subject.trim(), meta: `#${id} · ${fmtShort(TODAY)}`, status: 'Menunggu', last: msg.trim() })
    closeSheet()
    toast('Pengaduan terkirim ke pusat')
  }
  return (
    <>
      <SheetHead title="Buat Pengaduan" sub="Tim pusat membalas maks. 2×24 jam" />
      <div className="space-y-4">
        <Field label="Judul"><input value={subject} onChange={(e) => setSubject(e.target.value)} className={FLD} placeholder="Contoh: Barcode anggota tidak terkirim" maxLength={120} /></Field>
        <Field label="Detail kendala"><textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={4} className={FLD} placeholder="Jelaskan kendalanya, sertakan nama anggota bila perlu" maxLength={1000} /></Field>
        <button disabled={!subject.trim() || !msg.trim()} onClick={submit} className={`w-full py-3.5 ${BTN_RED}`}>Kirim Pengaduan</button>
      </div>
    </>
  )
}

export function KTicketsScreen() {
  const { tickets, go, sheet } = useProto()
  return (
    <section>
      <Hero className="pt-4 md:pt-2 pb-20 rounded-b-[32px]" decor="-right-6 top-14 w-40">
        <TopBar title="Pengaduan ke Pusat" back={() => go('k-more')} />
        <p className="text-center text-sm text-white/80 mt-2">Laporkan kendala data, barcode, atau aplikasi</p>
      </Hero>
      <div className="px-5 -mt-12 relative">
        <button onClick={() => sheet(<TicketSheet />)} className={`w-full p-4 ${LIFT} flex items-center gap-3 text-left active:scale-[.99] transition`}>
          <span className="w-11 h-11 rounded-xl bg-[#c9232c] text-white flex items-center justify-center"><Icon name="plus" className="w-6 h-6" sw={2.2} /></span>
          <span className="flex-1">
            <span className="block font-bold text-[#3b1417]">Buat Pengaduan Baru</span>
            <span className="block text-[12px] text-slate-500">Balasan dari pusat muncul di sini</span>
          </span>
          <Icon name="chevron" className="w-5 h-5 text-slate-400" sw={2} />
        </button>
        <p className={`${H3} mt-6 mb-3 px-1`}>Riwayat Pengaduan</p>
        <div className="space-y-3">
          {tickets.map((t) => (
            <div key={t.id} className={`${CARD} p-4`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-[14px] text-[#3b1417] flex items-center gap-1.5">
                    {t.unread && <span className="w-2 h-2 rounded-full bg-[#c9232c] shrink-0" />}{t.subject}
                  </p>
                  <p className="text-[12px] text-slate-400 mt-0.5">{t.meta}</p>
                </div>
                <Pill tone={TICKET_TONE[t.status]}>{t.status}</Pill>
              </div>
              <p className="mt-3 text-[12.5px] text-slate-600 bg-slate-50 rounded-xl px-3 py-2">{t.last}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
