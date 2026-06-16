'use client'

import { useState } from 'react'
import { FilterTabs } from '@/components/kota'
import { Badge, Button } from '@/components/ui'

// ── Types ──────────────────────────────────────────────────────
type SuratMasukStatus = 'baru' | 'diproses' | 'selesai'
type SuratKeluarStatus = 'menunggu_ttd' | 'ditandatangani' | 'dikirim'

type SuratMasuk = {
  id: string
  nomor: string
  dari: string
  perihal: string
  tanggal: string
  catatan: string
  status: SuratMasukStatus
}

type SuratKeluar = {
  id: string
  nomor: string
  tanggal: string
  template: string
  fields: Record<string, string>
  status: SuratKeluarStatus
  signatories: Array<{ userId: string; signed: boolean; signedAt?: string }>
}

type SuratData = {
  suratMasuk: SuratMasuk[]
  suratKeluar: SuratKeluar[]
  nextNomor: number
}

type SuratView =
  | 'dashboard'
  | 'masuk-form'
  | 'masuk-detail'
  | 'keluar-form'
  | 'keluar-preview'
  | 'keluar-detail'

type SignatoryOption = { id: string; name: string; jabatan: string }

// ── Templates ──────────────────────────────────────────────────
type TemplateField = { id: string; label: string; ph: string; textarea?: boolean }
type Template = { name: string; icon: string; fields: TemplateField[] }

const TEMPLATES: Record<string, Template> = {
  undangan: {
    name: 'Undangan',
    icon: '✉️',
    fields: [
      { id: 'kepada',       label: 'Kepada',         ph: 'Nama penerima undangan' },
      { id: 'perihal',      label: 'Perihal',         ph: 'Undangan Rapat Koordinasi' },
      { id: 'acara',        label: 'Nama Acara',      ph: 'Rapat Koordinasi ALK' },
      { id: 'tanggalAcara', label: 'Tanggal Acara',   ph: 'Sabtu, 7 Juni 2026' },
      { id: 'tempatAcara',  label: 'Tempat',          ph: 'Aula FTIF Lt. 3' },
      { id: 'isi',          label: 'Catatan Tambahan', ph: 'Keterangan atau catatan acara...', textarea: true },
    ],
  },
  permohonan: {
    name: 'Permohonan',
    icon: '📋',
    fields: [
      { id: 'kepada',  label: 'Kepada',           ph: 'Dekan FTIF' },
      { id: 'perihal', label: 'Perihal',           ph: 'Permohonan Penggunaan Ruang' },
      { id: 'isi',     label: 'Isi Permohonan',   ph: 'Kami bermohon...', textarea: true },
    ],
  },
  pemberitahuan: {
    name: 'Pemberitahuan',
    icon: '📢',
    fields: [
      { id: 'kepada',  label: 'Kepada',                ph: 'Seluruh Pengurus ALK' },
      { id: 'perihal', label: 'Perihal',                ph: 'Pemberitahuan Kegiatan' },
      { id: 'isi',     label: 'Isi Pemberitahuan', ph: 'Dengan hormat kami beritahukan...', textarea: true },
    ],
  },
  keputusan: {
    name: 'Keputusan',
    icon: '⚖️',
    fields: [
      { id: 'kepada',           label: 'Kepada',           ph: 'Seluruh Anggota' },
      { id: 'perihal',          label: 'Perihal',           ph: 'Keputusan Pengurus' },
      { id: 'nominalKeputusan', label: 'Nomor Keputusan',  ph: 'KEP-001/ALK/V/2026' },
      { id: 'isi',              label: 'Isi Keputusan',    ph: 'Memutuskan...', textarea: true },
    ],
  },
}

const INITIAL_DATA: SuratData = { suratMasuk: [], suratKeluar: [], nextNomor: 1 }

// ── Helpers ────────────────────────────────────────────────────
const ID_MONTHS = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
]

function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()} ${ID_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function mkInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

// ── Icons ──────────────────────────────────────────────────────
function ChevronIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  )
}

function CheckIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function InboxIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
    </svg>
  )
}

function PenIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

