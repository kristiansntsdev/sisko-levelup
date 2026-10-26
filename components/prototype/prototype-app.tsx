'use client'
import { useRef, useState, type ReactNode } from 'react'
import { ProtoContext, type Proto } from './context'
import { SCREEN_LIST, type ScreenId } from './screens'
import { HomeIcon, Icon } from './icons'
import {
  ABSEN, ACCOUNTS, EVENTS, GUESTS, PENGURUS, K_MEMBERS, K_REIMBURSE, K_TICKETS, NOW_HM, REGS, TESTIMONIES, TODAY, UPGRADES,
  type Absen, type Account, type Ev, type EventStatus, type KMember, type KTicket, type Level, type Reg, type Testimony, type Upgrade,
} from './data'
import { cabangName, fmtShort } from './logic'
import {
  DaftarScreen, DailyWords, DetailScreen, GoogleSheet, EventScreen, EventsScreen, HistoryScreen, HomeScreen, KesaksianScreen, LoginScreen,
  ProfileScreen, TicketScreen, TicketsScreen,
} from './member-screens'
import {
  KApprovalScreen, KEventNewScreen, KEventScreen, KEventsScreen, KHomeScreen, KMemberNewScreen, KMembersScreen, KMoreScreen,
  KReimburseScreen, KScanScreen, KTicketsScreen,
} from './alk-screens'
import { Logo, SHOW } from './ui'

interface NavItem { id: ScreenId; label: string; icon?: ReactNode; fab?: boolean; match: ScreenId[] }

const NAV_MEMBER: NavItem[] = [
  { id: 'home', label: 'Beranda', icon: <HomeIcon />, match: ['home', 'detail'] },
  { id: 'history', label: 'Riwayat', icon: <Icon name="history" sw={1.7} />, match: ['history'] },
  { id: 'tickets', label: 'Tiket', fab: true, match: ['tickets'] },
  { id: 'kesaksian', label: 'Kesaksian', icon: <Icon name="chat" sw={1.7} />, match: ['kesaksian'] },
  { id: 'profile', label: 'Profil', icon: <Icon name="user" sw={1.7} />, match: ['profile'] },
]

const NAV_ALK: NavItem[] = [
  { id: 'k-home', label: 'Beranda', icon: <HomeIcon />, match: ['k-home'] },
  { id: 'k-members', label: 'Anggota', icon: <Icon name="users" sw={1.7} />, match: ['k-members', 'k-member-new', 'k-approval'] },
  { id: 'k-scan', label: 'Scan', fab: true, match: ['k-scan'] },
  { id: 'k-events', label: 'Event', icon: <Icon name="calendar" sw={1.7} />, match: ['k-events', 'k-event', 'k-event-new', 'k-reimburse'] },
  { id: 'k-more', label: 'Lainnya', icon: <Icon name="grid" sw={1.7} />, match: ['k-more', 'k-tickets'] },
]

// Full-screen pages without the bottom nav
const NO_NAV: ScreenId[] = ['login', 'daftar', 'events', 'event', 'ticket']

function Screen({ id }: { id: ScreenId }) {
  switch (id) {
    case 'login': return <LoginScreen />
    case 'daftar': return <DaftarScreen />
    case 'home': return <HomeScreen />
    case 'detail': return <DetailScreen />
    case 'events': return <EventsScreen />
    case 'event': return <EventScreen />
    case 'tickets': return <TicketsScreen />
    case 'ticket': return <TicketScreen />
    case 'history': return <HistoryScreen />
    case 'kesaksian': return <KesaksianScreen />
    case 'profile': return <ProfileScreen />
    case 'k-home': return <KHomeScreen />
    case 'k-members': return <KMembersScreen />
    case 'k-approval': return <KApprovalScreen />
    case 'k-member-new': return <KMemberNewScreen />
    case 'k-events': return <KEventsScreen />
    case 'k-event': return <KEventScreen />
    case 'k-event-new': return <KEventNewScreen />
    case 'k-reimburse': return <KReimburseScreen />
    case 'k-scan': return <KScanScreen />
    case 'k-more': return <KMoreScreen />
    case 'k-tickets': return <KTicketsScreen />
  }
}

