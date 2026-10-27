'use client'
import { useRouter } from 'next/navigation'
import { useMemo, useState, type ReactNode } from 'react'
import type { AlkBerandaStats, EventDashboard } from '@/lib/actions/event'
import { PAGE_SIZE_TODO, Pager, SearchBox } from './list-tools'
import {
  ALK_BASE,
  Avatar,
  CARD,
  H3,
  Hero,
  Icon,
  ModeSwitch,
  Row,
  Toast,
  fCard,
  type IconName,
  type Tint,
} from './ui'

type Todo = {
  i: IconName
  tint: Tint
  t: string
  s: ReactNode
  search?: string
  href?: string
  soon?: string
  key: string
}

export function BerandaClient({
  nama,
  namaCabang,
  stats,
  saldo,
  pendingApprovals,
  events,
  isNasional = false,
}: {
  nama: string
  namaCabang: string
  stats: AlkBerandaStats
  saldo: number
  pendingApprovals: number
  events: EventDashboard[]
  isNasional?: boolean
}) {
  const router = useRouter()
  const [soon, setSoon] = useState<string | null>(null)
  const [todoQ, setTodoQ] = useState('')
  const [todoPage, setTodoPage] = useState(0)
  const totalPeserta = stats.pesertaVolunteer + stats.pesertaSquad + stats.pesertaCore
  const eventCount = stats.eventOffline + stats.eventOnline
  const pct = totalPeserta ? Math.round((stats.pesertaCore / totalPeserta) * 100) : 0

  const tiles: [IconName, string, string | number][] = [
    ['users', 'Total LevelUP Kota', stats.totalCabang],
    ['check', 'Total CORE', stats.pesertaCore],
    ['users', 'Squad', stats.pesertaSquad],
    ['userPlus', 'Volunteer', stats.pesertaVolunteer],
    ['calendar', 'Jumlah Event', eventCount],
    ['receipt', 'Saldo Kas', fmtRp(saldo)],
  ]

  const todos: Todo[] = useMemo(() => {
    const list: Todo[] = []
    if (pendingApprovals) {
      list.push({
        key: 'squad',
        i: 'userPlus',
        tint: 'gold',
        t: `${pendingApprovals} pengajuan Squad menunggu approval`,
        s: `Approval Member · ${namaCabang}`,
        href: `${ALK_BASE}/approval`,
      })
    }
    for (const e of events) {
      if (e.approvenasional === '0' && e.notenasional) {
        list.push({
          key: `rej-${e.id_event}`,
          i: 'alert',
          tint: 'rose',
          t: `${e.nama_event} ditolak pusat`,
          s: isNasional ? 'Lihat alasan penolakan' : 'Lihat alasan & ajukan ulang',
          href: isNasional
            ? `${ALK_BASE}/event/${e.id_event}/approve`
            : `${ALK_BASE}/event/${e.id_event}`,
        })
      } else if (e.approvenasional !== '1' && !e.notenasional) {
        list.push({
          key: `rev-${e.id_event}`,
          i: 'calendar',
          tint: 'amber',
          t: isNasional
            ? `${e.nama_event} menunggu approval`
            : `${e.nama_event} sedang direview`,
          s: isNasional ? (
            <>
              {e.tglDisplay}
              <br />
              Approve / Reject
            </>
          ) : (
            e.tglDisplay
          ),
          search: `${e.tglDisplay} Approve Reject`,
          href: isNasional
            ? `${ALK_BASE}/event/${e.id_event}/approve`
            : `${ALK_BASE}/event/${e.id_event}`,
        })
      }
    }
    list.push({
      key: 'set-role',
      i: 'shield',
      tint: 'gold',
      t: 'Pengajuan Set Role',
      s: 'Fitur segera tersedia',
      soon: 'Set Role',
    })
    return list
  }, [events, isNasional, namaCabang, pendingApprovals])

  const filteredTodos = useMemo(() => {
    const needle = todoQ.trim().toLowerCase()
    if (!needle) return todos
    return todos.filter((t) =>
      `${t.t} ${t.search ?? (typeof t.s === 'string' ? t.s : '')}`.toLowerCase().includes(needle),
    )
  }, [todos, todoQ])

  const todoPages = Math.max(1, Math.ceil(filteredTodos.length / PAGE_SIZE_TODO))
  const pagedTodos = filteredTodos.slice(todoPage * PAGE_SIZE_TODO, (todoPage + 1) * PAGE_SIZE_TODO)

  const menu: { i: IconName; t: string; tint: Tint; href?: string; soon?: string; badge?: number }[] = [
    { i: 'qr', t: 'Scan Absensi', tint: 'red', href: `${ALK_BASE}/scanner` },
    { i: 'userPlus', t: 'Tambah Pengurus', tint: 'gold', href: `${ALK_BASE}/anggota/baru` },
    { i: 'users', t: 'Approval Member', tint: 'red', href: `${ALK_BASE}/approval`, badge: pendingApprovals || undefined },
    { i: 'calPlus', t: 'Buat Event', tint: 'red', href: `${ALK_BASE}/event/new` },
    { i: 'receipt', t: 'Reimburse', tint: 'gold', soon: 'Reimburse' },
    { i: 'shield', t: 'Set Role', tint: 'red', soon: 'Set Role' },
    { i: 'grid', t: 'Lainnya', tint: 'slate', href: `${ALK_BASE}/lainnya` },
  ]

  function flash(msg: string) {
    setSoon(msg)
    setTimeout(() => setSoon(null), 2200)
  }

  return (
    <section>
      <Hero className="pt-5 md:pt-3 pb-28 rounded-b-[32px]" decor="-right-6 top-28 w-44">
        <div className="mb-4">
          <ModeSwitch
            alk
            onChange={(alk) => {
              if (!alk) router.push('/dashboard')
            }}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-12 h-12 shrink-0 rounded-full overflow-hidden ring-2 ring-[#e6cd7e]">
              <Avatar g="L" />
            </span>
            <div className="leading-tight min-w-0">
              <p className="text-[13px] text-white/80">Sekretariat · {namaCabang}</p>
              <p className="font-bold text-[17px] truncate">{nama}</p>
            </div>
          </div>
        </div>
      </Hero>

      <div className="px-5 -mt-20 relative">
        <div className="bg-white rounded-3xl shadow-[0_18px_40px_-14px_rgba(80,20,25,.3)] p-2.5 grid grid-cols-2 gap-2">
          {tiles.map(([i, l, v], idx) => (
            <div key={l} className="rounded-2xl bg-[#faf7f2] p-3.5">
              <div className="flex items-center gap-1.5 text-[12px] text-slate-500 font-medium">
                <span className="text-[#c9232c]">
                  <Icon name={i} className="w-4 h-4" sw={2} />
                </span>
                {l}
              </div>
              <div className="flex items-end justify-between mt-1.5">
                <p className={`${fCard} font-bold ${typeof v === 'string' && v.length > 8 ? 'text-[18px]' : 'text-[30px]'} leading-none text-[#3b1417] truncate`}>
                  {v}
                </p>
                {idx === 1 && <span className="text-[11px] font-bold text-emerald-700">{pct}%</span>}
              </div>
              {idx === 1 && (
                <div className="mt-2 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 mt-5 space-y-7 pb-4">
        <div>
          <h3 className={`${H3} mb-3`}>Perlu Tindakan</h3>
          <div className="mb-3">
            <SearchBox
              value={todoQ}
              onChange={(v) => {
                setTodoQ(v)
                setTodoPage(0)
              }}
              placeholder="Cari pengajuan / event..."
            />
          </div>
          <div className={`${CARD} divide-y divide-slate-100 overflow-hidden`}>
            {pagedTodos.length === 0 ? (
              <p className="px-4 py-8 text-center text-[13px] text-slate-400">Tidak ada yang cocok</p>
            ) : (
              pagedTodos.map((t) => (
                <Row
                  key={t.key}
                  icon={t.i}
                  tint={t.tint}
                  title={t.t}
                  sub={t.s}
                  onClick={() => {
                    if (t.soon) flash(t.soon)
                    else if (t.href) router.push(t.href)
                  }}
                />
              ))
            )}
          </div>
          <Pager page={todoPage} totalPages={todoPages} onChange={setTodoPage} />
        </div>
        <div>
          <h3 className={`${H3} mb-4`}>Menu Sekretariat</h3>
          <div className="grid grid-cols-4 gap-y-5 gap-x-2">
            {menu.map((x) => (
              <button
                key={x.t}
                type="button"
                onClick={() => {
                  if (x.soon) flash(x.soon)
                  else if (x.href) router.push(x.href)
                }}
                className="flex flex-col items-center gap-2 active:scale-95 transition"
              >
                <span
                  className={`relative w-[58px] h-[58px] rounded-[18px] flex items-center justify-center ${
                    x.tint === 'red'
                      ? 'text-[#c9232c] bg-[#fbeceb] ring-1 ring-[#f3d3d3]'
                      : x.tint === 'gold'
                        ? 'text-[#96792a] bg-[#f8f0dd] ring-1 ring-[#ecdcb3]'
                        : 'text-stone-600 bg-stone-100 ring-1 ring-stone-200/70'
                  }`}
                >
                  <span className={x.soon ? 'opacity-50' : ''}>
                    <Icon name={x.i} className="w-7 h-7" />
                  </span>
                  {x.soon && (
                    <span className="absolute -top-1.5 -right-2.5 text-[9px] font-bold tracking-wide bg-[#3b1417] text-[#f1dc9a] px-1.5 py-0.5 rounded-full">
                      Segera
                    </span>
                  )}
                  {!!x.badge && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-[#c9232c] text-white text-[10.5px] font-bold flex items-center justify-center ring-2 ring-[#faf7f2]">
                      {x.badge}
                    </span>
                  )}
                </span>
                <span className="text-[12px] text-slate-700 font-medium leading-tight text-center">{x.t}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <Toast msg={soon ? `Fitur belum tersedia: ${soon}` : null} />
    </section>
  )
}

function fmtRp(n: number) {
  if (!Number.isFinite(n)) return '—'
  if (n >= 1_000_000) return `Rp${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}jt`
  if (n >= 1_000) return `Rp${Math.round(n / 1_000)}rb`
  return `Rp${n.toLocaleString('id-ID')}`
}
