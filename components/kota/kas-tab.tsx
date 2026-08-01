'use client'

import { useState, useEffect, useTransition, useRef, useMemo } from 'react'
import { toPng } from 'html-to-image'
import { HeroCard, SummaryTile, FilterTabs } from '@/components/kota'
import { addTxnKota, deleteTxnKota, updateTxnKota } from '@/lib/actions/kas-kota'
import type { KasKotaData, TxnKotaItem } from '@/lib/actions/kas-kota'
import type { EventDashboard } from '@/lib/actions/event'

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
function fmtDate(iso: string | Date) {
  const d = new Date(iso)
  return `${d.getDate()} ${ID_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function dateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtEventDateShort(tglDisplay: string) {
  // tglDisplay dari server biasanya formatnya: "Rabu, 10 November 2025"
  // Kita strip part weekday agar jadi "10 November 2025"
  return tglDisplay.replace(/^[^,]+,\s*/, '')
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

function ExcelIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="9" x2="9" y2="21" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function ImageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
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

interface TxnFormProps {
  events: EventDashboard[]
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
  events,
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
  const sep = ' - '
  const initialIdx = initialKategori === 'event' ? initialKeterangan.indexOf(sep) : -1
  const initialEventNameParsed =
    initialKategori !== 'event'
      ? ''
      : initialIdx >= 0
        ? initialKeterangan.slice(0, initialIdx)
        : initialKeterangan
  const initialExtraParsed =
    initialKategori !== 'event'
      ? initialKeterangan
      : initialIdx >= 0
        ? initialKeterangan.slice(initialIdx + sep.length)
        : ''

  const [keterangan, setKeterangan] = useState(initialExtraParsed)
  const [tanggal, setTanggal] = useState(initialTanggal)
  const [kategori, setKategori] = useState<'harian' | 'event'>(initialKategori)
  const [selectedEventId, setSelectedEventId] = useState(() => {
    if (initialKategori !== 'event') return ''
    if (initialEventNameParsed) {
      const ev = events.find((x) => x.nama_event === initialEventNameParsed)
      if (ev) return String(ev.id_event)
    }
    return events[0]?.id_event ? String(events[0].id_event) : ''
  })
  const submittingRef = useRef(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submittingRef.current || isPending) return
    const jumlah = parseInt(parseRupiah(jumlahDisplay), 10)
    if (!jumlah || (kategori === 'harian' && !keterangan) || (kategori === 'event' && !selectedEventId)) return
    submittingRef.current = true
    const selectedEventName = events.find((ev) => String(ev.id_event) === selectedEventId)?.nama_event ?? ''
    const finalKeterangan = kategori === 'event'
      ? (keterangan ? `${selectedEventName} - ${keterangan}` : selectedEventName)
      : keterangan
    onSubmit({ tipe, jumlah, keterangan: finalKeterangan, tanggal, kategori })
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
        <>
          <div>
            <p className="text-[13px] font-medium text-fg2 mb-1.5">Event</p>
            {events.length === 0 ? (
              <p className="text-[13px] text-muted px-1">Belum ada event.</p>
            ) : (
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                required
                className="w-full px-3.5 py-3 border-[1.5px] border-border rounded-input text-[15px] bg-surface text-fg outline-none focus:border-accent transition-colors appearance-none"
              >
                <option value="" disabled>Pilih event...</option>
              {events.map((ev) => (
                <option key={ev.id_event} value={String(ev.id_event)}>
                  {ev.nama_event} ({fmtEventDateShort(ev.tglDisplay)})
                </option>
              ))}
              </select>
            )}
          </div>
          <div>
            <p className="text-[13px] font-medium text-fg2 mb-1.5">Keterangan</p>
            <input
              type="text"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Keterangan transaksi event..."
              className="w-full px-3.5 py-3 border-[1.5px] border-border rounded-input text-[15px] bg-surface text-fg outline-none focus:border-accent transition-colors"
            />
          </div>
        </>
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

// ── Report Sheet ─────────────────────────────────────────────────

function ReportSheet({
  events,
  initialEventId,
  onClose,
}: {
  events: EventDashboard[]
  initialEventId?: number
  onClose: () => void
}) {
  const [eventId, setEventId] = useState(String(initialEventId ?? 'all'))
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  function handleDownload() {
    const qs = new URLSearchParams()
    if (eventId !== 'all') qs.set('eventId', eventId)
    if (from) qs.set('from', from)
    if (to) qs.set('to', to)
    window.location.href = `/api/kas-kota/export?${qs.toString()}`
  }

  return (
    <Sheet title="Export Laporan Kas Kota" onClose={onClose}>
      <div className="flex flex-col gap-3.5">
        <div>
          <p className="text-[13px] font-medium text-fg2 mb-1.5">Event</p>
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="w-full px-3.5 py-3 border-[1.5px] border-border rounded-input text-[15px] bg-surface text-fg outline-none focus:border-accent transition-colors appearance-none"
          >
            <option value="all">Semua</option>
            {events.map((ev) => (
              <option key={ev.id_event} value={String(ev.id_event)}>
                {ev.nama_event} ({fmtEventDateShort(ev.tglDisplay)})
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className="text-[13px] font-medium text-fg2 mb-1.5">Dari Tanggal</p>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full px-3.5 py-3 border-[1.5px] border-border rounded-input text-[15px] bg-surface text-fg outline-none focus:border-accent transition-colors"
          />
        </div>
        <div>
          <p className="text-[13px] font-medium text-fg2 mb-1.5">Sampai Tanggal</p>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full px-3.5 py-3 border-[1.5px] border-border rounded-input text-[15px] bg-surface text-fg outline-none focus:border-accent transition-colors"
          />
        </div>
        <button
          onClick={handleDownload}
          className="w-full py-[15px] bg-accent text-white rounded-btn text-[16px] font-semibold mt-1 flex items-center justify-center gap-2"
        >
          <ExcelIcon /> Unduh Excel
        </button>
      </div>
    </Sheet>
  )
}

// ── Export Menu Modal ──────────────────────────────────────────

function ExportModal({
  onExcel,
  onImage,
  onClose,
}: {
  onExcel: () => void
  onImage: () => void
  onClose: () => void
}) {
  return (
    <Sheet title="Pilih Format Laporan" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <button
          onClick={onExcel}
          className="w-full bg-surface border border-border rounded-card p-3.5 flex items-center gap-3 cursor-pointer text-left transition-all hover:border-accent hover:bg-accent-light"
        >
          <div className="w-10 h-10 rounded-[12px] bg-green-light text-green flex items-center justify-center">
            <ExcelIcon />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-fg">Excel</p>
            <p className="text-[12px] text-muted">Unduh laporan sebagai file .xlsx</p>
          </div>
        </button>
        <button
          onClick={onImage}
          className="w-full bg-surface border border-border rounded-card p-3.5 flex items-center gap-3 cursor-pointer text-left transition-all hover:border-accent hover:bg-accent-light"
        >
          <div className="w-10 h-10 rounded-[12px] bg-purple-light text-purple flex items-center justify-center">
            <ImageIcon />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-fg">Gambar</p>
            <p className="text-[12px] text-muted">Simpan laporan sebagai gambar .png</p>
          </div>
        </button>
      </div>
    </Sheet>
  )
}

// ── Image Report Modal ─────────────────────────────────────────

function ImageReportModal({
  allTxns,
  events,
  initialEventId,
  cabangName,
  onClose,
}: {
  allTxns: TxnKotaItem[]
  events: EventDashboard[]
  initialEventId?: number
  cabangName?: string
  onClose: () => void
}) {
  const reportRef = useRef<HTMLDivElement>(null)
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  const [eventId, setEventId] = useState<string>(String(initialEventId ?? 'all'))
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const selectedEvent = events.find((e) => String(e.id_event) === eventId)
  const eventName = selectedEvent?.nama_event

  const visibleTxns = useMemo(() => {
    let rows = allTxns
    if (eventId && eventId !== 'all') {
      const name = selectedEvent?.nama_event
      if (name) {
        rows = rows.filter(
          (t) =>
            t.kategori === 'event' &&
            (t.keterangan === name || t.keterangan.startsWith(`${name} - `)),
        )
      }
    }
    if (from) {
      rows = rows.filter((t) => dateStr(new Date(t.tanggal)) >= from)
    }
    if (to) {
      rows = rows.filter((t) => dateStr(new Date(t.tanggal)) <= to)
    }
    return rows
  }, [allTxns, eventId, selectedEvent?.nama_event, from, to])

  const totalMasuk = useMemo(
    () => visibleTxns.filter((t) => t.tipe === 'masuk').reduce((s, t) => s + t.jumlah, 0),
    [visibleTxns],
  )
  const totalKeluar = useMemo(
    () => visibleTxns.filter((t) => t.tipe === 'keluar').reduce((s, t) => s + t.jumlah, 0),
    [visibleTxns],
  )
  const reportSaldo = totalMasuk - totalKeluar

  async function generateImage() {
    if (!reportRef.current) return
    setGenerating(true)
    try {
      const dataUrl = await toPng(reportRef.current, { pixelRatio: 2, backgroundColor: '#ffffff' })
      setImgUrl(dataUrl)
    } finally {
      setGenerating(false)
    }
  }

  useEffect(() => {
    const id = requestAnimationFrame(() => generateImage())
    return () => cancelAnimationFrame(id)
  }, [])

  function handleDownload() {
    if (!imgUrl) return
    const link = document.createElement('a')
    const slug = eventName
      ? eventName.replace(/\s+/g, '-').toLowerCase().slice(0, 40)
      : from && to
        ? `${from}_${to}`
        : 'semua'
    link.download = `laporan-kas-kota-${slug}.png`
    link.href = imgUrl
    link.click()
  }

  return (
    <Sheet title="Export Gambar" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-[13px] font-medium text-fg2 mb-1.5">Event</p>
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="w-full px-3.5 py-3 border-[1.5px] border-border rounded-input text-[15px] bg-surface text-fg outline-none focus:border-accent transition-colors appearance-none"
          >
            <option value="all">Semua</option>
            {events.map((ev) => (
              <option key={ev.id_event} value={String(ev.id_event)}>
                {ev.nama_event} ({fmtEventDateShort(ev.tglDisplay)})
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <p className="text-[13px] font-medium text-fg2 mb-1.5">Dari</p>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full px-3.5 py-3 border-[1.5px] border-border rounded-input text-[15px] bg-surface text-fg outline-none focus:border-accent transition-colors"
            />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-medium text-fg2 mb-1.5">Sampai</p>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-3.5 py-3 border-[1.5px] border-border rounded-input text-[15px] bg-surface text-fg outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>

        <button
          onClick={generateImage}
          disabled={generating}
          className="w-full py-[12px] bg-surface border border-border text-fg rounded-btn text-[15px] font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity"
        >
          <ImageIcon /> {generating ? 'Membuat gambar...' : 'Generate Ulang'}
        </button>

        <div className="max-h-[45vh] overflow-auto border border-border rounded-card bg-white">
          <div ref={reportRef} className="w-[480px] bg-white p-6 text-[14px] text-fg">
            <div className="text-center mb-4">
              <h2 className="text-[18px] font-bold mb-1">LAPORAN KAS KOTA</h2>
              <p className="text-[12px] text-muted">{cabangName ?? 'Wilayah'}</p>
              {eventName && (
                <p className="text-[13px] font-semibold text-accent mt-2">{eventName}</p>
              )}
            </div>

            <div className="flex gap-3 mb-4">
              <div className="flex-1 bg-bg rounded-[12px] p-3 text-center">
                <p className="text-[10px] text-muted uppercase tracking-wide">Pemasukan</p>
                <p className="text-[14px] font-bold text-green mt-0.5">{fmt(totalMasuk)}</p>
              </div>
              <div className="flex-1 bg-bg rounded-[12px] p-3 text-center">
                <p className="text-[10px] text-muted uppercase tracking-wide">Pengeluaran</p>
                <p className="text-[14px] font-bold text-red mt-0.5">{fmt(totalKeluar)}</p>
              </div>
              <div className="flex-1 bg-bg rounded-[12px] p-3 text-center">
                <p className="text-[10px] text-muted uppercase tracking-wide">Saldo</p>
                <p className="text-[14px] font-bold mt-0.5">{fmt(reportSaldo)}</p>
              </div>
            </div>

            <p className="text-[12px] text-muted mb-2">{visibleTxns.length} transaksi</p>

            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-1.5 font-semibold">No</th>
                  <th className="text-left py-1.5 font-semibold">Tanggal</th>
                  <th className="text-left py-1.5 font-semibold">Keterangan</th>
                  <th className="text-right py-1.5 font-semibold">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {visibleTxns.map((t, i) => (
                  <tr key={t.id_txn} className="border-b border-border/50">
                    <td className="py-1.5">{i + 1}</td>
                    <td className="py-1.5">{fmtDate(t.tanggal)}</td>
                    <td className="py-1.5">{t.keterangan}</td>
                    <td className={`py-1.5 text-right font-semibold ${t.tipe === 'masuk' ? 'text-green' : 'text-red'}`}>
                      {t.tipe === 'masuk' ? '+' : '-'}{fmt(t.jumlah)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="text-[10px] text-muted text-center mt-4">
              Dicetak pada {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <button
          onClick={handleDownload}
          disabled={!imgUrl || generating}
          className="w-full py-[15px] bg-accent text-white rounded-btn text-[16px] font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity"
        >
          <DownloadIcon /> Unduh PNG
        </button>
      </div>
    </Sheet>
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

export function KasTab({ kasKota, events, cabangName }: { kasKota: KasKotaData; events: EventDashboard[]; cabangName?: string }) {
  const [sheet, setSheet] = useState<'masuk' | 'keluar' | null>(null)
  const [exportMenu, setExportMenu] = useState(false)
  const [reportSheet, setReportSheet] = useState(false)
  const [imageReport, setImageReport] = useState(false)
  const [editTxn, setEditTxn] = useState<TxnKotaItem | null>(null)
  const [page, setPage] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [tab, setTab] = useState<'semua' | 'harian' | 'event'>('semua')
  const [selectedEventId, setSelectedEventId] = useState<number | ''>(events[0]?.id_event ?? '')

  const txns = kasKota.txns

  function isTxnForEvent(txn: TxnKotaItem, eventName: string) {
    if (txn.kategori !== 'event') return false
    return txn.keterangan === eventName || txn.keterangan.startsWith(`${eventName} - `)
  }

  function getEventTotals(eventName: string) {
    const eventTxns = txns.filter((t) => isTxnForEvent(t, eventName))
    return {
      income: eventTxns.filter((t) => t.tipe === 'masuk').reduce((s, t) => s + t.jumlah, 0),
      spent: eventTxns.filter((t) => t.tipe === 'keluar').reduce((s, t) => s + t.jumlah, 0),
    }
  }

  const filteredTxns = useMemo(() => {
    if (tab === 'semua') return txns
    if (tab === 'harian') return txns.filter((t) => t.kategori === 'harian')
    const eventName = events.find((e) => e.id_event === selectedEventId)?.nama_event ?? ''
    if (!eventName) return txns.filter((t) => t.kategori === 'event')
    return txns.filter((t) => isTxnForEvent(t, eventName))
  }, [tab, txns, selectedEventId, events])

  const totalMasuk = useMemo(
    () => txns.filter((t) => t.tipe === 'masuk').reduce((s, t) => s + t.jumlah, 0),
    [txns],
  )
  const totalKeluar = useMemo(
    () => txns.filter((t) => t.tipe === 'keluar').reduce((s, t) => s + t.jumlah, 0),
    [txns],
  )

  const counts = useMemo(
    () => ({
      semua: txns.length,
      harian: txns.filter((t) => t.kategori === 'harian').length,
      event: txns.filter((t) => t.kategori === 'event').length,
    }),
    [txns],
  )

  const tabList = useMemo(
    () => [
      { key: 'semua', label: 'Semua', count: counts.semua },
      { key: 'harian', label: 'Harian', count: counts.harian },
      { key: 'event', label: 'Event', count: counts.event },
    ],
    [counts],
  )

  const totalPages = Math.ceil(filteredTxns.length / PAGE_SIZE)
  const pagedTxns = filteredTxns.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function changeTab(next: 'semua' | 'harian' | 'event') {
    setTab(next)
    setPage(0)
  }

  function changeEvent(id: number) {
    setSelectedEventId(id)
    setPage(0)
  }

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

      <button
        onClick={() => setExportMenu(true)}
        disabled={isPending}
        className="w-full bg-surface border border-border rounded-card p-3.5 flex items-center gap-3 cursor-pointer text-left transition-all hover:border-accent hover:bg-accent-light disabled:opacity-60"
      >
        <div className="w-9 h-9 rounded-[10px] bg-blue-light text-blue flex items-center justify-center">
          <DownloadIcon />
        </div>
        <span className="text-[13px] font-semibold text-fg leading-tight">Export Laporan</span>
      </button>

      {events.length > 0 && (
        <div>
          <p className="text-[15px] font-bold text-fg mb-2.5">Event Aktif</p>
          <div className="flex flex-col gap-2">
            {events.slice(0, 3).map((ev) => {
              const { income, spent } = getEventTotals(ev.nama_event)
              return (
                <div
                  key={ev.id_event}
                  className="flex items-center gap-1 bg-surface border border-border rounded-card p-2.5 pr-3.5"
                >
                  <button
                    onClick={() => { changeEvent(ev.id_event); changeTab('event') }}
                    className="flex-1 flex items-center gap-3 min-w-0 text-left cursor-pointer border-none bg-transparent p-0 transition-opacity hover:opacity-80"
                  >
                    <div className="w-2 h-2 rounded-full bg-accent shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-fg truncate">{ev.nama_event}</p>
                      <p className="text-[12px] text-muted">{fmtEventDateShort(ev.tglDisplay)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[12px] font-semibold text-green">{fmtShort(income)} masuk</p>
                      <p className="text-[12px] font-semibold text-red">{fmtShort(spent)} terpakai</p>
                    </div>
                  </button>
                  <button
                    onClick={() => { setSelectedEventId(ev.id_event); setTab('event'); setExportMenu(true) }}
                    className="shrink-0 ml-2 w-9 h-9 rounded-[10px] bg-accent-light text-accent flex items-center justify-center border-none cursor-pointer transition-all hover:bg-accent hover:text-white"
                    aria-label="Export laporan event"
                  >
                    <DownloadIcon />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div>
        <p className="text-[15px] font-bold text-fg mb-2.5">Riwayat Transaksi</p>
        <FilterTabs tabs={tabList} active={tab} onChange={(k) => changeTab(k as 'semua' | 'harian' | 'event')} />
        {tab === 'event' && (
          <div className="mt-2.5">
            {events.length === 0 ? (
              <p className="text-[13px] text-muted px-1">Belum ada event.</p>
            ) : (
              <select
                value={selectedEventId}
                onChange={(e) => changeEvent(Number(e.target.value))}
                className="w-full px-3.5 py-3 border-[1.5px] border-border rounded-input text-[15px] bg-surface text-fg outline-none focus:border-accent transition-colors appearance-none"
              >
                {events.map((ev) => (
                  <option key={ev.id_event} value={ev.id_event}>
                    {ev.nama_event} ({fmtEventDateShort(ev.tglDisplay)})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
        <div className="bg-surface border border-border rounded-card overflow-hidden mt-2.5">
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
            events={events}
            initialTipe={sheet}
            isPending={isPending}
            onSubmit={handleAdd}
          />
        </Sheet>
      )}

      {editTxn && (
        <Sheet title="Edit Transaksi" onClose={() => setEditTxn(null)}>
          <TxnForm
            events={events}
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

      {exportMenu && (
        <ExportModal
          onExcel={() => { setExportMenu(false); setReportSheet(true) }}
          onImage={() => { setExportMenu(false); setImageReport(true) }}
          onClose={() => setExportMenu(false)}
        />
      )}

      {reportSheet && (
        <ReportSheet
          events={events}
          initialEventId={selectedEventId || undefined}
          onClose={() => setReportSheet(false)}
        />
      )}

      {imageReport && (
        <ImageReportModal
          allTxns={txns}
          events={events}
          initialEventId={selectedEventId || undefined}
          cabangName={cabangName}
          onClose={() => setImageReport(false)}
        />
      )}
    </div>
  )
}
