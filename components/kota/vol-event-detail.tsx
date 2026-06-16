'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import type { EventDetailFull } from '@/lib/actions/event'
import type { EventDetailVol, PembicaraItem, RundownRow } from '@/lib/actions/event-detail'
import { upsertPembicara, upsertRundownPra, upsertRundownOn } from '@/lib/actions/event-detail'

// ── Helpers ────────────────────────────────────────────────────

function fmtRp(s: string) {
  const n = parseInt(s.replace(/\D/g, ''), 10)
  if (isNaN(n)) return s
  return `Rp ${n.toLocaleString('id-ID')}`
}

// ── Pembicara Section ──────────────────────────────────────────

function PembicaraSection({
  idEvent,
  initial,
}: {
  idEvent: number
  initial: PembicaraItem[]
}) {
  const [items, setItems] = useState<PembicaraItem[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [nama, setNama] = useState('')
  const [jabatan, setJabatan] = useState('')
  const [bio, setBio] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleDelete(idx: number) {
    const updated = items.filter((_, i) => i !== idx)
    setItems(updated)
    startTransition(async () => { await upsertPembicara(idEvent, updated) })
  }

  function handleAdd() {
    if (!nama.trim()) return
    const updated = [...items, { nama: nama.trim(), jabatan: jabatan.trim(), bio: bio.trim() }]
    setItems(updated)
    setNama(''); setJabatan(''); setBio('')
    setShowForm(false)
    startTransition(async () => { await upsertPembicara(idEvent, updated) })
  }

  return (
    <div className="bg-surface border border-border rounded-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <p className="text-[13px] font-semibold text-fg">Pembicara</p>
        <span className="text-[11px] text-muted bg-bg px-2 py-0.5 rounded-full border border-border">
          {items.length} orang
        </span>
      </div>

      {items.length === 0 && !showForm && (
        <div className="px-4 py-6 text-center">
          <p className="text-[13px] text-muted">Belum ada pembicara.</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="divide-y divide-border">
          {items.map((sp, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-fg">{sp.nama}</p>
                {sp.jabatan && <p className="text-[12px] text-muted mt-0.5">{sp.jabatan}</p>}
                {sp.bio && <p className="text-[12px] text-fg2 mt-1 leading-relaxed">{sp.bio}</p>}
              </div>
              <button
                onClick={() => handleDelete(i)}
                disabled={isPending}
                className="shrink-0 text-[18px] leading-none text-muted hover:text-red transition-colors disabled:opacity-40 mt-0.5"
                aria-label="Hapus pembicara"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="px-4 py-3 border-t border-border flex flex-col gap-2.5 bg-bg">
          <input
            autoFocus
            placeholder="Nama *"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="w-full px-3 py-2.5 border border-border rounded-input text-[14px] bg-surface text-fg outline-none focus:border-accent"
          />
          <input
            placeholder="Jabatan / Profesi"
            value={jabatan}
            onChange={(e) => setJabatan(e.target.value)}
            className="w-full px-3 py-2.5 border border-border rounded-input text-[14px] bg-surface text-fg outline-none focus:border-accent"
          />
          <textarea
            placeholder="Bio / Deskripsi singkat"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={2}
            className="w-full px-3 py-2.5 border border-border rounded-input text-[14px] bg-surface text-fg outline-none focus:border-accent resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!nama.trim() || isPending}
              className="flex-1 py-2.5 bg-accent text-white rounded-input text-[13px] font-semibold disabled:opacity-50"
            >
              Tambah
            </button>
            <button
              onClick={() => { setShowForm(false); setNama(''); setJabatan(''); setBio('') }}
              className="px-4 py-2.5 border border-border rounded-input text-[13px] text-fg2 hover:bg-bg"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      <div className="px-4 py-3 border-t border-border">
        <button
          onClick={() => setShowForm(true)}
          disabled={showForm || isPending}
          className="w-full py-2.5 border border-dashed border-border rounded-input text-[13px] text-muted hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
        >
          + Tambah Pembicara
        </button>
      </div>
    </div>
  )
}

// ── Rundown Section ────────────────────────────────────────────

type EditingCell = { rowId: string; field: Exclude<keyof RundownRow, 'id'> } | null

const RUNDOWN_COLS: { key: Exclude<keyof RundownRow, 'id'>; label: string; width: string }[] = [
  { key: 'waktu',      label: 'Waktu',      width: 'w-[70px]' },
  { key: 'kegiatan',   label: 'Kegiatan',   width: 'flex-1' },
  { key: 'pic',        label: 'PIC',        width: 'w-[80px]' },
  { key: 'keterangan', label: 'Ket.',       width: 'w-[90px]' },
]

function RundownSection({
  label,
  initial,
  onSave,
}: {
  label: string
  initial: RundownRow[]
  onSave: (rows: RundownRow[]) => Promise<void>
}) {
  const [rows, setRows] = useState<RundownRow[]>(initial)
  const [editingCell, setEditingCell] = useState<EditingCell>(null)
  const [editValue, setEditValue] = useState('')
  const [isPending, startTransition] = useTransition()

  function commitEdit() {
    if (!editingCell) return
    setRows((prev) =>
      prev.map((r) =>
        r.id === editingCell.rowId ? { ...r, [editingCell.field]: editValue } : r,
      ),
    )
    setEditingCell(null)
    setEditValue('')
  }

  function startEdit(rowId: string, field: Exclude<keyof RundownRow, 'id'>, current: string) {
    setEditingCell({ rowId, field })
    setEditValue(current)
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      { id: crypto.randomUUID(), waktu: '', kegiatan: '', pic: '', keterangan: '' },
    ])
  }

  function deleteRow(rowId: string) {
    setRows((prev) => prev.filter((r) => r.id !== rowId))
  }

  function moveRow(idx: number, dir: -1 | 1) {
    const target = idx + dir
    if (target < 0 || target >= rows.length) return
    const next = [...rows]
    ;[next[idx], next[target]] = [next[target], next[idx]]
    setRows(next)
  }

  function handleSave() {
    startTransition(async () => { await onSave(rows) })
  }

  const isEditing = (rowId: string, field: string) =>
    editingCell?.rowId === rowId && editingCell?.field === field

  return (
    <div className="bg-surface border border-border rounded-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <p className="text-[13px] font-semibold text-fg">{label}</p>
        <span className="text-[11px] text-muted bg-bg px-2 py-0.5 rounded-full border border-border">
          {rows.length} item
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-[13px] text-muted">Belum ada rundown. Klik "+ Tambah Baris" untuk mulai.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {/* Header */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-bg min-w-[420px]">
            <span className="w-14 shrink-0" />
            {RUNDOWN_COLS.map((col) => (
              <span key={col.key} className={`${col.width} text-[11px] font-semibold text-muted uppercase tracking-wider shrink-0`}>
                {col.label}
              </span>
            ))}
            <span className="w-6 shrink-0" />
          </div>

          {/* Rows */}
          {rows.map((row, idx) => (
            <div
              key={row.id}
              className={`flex items-center gap-1 px-3 py-1.5 min-w-[420px] ${idx > 0 ? 'border-t border-border' : ''}`}
            >
              {/* Reorder */}
              <div className="w-14 shrink-0 flex flex-col gap-0.5">
                <button
                  onClick={() => moveRow(idx, -1)}
                  disabled={idx === 0 || isPending}
                  className="w-6 h-5 flex items-center justify-center text-muted hover:text-fg disabled:opacity-20 text-[11px]"
                  aria-label="Naik"
                >↑</button>
                <button
                  onClick={() => moveRow(idx, 1)}
                  disabled={idx === rows.length - 1 || isPending}
                  className="w-6 h-5 flex items-center justify-center text-muted hover:text-fg disabled:opacity-20 text-[11px]"
                  aria-label="Turun"
                >↓</button>
              </div>

              {/* Cells */}
              {RUNDOWN_COLS.map((col) => (
                <div key={col.key} className={`${col.width} shrink-0`}>
                  {isEditing(row.id, col.key) ? (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); commitEdit() }
                        if (e.key === 'Escape') { setEditingCell(null); setEditValue('') }
                      }}
                      className="w-full px-1.5 py-1 border border-accent rounded-[4px] text-[12px] bg-surface text-fg outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => startEdit(row.id, col.key, row[col.key])}
                      disabled={isPending}
                      className="w-full text-left px-1.5 py-1 rounded-[4px] text-[12px] text-fg hover:bg-bg transition-colors min-h-[28px] truncate disabled:cursor-default"
                    >
                      {row[col.key] || <span className="text-subtle">—</span>}
                    </button>
                  )}
                </div>
              ))}

              {/* Delete */}
              <button
                onClick={() => deleteRow(row.id)}
                disabled={isPending}
                className="w-6 shrink-0 text-[16px] leading-none text-muted hover:text-red transition-colors disabled:opacity-40 text-center"
                aria-label="Hapus baris"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="px-4 py-3 border-t border-border flex items-center gap-2">
        <button
          onClick={addRow}
          disabled={isPending}
          className="flex-1 py-2 border border-dashed border-border rounded-input text-[13px] text-muted hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
        >
          + Tambah Baris
        </button>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-4 py-2 bg-accent text-white rounded-input text-[13px] font-semibold disabled:opacity-60 shrink-0"
        >
          {isPending ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────

interface VolEventDetailClientProps {
  event: EventDetailFull
  volDetail: EventDetailVol | null
  backUrl: string
}

export function VolEventDetailClient({ event, volDetail, backUrl }: VolEventDetailClientProps) {
  const mapSrc = (() => {
    if (!event.longlatevent) return ''
    const parts = event.longlatevent.split(',').map(Number)
    if (parts.length < 2 || parts.some(isNaN)) return ''
    return `https://maps.google.com/maps?q=${parts[0]},${parts[1]}&z=15&output=embed`
  })()

  const isApproved = event.approvenasional === '1'
  const sameDates = event.tglDisplay === event.tglSelesaiDisplay

  const infoRows = [
    { label: 'Jenis Event', value: event.jenisevent },
    { label: 'Alamat', value: event.alamatevent },
    { label: 'Jam', value: `${event.jamevent} – ${event.jamselesaievent}` },
    { label: 'Dana', value: fmtRp(event.danaevent) },
    { label: 'Target Peserta', value: `${event.targetjumlah} orang` },
    ...(event.linkevent && event.linkevent !== '0' ? [{ label: 'Link', value: event.linkevent }] : []),
  ]

  return (
    <main className="min-h-screen bg-bg pb-10">
      {/* Sticky nav */}
      <nav className="sticky top-0 z-10 bg-surface border-b border-border">
        <div className="max-w-[480px] mx-auto px-5 pt-6 pb-4 flex items-center gap-3">
          <Link href={backUrl} className="text-sm text-muted hover:text-fg transition-colors shrink-0">
            ← Kembali
          </Link>
          <p className="text-[14px] font-semibold text-fg truncate flex-1 text-center">
            Detail Event
          </p>
          {/* Spacer to balance the back link */}
          <span className="shrink-0 w-16" />
        </div>
      </nav>

      <div className="max-w-[480px] mx-auto px-4 pt-5 flex flex-col gap-4">

        {/* Header card */}
        <div className="bg-surface border border-border rounded-card p-4 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-[18px] font-bold text-fg leading-snug flex-1">{event.nama_event}</h1>
            <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
              isApproved ? 'bg-green-light text-green-dark' : 'bg-amber-light text-amber-dark'
            }`}>
              {isApproved ? 'Disetujui' : 'Belum Approve'}
            </span>
          </div>
          <p className="text-[13px] text-muted leading-relaxed">
            {event.tglDisplay}
            {!sameDates && <span> – {event.tglSelesaiDisplay}</span>}
          </p>
          {event.jamevent && (
            <p className="text-[12px] text-muted">
              {event.jamevent}{event.jamselesaievent ? ` – ${event.jamselesaievent}` : ''}
            </p>
          )}
        </div>

        {/* Poster */}
        {event.posterUrl && (
          <div className="rounded-card overflow-hidden border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.posterUrl}
              alt={`Poster ${event.nama_event}`}
              className="w-full object-cover"
            />
          </div>
        )}

        {/* Info table */}
        <div className="bg-surface border border-border rounded-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-[13px] font-semibold text-fg">Detail Event</p>
          </div>
          {infoRows.map((row, i) => (
            <div
              key={row.label}
              className={`flex gap-3 px-4 py-3 ${i > 0 ? 'border-t border-border' : ''}`}
            >
              <p className="text-[12px] text-muted w-28 shrink-0 pt-0.5">{row.label}</p>
              <p className="text-[13px] text-fg flex-1 break-words">{row.value}</p>
            </div>
          ))}
        </div>

        {/* Map */}
        {mapSrc && (
          <div className="rounded-card overflow-hidden border border-border">
            <div className="px-4 py-3 bg-surface border-b border-border">
              <p className="text-[13px] font-semibold text-fg">Lokasi Event</p>
            </div>
            <iframe
              src={mapSrc}
              width="100%"
              height="240"
              style={{ border: 0, display: 'block' }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Lokasi Event"
            />
          </div>
        )}

        {/* Peserta count summary */}
        <div className="bg-surface border border-border rounded-card px-4 py-3 flex items-center justify-between">
          <p className="text-[13px] text-fg font-medium">Peserta Terdaftar</p>
          <span className="text-[13px] font-semibold text-accent">{event.registrasi.length} orang</span>
        </div>

        {/* ── VOL-specific sections ── */}

        <div className="flex items-center gap-2 pt-2">
          <div className="flex-1 h-px bg-border" />
          <p className="text-[11px] font-semibold text-muted uppercase tracking-wider shrink-0">Data VOL</p>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Pembicara */}
        <PembicaraSection
          idEvent={event.id_event}
          initial={volDetail?.pembicara ?? []}
        />

        {/* Rundown Pra Event */}
        <RundownSection
          label="Rundown Pra Event"
          initial={volDetail?.rundown_pra ?? []}
          onSave={(rows) => upsertRundownPra(event.id_event, rows)}
        />

        {/* Rundown On Event */}
        <RundownSection
          label="Rundown On Event"
          initial={volDetail?.rundown_on ?? []}
          onSave={(rows) => upsertRundownOn(event.id_event, rows)}
        />

      </div>
    </main>
  )
}