// ── Status badge helper ────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: 'accent' | 'green' | 'amber' | 'neutral'; label: string }> = {
    baru:           { variant: 'accent',  label: 'Baru' },
    diproses:       { variant: 'amber',   label: 'Diproses' },
    selesai:        { variant: 'green',   label: 'Selesai' },
    menunggu_ttd:   { variant: 'amber',   label: 'Menunggu TTD' },
    ditandatangani: { variant: 'green',   label: 'Ditandatangani' },
    dikirim:        { variant: 'accent',  label: 'Dikirim' },
  }
  const m = map[status] ?? { variant: 'neutral' as const, label: status }
  return <Badge variant={m.variant}>{m.label}</Badge>
}

// ── LetterPaper ────────────────────────────────────────────────
type SigWithMeta = { userId: string; signed: boolean; signedAt?: string; name: string; jabatan: string }

function LetterPaper({
  nomor, tanggal, fields, templateKey, signatories, orgName,
}: {
  nomor: string
  tanggal: string
  fields: Record<string, string>
  templateKey: string
  signatories: SigWithMeta[]
  orgName: string
}) {
  const tmpl = TEMPLATES[templateKey]
  const allSigned = signatories.length > 0 && signatories.every((s) => s.signed)

  return (
    <div style={{
      background: '#fff',
      fontFamily: 'DM Sans, sans-serif',
      minWidth: 400,
      padding: '32px 36px',
      fontSize: 11,
      lineHeight: 1.65,
      color: '#1c1917',
    }}>
      {/* Letterhead */}
      <div style={{ borderBottom: '2px solid #1c1917', paddingBottom: 10, marginBottom: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{orgName}</div>
        <div style={{ fontSize: 10, color: '#78716c', marginTop: 2 }}>Sekretariat: Gedung FTIF, Kampus ITS Sukolilo, Surabaya</div>
      </div>

      {/* Nomor & date */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontSize: 10.5 }}>
        <span>No. : {nomor || '—'}</span>
        <span>Surabaya, {fmtDate(tanggal)}</span>
      </div>

      {/* Kepada & Perihal */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ minWidth: 76 }}>Kepada Yth.</span>
          <span style={{ fontWeight: 600 }}>: {fields.kepada || '...'}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ minWidth: 76 }}>Hal</span>
          <span>: {fields.perihal || tmpl?.name || '...'}</span>
        </div>
      </div>

      <p style={{ marginBottom: 12 }}>Dengan hormat,</p>

      {/* Template body */}
      {templateKey === 'undangan' && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ marginBottom: 8 }}>
            Sehubungan dengan hal tersebut, kami mengundang Bapak/Ibu/Saudara{fields.kepada ? ` ${fields.kepada}` : ''} untuk hadir dalam kegiatan berikut:
          </p>
          <div style={{ margin: '8px 0 8px 20px', borderLeft: '2px solid #e7e5e4', paddingLeft: 12 }}>
            <div><span style={{ minWidth: 88, display: 'inline-block' }}>Acara</span>: {fields.acara || '...'}</div>
            <div><span style={{ minWidth: 88, display: 'inline-block' }}>Tanggal</span>: {fields.tanggalAcara || '...'}</div>
            <div><span style={{ minWidth: 88, display: 'inline-block' }}>Tempat</span>: {fields.tempatAcara || '...'}</div>
          </div>
          {fields.isi && <p style={{ marginTop: 8 }}>{fields.isi}</p>}
        </div>
      )}
      {['permohonan', 'pemberitahuan', 'keputusan'].includes(templateKey) && (
        <p style={{ marginBottom: 12, whiteSpace: 'pre-wrap' }}>{fields.isi || '...'}</p>
      )}

      <p style={{ marginBottom: 24 }}>
        Demikian surat ini kami sampaikan. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.
      </p>

      {/* Signatures */}
      <div style={{ display: 'flex', gap: 24 }}>
        {signatories.length > 0 ? signatories.map((sig, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 10 }}>{sig.jabatan}</div>
            <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {sig.signed ? (
                allSigned ? (
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    border: '2px solid oklch(0.55 0.15 155)',
                    background: 'oklch(0.94 0.06 155)',
                    color: 'oklch(0.42 0.14 155)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 9,
                  }}>
                    ✓ QR
                  </div>
                ) : (
                  <span style={{ fontSize: 16, color: 'oklch(0.55 0.15 155)' }}>✓</span>
                )
              ) : (
                <div style={{ width: 80, borderBottom: '1px dashed #e7e5e4' }}/>
              )}
            </div>
            <div style={{ width: 100, borderBottom: '1px solid #1c1917', margin: '0 auto 4px' }}/>
            <div style={{ fontWeight: 600, fontSize: 10.5 }}>{sig.name}</div>
          </div>
        )) : (
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 10 }}>Ketua ALK</div>
            <div style={{ height: 52 }}/>
            <div style={{ width: 100, borderBottom: '1px solid #1c1917', margin: '0 auto 4px' }}/>
            <div style={{ fontWeight: 600, fontSize: 10.5 }}>—</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Mail row ───────────────────────────────────────────────────