export function PrototypeApp({ initial }: { initial: ScreenId }) {
  const [screen, setScreen] = useState<ScreenId>(initial)
  // Satu HP: 1 sesi peserta + 1 sesi pengurus. Deep link ke Masuk / Daftar = HP belum login
  const signedOut = initial === 'login' || initial === 'daftar'
  const [pesertaId, setPesertaId] = useState<string | null>(signedOut ? null : ACCOUNTS[0].id)
  const [pengurusOn, setPengurusOn] = useState(!signedOut)
  const [allAccounts, setAllAccounts] = useState<Account[]>(ACCOUNTS)
  const [daftarStep, setDaftarStep] = useState<'intro' | 'form' | 'done'>('intro')
  const [upgrades, setUpgrades] = useState<Upgrade[]>(UPGRADES)
  const [levels, setLevels] = useState<Record<string, Level>>({})
  const [photos, setPhotos] = useState<Record<string, string>>({})
  const [testimonies, setTestimonies] = useState<Testimony[]>(TESTIMONIES)
  const [push, setPush] = useState(false)
  const [notifUnread, setNotifUnread] = useState(true)
  const [daily, setDaily] = useState(initial === 'home')
  const dailySeen = useRef(initial === 'home')
  const [sheetNode, setSheetNode] = useState<ReactNode>(null)
  const [soonName, setSoonName] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const clock = useRef(0)
  const mainRef = useRef<HTMLElement>(null)

  const [events, setEvents] = useState<Ev[]>(EVENTS)
  const [regs, setRegs] = useState<Reg[]>(REGS)
  const [absen, setAbsen] = useState<Absen[]>(ABSEN)
  const [viewEventId, setViewEventId] = useState('raya')
  const [eventKota, setEventKota] = useState(ACCOUNTS[0].kotalevelup)
  const [ticketId, setTicketId] = useState('ignite:yohanes')

  const [members, setMembers] = useState<KMember[]>(K_MEMBERS)
  const [eventId, setEventId] = useState('ignite')
  const [scanEventId, setScanEventId] = useState('ignite')
  const [reimburse, setReimburse] = useState(K_REIMBURSE)
  const [tickets, setTickets] = useState<KTicket[]>(K_TICKETS)

  const me = allAccounts.find((a) => a.id === pesertaId) ?? allAccounts[0]
  // Level change: device accounts live in allAccounts, other peserta in the overrides map
  const setLevel = (key: string, level: Level) => {
    if (allAccounts.some((a) => a.id === key)) setAllAccounts(allAccounts.map((a) => (a.id === key ? { ...a, level } : a)))
    else setLevels({ ...levels, [key]: level })
  }

  const go = (s: ScreenId) => {
    // Jumps from the desktop index / deep links open the session the screen needs.
    // Functional update so a sign-in made in the same handler is not overwritten
    if (s.startsWith('k-')) setPengurusOn(true)
    else if (s !== 'login' && s !== 'daftar') setPesertaId((cur) => cur ?? ACCOUNTS[0].id)
    // Daily Words pops up once per login, on the first visit to Beranda
    if (s === 'home' && !dailySeen.current) { dailySeen.current = true; setDaily(true) }
    setSheetNode(null)
    setScreen(s)
    mainRef.current?.scrollTo(0, 0)
    window.history.replaceState(null, '', `?s=${s}`)
  }

  const toast = (msg: string) => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(null), 2400)
  }

  const ctx: Proto = {
    go,
    toast,
    soon: setSoonName,
    sheet: setSheetNode,
    closeSheet: () => setSheetNode(null),
    tick: () => {
      clock.current += 1
      const [h, m] = NOW_HM.split(':').map(Number)
      const t = h * 60 + m + clock.current
      return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
    },

    me,
    pesertaOn: pesertaId !== null,
    pengurusOn,
    pengurus: PENGURUS,
    allAccounts,
    signIn: setPesertaId,
    signInPengurus: () => setPengurusOn(true),
    logoutPengurus: () => {
      setPengurusOn(false)
      if (pesertaId) { go('home'); toast('Keluar dari akun pengurus') } else { setDaftarStep('intro'); go('login') }
    },
    toKartu: () => (pesertaId ? go('home') : setSheetNode(<GoogleSheet />)),
    register: (a) => { setAllAccounts([...allAccounts, a]); setPesertaId(a.id) },
    daftarStep,
    setDaftarStep,
    joinVolunteer: () => { if (me.level === 'Umum') setLevel(me.id, 'Volunteer') },
    joinSquad: (cabang) => {
      // Same as sisko joinSquad: kota disimpan di peserta.kotalevelup; pengajuan pending dipindah, bukan diduplikasi
      setAllAccounts(allAccounts.map((a) => (a.id === me.id ? { ...a, kotalevelup: cabang, city: cabangName(cabang) } : a)))
      setUpgrades(upgrades.some((u) => u.key === me.id)
        ? upgrades.map((u) => (u.key === me.id ? { ...u, cabang } : u))
        : [...upgrades, { id: Math.max(0, ...upgrades.map((u) => u.id)) + 1, key: me.id, cabang, usercode: me.no }])
    },
    upgrades,
    approveUpgrade: (id) => {
      const u = upgrades.find((x) => x.id === id)
      if (!u) return
      setUpgrades(upgrades.filter((x) => x.id !== id))
      setLevel(u.key, 'Squad')
    },
    photos,
    setPhoto: (id, url) => setPhotos({ ...photos, [id]: url }),
    logout: () => {
      dailySeen.current = false
      setPesertaId(null)
      if (pengurusOn) { go('k-home'); toast('Keluar dari akun peserta') } else { setDaftarStep('intro'); go('login') }
    },
    testimonies,
    addTestimony: (t) => setTestimonies([t, ...testimonies]),
    push,
    setPush,
    notifUnread,
    readNotif: () => setNotifUnread(false),
    eventKota,
    setEventKota,
    viewEventId,
    openViewEvent: (id) => { setViewEventId(id); go('event') },
    ticketId,
    openTicket: (id, key) => { setTicketId(`${id}:${key}`); go('ticket') },

    events,
    addEvent: (e) => setEvents([...events, e]),
    setEventStatus: (id: string, status: EventStatus) => setEvents(events.map((e) => (e.id === id ? { ...e, status } : e))),
    regs,
    addReg: (r) => { if (!regs.some((x) => x.eventId === r.eventId && x.key === r.key)) setRegs([...regs, r]) },
    absen,
    addAbsen: (a) => setAbsen([...absen, a]),
    // Peserta only (Events/absen). Tab Anggota Sekretariat pakai `members` = pengurus
    people: [
      ...GUESTS,
      ...allAccounts.map((a) => ({ key: a.id, name: a.name, g: a.g, church: a.church, city: a.city, email: a.email, level: a.level })),
    ].map((p) => (levels[p.key] ? { ...p, level: levels[p.key] } : p)),

    members,
    addMember: (m) => setMembers([...members, m]),
    updateMember: (key, patch) => setMembers(members.map((m) => (m.key === key ? { ...m, ...patch } : m))),
    eventId,
    openEvent: (id) => { setEventId(id); go('k-event') },
    scanEventId,
    setScanEventId,
    openScan: (id) => { setScanEventId(id); go('k-scan') },
    reimburse,
    submitReimburse: (id, amount) => {
      const note = `Diajukan ${fmtShort(TODAY).replace(/ \d{4}$/, '')}`
      setReimburse(reimburse.some((r) => r.eventId === id)
        ? reimburse.map((r) => (r.eventId === id ? { ...r, amount, status: 'diajukan', note } : r))
        : [{ id: `rb-${Date.now()}`, eventId: id, amount, status: 'diajukan', note }, ...reimburse])
    },
    tickets,
    addTicket: (t) => setTickets([t, ...tickets]),
  }

  const nav = NO_NAV.includes(screen) ? null : screen.startsWith('k-') ? NAV_ALK : NAV_MEMBER

  return (
    <ProtoContext.Provider value={ctx}>
      <div className="flex-1 min-h-dvh bg-[#faf7f2] md:bg-[#efe8dc] md:flex md:items-center md:justify-center md:gap-12 md:py-6 font-[family-name:var(--font-proto)] text-slate-900">
        <ScreenIndex current={screen} go={go} />

        <div className="relative w-full max-w-[430px] mx-auto md:mx-0 h-dvh md:h-[880px] md:max-h-[calc(100dvh-48px)] bg-[#faf7f2] md:rounded-[46px] md:border-[11px] md:border-slate-900 md:shadow-[0_40px_80px_-20px_rgba(80,20,25,.45)] overflow-hidden flex flex-col">
          {/* Fake status bar (desktop mockup only) */}
          <div className={`hidden md:flex shrink-0 h-11 text-sm font-semibold items-center justify-between px-8 relative z-30 bg-[#d73640] text-white`}>
            <span>19:25</span>
            <span className="absolute left-1/2 -translate-x-1/2 top-2 w-6 h-6 rounded-full bg-slate-900" />
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" viewBox="0 0 20 14" fill="currentColor" aria-hidden="true"><rect x="0" y="9" width="3" height="5" rx="1" /><rect x="5" y="6" width="3" height="8" rx="1" /><rect x="10" y="3" width="3" height="11" rx="1" /><rect x="15" y="0" width="3" height="14" rx="1" /></svg>
              <svg className="w-6 h-3.5" viewBox="0 0 26 13" fill="none" stroke="currentColor" aria-hidden="true"><rect x=".5" y=".5" width="22" height="12" rx="3" /><rect x="2.5" y="2.5" width="18" height="8" rx="1.5" fill="currentColor" /><path d="M24.5 4.5v4" strokeLinecap="round" /></svg>
            </span>
          </div>

          <main ref={mainRef} className={`flex-1 flex flex-col overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${nav ? 'pb-[120px]' : screen === 'event' ? '' : 'pb-10'}`}>
            <div key={screen} className={`flex-1 flex flex-col ${SHOW}`}><Screen id={screen} /></div>
          </main>

          {nav && <BottomNav items={nav} screen={screen} go={go} />}

          {sheetNode && (
            <div className="absolute inset-0 z-40">
              <div className="absolute inset-0 bg-[#2a1416]/55" onClick={() => setSheetNode(null)} />
              <div role="dialog" className="absolute bottom-0 inset-x-0 max-h-[88%] overflow-y-auto bg-white rounded-t-[28px] px-5 pt-3 pb-[max(env(safe-area-inset-bottom),24px)] md:rounded-b-[35px] animate-[proto-up_.28s_cubic-bezier(.2,.8,.2,1)]">
                <div className="w-10 h-1.5 rounded-full bg-slate-200 mx-auto mb-4" />
                {sheetNode}
              </div>
            </div>
          )}

          {daily && screen === 'home' && <DailyWords onClose={() => setDaily(false)} />}

          {soonName && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-[#2a1416]/55" onClick={() => setSoonName(null)} />
              <div role="dialog" className="relative w-full max-w-[320px] bg-white rounded-3xl p-6 text-center shadow-2xl animate-[proto-pop_.25s_ease]">
                <span className="w-16 h-16 mx-auto rounded-2xl bg-[#f8f0dd] text-[#96792a] flex items-center justify-center"><Icon name="clock" className="w-8 h-8" /></span>
                <p className="font-extrabold text-[18px] text-[#3b1417] mt-4">Fitur belum tersedia</p>
                <p className="text-[13.5px] text-slate-500 mt-1.5 leading-relaxed"><b className="text-slate-700">{soonName}</b> sedang disiapkan dan akan hadir di pembaruan berikutnya.</p>
                <button onClick={() => setSoonName(null)} className="mt-5 w-full py-3 rounded-2xl bg-[#c9232c] text-white font-bold">Mengerti</button>
              </div>
            </div>
          )}

          {toastMsg && (
            <div key={toastMsg} role="status" className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-28 z-50 w-max max-w-[88%] px-4 py-2.5 rounded-2xl bg-[#2a1416] text-white text-[13px] font-medium text-center shadow-lg animate-[proto-pop_.2s_ease]">
              {toastMsg}
            </div>
          )}
        </div>
      </div>
    </ProtoContext.Provider>
  )
}

