'use client'
import Link from 'next/link'
import { useRef, useState, useTransition, type ReactNode } from 'react'
import { cariAnggota, kirimPengumuman, type KirimResult } from '@/lib/actions/pengumuman'
import type { AnggotaOpsi } from '@/lib/push/pengumuman'
import { ANTON, BTN_SHELL, ERROR, LABEL, MONO, PANEL, PAPER_INPUT, Strip } from '@/components/pwa/paper-ui'
import { Icon, type IconName } from '@/components/pwa/ui'
import { MAKS_ISI, MAKS_JUDUL } from '@/lib/push/target'

const INPUT = PAPER_INPUT.replace('text-[16px]', 'text-[15px]')
const TAUTAN: [string, string][] = [
  ['', 'Halaman pengumuman'],
  ['/dashboard', 'Beranda'],
  ['/events', 'Events'],
  ['/dashboard/tiket', 'Tiket'],
  ['/artikel', 'Artikel'],
]

function Bagian({ no, judul, sub, children }: { no: number; judul: string; sub: string; children: ReactNode }) {
  return (
    <section className={`${PANEL} p-5 sm:p-6`}>
      <div className="flex items-start gap-3 pb-4 mb-5 border-b-2 border-dotted border-[#161616]/25">
        <span className={`${ANTON} w-9 h-9 shrink-0 -rotate-3 bg-[#161616] text-[#ffd83d] text-[18px] flex items-center justify-center rounded-[8px]`}>{no}</span>
        <div className="min-w-0">
          <h2 className={`${ANTON} text-[22px] leading-none tracking-[.01em]`}>{judul}</h2>
          <p className={`${MONO} mt-1.5 text-[11.5px] text-[#57534e]`}>{sub}</p>
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  )
}

