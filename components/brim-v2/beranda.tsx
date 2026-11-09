'use client'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import type { EventDashboard } from '@/lib/actions/event'
import type { BrimArtikelStats } from '@/lib/artikel-data'
import { hasBrimRejectNote } from '@/lib/event-approval'
import { ANTON, LABEL, LIFTED, MONO, PANEL, PaperHeader, PaperMain, PRESS, ROWS, SectionHead } from '@/components/pwa/paper-ui'
import { PAGE_SIZE_TODO, Pager, SearchBox } from '@/components/alk-v2/list-tools'
import { Empty, Icon, Row, TINT, type IconName, type Tint } from '@/components/alk-v2/ui'
import { BRIM_ARTIKEL_BASE, BRIM_EVENT_BASE, BRIM_LEGACY } from './paths'

const TILT = ['-rotate-1', 'rotate-1', '-rotate-[.5deg]', 'rotate-[.5deg]', '-rotate-1', 'rotate-1']

type Menu = { i: IconName; tint: Tint; t: string; href: string; badge?: number }

export function BerandaClient({
  nama,
  events,
  artikel,
}: {
  nama: string
  events: EventDashboard[]
  artikel: BrimArtikelStats
}) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)

  const { pending, rejected } = useMemo(() => {
    const open = events.filter((e) => e.approvebrimnas !== '1')
    return {
      pending: open.filter((e) => !hasBrimRejectNote(e.notenasional)).sort((a, b) => b.tglMs - a.tglMs),
      rejected: open.filter((e) => hasBrimRejectNote(e.notenasional)).length,
    }
  }, [events])

  const needle = q.trim().toLowerCase()
  const shown = needle
    ? pending.filter((e) => `${e.nama_event} ${e.tglDisplay} ${e.cabangName} ${e.id_event}`.toLowerCase().includes(needle))
    : pending
  const totalPages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE_TODO))
  const safePage = Math.min(page, totalPages - 1)
  const paged = shown.slice(safePage * PAGE_SIZE_TODO, (safePage + 1) * PAGE_SIZE_TODO)

  const tiles: [IconName, string, number | string, string?][] = [
    ['calendar', 'Belum Approve', pending.length, BRIM_EVENT_BASE],
    ['alert', 'Ditolak Brim', rejected, BRIM_EVENT_BASE],
    ['megaphone', 'Artikel Terbit', artikel.terbit, BRIM_ARTIKEL_BASE],
    ['eye', 'Views 7 Hari', artikel.views7.toLocaleString('id-ID'), BRIM_ARTIKEL_BASE],
    ['sparkle', 'Total Like', artikel.likes.toLocaleString('id-ID'), BRIM_ARTIKEL_BASE],
    ['chat', 'Komentar 7 Hari', artikel.komentar7.toLocaleString('id-ID'), BRIM_ARTIKEL_BASE],
  ]

  const menu: Menu[] = [
    { i: 'check', tint: 'red', t: 'Approval Event', href: BRIM_EVENT_BASE, badge: pending.length },
    { i: 'megaphone', tint: 'gold', t: 'Artikel', href: BRIM_ARTIKEL_BASE },
    { i: 'edit', tint: 'sky', t: 'Tulis Artikel', href: `${BRIM_ARTIKEL_BASE}/baru` },
    { i: 'image', tint: 'gold', t: 'Flyer Generator', href: `${BRIM_LEGACY}/pamflet` },
    { i: 'image', tint: 'red', t: 'Flyer WW JFE', href: `${BRIM_LEGACY}/wfe-flyer` },
    { i: 'link', tint: 'slate', t: 'Dokumentasi', href: `${BRIM_LEGACY}/dokumentasi` },
  ]

  return (
    <PaperMain>
      <PaperHeader sticker={`BRIM Nasional · ${nama}`} title="Beranda" />
      <div className="px-5 mt-5 space-y-6 pb-4">
        <section aria-label="Ringkasan" className="grid grid-cols-2 gap-2.5">
          {tiles.map(([i, l, v, href], idx) => (
            <button
              key={l}
              type="button"
              onClick={() => href && router.push(href)}
              className={`relative text-left p-3.5 ${PANEL} ${TILT[idx % TILT.length]} ${PRESS}`}
            >
              <div className={`${LABEL} flex items-center gap-1.5 text-[9px] text-[#57534e]`}>
                <span className="shrink-0 text-[#c21f24]">
                  <Icon name={i} className="w-3.5 h-3.5" sw={2.2} />
                </span>
                <span className="min-w-0">{l}</span>
              </div>
              <p className={`${ANTON} mt-2 text-[36px] leading-none text-[#161616] truncate`}>{v}</p>
            </button>
          ))}
        </section>

        <div>
          <SectionHead title="Perlu Approve" count={pending.length} />
          <div className="mb-3">
            <SearchBox
              value={q}
              onChange={(v) => {
                setQ(v)
                setPage(0)
              }}
              placeholder="Cari event…"
            />
          </div>
          {paged.length === 0 ? (
            <Empty>{needle ? 'Tidak ada yang cocok.' : 'Semua event sudah diproses. 🎉'}</Empty>
          ) : (
            <div className={`${PANEL} ${ROWS} overflow-hidden`}>
              {paged.map((e) => (
                <Row
                  key={e.id_event}
                  icon="calendar"
                  tint="amber"
                  title={e.nama_event}
                  sub={
                    <>
                      {e.tglDisplay}
                      <br />
                      {e.cabangName || 'Nasional'} · Approve / Reject
                    </>
                  }
                  onClick={() => router.push(`${BRIM_EVENT_BASE}/${e.id_event}`)}
                />
              ))}
            </div>
          )}
          <Pager page={safePage} totalPages={totalPages} onChange={setPage} />
        </div>

        {artikel.top.length > 0 && (
          <div>
            <SectionHead title="Artikel Terpopuler" />
            <div className={`${PANEL} ${ROWS} overflow-hidden`}>
              {artikel.top.map((a) => (
                <Row
                  key={a.id}
                  icon="eye"
                  tint="gold"
                  title={a.judul}
                  sub={`${a.views30.toLocaleString('id-ID')} views · 30 hari`}
                  onClick={() => router.push(`${BRIM_ARTIKEL_BASE}/${a.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        <div>
          <SectionHead title="Menu BRIM" />
          <div className="grid grid-cols-3 gap-2.5">
            {menu.map((x, idx) => (
              <button
                key={x.t}
                type="button"
                onClick={() => router.push(x.href)}
                className={`relative h-[104px] rounded-[14px] flex flex-col items-center justify-center gap-2 bg-[#fffdf7] text-[#161616] ${LIFTED} ${TILT[idx % TILT.length]} ${PRESS}`}
              >
                <span className={`relative w-11 h-11 rounded-[10px] -rotate-3 flex items-center justify-center ${TINT[x.tint]}`}>
                  <Icon name={x.i} className="w-[22px] h-[22px]" />
                  {!!x.badge && (
                    <span className={`${ANTON} absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-[#161616] text-[#ffd83d] text-[11px] flex items-center justify-center`}>{x.badge}</span>
                  )}
                </span>
                <span className={`${ANTON} text-[14px] leading-none tracking-[.02em] text-center px-1`}>{x.t}</span>
              </button>
            ))}
          </div>
          <p className={`${MONO} mt-3 text-[11px] text-[#57534e]`}>Flyer Generator, Flyer WW JFE &amp; Dokumentasi membuka dashboard BRIM lama.</p>
        </div>
      </div>
    </PaperMain>
  )
}
