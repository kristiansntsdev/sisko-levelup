/* eslint-disable */
// GENERATED from components/alk-v2/kas.tsx by scripts/gen-demo-preview.mjs — do not edit; change the source or the generator and re-run.
'use client'
import { useRouter } from 'next/navigation'
import { useMemo, useRef, useState, useTransition } from 'react'
import { addTxnKota, deleteTxnKota, updateTxnKota, type KasKotaData, type TxnKotaItem } from '@/components/demo-preview/shim/actions/kas-kota'
import type { EventDashboard } from '@/components/demo-preview/shim/actions/event'
import { kasCatatan, kasEventId } from '@/lib/kas-event'
import { wibToday } from '@/lib/wib'
import { RupiahInput } from '@/components/ui/rupiah-input'
import {
  ANTON,
  BTN,
  BTN_OUTLINE,
  BTN_SHELL,
  ERROR,
  IconButton,
  LABEL,
  MONO,
  PANEL,
  PaperHeader,
  PaperMain,
  PRESS,
  ROWS,
  SectionHead,
  Strip,
  TAPE_RIGHT,
} from '@/components/pwa/paper-ui'
import { PAGE_SIZE_EVENT, Pager, SearchBox } from './list-tools'
import { ALK_BASE, DateBlock, Empty, Field, FieldGroup, FLD, Note, Seg, Sheet, SheetHead, Toast } from './ui'

type Tipe = TxnKotaItem['tipe']
type Kategori = TxnKotaItem['kategori']
type Filter = 'semua' | Kategori

const FILTERS: [Filter, string][] = [
  ['semua', 'Semua'],
  ['harian', 'Harian'],
  ['event', 'Event'],
]

const RED_TEXT = 'text-[#c21f24]'
const RP_WRAP =
  'flex items-center gap-2 rounded-[10px] bg-[#efe8da]/50 ring-1 ring-[#161616]/15 px-3.5 py-3 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-[#161616]'
const RP_INPUT =
  'flex-1 min-w-0 bg-transparent outline-none text-[16px] text-[#161616] font-[family-name:var(--font-proto)] placeholder:text-[#57534e]/75'
const RP_PREFIX = `${MONO} shrink-0 text-[15px] font-bold text-[#57534e]`
const KET_MAX = 300

/** Anton has no usable +/− glyphs at chip size, so the sign is drawn. */
function SignIcon({ minus, className }: { minus: boolean; className: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" className={className}>
      {!minus && <path d="M12 5v14" />}
      <path d="M5 12h14" />
    </svg>
  )
}

function rp(n: number) {
  const s = `Rp ${Math.round(Math.abs(n)).toLocaleString('id-ID')}`
  return n < 0 ? `−${s}` : s
}