function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <span className={`${LABEL} text-[10px] font-bold text-[#44403c]`}>{label}</span>
        {hint && <span className={`${MONO} text-[11px] text-[#57534e]`}>{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function Chips({ items, onRemove, tone = 'ink' }: { items: { key: string; label: string; redup?: boolean }[]; onRemove: (key: string) => void; tone?: 'ink' | 'gold' }) {
  if (!items.length) return null
  return (
    <div className="flex flex-wrap gap-2 mt-2.5">
      {items.map((i) => (
        <span
          key={i.key}
          className={`${MONO} inline-flex items-center gap-1.5 rounded-[6px] pl-2.5 pr-1 py-1 text-[12px] font-bold ${
            tone === 'gold' ? 'bg-[#ffd83d] text-[#161616]' : 'bg-[#161616] text-[#fbf6ec]'
          } ${i.redup ? 'opacity-60' : ''}`}
        >
          {i.label}
          <button type="button" aria-label={`Hapus ${i.label}`} onClick={() => onRemove(i.key)} className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/20">
            <Icon name="x" className="w-3.5 h-3.5" sw={2.4} />
          </button>
        </span>
      ))}
    </div>
  )
}

/** Dropdown cari nama anggota: hasil "Nama - Nama kota"; yang dipilih jadi chip. */
function CariAnggota({ dipilih, onTambah }: { dipilih: Set<number>; onTambah: (a: AnggotaOpsi) => void }) {
  const [q, setQ] = useState('')
  const [hasil, setHasil] = useState<AnggotaOpsi[]>([])
  const [buka, setBuka] = useState(false)
  const [mencari, setMencari] = useState(false)
  const [aktif, setAktif] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const seq = useRef(0)

  function ketik(v: string) {
    setQ(v)
    setBuka(true)
    setAktif(0)
    if (timer.current) clearTimeout(timer.current)
    if (v.trim().length < 2) {
      setHasil([])
      setMencari(false)
      return
    }
    setMencari(true)
    timer.current = setTimeout(async () => {
      const n = ++seq.current
      const rows = await cariAnggota(v)
      if (n !== seq.current) return
      setHasil(rows)
      setMencari(false)
    }, 250)
  }

  function pilih(a: AnggotaOpsi) {
    if (dipilih.has(a.id)) return
    onTambah(a)
    setQ('')
    setHasil([])
    setBuka(false)
  }

  return (
    <div className="relative">
      <div className="relative">
        <Icon name="search" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#57534e] pointer-events-none" />
        <input
          value={q}
          onChange={(e) => ketik(e.target.value)}
          onFocus={() => setBuka(true)}
          onBlur={() => setTimeout(() => setBuka(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setAktif((i) => Math.min(i + 1, hasil.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setAktif((i) => Math.max(i - 1, 0))
            } else if (e.key === 'Enter') {
              e.preventDefault()
              if (hasil[aktif]) pilih(hasil[aktif])
            } else if (e.key === 'Escape') setBuka(false)
          }}
          placeholder="Ketik nama anggota (min. 2 huruf)…"
          autoComplete="off"
          role="combobox"
          aria-expanded={buka}
          aria-controls="cari-anggota-list"
          className={`${INPUT} pl-10`}
        />
      </div>
      {buka && q.trim().length >= 2 && (
        <ul id="cari-anggota-list" role="listbox" className={`absolute z-30 left-0 right-0 mt-1.5 max-h-72 overflow-y-auto rounded-[10px] bg-[#fffdf7] ring-2 ring-[#161616] shadow-[0_14px_24px_-10px_rgba(40,30,10,.5)]`}>
          {mencari && <li className={`${MONO} px-4 py-3 text-[12.5px] text-[#57534e]`}>Mencari…</li>}
          {!mencari && hasil.length === 0 && <li className={`${MONO} px-4 py-3 text-[12.5px] text-[#57534e]`}>Tidak ada anggota bernama itu.</li>}
          {!mencari &&
            hasil.map((a, i) => (
              <li key={a.id} role="option" aria-selected={i === aktif}>
                <button
                  type="button"
                  disabled={dipilih.has(a.id)}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setAktif(i)}
                  onClick={() => pilih(a)}
                  className={`w-full flex items-center justify-between gap-3 text-left px-4 py-2.5 ${MONO} text-[13px] disabled:opacity-40 ${
                    i === aktif ? 'bg-[#ffd83d]/60' : ''
                  }`}
                >
                  <span className="min-w-0 truncate font-bold">{a.label}</span>
                  {dipilih.has(a.id) ? (
                    <span className={`${LABEL} shrink-0 text-[9px] text-[#57534e]`}>Dipilih</span>
                  ) : !a.punyaPerangkat ? (
                    <span className={`${LABEL} shrink-0 text-[9px] text-[#c21f24]`}>Belum aktif notif</span>
                  ) : null}
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}

function AppIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/icons/icon-192.png" alt="" className={`${className} rounded-[5px]`} />
  )
}

/** Pratinjau kasar notifikasi di iPhone dan Android; tampilan asli tergantung OS. */
function Pratinjau({ judul, isi, gambar }: { judul: string; isi: string; gambar: string | null }) {
  const t = judul.trim() || 'Judul pengumuman'
  const penuh = isi.trim() || 'Isi pengumuman tampil di sini.'
  // Notifikasi hanya membawa 180 karakter pertama; teks lengkap ada di halaman pengumuman.
  const b = penuh.length > 180 ? `${penuh.slice(0, 179)}…` : penuh
  return (
    <div className="space-y-4">
      <div>
        <p className={`${LABEL} mb-2 text-[9.5px] font-bold text-[#57534e]`}>iPhone</p>
        <div className="rounded-[18px] p-3 bg-gradient-to-br from-[#e9dcc4] via-[#f3ead9] to-[#d9cbb0]">
          <div className="rounded-[14px] bg-white/80 backdrop-blur px-3 py-2.5 shadow-sm">
            <div className="flex items-center gap-2">
              <AppIcon />
              <span className="text-[12px] font-semibold text-[#161616]/70 uppercase tracking-wide flex-1">LevelUP</span>
              <span className="text-[11px] text-[#161616]/50">sekarang</span>
            </div>
            <p className="mt-1.5 text-[14px] font-semibold text-[#161616] leading-snug break-words">{t}</p>
            <p className="text-[13.5px] text-[#161616]/85 leading-snug break-words line-clamp-4">{b}</p>
          </div>
        </div>
        {gambar && <p className={`${MONO} mt-1.5 text-[10.5px] text-[#57534e]`}>iPhone tidak menampilkan gambar di notifikasi (tetap tampil di halaman pengumuman).</p>}
      </div>
      <div>
        <p className={`${LABEL} mb-2 text-[9.5px] font-bold text-[#57534e]`}>Android</p>
        <div className="rounded-[18px] bg-[#f4f1ea] p-3">
          <div className="rounded-[14px] bg-white px-3.5 py-3 shadow-sm">
            <div className="flex items-center gap-2 text-[11.5px] text-[#161616]/60">
              <AppIcon className="w-4 h-4" />
              <span>LevelUP</span>
              <span>· sekarang</span>
            </div>
            <p className="mt-1.5 text-[14px] font-semibold text-[#161616] leading-snug break-words">{t}</p>
            <p className="text-[13.5px] text-[#161616]/75 leading-snug break-words">{b}</p>
            {gambar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={gambar} alt="" className="mt-2.5 w-full max-h-48 object-cover rounded-[10px]" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Baris({ icon, children, redup = false }: { icon: IconName; children: ReactNode; redup?: boolean }) {
  return (
    <li className={`flex items-center gap-2.5 ${MONO} text-[12.5px] ${redup ? 'text-[#57534e]/60' : 'text-[#161616]'}`}>
      <Icon name={icon} className="w-4 h-4 shrink-0" />
      {children}
    </li>
  )
}

export function Composer({ kota, awal }: { kota: { id: string; nama: string }[]; awal: AnggotaOpsi[] }) {
  const [semua, setSemua] = useState(false)
  const [kotaDipilih, setKotaDipilih] = useState<string[]>([])
  const [anggota, setAnggota] = useState<AnggotaOpsi[]>(awal)
  const [nomor, setNomor] = useState('')
  const [judul, setJudul] = useState('')
  const [isi, setIsi] = useState('')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [konfirmasi, setKonfirmasi] = useState(false)
  const [hasil, setHasil] = useState<KirimResult | null>(null)
  const [pending, start] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const namaKota = new Map(kota.map((c) => [c.id, c.nama]))

  const daftarNomor = nomor.split(/[\n,;]+/).map((n) => n.trim()).filter(Boolean)
  const adaTarget = semua || kotaDipilih.length > 0 || anggota.length > 0 || daftarNomor.length > 0
  const siapKirim = adaTarget && judul.trim().length > 0 && isi.trim().length > 0

  function gantiGambar(f: File | null) {
    if (preview) URL.revokeObjectURL(preview)
    setFile(f)
    setPreview(f ? URL.createObjectURL(f) : null)
    if (!f && fileRef.current) fileRef.current.value = ''
  }

  function reset() {
    setSemua(false)
    setKotaDipilih([])
    setAnggota([])
    setNomor('')
    setJudul('')
    setIsi('')
    setUrl('')
    gantiGambar(null)
    setKonfirmasi(false)
    setHasil(null)
  }

  function kirim() {
    if (!siapKirim || pending) return
    // Kirim ke semua tidak bisa ditarik: ketuk dua kali.
    if (semua && !konfirmasi) return setKonfirmasi(true)
    const fd = new FormData()
    fd.set('judul', judul)
    fd.set('isi', isi)
    fd.set('url', url)
    if (semua) fd.set('semua', '1')
    else {
      kotaDipilih.forEach((k) => fd.append('kota', k))
      anggota.forEach((a) => fd.append('anggota', String(a.id)))
      fd.set('nomor', nomor)
    }
    if (file) fd.set('gambar', file)
    start(async () => {
      const res = await kirimPengumuman(fd)
      setHasil(res)
      setKonfirmasi(false)
    })
  }

  const terkirim = hasil?.ok ? hasil : null

  return (
    <div className="grid gap-6 lg:gap-8 lg:grid-cols-[minmax(0,1fr)_380px] items-start">
      <div className="space-y-6 min-w-0">
        <Link href="/pengumuman" className={`${LABEL} inline-flex items-center gap-1.5 text-[11px] font-bold text-[#44403c] hover:text-[#161616]`}>
          <Icon name="chevronLeft" className="w-4 h-4" />
          Kembali ke daftar
        </Link>

        <Bagian no={1} judul="Penerima" sub="Boleh digabung: beberapa kota, anggota, dan nomor sekaligus. Penerima dobel dihitung sekali.">
          <label
            className={`flex items-start gap-3 rounded-[12px] p-4 cursor-pointer transition ${
              semua ? 'bg-[#e02a2f] text-white' : 'ring-2 ring-inset ring-[#161616]/20 hover:ring-[#161616]'
            }`}
          >
            <input
              type="checkbox"
              checked={semua}
              onChange={(e) => {
                setSemua(e.target.checked)
                setKonfirmasi(false)
              }}
              className="mt-1 w-4 h-4 accent-[#161616]"
            />
            <span>
              <span className={`${ANTON} block text-[18px] leading-none tracking-[.02em]`}>Semua anggota</span>
              <span className={`${MONO} block mt-1.5 text-[11.5px] ${semua ? 'text-white/85' : 'text-[#57534e]'}`}>
                Semua perangkat yang sudah mengaktifkan notifikasi, termasuk pengurus.
              </span>
            </span>
          </label>

          <fieldset disabled={semua} className={`space-y-5 transition ${semua ? 'opacity-35' : ''}`}>
            <div className="grid gap-5 xl:grid-cols-2">
              <Field label="Kota" hint={kotaDipilih.length ? `${kotaDipilih.length} dipilih` : undefined}>
                <select
                  value=""
                  onChange={(e) => {
                    const v = e.target.value
                    if (v && !kotaDipilih.includes(v)) setKotaDipilih((p) => [...p, v])
                  }}
                  className={INPUT}
                >
                  <option value="">+ Tambah kota…</option>
                  {kota.map((c) => (
                    <option key={c.id} value={c.id} disabled={kotaDipilih.includes(c.id)}>
                      {c.nama}
                    </option>
                  ))}
                </select>
                <Chips items={kotaDipilih.map((k) => ({ key: k, label: namaKota.get(k) ?? k }))} onRemove={(k) => setKotaDipilih((p) => p.filter((x) => x !== k))} tone="gold" />
              </Field>
              <Field label="Anggota" hint={anggota.length ? `${anggota.length} dipilih` : undefined}>
                <CariAnggota dipilih={new Set(anggota.map((a) => a.id))} onTambah={(a) => setAnggota((p) => [...p, a])} />
                <Chips
                  items={anggota.map((a) => ({ key: String(a.id), label: a.label, redup: !a.punyaPerangkat }))}
                  onRemove={(k) => setAnggota((p) => p.filter((a) => String(a.id) !== k))}
                />
              </Field>
            </div>
            <Field label="Nomor HP" hint="Satu per baris atau pisah koma">
              <textarea
                value={nomor}
                onChange={(e) => setNomor(e.target.value)}
                rows={2}
                inputMode="tel"
                placeholder="0812xxxxxxx, +62 857xxxxxxx"
                className={`${INPUT} resize-y`}
              />
            </Field>
          </fieldset>
        </Bagian>

        <Bagian no={2} judul="Isi Pengumuman" sub="Notifikasi hanya menampilkan awal isi; teks lengkap dibaca di halaman pengumuman.">
          <Field label="Judul" hint={`${judul.length}/${MAKS_JUDUL}`}>
            <input value={judul} onChange={(e) => setJudul(e.target.value)} maxLength={MAKS_JUDUL} placeholder="Contoh: WW Nasional minggu ini" className={INPUT} />
          </Field>
          <Field label="Isi" hint={`${isi.length}/${MAKS_ISI}`}>
            <textarea value={isi} onChange={(e) => setIsi(e.target.value)} maxLength={MAKS_ISI} rows={7} placeholder="Tulis pesan untuk anggota…" className={`${INPUT} resize-y`} />
          </Field>
        </Bagian>

        <Bagian no={3} judul="Gambar & Tautan" sub="Keduanya opsional. Tanpa tautan, notifikasi membuka halaman pengumuman ini.">
          <div className="grid gap-5 xl:grid-cols-2">
            <Field label="Gambar" hint="JPG / PNG / WebP, maks 4 MB">
              {preview ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Pratinjau gambar" className="w-full max-h-56 object-cover rounded-[10px] ring-1 ring-[#161616]/15" />
                  <button
                    type="button"
                    onClick={() => gantiGambar(null)}
                    className={`${LABEL} absolute top-2 right-2 bg-[#161616] text-[#fbf6ec] text-[10px] font-bold px-2.5 py-1.5 rounded-[6px]`}
                  >
                    Hapus
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 h-36 rounded-[10px] border-2 border-dashed border-[#161616]/30 hover:border-[#161616] hover:bg-[#efe8da]/50 cursor-pointer transition">
                  <Icon name="image" className="w-7 h-7 text-[#57534e]" />
                  <span className={`${MONO} text-[12px] font-bold`}>Pilih gambar</span>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(e) => gantiGambar(e.target.files?.[0] ?? null)}
                  />
                </label>
              )}
            </Field>
            <Field label="Buka halaman saat diketuk">
              <div className="flex flex-wrap gap-2 mb-2.5">
                {TAUTAN.map(([path, label]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setUrl(path)}
                    className={`${LABEL} px-2.5 py-1.5 text-[9.5px] font-bold rounded-[6px] transition ${
                      url === path ? 'bg-[#161616] text-[#ffd83d]' : 'ring-2 ring-inset ring-[#161616]/25 hover:ring-[#161616]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Kosong = halaman pengumuman" className={INPUT} />
              <p className={`${MONO} mt-2 text-[11px] text-[#57534e]`}>
                {url.trim() ? 'Halaman di app ini (diawali /). Halaman pengumuman tetap bisa dibuka dari lonceng Beranda.' : 'Notifikasi membuka halaman pengumuman: judul, gambar, dan isi lengkap.'}
              </p>
            </Field>
          </div>
        </Bagian>
      </div>

      <aside className="space-y-5 lg:sticky lg:top-6">
        <section className={`${PANEL} p-5`}>
          <p className={`${LABEL} mb-3 text-[10px] font-bold text-[#44403c]`}>Pratinjau</p>
          <Pratinjau judul={judul} isi={isi} gambar={preview} />
        </section>

        <section className={`${PANEL} relative p-5`}>
          <span aria-hidden className="absolute -top-2 right-6 rotate-3 w-14 h-4 bg-[#ffd83d]/90" />
          {terkirim ? (
            <div className="space-y-4">
              <div>
                <p className={`${LABEL} text-[10px] font-bold text-[#44403c]`}>Terkirim</p>
                <p className={`${ANTON} mt-1 text-[40px] leading-none`}>
                  {terkirim.terkirim}
                  <span className={`${MONO} text-[14px] font-bold text-[#57534e] tracking-normal`}> perangkat</span>
                </p>
                <p className={`${MONO} mt-1.5 text-[12px] text-[#57534e]`}>
                  {terkirim.cocok} penerima cocok{terkirim.gagal ? ` · ${terkirim.gagal} gagal` : ''}
                </p>
              </div>
              {terkirim.anggota.length > 0 && (
                <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                  {terkirim.anggota.map((a, i) => (
                    <li key={`${i}-${a.nama}`} className={`${MONO} flex items-center gap-2 text-[12px]`}>
                      <Icon name={a.punyaPerangkat ? 'check' : 'x'} className={`w-4 h-4 shrink-0 ${a.punyaPerangkat ? 'text-[#161616]' : 'text-[#c21f24]'}`} sw={2.4} />
                      <span className="min-w-0 truncate">{a.nama}</span>
                      {!a.punyaPerangkat && <span className="shrink-0 text-[10.5px] text-[#c21f24]">belum aktif</span>}
                    </li>
                  ))}
                </ul>
              )}
              {terkirim.nomorTakDikenal.length > 0 && <p className={ERROR}>Nomor tidak dikenal: {terkirim.nomorTakDikenal.join(', ')}</p>}
              <a
                href={`/dashboard/pengumuman/${terkirim.id}`}
                target="_blank"
                rel="noreferrer"
                className={`${LABEL} inline-flex items-center gap-1.5 text-[10.5px] font-bold underline underline-offset-4 decoration-dotted`}
              >
                <Icon name="eye" className="w-4 h-4" />
                Lihat halaman pengumuman
              </a>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/pengumuman" className={`${BTN_SHELL} block`}>
                  <Strip tone="ink" className="py-2.5 text-[15px]">Lihat daftar</Strip>
                </Link>
                <button type="button" onClick={reset} className={`${BTN_SHELL} block`}>
                  <Strip className="py-2.5 text-[15px]">Buat lagi</Strip>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className={`${LABEL} text-[10px] font-bold text-[#44403c]`}>Dikirim ke</p>
                <ul className="mt-2.5 space-y-2">
                  {semua ? (
                    <Baris icon="megaphone">
                      <b>Semua anggota & pengurus</b>
                    </Baris>
                  ) : (
                    <>
                      <Baris icon="pin" redup={!kotaDipilih.length}>{kotaDipilih.length} kota</Baris>
                      <Baris icon="user" redup={!anggota.length}>{anggota.length} anggota</Baris>
                      <Baris icon="phone" redup={!daftarNomor.length}>{daftarNomor.length} nomor</Baris>
                    </>
                  )}
                </ul>
                <p className={`${MONO} mt-3 text-[11px] text-[#57534e]`}>Hanya perangkat yang sudah mengaktifkan notifikasi yang menerima.</p>
              </div>
              {hasil && !hasil.ok && <p role="alert" className={ERROR}>{hasil.error}</p>}
              <button type="button" disabled={!siapKirim || pending} onClick={kirim} className={`block w-full ${BTN_SHELL}`}>
                <Strip tone={semua && konfirmasi ? 'ink' : 'red'} className="py-3.5 text-[19px]">
                  <Icon name="send" className="w-5 h-5" />
                  {pending ? 'Mengirim…' : semua && konfirmasi ? 'Yakin? Klik lagi' : 'Kirim Pengumuman'}
                </Strip>
              </button>
              {!siapKirim && (
                <p className={`${MONO} text-[11px] text-[#57534e]`}>
                  {!adaTarget ? 'Pilih penerima dulu.' : 'Isi judul dan isi pengumuman.'}
                </p>
              )}
              {semua && konfirmasi && (
                <button type="button" onClick={() => setKonfirmasi(false)} className={`${LABEL} w-full text-center text-[10px] font-bold text-[#57534e] underline underline-offset-4`}>
                  Batal
                </button>
              )}
            </div>
          )}
        </section>
      </aside>
    </div>
  )
}
