'use client'
import { useRouter } from 'next/navigation'
import { useMemo, useState, type ReactNode } from 'react'
import type { AlkBerandaStats, EventDashboard } from '@/lib/actions/event'
import { ANTON, LABEL, LIFTED, PANEL, PaperHeader, PaperMain, PRESS, ROWS, SectionHead, TAPE_RIGHT } from '@/components/pwa/paper-ui'
import { PAGE_SIZE_TODO, Pager, SearchBox } from './list-tools'
import {
  ALK_BASE,
  Icon,
  ModeSwitch,
  Row,
  SoonTag,
  TINT,
  Toast,
  type IconName,
  type Tint,
} from './ui'

const TILT = ['-rotate-1', 'rotate-1', '-rotate-[.5deg]', 'rotate-[.5deg]', '-rotate-1', 'rotate-1', '-rotate-[.5deg]']

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
  pendingPindahKota = 0,
  pendingTiketNasional = 0,
  events,
  isNasional = false,
}: {
  nama: string
  namaCabang: string
  stats: AlkBerandaStats
  saldo: number
  pendingApprovals: number
  pendingPindahKota?: number
  pendingTiketNasional?: number
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

  const tiles: [IconName, string, string | number, string?][] = [
    ['users', 'Total LevelUP Kota', stats.totalCabang],
    ['check', 'Total CORE', stats.pesertaCore],
    ['users', 'Squad', stats.pesertaSquad],
    ['userPlus', 'Volunteer', stats.pesertaVolunteer],
    ['calendar', 'Jumlah Event', eventCount],
    ['receipt', 'Saldo Kas', fmtRp(saldo), `${ALK_BASE}/kas`],
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
    if (isNasional && pendingPindahKota) {
      list.push({
        key: 'pindah-kota',
        i: 'pin',
        tint: 'amber',
        t: `${pendingPindahKota} pengajuan pindah LevelUP Kota`,
        s: 'Approve / Tolak · Sekretariat Nasional',
        href: `${ALK_BASE}/pindah-kota`,
      })
    }
    if (isNasional && pendingTiketNasional) {
      list.push({
        key: 'tiket-nasional',
        i: 'ticket',
        tint: 'red',
        t: `${pendingTiketNasional} pengajuan tiket event nasional`,
        s: 'Approve / Tolak · Sekretariat Nasional',
        href: `${ALK_BASE}/tiket-nasional`,
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
  }, [events, isNasional, namaCabang, pendingApprovals, pendingPindahKota, pendingTiketNasional])

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
    { i: 'receipt', t: 'Reimburse', tint: 'gold', href: `${ALK_BASE}/reimburse` },
    { i: 'box', t: 'Kas Kota', tint: 'red', href: `${ALK_BASE}/kas` },
    { i: 'shield', t: 'Set Role', tint: 'red', soon: 'Set Role' },
    { i: 'grid', t: 'Lainnya', tint: 'slate', href: `${ALK_BASE}/lainnya` },
  ]

  function flash(msg: string) {
    setSoon(msg)
    setTimeout(() => setSoon(null), 2200)
  }

  return (
    <PaperMain>
      <PaperHeader sticker={`Sekretariat · ${namaCabang}`} title={nama}>
        <div className="mt-4">
          <ModeSwitch
            alk
            onChange={(alk) => {
              if (!alk) router.push('/dashboard')
            }}
          />
        </div>
      </PaperHeader>

      <div className="px-5 mt-5 flex flex-col gap-7 pb-4">
        <section aria-label="Ringkasan" className={`relative grid grid-cols-2 ${PANEL}`}>
          <span aria-hidden className={TAPE_RIGHT} />
          {tiles.map(([i, l, v, href], idx) => (
            <div
              key={l}
              role={href ? 'link' : undefined}
              tabIndex={href ? 0 : undefined}
              onClick={href ? () => router.push(href) : undefined}
              onKeyDown={href ? (e) => e.key === 'Enter' && router.push(href) : undefined}
              className={`p-3.5 min-w-0 border-dotted border-[#161616]/20 ${idx % 2 === 0 ? 'border-r-2' : ''} ${idx < tiles.length - 2 ? 'border-b-2' : ''} ${href ? `cursor-pointer active:bg-[#161616]/5 ${PRESS}` : ''}`}
            >
              <div className={`${LABEL} flex items-center gap-1.5 text-[9px] text-[#57534e]`}>
                <span className="shrink-0 text-[#c21f24]">
                  <Icon name={i} className="w-3.5 h-3.5" sw={2.2} />
                </span>
                <span className="min-w-0">{l}</span>
                {href && <Icon name="chevron" className="w-3.5 h-3.5 ml-auto shrink-0 text-[#161616]" sw={2.2} />}
              </div>
              <div className="flex items-end justify-between gap-2 mt-2">
                <p className={`${ANTON} ${typeof v === 'string' && v.length > 8 ? 'text-[24px]' : 'text-[36px]'} leading-none text-[#161616] truncate`}>{v}</p>
                {idx === 1 && <span className="text-[11px] font-bold text-[#c21f24]">{pct}%</span>}
              </div>
              {idx === 1 && (
                <div className="mt-2 h-2.5 rounded-full border-2 border-[#161616] overflow-hidden">
                  <div className="h-full bg-[#e02a2f]" style={{ width: `${pct}%` }} />
                </div>
              )}
            </div>
          ))}
        </section>

        <div>
          <SectionHead title="Perlu Tindakan" />
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
          <div className={`${PANEL} ${ROWS} overflow-hidden`}>
            {pagedTodos.length === 0 ? (
              <p className={`${LABEL} px-4 py-8 text-center text-[11px] text-[#57534e]`}>Tidak ada yang cocok</p>
            ) : (
              pagedTodos.map((t) => (
                <Row
                  key={t.key}
                  icon={t.i}
                  tint={t.tint}
                  title={t.t}
                  sub={t.s}
                  right={t.soon ? <SoonTag /> : undefined}
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
          <SectionHead title="Menu Sekretariat" />
          <div className="grid grid-cols-3 gap-2.5">
            {menu.map((x, idx) => (
              <button
                key={x.t}
                type="button"
                onClick={() => {
                  if (x.soon) flash(x.soon)
                  else if (x.href) router.push(x.href)
                }}
                className={`relative h-[104px] rounded-[14px] flex flex-col items-center justify-center gap-2 text-[#161616] ${TILT[idx % TILT.length]} ${PRESS} ${
                  x.soon ? 'border-2 border-dotted border-[#161616]/30' : `bg-[#fffdf7] ${LIFTED}`
                }`}
              >
                <span className={`relative w-11 h-11 rounded-[10px] -rotate-3 flex items-center justify-center ${x.soon ? TINT.slate : TINT[x.tint]}`}>
                  <Icon name={x.i} className="w-[22px] h-[22px]" />
                  {!!x.badge && (
                    <span className={`${ANTON} absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-[#161616] text-[#ffd83d] text-[11px] flex items-center justify-center`}>{x.badge}</span>
                  )}
                </span>
                <span className={`${ANTON} text-[14px] leading-none tracking-[.02em] text-center px-1`}>{x.t}</span>
                {x.soon && (
                  <span className="absolute right-1.5 top-1.5">
                    <SoonTag />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
      <Toast msg={soon ? `Fitur belum tersedia: ${soon}` : null} />
    </PaperMain>
  )
}

function fmtRp(n: number) {
  if (!Number.isFinite(n)) return '—'
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}jt`
  if (n >= 1_000) return `Rp ${Math.round(n / 1_000)}rb`
  return `Rp ${n.toLocaleString('id-ID')}`
}