function BottomNav({ items, screen, go }: { items: NavItem[]; screen: ScreenId; go: (s: ScreenId) => void }) {
  return (
    <nav className="absolute bottom-0 inset-x-0 z-20 bg-white shadow-[0_-8px_30px_rgba(80,20,25,.08)] md:rounded-b-[35px] pb-[max(env(safe-area-inset-bottom),10px)]">
      <div className="grid grid-cols-5 h-[68px] px-1 text-[12px] font-medium">
        {items.map((it) => {
          const active = it.match.includes(screen)
          if (it.fab) {
            return (
              <button key={it.id} onClick={() => go(it.id)} className={`relative flex flex-col items-center justify-end pb-2.5 ${active ? 'text-[#c9232c] font-semibold' : 'text-slate-500'}`}>
                <span className="absolute -top-7 w-16 h-16 rounded-full bg-linear-to-b from-[#d93a43] to-[#a81c24] text-white flex items-center justify-center shadow-[0_8px_20px_-4px_rgba(201,35,44,.6)] ring-[6px] ring-white active:scale-95 transition">
                  <Icon name="scan" className="w-8 h-8" sw={2} />
                </span>
                {it.label}
              </button>
            )
          }
          return (
            <button
              key={it.id}
              onClick={() => go(it.id)}
              aria-current={active ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-1 transition ${active ? 'text-[#c9232c] font-semibold bg-linear-to-b from-[#fcebec] to-white/0' : 'text-slate-400'}`}
            >
              {active && <span className="absolute top-0 left-2 right-2 h-[3px] bg-[#c9232c] rounded-b" />}
              {it.icon}
              {it.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

// Desktop-only jump list so reviewers can open any screen directly
function ScreenIndex({ current, go }: { current: ScreenId; go: (s: ScreenId) => void }) {
  const groups = [['pwa', 'PWA Anggota'], ['alk', 'Sekretariat']] as const
  return (
    <aside className="hidden lg:block w-[250px] shrink-0">
      <div className="inline-flex rounded-2xl bg-[#b3202a] px-4 py-3 shadow-md"><Logo className="h-10 w-auto" /></div>
      <p className="mt-4 font-extrabold text-[22px] text-[#3b1417] leading-tight">Prototype Aplikasi</p>
      <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">PWA Anggota &amp; Sekretariat. Data dummy, jam prototype Jumat 23 Okt 2026 19:25 WIB.</p>
      {groups.map(([g, label]) => (
        <div key={g} className="mt-5">
          <p className="text-[11px] font-bold tracking-[.14em] text-[#96792a] uppercase mb-1.5 px-3">{label}</p>
          {SCREEN_LIST.filter((s) => s.group === g).map((s) => (
            <button
              key={s.id}
              onClick={() => go(s.id)}
              className={`block w-full text-left px-3 py-1.5 rounded-lg text-[13.5px] transition ${current === s.id ? 'bg-[#c9232c] text-white font-semibold' : 'text-slate-600 hover:bg-white/70'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      ))}
    </aside>
  )
}
