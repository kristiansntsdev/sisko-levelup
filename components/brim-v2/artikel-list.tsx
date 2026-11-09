'use client'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { ArtikelAdminRow } from '@/lib/artikel-data'
import { formatTanggalArtikel } from '@/lib/artikel'
import { ANTON, BTN_SHELL, LABEL, MONO, PANEL, PaperHeader, PaperMain, Poster, PRESS, Strip } from '@/components/pwa/paper-ui'
import { PAGE_SIZE_EVENT, Pager, SearchBox } from '@/components/alk-v2/list-tools'
import { Empty, Icon, Pill, StatTriple } from '@/components/alk-v2/ui'
import { BRIM_ARTIKEL_BASE } from './paths'

type Filter = 'all' | 'published' | 'draft'
const TABS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'published', label: 'Terbit' },
  { key: 'draft', label: 'Draft' },
]

function Item({ a }: { a: ArtikelAdminRow }) {
  return (
    <Link href={`${BRIM_ARTIKEL_BASE}/${a.id}`} className={`w-full p-3 flex items-center gap-3 text-left ${PANEL} ${PRESS}`}>
      <div className="w-[64px] h-[64px] shrink-0 overflow-hidden rounded-[8px] bg-[#d6d0c4] -rotate-2">
        {a.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={a.coverUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <Poster src="" className="w-full h-full" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`${ANTON} text-[17px] leading-[1.15] tracking-[.01em] line-clamp-2`}>{a.judul}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <Pill tone={a.status === 'published' ? 'green' : 'amber'}>{a.status === 'published' ? 'Terbit' : 'Draft'}</Pill>
          <span className={`${MONO} text-[11px] text-[#44403c]`}>
            {formatTanggalArtikel(a.publishedAt ?? a.createdAt)}
          </span>
        </div>
        <p className={`${MONO} mt-1.5 flex items-center gap-3 text-[11.5px] font-bold text-[#161616]`}>
          <span className="inline-flex items-center gap-1"><Icon name="eye" className="w-3.5 h-3.5" sw={2} />{a.viewsTotal.toLocaleString('id-ID')}</span>
          <span className="inline-flex items-center gap-1"><Icon name="sparkle" className="w-3.5 h-3.5 text-[#e02a2f]" sw={2} />{a.likes}</span>
          <span className="inline-flex items-center gap-1"><Icon name="chat" className="w-3.5 h-3.5" sw={2} />{a.komentarSemua}</span>
        </p>
      </div>
    </Link>
  )
}

export function ArtikelListClient({ artikel }: { artikel: ArtikelAdminRow[] }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)

  const terbit = artikel.filter((a) => a.status === 'published').length
  const views30 = artikel.reduce((s, a) => s + a.views30, 0)

  const needle = q.trim().toLowerCase()
  const filtered = useMemo(
    () =>
      artikel.filter(
        (a) =>
          (filter === 'all' || a.status === filter) &&
          (!needle || `${a.judul} ${a.ringkasan}`.toLowerCase().includes(needle)),
      ),
    [artikel, filter, needle],
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE_EVENT))
  const safePage = Math.min(page, totalPages - 1)
  const paged = filtered.slice(safePage * PAGE_SIZE_EVENT, (safePage + 1) * PAGE_SIZE_EVENT)

  return (
    <PaperMain>
      <PaperHeader
        sticker="BRIM Nasional"
        title="Artikel"
        action={
          <Link href={`${BRIM_ARTIKEL_BASE}/baru`} className={`shrink-0 rotate-2 ${BTN_SHELL}`}>
            <Strip className="px-4 py-2 text-[14px]">+ Tulis</Strip>
          </Link>
        }
      />
      <div className="px-5 mt-4 space-y-3 pb-4">
        <StatTriple
          items={[
            [terbit, 'Terbit', 'text-[#e02a2f]'],
            [artikel.length - terbit, 'Draft', 'text-[#161616]'],
            [views30.toLocaleString('id-ID'), 'Views 30 hr', 'text-[#161616]'],
          ]}
        />
        <SearchBox
          value={q}
          onChange={(v) => {
            setQ(v)
            setPage(0)
          }}
          placeholder="Cari judul artikel…"
        />
        <div className="flex gap-2">
          {TABS.map((t) => {
            const on = t.key === filter
            return (
              <button
                key={t.key}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  setFilter(t.key)
                  setPage(0)
                }}
                className={`${LABEL} h-9 px-3.5 rounded-full text-[10.5px] font-bold ${PRESS} ${on ? 'bg-[#161616] text-[#ffd83d]' : 'bg-[#fffdf7] text-[#161616]'}`}
              >
                {t.label}
              </button>
            )
          })}
        </div>
        {paged.length === 0 ? (
          <Empty>{artikel.length === 0 ? 'Belum ada artikel. Tulis yang pertama!' : 'Tidak ada artikel yang cocok.'}</Empty>
        ) : (
          <div className="space-y-2.5">
            {paged.map((a) => (
              <Item key={a.id} a={a} />
            ))}
          </div>
        )}
        <Pager page={safePage} totalPages={totalPages} onChange={setPage} />
      </div>
    </PaperMain>
  )
}