/** Kolom tanggal kas = tanggal kalender WIB disimpan sebagai UTC midnight. */
function fmtTgl(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

/** Angka tanpa "Rp" untuk kolom sempit; label kolom sudah menyebut Masuk/Keluar/Selisih. */
function num(n: number) {
  const s = Math.round(Math.abs(n)).toLocaleString('id-ID')
  return n < 0 ? `−${s}` : s
}

const tglShort = (e: EventDashboard) => e.tglDisplay.replace(/^[^,]+,\s*/, '')

function eventLabel(e: EventDashboard) {
  return `${e.nama_event} (${tglShort(e)})`
}

type EventRecap = { e: EventDashboard; masuk: number; keluar: number; n: number }

type Draft = {
  id?: number
  tipe: Tipe
  kategori: Kategori
  jumlah: string
  eventId: string
  ket: string
  tanggal: string
}

export function KasV2Client({
  kas,
  events,
  namaCabang,
  exportHref,
}: {
  kas: KasKotaData
  events: EventDashboard[]
  namaCabang: string
  /** Route Excel; tidak diisi di demo supaya demo tidak pernah memanggil API asli. */
  exportHref?: string
}) {
  const router = useRouter()
  const txns = kas.txns
  // Transaksi → id_event (kolom id_event, atau nama event untuk baris lama; lihat lib/kas-event.ts)
  const eventOf = useMemo(() => new Map(txns.map((t) => [t.id_txn, kasEventId(t, events)])), [txns, events])
  // Event yang punya transaksi kas, urut tanggal event terbaru (urutan `events`)
  const perEvent = useMemo<EventRecap[]>(() => {
    const acc = new Map<number, { masuk: number; keluar: number; n: number }>()
    for (const t of txns) {
      const id = eventOf.get(t.id_txn)
      if (id == null) continue
      const a = acc.get(id) ?? { masuk: 0, keluar: 0, n: 0 }
      if (t.tipe === 'masuk') a.masuk += t.jumlah
      else a.keluar += t.jumlah
      a.n++
      acc.set(id, a)
    }
    return events.flatMap((e) => {
      const a = acc.get(e.id_event)
      return a ? [{ e, ...a }] : []
    })
  }, [txns, events, eventOf])

  const [filter, setFilter] = useState<Filter>('semua')
  const [eventId, setEventId] = useState(() => {
    const first = perEvent[0]?.e ?? events[0]
    return first ? String(first.id_event) : ''
  })
  const [showAllEvents, setShowAllEvents] = useState(false)
  const riwayatRef = useRef<HTMLDivElement>(null)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const masuk = useMemo(() => txns.filter((t) => t.tipe === 'masuk').reduce((s, t) => s + t.jumlah, 0), [txns])
  const keluar = useMemo(() => txns.filter((t) => t.tipe === 'keluar').reduce((s, t) => s + t.jumlah, 0), [txns])
  const selectedEvent = events.find((e) => String(e.id_event) === eventId)
  const selectedRecap = perEvent.find((x) => String(x.e.id_event) === eventId)

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return txns.filter((t) => {
      if (filter === 'harian' && t.kategori !== 'harian') return false
      if (filter === 'event' && (eventId ? eventOf.get(t.id_txn) !== Number(eventId) : t.kategori !== 'event')) return false
      return !needle || t.keterangan.toLowerCase().includes(needle)
    })
  }, [txns, filter, eventId, eventOf, q])
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE_EVENT))
  const current = Math.min(page, pages - 1)
  const shown = rows.slice(current * PAGE_SIZE_EVENT, (current + 1) * PAGE_SIZE_EVENT)

  const saldoText = rp(kas.saldo)

  function openNew(tipe: Tipe) {
    setDraft({
      tipe,
      kategori: filter === 'event' && eventId ? 'event' : 'harian',
      jumlah: '',
      eventId: eventId || (events[0] ? String(events[0].id_event) : ''),
      ket: '',
      tanggal: wibToday().toISOString().slice(0, 10),
    })
  }

  function openEdit(t: TxnKotaItem) {
    const ev = t.kategori === 'event' ? events.find((e) => e.id_event === eventOf.get(t.id_txn)) : undefined
    setDraft({
      id: t.id_txn,
      tipe: t.tipe,
      kategori: t.kategori,
      jumlah: String(Math.round(t.jumlah)),
      eventId: ev ? String(ev.id_event) : '',
      ket: t.kategori === 'event' ? kasCatatan(t.keterangan, ev?.nama_event) : t.keterangan,
      tanggal: t.tanggal.slice(0, 10),
    })
  }

  function openEvent(id: number) {
    setFilter('event')
    setEventId(String(id))
    setQ('')
    setPage(0)
    requestAnimationFrame(() => riwayatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  function done(msg: string) {
    setDraft(null)
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
    router.refresh()
  }

  const exportUrl = exportHref ? `${exportHref}${filter === 'event' && eventId ? `?eventId=${eventId}` : ''}` : null

  return (
    <PaperMain>
      <PaperHeader
        sticker={`Sekretariat · ${namaCabang}`}
        title="Kas Kota"
        leading={<IconButton icon="chevronLeft" label="Kembali" onClick={() => router.push(ALK_BASE)} className="-rotate-3" />}
      />
      <div className="px-5 mt-5 space-y-6 pb-4">
        <section aria-label="Saldo kas" className={`relative px-4 pt-4 pb-4 ${PANEL}`}>
          <span aria-hidden className={TAPE_RIGHT} />
          <p className={`${LABEL} text-[10px] text-[#57534e]`}>Saldo Kas</p>
          <p className={`${ANTON} mt-1.5 leading-none truncate ${saldoText.length > 15 ? 'text-[32px]' : 'text-[42px]'} ${kas.saldo < 0 ? RED_TEXT : 'text-[#161616]'}`}>
            {saldoText}
          </p>
          <div className="mt-4 pt-3 grid grid-cols-2 divide-x-2 divide-dotted divide-[#161616]/20 border-t-2 border-dotted border-[#161616]/20">
            <div className="pr-3 min-w-0">
              <p className={`${LABEL} text-[9px] text-[#57534e]`}>Pemasukan</p>
              <p className={`${MONO} mt-1 truncate text-[13px] font-bold`}>+{rp(masuk)}</p>
            </div>
            <div className="pl-3 min-w-0">
              <p className={`${LABEL} text-[9px] text-[#57534e]`}>Pengeluaran</p>
              <p className={`${MONO} mt-1 truncate text-[13px] font-bold ${RED_TEXT}`}>−{rp(keluar)}</p>
            </div>
          </div>
        </section>

        <div className="flex gap-2.5">
          <button type="button" onClick={() => openNew('masuk')} className={`flex-1 min-w-0 ${BTN_SHELL}`}>
            <Strip tone="ink" className="py-2.5 text-[16px]">
              <SignIcon minus={false} className="w-4 h-4" />
              Pemasukan
            </Strip>
          </button>
          <button
            type="button"
            onClick={() => openNew('keluar')}
            className={`${ANTON} flex-1 min-w-0 flex items-center justify-center gap-2 py-2.5 rounded-sm ring-2 ring-inset ring-[#c21f24] text-[16px] tracking-[.03em] ${RED_TEXT} ${PRESS}`}
          >
            <SignIcon minus className="w-4 h-4" />
            Pengeluaran
          </button>
        </div>

        {perEvent.length > 0 && (
          <div>
            <SectionHead title="Per Event" count={perEvent.length} />
            <div className={`${PANEL} ${ROWS} overflow-hidden`}>
              {(showAllEvents ? perEvent : perEvent.slice(0, 3)).map((x) => (
                <EventRecapRow key={x.e.id_event} recap={x} onClick={() => openEvent(x.e.id_event)} />
              ))}
            </div>
            {perEvent.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllEvents((v) => !v)}
                className={`${LABEL} mt-3 text-[11px] font-bold text-[#161616] underline underline-offset-4 decoration-dotted`}
              >
                {showAllEvents ? 'Tampilkan 3 saja' : `Lihat semua event (${perEvent.length})`}
              </button>
            )}
          </div>
        )}

        <div ref={riwayatRef} className="scroll-mt-4">
          <SectionHead title="Riwayat" count={rows.length} />
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
            {FILTERS.map(([v, label]) => (
              <button
                key={v}
                type="button"
                aria-pressed={filter === v}
                onClick={() => {
                  setFilter(v)
                  setPage(0)
                }}
                className={`${LABEL} shrink-0 rounded-full px-3.5 py-2 text-[10.5px] font-bold ${filter === v ? 'bg-[#161616] text-[#ffd83d]' : 'bg-[#fffdf7] text-[#161616]'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-3 space-y-3">
            {filter === 'event' &&
              (events.length === 0 ? (
                <Empty>Belum ada event di kota ini.</Empty>
              ) : (
                <Field label="Event">
                  <select
                    value={eventId}
                    onChange={(e) => {
                      setEventId(e.target.value)
                      setPage(0)
                    }}
                    className={FLD}
                  >
                    {events.map((e) => (
                      <option key={e.id_event} value={String(e.id_event)}>
                        {eventLabel(e)}
                      </option>
                    ))}
                  </select>
                </Field>
              ))}
            {filter === 'event' && selectedEvent && (
              <EventSummary event={selectedEvent} recap={selectedRecap} />
            )}
            <SearchBox
              value={q}
              onChange={(v) => {
                setQ(v)
                setPage(0)
              }}
              placeholder="Cari keterangan..."
            />
            {shown.length === 0 ? (
              <Empty>{txns.length === 0 ? 'Belum ada transaksi. Catat pemasukan pertama di atas.' : 'Tidak ada transaksi di filter ini.'}</Empty>
            ) : (
              <div className={`${PANEL} ${ROWS} overflow-hidden`}>
                {shown.map((t) => (
                  <TxnRow
                    key={t.id_txn}
                    txn={t}
                    // Di filter Event nama event sudah ada di ringkasan; tampilkan catatannya saja
                    label={filter === 'event' ? kasCatatan(t.keterangan, selectedEvent?.nama_event) || t.keterangan : t.keterangan}
                    onClick={() => openEdit(t)}
                  />
                ))}
              </div>
            )}
            <Pager page={current} totalPages={pages} onChange={setPage} />
          </div>
        </div>

        {exportUrl && (
          <a href={exportUrl} className={BTN_OUTLINE}>
            {filter === 'event' && eventId ? 'Unduh Excel · event ini' : 'Unduh Laporan Excel'}
          </a>
        )}
      </div>

      {draft && (
        <TxnSheet
          key={draft.id ?? `new-${draft.tipe}`}
          draft={draft}
          events={events}
          namaCabang={namaCabang}
          onClose={() => setDraft(null)}
          onDone={done}
        />
      )}
      <Toast msg={toast} />
    </PaperMain>
  )
}

function MiniStat({ label, value, red = false }: { label: string; value: string; red?: boolean }) {
  return (
    <span className="min-w-0">
      <span className={`${LABEL} block text-[8.5px] text-[#57534e]`}>{label}</span>
      <span className={`${MONO} block truncate text-[11px] font-bold ${red ? RED_TEXT : 'text-[#161616]'}`}>{value}</span>
    </span>
  )
}

function EventRecapRow({ recap, onClick }: { recap: EventRecap; onClick: () => void }) {
  const { e, masuk, keluar } = recap
  const d = e.tglMs ? new Date(e.tglMs) : null
  return (
    <button type="button" onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-[#161616]/5 transition">
      <DateBlock
        d={d ? String(d.getUTCDate()) : '–'}
        m={d ? d.toLocaleDateString('id-ID', { month: 'short', timeZone: 'UTC' }).toUpperCase() : ''}
      />
      <span className="flex-1 min-w-0">
        <span className={`${ANTON} block truncate text-[16px] leading-tight tracking-[.02em] text-[#161616]`}>{e.nama_event}</span>
        <span className="mt-1.5 grid grid-cols-3 gap-2">
          <MiniStat label="Masuk" value={num(masuk)} />
          <MiniStat label="Keluar" value={num(keluar)} red />
          <MiniStat label="Selisih" value={num(masuk - keluar)} red={masuk - keluar < 0} />
        </span>
      </span>
    </button>
  )
}

/** Ringkasan event terpilih di filter Event: berapa masuk, berapa keluar, selisihnya. */
function EventSummary({ event, recap }: { event: EventDashboard; recap: EventRecap | undefined }) {
  const masuk = recap?.masuk ?? 0
  const keluar = recap?.keluar ?? 0
  return (
    <section aria-label="Ringkasan kas event" className={`relative px-4 pt-3.5 pb-4 ${PANEL}`}>
      <span aria-hidden className={TAPE_RIGHT} />
      <p className={`${LABEL} text-[9.5px] text-[#57534e]`}>
        {tglShort(event)} · {recap?.n ?? 0} transaksi
      </p>
      <p className={`${ANTON} mt-1 truncate text-[22px] leading-tight tracking-[.01em] text-[#161616]`}>{event.nama_event}</p>
      <div className="mt-3 pt-3 grid grid-cols-3 divide-x-2 divide-dotted divide-[#161616]/20 border-t-2 border-dotted border-[#161616]/20">
        <div className="pr-2 min-w-0">
          <p className={`${LABEL} text-[8.5px] text-[#57534e]`}>Pemasukan</p>
          <p className={`${MONO} mt-1 truncate text-[12px] font-bold`}>{rp(masuk)}</p>
        </div>
        <div className="px-2 min-w-0">
          <p className={`${LABEL} text-[8.5px] text-[#57534e]`}>Pengeluaran</p>
          <p className={`${MONO} mt-1 truncate text-[12px] font-bold ${RED_TEXT}`}>{rp(keluar)}</p>
        </div>
        <div className="pl-2 min-w-0">
          <p className={`${LABEL} text-[8.5px] text-[#57534e]`}>Selisih</p>
          <p className={`${MONO} mt-1 truncate text-[12px] font-bold ${masuk - keluar < 0 ? RED_TEXT : ''}`}>{rp(masuk - keluar)}</p>
        </div>
      </div>
    </section>
  )
}

function TxnRow({ txn, label, onClick }: { txn: TxnKotaItem; label: string; onClick: () => void }) {
  const isMasuk = txn.tipe === 'masuk'
  return (
    <button type="button" onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-[#161616]/5 transition">
      <span
        aria-hidden
        className={`w-9 h-9 shrink-0 rounded-[10px] -rotate-3 flex items-center justify-center ${
          isMasuk ? 'bg-[#161616] text-[#ffd83d]' : 'bg-[#e02a2f] text-white'
        }`}
      >
        <SignIcon minus={!isMasuk} className="w-[18px] h-[18px]" />
      </span>
      <span className="flex-1 min-w-0">
        <span className={`${MONO} block truncate text-[13px] font-bold text-[#161616]`}>{label}</span>
        <span className={`${LABEL} block mt-1 text-[9.5px] text-[#57534e]`}>
          {fmtTgl(txn.tanggal)} · {txn.kategori}
        </span>
      </span>
      <span className={`${MONO} shrink-0 text-[13px] font-bold ${isMasuk ? 'text-[#161616]' : RED_TEXT}`}>
        <span className="sr-only">{isMasuk ? 'Pemasukan' : 'Pengeluaran'} </span>
        {isMasuk ? '+' : '−'}
        {rp(txn.jumlah)}
      </span>
    </button>
  )
}

function TxnSheet({
  draft,
  events,
  namaCabang,
  onClose,
  onDone,
}: {
  draft: Draft
  events: EventDashboard[]
  namaCabang: string
  onClose: () => void
  onDone: (msg: string) => void
}) {
  const [tipe, setTipe] = useState<Tipe>(draft.tipe)
  const [kategori, setKategori] = useState<Kategori>(draft.kategori)
  const [jumlah, setJumlah] = useState(draft.jumlah)
  const [eventId, setEventId] = useState(draft.eventId)
  const [ket, setKet] = useState(draft.ket)
  const [tanggal, setTanggal] = useState(draft.tanggal)
  const [error, setError] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)
  const [pending, start] = useTransition()
  const editing = draft.id != null

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (pending) return
    const n = Number(jumlah)
    if (!n) return setError('Jumlah harus lebih dari 0')
    const ev = events.find((x) => String(x.id_event) === eventId)
    if (kategori === 'event' && !ev) return setError('Pilih event')
    const extra = ket.trim()
    if (kategori === 'harian' && !extra) return setError('Keterangan wajib diisi')
    if (!tanggal) return setError('Tanggal wajib diisi')
    const keterangan = kategori === 'event' ? (extra ? `${ev!.nama_event} - ${extra}` : ev!.nama_event) : extra
    const input = { tipe, kategori, jumlah: n, keterangan, tanggal, idEvent: kategori === 'event' ? ev!.id_event : null }
    setError('')
    start(async () => {
      const res = editing ? await updateTxnKota(draft.id!, input) : await addTxnKota(input)
      if (!res.ok) return setError(res.error)
      onDone(editing ? 'Transaksi diperbarui' : tipe === 'masuk' ? 'Pemasukan tercatat' : 'Pengeluaran tercatat')
    })
  }

  function remove() {
    if (!confirmDel) return setConfirmDel(true)
    setError('')
    start(async () => {
      const res = await deleteTxnKota(draft.id!)
      if (!res.ok) {
        setConfirmDel(false)
        return setError(res.error)
      }
      onDone('Transaksi dihapus')
    })
  }

  const title = editing ? 'Edit Transaksi' : tipe === 'masuk' ? 'Catat Pemasukan' : 'Catat Pengeluaran'

  return (
    <Sheet open onClose={onClose}>
      <SheetHead title={title} sub={`Kas ${namaCabang}`} />
      <form onSubmit={submit} className="space-y-4">
        <FieldGroup label="Tipe">
          <Seg options={[['masuk', 'Pemasukan'], ['keluar', 'Pengeluaran']]} value={tipe} onChange={(v) => setTipe(v as Tipe)} />
        </FieldGroup>
        <FieldGroup label="Kategori">
          <Seg options={[['harian', 'Harian'], ['event', 'Event']]} value={kategori} onChange={(v) => setKategori(v as Kategori)} />
        </FieldGroup>
        <FieldGroup label="Jumlah">
          <RupiahInput
            value={jumlah}
            onChange={setJumlah}
            disabled={pending}
            ariaLabel="Jumlah"
            className={RP_WRAP}
            inputClassName={RP_INPUT}
            prefixClassName={RP_PREFIX}
          />
        </FieldGroup>
        {kategori === 'event' &&
          (events.length === 0 ? (
            <Note>Belum ada event di kota ini. Pilih kategori Harian.</Note>
          ) : (
            <Field label="Event">
              <select value={eventId} onChange={(e) => setEventId(e.target.value)} disabled={pending} className={FLD}>
                <option value="" disabled>
                  Pilih event...
                </option>
                {events.map((e) => (
                  <option key={e.id_event} value={String(e.id_event)}>
                    {eventLabel(e)}
                  </option>
                ))}
              </select>
            </Field>
          ))}
        <Field label={kategori === 'event' ? 'Keterangan (opsional)' : 'Keterangan'}>
          <input
            value={ket}
            onChange={(e) => setKet(e.target.value)}
            maxLength={KET_MAX}
            disabled={pending}
            placeholder={tipe === 'masuk' ? 'Contoh: Persembahan ibadah' : 'Contoh: Sewa sound system'}
            className={FLD}
          />
        </Field>
        <Field label="Tanggal">
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            disabled={pending}
            className={`${FLD} block appearance-none min-h-12`}
          />
        </Field>

        {error && (
          <p role="alert" className={ERROR}>
            {error}
          </p>
        )}

        <button type="submit" disabled={pending} className={BTN}>
          <Strip tone="ink" className="py-2.5 text-[16px]">
            {pending ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Simpan'}
          </Strip>
        </button>
        {editing && (
          <button
            type="button"
            disabled={pending}
            onClick={remove}
            className={`${ANTON} w-full py-2.5 rounded-sm ring-2 ring-inset ring-[#c21f24] text-[16px] tracking-[.03em] disabled:opacity-50 ${RED_TEXT} ${PRESS}`}
          >
            {confirmDel ? 'Yakin hapus? Tap lagi' : 'Hapus Transaksi'}
          </button>
        )}
      </form>
    </Sheet>
  )
}