function MailRow({
  surat, type, onClick,
}: {
  surat: SuratMasuk | SuratKeluar
  type: 'masuk' | 'keluar'
  onClick: () => void
}) {
  const isMasuk = type === 'masuk'
  const perihal = isMasuk
    ? (surat as SuratMasuk).perihal
    : (surat as SuratKeluar).fields?.perihal ?? '—'
  const sub = isMasuk
    ? (surat as SuratMasuk).dari
    : `Template: ${TEMPLATES[(surat as SuratKeluar).template]?.name ?? '—'}`

  return (
    <button
      onClick={onClick}
      className="w-full flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-bg text-left border-t border-border first:border-t-0"
    >
      <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center text-[18px] flex-shrink-0 mt-0.5 ${isMasuk ? 'bg-accent-light' : 'bg-amber-light'}`}>
        {isMasuk ? '📥' : '📤'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-muted font-medium">{surat.nomor}</div>
        <div className="text-[14px] font-semibold text-fg truncate mt-0.5">{perihal}</div>
        <div className="text-[12px] text-muted truncate">{sub}</div>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-2">
        <StatusBadge status={surat.status}/>
        <span className="text-[11px] text-subtle">{fmtDate(surat.tanggal)}</span>
      </div>
    </button>
  )
}

// ── TopNav ─────────────────────────────────────────────────────
function TopNav({
  title, subtitle, onBack,
}: {
  title: string
  subtitle?: string
  onBack?: () => void
}) {
  return (
    <div className="sticky top-0 z-[100] bg-surface border-b border-border flex items-center gap-3 px-4 h-14">
      {onBack && (
        <button
          onClick={onBack}
          className="w-9 h-9 bg-bg rounded-[10px] border-none cursor-pointer flex items-center justify-center text-accent flex-shrink-0 hover:bg-accent-light transition-colors"
        >
          <ChevronIcon size={20}/>
        </button>
      )}
      <div className="flex-1">
        <div className="text-[17px] font-semibold text-fg">{title}</div>
        {subtitle && <div className="text-[11px] text-muted mt-px">{subtitle}</div>}
      </div>
    </div>
  )
}

const INPUT_CLS =
  'w-full px-3.5 py-3 border-[1.5px] border-border rounded-input text-[15px] bg-surface text-fg outline-none focus:border-accent transition-colors font-sans'

// ── DashboardView ──────────────────────────────────────────────
function DashboardView({
  data, navigate,
}: {
  data: SuratData
  navigate: (v: SuratView, params?: Record<string, unknown>) => void
}) {
  const [listTab, setListTab] = useState<'masuk' | 'keluar'>('masuk')
  const pending = data.suratKeluar.filter((s) => s.status === 'menunggu_ttd')

  const filterTabs = [
    { key: 'masuk',  label: 'Surat Masuk',  count: data.suratMasuk.length },
    { key: 'keluar', label: 'Surat Keluar', count: data.suratKeluar.length },
  ]

  return (
    <div className="max-w-[480px] mx-auto px-4 flex flex-col gap-4 pb-6">
      <div className="pt-5">
        <h1 className="text-[22px] font-bold text-fg">Surat Menyurat</h1>
        <p className="text-[12px] text-muted mt-0.5">Kelola surat masuk dan keluar</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {([
          { label: 'Surat Masuk',  val: data.suratMasuk.length,  extra: '' },
          { label: 'Surat Keluar', val: data.suratKeluar.length, extra: '' },
          { label: 'Menunggu TTD', val: pending.length,          extra: pending.length ? 'text-amber-dark' : '' },
        ] as const).map(({ label, val, extra }) => (
          <div key={label} className="bg-surface border border-border rounded-card p-3.5 flex flex-col gap-1">
            <div className="text-[10px] text-muted uppercase tracking-wider leading-tight">{label}</div>
            <div className={`text-[22px] font-bold ${extra || 'text-fg'}`}>{val}</div>
          </div>
        ))}
      </div>

      {/* Pending banner */}
      {pending.length > 0 && (
        <button
          onClick={() => navigate('keluar-detail', { suratId: pending[0].id })}
          className="w-full bg-amber-light rounded-card px-4 py-3 flex items-center gap-3 text-left border-none cursor-pointer hover:opacity-80 transition-opacity"
        >
          <span className="text-[20px]">⏳</span>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-fg">Menunggu Tanda Tangan</div>
            <div className="text-[12px] text-muted mt-0.5 truncate">"{pending[0].fields?.perihal}"</div>
          </div>
          <span className="text-muted flex-shrink-0"><ChevronIcon size={16}/></span>
        </button>
      )}

      {/* Action grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => navigate('masuk-form')}
          className="bg-surface border border-border rounded-card p-3.5 flex flex-col items-start gap-2 cursor-pointer text-left transition-all hover:border-accent hover:bg-accent-light active:scale-[.98] font-sans"
        >
          <div className="w-9 h-9 rounded-[10px] bg-accent-light text-accent flex items-center justify-center">
            <InboxIcon/>
          </div>
          <span className="text-[13px] font-semibold text-fg leading-tight">Catat Surat Masuk</span>
        </button>
        <button
          onClick={() => navigate('keluar-form')}
          className="bg-surface border border-border rounded-card p-3.5 flex flex-col items-start gap-2 cursor-pointer text-left transition-all hover:border-accent hover:bg-accent-light active:scale-[.98] font-sans"
        >
          <div className="w-9 h-9 rounded-[10px] bg-amber-light text-amber-dark flex items-center justify-center">
            <PenIcon/>
          </div>
          <span className="text-[13px] font-semibold text-fg leading-tight">Buat Surat Keluar</span>
        </button>
      </div>

      {/* List */}
      <div>
        <FilterTabs tabs={filterTabs} active={listTab} onChange={(k) => setListTab(k as 'masuk' | 'keluar')}/>
        <div className="mt-3 bg-surface border border-border rounded-card overflow-hidden">
          {listTab === 'masuk' ? (
            data.suratMasuk.length === 0 ? (
              <div className="text-center py-10 text-muted">
                <div className="text-[32px] mb-2">📭</div>
                <div className="text-[14px]">Belum ada surat masuk</div>
              </div>
            ) : data.suratMasuk.map((s) => (
              <MailRow key={s.id} surat={s} type="masuk" onClick={() => navigate('masuk-detail', { suratId: s.id })}/>
            ))
          ) : (
            data.suratKeluar.length === 0 ? (
              <div className="text-center py-10 text-muted">
                <div className="text-[32px] mb-2">📭</div>
                <div className="text-[14px]">Belum ada surat keluar</div>
              </div>
            ) : data.suratKeluar.map((s) => (
              <MailRow key={s.id} surat={s} type="keluar" onClick={() => navigate('keluar-detail', { suratId: s.id })}/>
            ))
          )}
        </div>
      </div>
      <div className="h-5"/>
    </div>
  )
}

// ── MasukFormView ──────────────────────────────────────────────
function MasukFormView({
  data, setData, navigate,
}: {
  data: SuratData
  setData: (d: SuratData) => void
  navigate: (v: SuratView, params?: Record<string, unknown>) => void
}) {
  const [nomor, setNomor] = useState('')
  const [dari, setDari] = useState('')
  const [perihal, setPerihal] = useState('')
  const [tanggal, setTanggal] = useState(todayISO())
  const [catatan, setCatatan] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setData({
      ...data,
      suratMasuk: [
        { id: 'sm' + Date.now(), nomor, dari, perihal, tanggal, catatan, status: 'baru' },
        ...data.suratMasuk,
      ],
    })
    navigate('dashboard')
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <TopNav title="Catat Surat Masuk" onBack={() => navigate('dashboard')}/>
      <div className="max-w-[480px] mx-auto px-4 w-full">
        <form onSubmit={submit} className="flex flex-col gap-4 pt-4 pb-24">
          {([
            ['Nomor Surat',      nomor,   setNomor,   '001/FTIF/V/2026'],
            ['Dari / Pengirim',  dari,    setDari,    'Dekanat FTIF'],
            ['Perihal',          perihal, setPerihal, 'Undangan Rapat Koordinasi'],
          ] as [string, string, (v: string) => void, string][]).map(([label, val, set, ph]) => (
            <div key={label} className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-fg2">{label}</label>
              <input
                className={INPUT_CLS}
                type="text"
                placeholder={ph}
                value={val}
                onChange={(e) => set(e.target.value)}
                required
              />
            </div>
          ))}

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-fg2">Tanggal Surat</label>
            <input className={INPUT_CLS} type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} required/>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-fg2">
              Catatan / Disposisi{' '}
              <span className="text-muted font-normal">(opsional)</span>
            </label>
            <textarea
              className={`${INPUT_CLS} resize-y min-h-[80px]`}
              placeholder="Catatan disposisi atau keterangan..."
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
            />
          </div>

          <Button type="submit" variant="primary" fullWidth size="lg">
            Simpan Surat Masuk
          </Button>
        </form>
      </div>
    </div>
  )
}

// ── MasukDetailView ────────────────────────────────────────────
function MasukDetailView({
  data, setData, navigate, suratId,
}: {
  data: SuratData
  setData: (d: SuratData) => void
  navigate: (v: SuratView, params?: Record<string, unknown>) => void
  suratId: string
}) {
  const s = data.suratMasuk.find((x) => x.id === suratId)

  if (!s) {
    return (
      <div className="min-h-screen bg-bg">
        <TopNav title="Tidak Ditemukan" onBack={() => navigate('dashboard')}/>
      </div>
    )
  }

  const STATUS_LIST: SuratMasukStatus[] = ['baru', 'diproses', 'selesai']
  const STATUS_LABELS: Record<SuratMasukStatus, string> = { baru: 'Baru', diproses: 'Diproses', selesai: 'Selesai' }

  function setStatus(st: SuratMasukStatus) {
    setData({
      ...data,
      suratMasuk: data.suratMasuk.map((x) => (x.id === s!.id ? { ...x, status: st } : x)),
    })
  }

  return (
    <div className="min-h-screen bg-bg">
      <TopNav title="Detail Surat Masuk" onBack={() => navigate('dashboard')}/>
      <div className="max-w-[480px] mx-auto px-4 flex flex-col gap-4 pt-4 pb-6">

        <div className="bg-surface border border-border rounded-card overflow-hidden">
          <div className="p-4">
            <div className="flex justify-between items-start mb-2.5">
              <StatusBadge status={s.status}/>
              <span className="text-[12px] text-muted">{fmtDate(s.tanggal)}</span>
            </div>
            <div className="text-[17px] font-bold text-fg mb-1 leading-snug">{s.perihal}</div>
            <div className="text-[13px] text-muted">Nomor: {s.nomor}</div>
            <div className="text-[13px] text-muted mt-0.5">Dari: {s.dari}</div>
          </div>
          {s.catatan && (
            <div className="border-t border-border px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">Catatan Disposisi</div>
              <div className="text-[13px] text-fg">{s.catatan}</div>
            </div>
          )}
        </div>

        <div>
          <div className="text-[15px] font-semibold text-fg mb-2.5">Ubah Status</div>
          <div className="flex gap-2">
            {STATUS_LIST.map((st) => (
              <button
                key={st}
                onClick={() => setStatus(st)}
                className={`flex-1 py-2.5 px-1 border-[1.5px] rounded-[10px] text-[12px] font-semibold transition-all font-sans ${
                  s.status === st
                    ? 'border-accent bg-accent-light text-accent-dark'
                    : 'border-border bg-surface text-muted hover:border-accent/40'
                }`}
              >
                {STATUS_LABELS[st]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── KeluarFormView ─────────────────────────────────────────────
function KeluarFormView({
  data, navigate,
}: {
  data: SuratData
  navigate: (v: SuratView, params?: Record<string, unknown>) => void
}) {
  const [tmplKey, setTmplKey] = useState<string | null>(null)
  const [fields, setFields] = useState<Record<string, string>>({})
  const [nomor, setNomor] = useState(
    `${String(data.nextNomor).padStart(3, '0')}/ALK/${['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'][new Date().getMonth()]}/${new Date().getFullYear()}`
  )
  const [tanggal, setTanggal] = useState(todayISO())

  const tmpl = tmplKey ? TEMPLATES[tmplKey] : null
  const setF = (id: string, v: string) => setFields((p) => ({ ...p, [id]: v }))

  function handlePreview(e: React.FormEvent) {
    e.preventDefault()
    navigate('keluar-preview', { draft: { template: tmplKey, fields, nomor, tanggal } })
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <TopNav title="Buat Surat Keluar" onBack={() => navigate('dashboard')}/>
      <div className="max-w-[480px] mx-auto px-4 w-full">

        {!tmplKey ? (
          <div className="flex flex-col gap-4 pt-4">
            <div className="text-[15px] font-semibold text-fg">Pilih Template Surat</div>
            <div className="grid grid-cols-2 gap-2.5">
              {Object.entries(TEMPLATES).map(([k, t]) => (
                <button
                  key={k}
                  onClick={() => { setTmplKey(k); setFields({}) }}
                  className="p-4 border-[1.5px] border-border rounded-card cursor-pointer transition-all text-left bg-surface hover:border-accent hover:bg-accent-light active:scale-[.98] font-sans"
                >
                  <div className="text-[26px] mb-2">{t.icon}</div>
                  <div className="text-[14px] font-bold text-fg">Surat {t.name}</div>
                  <div className="text-[12px] text-muted mt-1">{t.fields.length} isian</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handlePreview} className="flex flex-col gap-4 pt-4 pb-24">
            {/* Template bar */}
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-accent-light rounded-[12px]">
              <span className="text-[18px]">{tmpl!.icon}</span>
              <div className="flex-1 text-[14px] font-semibold text-accent-dark">Surat {tmpl!.name}</div>
              <button
                type="button"
                onClick={() => setTmplKey(null)}
                className="text-[12px] text-accent bg-transparent border-none cursor-pointer font-semibold font-sans"
              >
                Ganti ›
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-fg2">Nomor Surat</label>
              <input className={INPUT_CLS} value={nomor} onChange={(e) => setNomor(e.target.value)} required/>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-fg2">Tanggal Surat</label>
              <input className={INPUT_CLS} type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} required/>
            </div>

            {tmpl!.fields.map((f) => (
              <div key={f.id} className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-fg2">{f.label}</label>
                {f.textarea ? (
                  <textarea
                    className={`${INPUT_CLS} resize-y min-h-[80px]`}
                    placeholder={f.ph}
                    value={fields[f.id] ?? ''}
                    onChange={(e) => setF(f.id, e.target.value)}
                  />
                ) : (
                  <input
                    className={INPUT_CLS}
                    type="text"
                    placeholder={f.ph}
                    value={fields[f.id] ?? ''}
                    onChange={(e) => setF(f.id, e.target.value)}
                    required
                  />
                )}
              </div>
            ))}

            <Button type="submit" variant="primary" fullWidth size="lg">
              Preview Surat →
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

// ── KeluarPreviewView ──────────────────────────────────────────
type DraftPayload = {
  template: string
  fields: Record<string, string>
  nomor: string
  tanggal: string
}

function KeluarPreviewView({
  data, setData, navigate, draft, signatoryOptions,
}: {
  data: SuratData
  setData: (d: SuratData) => void
  navigate: (v: SuratView, params?: Record<string, unknown>) => void
  draft: DraftPayload
  signatoryOptions: SignatoryOption[]
}) {
  const [sigIds, setSigIds] = useState<string[]>([])

  function toggle(id: string) {
    setSigIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }

  function submit() {
    const s: SuratKeluar = {
      id: 'sk' + Date.now(),
      nomor: draft.nomor,
      tanggal: draft.tanggal,
      template: draft.template,
      fields: draft.fields,
      status: 'menunggu_ttd',
      signatories: sigIds.map((id) => ({ userId: id, signed: false })),
    }
    setData({ ...data, suratKeluar: [s, ...data.suratKeluar], nextNomor: data.nextNomor + 1 })
    navigate('keluar-detail', { suratId: s.id })
  }

  const previewSigs: SigWithMeta[] = sigIds.map((id) => {
    const u = signatoryOptions.find((x) => x.id === id)
    return { userId: id, signed: false, name: u?.name ?? id, jabatan: u?.jabatan ?? '' }
  })

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <TopNav title="Preview & Kirim" subtitle={draft.nomor} onBack={() => navigate('keluar-form')}/>
      <div className="max-w-[480px] mx-auto px-4 flex flex-col gap-4 pt-4 pb-24 w-full">

        {/* Letter paper */}
        <div className="bg-[#ddd9d3] rounded-[16px] p-3.5 overflow-x-auto">
          <div style={{ boxShadow: '0 4px 28px rgba(0,0,0,.15)' }}>
            <LetterPaper
              nomor={draft.nomor}
              tanggal={draft.tanggal}
              fields={draft.fields}
              templateKey={draft.template}
              signatories={previewSigs}
              orgName="ALK ITS"
            />
          </div>
        </div>

        {/* Signatory picker */}
        <div>
          <div className="text-[15px] font-semibold text-fg mb-1">Pilih Penandatangan</div>
          <div className="text-[13px] text-muted mb-3">QR stamp otomatis muncul setelah semua menyetujui</div>
          <div className="flex flex-col gap-2">
            {signatoryOptions.map((s) => (
              <button
                key={s.id}
                onClick={() => toggle(s.id)}
                className={`flex items-center gap-3 px-3.5 py-3 border-[1.5px] rounded-[12px] cursor-pointer transition-all text-left font-sans ${
                  sigIds.includes(s.id)
                    ? 'border-accent bg-accent-light'
                    : 'border-border bg-surface hover:border-accent/40'
                }`}
              >
                <div className="w-[38px] h-[38px] rounded-[10px] bg-accent-light text-accent-dark flex items-center justify-center text-[13px] font-bold flex-shrink-0">
                  {mkInitials(s.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-fg">{s.name}</div>
                  <div className="text-[12px] text-muted">{s.jabatan}</div>
                </div>
                {sigIds.includes(s.id) && (
                  <span className="text-accent flex-shrink-0"><CheckIcon/></span>
                )}
              </button>
            ))}
          </div>
        </div>

        <Button
          variant="primary"
          fullWidth
          size="lg"
          onClick={submit}
          disabled={sigIds.length === 0}
        >
          {sigIds.length
            ? `Kirim untuk Ditandatangani (${sigIds.length} orang)`
            : 'Pilih penandatangan terlebih dahulu'}
        </Button>
      </div>
    </div>
  )
}

// ── KeluarDetailView ───────────────────────────────────────────
function KeluarDetailView({
  data, setData, navigate, suratId, signatoryOptions,
}: {
  data: SuratData
  setData: (d: SuratData) => void
  navigate: (v: SuratView, params?: Record<string, unknown>) => void
  suratId: string
  signatoryOptions: SignatoryOption[]
}) {
  const s = data.suratKeluar.find((x) => x.id === suratId)

  if (!s) {
    return (
      <div className="min-h-screen bg-bg">
        <TopNav title="Tidak Ditemukan" onBack={() => navigate('dashboard')}/>
      </div>
    )
  }

  function sign(userId: string) {
    const newSigs = s!.signatories.map((x) =>
      x.userId === userId ? { ...x, signed: true, signedAt: todayISO() } : x
    )
    const allSigned = newSigs.every((x) => x.signed)
    setData({
      ...data,
      suratKeluar: data.suratKeluar.map((x) =>
        x.id === s!.id
          ? { ...x, signatories: newSigs, status: allSigned ? 'ditandatangani' : 'menunggu_ttd' }
          : x
      ),
    })
  }

  const sigsWithNames: SigWithMeta[] = s.signatories.map((sig) => {
    const u = signatoryOptions.find((x) => x.id === sig.userId)
    return { ...sig, name: u?.name ?? sig.userId, jabatan: u?.jabatan ?? '' }
  })

  return (
    <div className="min-h-screen bg-bg">
      <TopNav title="Detail Surat Keluar" subtitle={s.nomor} onBack={() => navigate('dashboard')}/>
      <div className="max-w-[480px] mx-auto px-4 flex flex-col gap-4 pt-4 pb-6">

        {/* Meta */}
        <div className="bg-surface border border-border rounded-card overflow-hidden">
          <div className="p-4">
            <div className="flex justify-between items-start mb-2.5">
              <StatusBadge status={s.status}/>
              <span className="text-[12px] text-muted">{fmtDate(s.tanggal)}</span>
            </div>
            <div className="text-[17px] font-bold text-fg mb-1 leading-snug">{s.fields?.perihal}</div>
            <div className="text-[13px] text-muted">Kepada: {s.fields?.kepada}</div>
            <div className="text-[12px] text-muted mt-0.5">
              Template: Surat {TEMPLATES[s.template]?.name}
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div>
          <div className="text-[15px] font-semibold text-fg mb-2.5">Status Tanda Tangan</div>
          {s.signatories.length === 0 ? (
            <p className="text-[13px] text-muted">Tidak ada penandatangan</p>
          ) : (
            <div className="flex flex-col gap-2">
              {sigsWithNames.map((sig, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-3.5 py-3 border-[1.5px] rounded-[12px] transition-all ${
                    sig.signed ? 'border-green bg-green-light' : 'border-border bg-surface'
                  }`}
                >
                  <div
                    className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-[13px] font-bold flex-shrink-0 ${
                      sig.signed ? 'bg-green-light text-green' : 'bg-accent-light text-accent-dark'
                    }`}
                  >
                    {mkInitials(sig.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-fg">{sig.name}</div>
                    <div className="text-[12px] text-muted">
                      {sig.jabatan}{sig.signedAt ? ` · ${fmtDate(sig.signedAt)}` : ''}
                    </div>
                  </div>
                  {sig.signed ? (
                    <span className="text-green flex-shrink-0"><CheckIcon/></span>
                  ) : (
                    <button
                      onClick={() => sign(sig.userId)}
                      className="px-3.5 py-2 bg-accent text-white border-none rounded-[8px] text-[13px] font-semibold cursor-pointer hover:opacity-90 font-sans whitespace-nowrap flex-shrink-0"
                    >
                      Tandatangani
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All-signed banner */}
        {s.status === 'ditandatangani' && (
          <div className="bg-green-light border border-green rounded-card px-4 py-3 flex items-center gap-3">
            <span className="text-[20px]">✅</span>
            <div>
              <div className="text-[13px] font-semibold text-green-dark">Surat telah ditandatangani</div>
              <div className="text-[12px] text-green">QR stamp sudah terpasang otomatis di surat</div>
            </div>
          </div>
        )}

        {/* Letter preview */}
        <div className="text-[15px] font-semibold text-fg">Pratinjau Surat</div>
        <div className="bg-[#ddd9d3] rounded-[16px] p-3.5 overflow-x-auto">
          <div style={{ boxShadow: '0 4px 28px rgba(0,0,0,.15)' }}>
            <LetterPaper
              nomor={s.nomor}
              tanggal={s.tanggal}
              fields={s.fields}
              templateKey={s.template}
              signatories={sigsWithNames}
              orgName="ALK ITS"
            />
          </div>
        </div>

        <div className="h-5"/>
      </div>
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────
interface SuratTabProps {
  pengurus: {
    id_pengurus: number
    nama: string
    kotalevelup: string
    divisi: string | null
  }
}

export function SuratTab({ pengurus }: SuratTabProps) {
  const [data, setData] = useState<SuratData>(INITIAL_DATA)
  const [view, setView] = useState<SuratView>('dashboard')
  const [viewParams, setViewParams] = useState<Record<string, unknown>>({})

  const signatoryOptions: SignatoryOption[] = [
    {
      id: String(pengurus.id_pengurus),
      name: pengurus.nama,
      jabatan: `Ketua ALK · ${pengurus.kotalevelup}`,
    },
    {
      id: 'pembina',
      name: 'Pembina ALK',
      jabatan: 'Dosen Pembimbing',
    },
  ]

  function navigate(v: SuratView, params: Record<string, unknown> = {}) {
    setView(v)
    setViewParams(params)
  }

  if (view === 'masuk-form') {
    return <MasukFormView data={data} setData={setData} navigate={navigate}/>
  }
  if (view === 'masuk-detail') {
    return (
      <MasukDetailView
        data={data} setData={setData} navigate={navigate}
        suratId={viewParams.suratId as string}
      />
    )
  }
  if (view === 'keluar-form') {
    return <KeluarFormView data={data} navigate={navigate}/>
  }
  if (view === 'keluar-preview') {
    return (
      <KeluarPreviewView
        data={data} setData={setData} navigate={navigate}
        draft={viewParams.draft as DraftPayload}
        signatoryOptions={signatoryOptions}
      />
    )
  }
  if (view === 'keluar-detail') {
    return (
      <KeluarDetailView
        data={data} setData={setData} navigate={navigate}
        suratId={viewParams.suratId as string}
        signatoryOptions={signatoryOptions}
      />
    )
  }

  return <DashboardView data={data} navigate={navigate}/>
}
