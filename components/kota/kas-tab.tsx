'use client'

import { useState, useEffect, useTransition, useRef, useMemo } from 'react'
import { HeroCard, SummaryTile } from '@/components/kota'
import { addTxnKota, deleteTxnKota, updateTxnKota } from '@/lib/actions/kas-kota'
import type { KasKotaData, TxnKotaItem } from '@/lib/actions/kas-kota'
import { getAllEventsByKotalevelup } from '@/lib/actions/event'

export type { KasKotaData }

// ── Helpers ────────────────────────────────────────────────────

function fmt(n: number) {
  return 'Rp ' + Math.round(n).toLocaleString('id-ID')
}

function fmtShort(n: number) {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} jt`
  if (n >= 1_000) return `Rp ${Math.round(n / 1_000)} rb`
  return `Rp ${Math.round(n)}`
}

const ID_MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()} ${ID_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function formatRupiah(raw: string): string {
  if (!raw) return ''
  const num = parseInt(raw.replace(/\D/g, ''), 10)
  if (isNaN(num)) return ''
  return 'Rp ' + num.toLocaleString('id-ID')
}

function parseRupiah(display: string): string {
  return display.replace(/\D/g, '')
}

// ── Icons ──────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function MinusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
    </svg>
  )
}

// ── Sheet ──────────────────────────────────────────────────────

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 z-[200] flex items-end"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-[480px] mx-auto bg-surface rounded-t-[24px] px-5 pt-3 pb-10 max-h-[90vh] overflow-y-auto">
        <div className="w-9 h-1 rounded-full bg-border mx-auto mb-5" />
        <p className="text-[18px] font-bold text-fg mb-5">{title}</p>
        {children}
      </div>
    </div>
  )
}

// ── Transaction Form ───────────────────────────────────────────

type EventOption = { id_event: number; nama_event: string }

interface TxnFormProps {
  kotalevelup: string
  initialTipe?: 'masuk' | 'keluar'
  initialJumlah?: string
  initialKeterangan?: string
  initialTanggal?: string
  initialKategori?: 'harian' | 'event'
  submitLabel?: string
  isPending: boolean
  onSubmit: (data: {
    tipe: 'masuk' | 'keluar'
    jumlah: number
    keterangan: string
    tanggal: string
    kategori: 'harian' | 'event'
  }) => void
}

function TxnForm({
  kotalevelup,
  initialTipe = 'masuk',
  initialJumlah = '',
  initialKeterangan = '',
  initialTanggal = todayStr(),
  initialKategori = 'harian',
  submitLabel = 'Simpan',
  isPending,
  onSubmit,
}: TxnFormProps) {
  const [tipe, setTipe] = useState<'masuk' | 'keluar'>(initialTipe)
  const [jumlahDisplay, setJumlahDisplay] = useState(
    initialJumlah ? formatRupiah(initialJumlah) : ''
  )
  const [keterangan, setKeterangan] = useState(initialKeterangan)
  const [tanggal, setTanggal] = useState(initialTanggal)
  const [kategori, setKategori] = useState<'harian' | 'event'>(initialKategori)
  const [events, setEvents] = useState<EventOption[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const submittingRef = useRef(false)

  useEffect(() => {
    if (kategori !== 'event') return
    setEventsLoading(true)
    getAllEventsByKotalevelup(kotalevelup).then((evts) => {
      setEvents(evts)
      setEventsLoading(false)
    })
  }, [kategori, kotalevelup])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submittingRef.current || isPending) return
    const jumlah = parseInt(parseRupiah(jumlahDisplay), 10)
    if (!jumlah || !keterangan) return
    submittingRef.current = true
    onSubmit({ tipe, jumlah, keterangan, tanggal, kategori })
  }

  const segBase = 'flex-1 py-2.5 rounded-[9px] text-[14px] font-medium transition-all duration-150 cursor-pointer border-none'
  const segActive = 'bg-surface shadow-xs'
  const segInactive = 'bg-transparent text-muted'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      <div>
        <p className="text-[13px] font-medium text-fg2 mb-1.5">Tipe</p>
        <div className="flex gap-1 bg-bg border border-border rounded-[12px] p-1">
          <button type="button" onClick={() => setTipe('masuk')}
            className={`${segBase} ${tipe === 'masuk' ? `${segActive} text-green` : segInactive}`}>
            ↑ Pemasukan
          </button>
          <button type="button" onClick={() => setTipe('keluar')}
            className={`${segBase} ${tipe === 'keluar' ? `${segActive} text-red` : segInactive}`}>
            ↓ Pengeluaran
          </button>
        </div>
      </div>

      <div>
        <p className="text-[13px] font-medium text-fg2 mb-1.5">Kategori</p>
        <div className="flex gap-1 bg-bg border border-border rounded-[12px] p-1">
          <button type="button" onClick={() => setKategori('harian')}
            className={`${segBase} ${kategori === 'harian' ? `${segActive} text-fg` : segInactive}`}>
            Harian
          </button>
          <button type="button" onClick={() => setKategori('event')}
            className={`${segBase} ${kategori === 'event' ? `${segActive} text-fg` : segInactive}`}>
            Event
          </button>
        </div>
      </div>

      <div>
        <p className="text-[13px] font-medium text-fg2 mb-1.5">Jumlah</p>
        <input
          type="text"
          inputMode="numeric"
          value={jumlahDisplay}
          onChange={(e) => setJumlahDisplay(formatRupiah(parseRupiah(e.target.value)))}
          placeholder="Rp 0"
          required
          className="w-full px-3.5 py-3 border-[1.5px] border-border rounded-input text-[15px] bg-surface text-fg outline-none focus:border-accent transition-colors"
        />
      </div>

      {kategori === 'event' ? (
        <div>
          <p className="text-[13px] font-medium text-fg2 mb-1.5">Event</p>
          {eventsLoading ? (
            <div className="w-full px-3.5 py-3 border-[1.5px] border-border rounded-input text-[15px] bg-surface text-muted">
              Memuat event...
            </div>
          ) : (
            <select
              value={events.find((e) => e.nama_event === keterangan)?.id_event ?? ''}
              onChange={(e) => {
                const ev = events.find((ev) => ev.id_event === Number(e.target.value))
                if (ev) setKeterangan(ev.nama_event)
              }}
              required
              className="w-full px-3.5 py-3 border-[1.5px] border-border rounded-input text-[15px] bg-surface text-fg outline-none focus:border-accent transition-colors appearance-none"
            >
              <option value="" disabled>Pilih event...</option>
              {events.map((ev) => (
                <option key={ev.id_event} value={ev.id_event}>{ev.nama_event}</option>
              ))}
            </select>
          )}
        </div>
      ) : (
        <div>
          <p className="text-[13px] font-medium text-fg2 mb-1.5">Keterangan</p>
          <input
            type="text"
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            placeholder="Deskripsi transaksi..."
            required
            className="w-full px-3.5 py-3 border-[1.5px] border-border rounded-input text-[15px] bg-surface text-fg outline-none focus:border-accent transition-colors"
          />
        </div>
      )}

      <div>
        <p className="text-[13px] font-medium text-fg2 mb-1.5">Tanggal</p>
        <input
          type="date"
          value={tanggal}
          onChange={(e) => setTanggal(e.target.value)}
          required
          className="w-full px-3.5 py-3 border-[1.5px] border-border rounded-input text-[15px] bg-surface text-fg outline-none focus:border-accent transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-[15px] bg-accent text-white rounded-btn text-[16px] font-semibold mt-1 disabled:opacity-60 transition-opacity"
      >
        {isPending ? 'Menyimpan...' : submitLabel}
      </button>
    </form>
  )
}

// ── Transaction Row ────────────────────────────────────────────

function TxnRow({
  txn,
  isPending,
  onEdit,
  onDelete,
}: {
  txn: TxnKotaItem
  isPending: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const [confirm, setConfirm] = useState(false)
  const isMasuk = txn.tipe === 'masuk'

  return (
    <div className="flex items-center gap-2.5 px-4 py-3 relative [&+&]:before:content-[''] [&+&]:before:absolute [&+&]:before:top-0 [&+&]:before:left-4 [&+&]:before:right-4 [&+&]:before:h-px [&+&]:before:bg-border">
      <div
        className="w-10 h-10 rounded-[12px] flex items-center justify-center text-[16px] shrink-0"
        style={{
          background: isMasuk ? 'var(--green-light)' : 'var(--red-light)',
          color: isMasuk ? 'var(--green)' : 'var(--red)',
        }}
      >
        {isMasuk ? '↑' : '↓'}
      </div>

      <div className="flex-1 min-w-0 overflow-hidden">
        <p className="text-[14px] font-medium text-fg truncate">{txn.keterangan}</p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-nowrap overflow-hidden">
          <span className="text-[12px] text-muted shrink-0">{fmtDate(txn.tanggal)}</span>
          <span
            className="text-[11px] font-medium px-[6px] py-[2px] rounded-badge shrink-0"
            style={{
              background: txn.kategori === 'harian' ? 'var(--amber-light)' : 'var(--purple-light)',
              color: txn.kategori === 'harian' ? 'var(--amber-dark)' : 'var(--purple-dark)',
            }}
          >
            {txn.kategori}
          </span>
        </div>
      </div>

      {confirm ? (
        <div className="flex gap-1.5 items-center shrink-0">
          <button
            onClick={() => { setConfirm(false); onDelete() }}
            disabled={isPending}
            className="text-[12px] px-3 py-1.5 rounded-[8px] bg-red text-white font-semibold border-none cursor-pointer"
          >
            Hapus
          </button>
          <button
            onClick={() => setConfirm(false)}
            className="text-[12px] px-3 py-1.5 rounded-[8px] border border-border bg-bg cursor-pointer"
          >
            Batal
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className="text-[14px] font-semibold"
            style={{ color: isMasuk ? 'var(--green)' : 'var(--red)' }}
          >
            {isMasuk ? '+' : '-'}{fmtShort(txn.jumlah)}
          </span>
          <button
            onClick={onEdit}
            disabled={isPending}
            className="w-[30px] h-[30px] rounded-[8px] bg-accent text-white flex items-center justify-center border-none cursor-pointer"
          >
            <PencilIcon />
          </button>
          <button
            onClick={() => setConfirm(true)}
            disabled={isPending}
            className="w-[30px] h-[30px] rounded-[8px] bg-red text-white flex items-center justify-center border-none cursor-pointer"
          >
            <TrashIcon />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main Tab ───────────────────────────────────────────────────

const PAGE_SIZE = 10

export function KasTab({ kasKota }: { kasKota: KasKotaData }) {
  const [sheet, setSheet] = useState<'masuk' | 'keluar' | null>(null)
  const [editTxn, setEditTxn] = useState<TxnKotaItem | null>(null)
  const [page, setPage] = useState(0)
  const [isPending, startTransition] = useTransition()

  const txns = kasKota.txns

  const totalMasuk = useMemo(
    () => txns.filter((t) => t.tipe === 'masuk').reduce((s, t) => s + t.jumlah, 0),
    [txns],
  )
  const totalKeluar = useMemo(
    () => txns.filter((t) => t.tipe === 'keluar').reduce((s, t) => s + t.jumlah, 0),
    [txns],
  )

  const totalPages = Math.ceil(txns.length / PAGE_SIZE)
  const pagedTxns = txns.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function handleAdd(data: { tipe: 'masuk' | 'keluar'; jumlah: number; keterangan: string; tanggal: string; kategori: 'harian' | 'event' }) {
    startTransition(async () => {
      await addTxnKota({ idCabang: kasKota.id_cabang, ...data })
      setSheet(null)
    })
  }

  function handleUpdate(data: { tipe: 'masuk' | 'keluar'; jumlah: number; keterangan: string; tanggal: string; kategori: 'harian' | 'event' }) {
    if (!editTxn) return
    startTransition(async () => {
      await updateTxnKota(editTxn.id_txn, kasKota.id_cabang, editTxn.jumlah, editTxn.tipe, data)
      setEditTxn(null)
    })
  }

  function handleDelete(txn: TxnKotaItem) {
    startTransition(async () => {
      await deleteTxnKota(txn.id_txn, kasKota.id_cabang, txn.jumlah, txn.tipe)
    })
  }

  return (
    <div className="max-w-[480px] mx-auto px-4 flex flex-col gap-4 pb-6">
      <div className="pt-5">
        <h1 className="text-[22px] font-bold text-fg">Kas Kota</h1>
        <p className="text-[12px] text-muted mt-0.5">Keuangan tingkat kota</p>
      </div>

      <HeroCard
        label="Saldo Kas Kota"
        amount={fmt(kasKota.saldo)}
        meta={[
          { label: 'Pemasukan', value: fmtShort(totalMasuk) },
          { label: 'Pengeluaran', value: fmtShort(totalKeluar) },
        ]}
      />

      <div className="flex gap-2.5">
        <SummaryTile label="Pemasukan" value={fmtShort(totalMasuk)} valueColor="var(--green)" />
        <SummaryTile label="Pengeluaran" value={fmtShort(totalKeluar)} valueColor="var(--red)" />
        <SummaryTile label="Transaksi" value={txns.length} />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => setSheet('masuk')}
          disabled={isPending}
          className="bg-surface border border-border rounded-card p-3.5 flex flex-col items-start gap-2 cursor-pointer text-left transition-all hover:border-accent hover:bg-accent-light disabled:opacity-60"
        >
          <div className="w-9 h-9 rounded-[10px] bg-green-light text-green flex items-center justify-center">
            <PlusIcon />
          </div>
          <span className="text-[13px] font-semibold text-fg leading-tight">Catat Pemasukan</span>
        </button>
        <button
          onClick={() => setSheet('keluar')}
          disabled={isPending}
          className="bg-surface border border-border rounded-card p-3.5 flex flex-col items-start gap-2 cursor-pointer text-left transition-all hover:border-accent hover:bg-accent-light disabled:opacity-60"
        >
          <div className="w-9 h-9 rounded-[10px] bg-red-light text-red flex items-center justify-center">
            <MinusIcon />
          </div>
          <span className="text-[13px] font-semibold text-fg leading-tight">Catat Pengeluaran</span>
        </button>
      </div>

      <div>
        <p className="text-[15px] font-bold text-fg mb-2.5">Riwayat Transaksi</p>
        <div className="bg-surface border border-border rounded-card overflow-hidden">
          {txns.length === 0 ? (
            <div className="flex flex-col items-center py-10">
              <p className="text-[32px] opacity-40 mb-2">📋</p>
              <p className="text-[13px] text-muted">Belum ada transaksi</p>
            </div>
          ) : (
            pagedTxns.map((txn) => (
              <TxnRow
                key={txn.id_txn}
                txn={txn}
                isPending={isPending}
                onEdit={() => setEditTxn(txn)}
                onDelete={() => handleDelete(txn)}
              />
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-2.5 gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 0}
              className="text-[13px] px-4 py-1.5 rounded-[10px] border border-border bg-bg cursor-pointer disabled:opacity-40"
            >
              ← Prev
            </button>
            <span className="text-[13px] text-muted">{page + 1} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages - 1}
              className="text-[13px] px-4 py-1.5 rounded-[10px] border border-border bg-bg cursor-pointer disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {sheet && (
        <Sheet
          title={sheet === 'masuk' ? 'Catat Pemasukan' : 'Catat Pengeluaran'}
          onClose={() => setSheet(null)}
        >
          <TxnForm
            kotalevelup={String(kasKota.id_cabang)}
            initialTipe={sheet}
            isPending={isPending}
            onSubmit={handleAdd}
          />
        </Sheet>
      )}

      {editTxn && (
        <Sheet title="Edit Transaksi" onClose={() => setEditTxn(null)}>
          <TxnForm
            kotalevelup={String(kasKota.id_cabang)}
            initialTipe={editTxn.tipe}
            initialJumlah={String(editTxn.jumlah)}
            initialKeterangan={editTxn.keterangan}
            initialTanggal={editTxn.tanggal.slice(0, 10)}
            initialKategori={editTxn.kategori}
            submitLabel="Simpan Perubahan"
            isPending={isPending}
            onSubmit={handleUpdate}
          />
        </Sheet>
      )}
    </div>
  )
}
