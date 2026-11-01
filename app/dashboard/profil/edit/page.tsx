'use client'
import { useEffect, useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { getPesertaById, getMemberCardForPeserta } from '@/lib/actions/peserta'
import { upsertJobsPlace } from '@/lib/actions/jobs-place'
import { updatePesertaProfile } from '@/lib/actions/registrasi'
import { getCabangs, type CabangOption } from '@/lib/actions/event'
import {
  ajukanPindahKota,
  batalPindahKota,
  getPindahKotaForMe,
  type PindahKotaMine,
} from '@/lib/actions/pindah-kota'
import {
  listDesa,
  listKabupaten,
  listKecamatan,
  listProvinsi,
  type WilayahOption,
} from '@/lib/actions/wilayah'
import {
  ANTON,
  BTN,
  Chip,
  ERROR,
  IconButton,
  LABEL,
  MONO,
  PAPER_INPUT,
  PAPER_INPUT_LOCKED,
  PaperField,
  PaperHeader,
  PaperMain,
  PaperNote,
  PaperSection,
  PRESS,
  Strip,
} from '@/components/pwa/paper-ui'
import { Icon, Sheet, SheetHead } from '@/components/pwa/ui'

const BTN_LINE = `${ANTON} flex-1 py-2.5 rounded-sm ring-2 text-[15px] tracking-[.03em] disabled:opacity-50 ${PRESS}`
const STAMP = `${MONO} shrink-0 -rotate-6 rounded-[4px] px-2 py-1 text-[9.5px] font-bold uppercase`

function WilayahSelect({
  label,
  placeholder,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string
  placeholder: string
  value: string
  options: WilayahOption[]
  disabled?: boolean
  onChange: (id: string) => void
}) {
  return (
    <PaperField label={label}>
      <select className={`${PAPER_INPUT} ${value ? '' : 'text-[#57534e]'}`} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id} className="text-[#161616]">
            {o.nama}
          </option>
        ))}
      </select>
    </PaperField>
  )
}

function toDateInput(raw: string): string {
  const s = raw.trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  const m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  return ''
}

function normalizeGender(g: string): 'L' | 'P' {
  if (g === 'P' || g === 'Perempuan' || g.toLowerCase() === 'p') return 'P'
  return 'L'
}

export default function ProfilEditPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [idPeserta, setIdPeserta] = useState<number | null>(null)
  const [email, setEmail] = useState('')
  const [kotaName, setKotaName] = useState('—')
  const [nama, setNama] = useState('')
  const [gender, setGender] = useState<'L' | 'P'>('L')
  const [tempatlahir, setTempatlahir] = useState('')
  const [tgllahir, setTgllahir] = useState('')
  const [nowa, setNowa] = useState('')
  const [provinsi, setProvinsi] = useState('')
  const [kabupaten, setKabupaten] = useState('')
  const [kecamatan, setKecamatan] = useState('')
  const [desa, setDesa] = useState('')
  const [alamat, setAlamat] = useState('')
  const [gereja, setGereja] = useState('')
  const [sekolah, setSekolah] = useState('')
  const [pendidikan, setPendidikan] = useState('')
  const [jurusan, setJurusan] = useState('')

  const [provinsiOpts, setProvinsiOpts] = useState<WilayahOption[]>([])
  const [kabupatenOpts, setKabupatenOpts] = useState<WilayahOption[]>([])
  const [kecamatanOpts, setKecamatanOpts] = useState<WilayahOption[]>([])
  const [desaOpts, setDesaOpts] = useState<WilayahOption[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [cabangs, setCabangs] = useState<CabangOption[]>([])
  const [pindah, setPindah] = useState<PindahKotaMine | null>(null)
  const [kotaSheetOpen, setKotaSheetOpen] = useState(false)
  const [kotaQ, setKotaQ] = useState('')
  const [pindahCatatan, setPindahCatatan] = useState('')
  const [pindahError, setPindahError] = useState('')
  const [pindahPending, startPindah] = useTransition()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=/dashboard/profil/edit')
      return
    }
    const id = session?.user?.idPeserta
    if (!id) return

    let cancelled = false
    ;(async () => {
      const [p, card, provs, cabangList, pindahMine] = await Promise.all([
        getPesertaById(id),
        getMemberCardForPeserta(id),
        listProvinsi(),
        getCabangs(),
        getPindahKotaForMe(),
      ])
      if (cancelled || !p) return

      setIdPeserta(p.id_peserta)
      setEmail(p.email || session?.user?.email || '')
      setKotaName(card?.city || '—')
      setNama(p.nama)
      setGender(normalizeGender(p.gender || 'L'))
      setTempatlahir(p.tempatlahir || '')
      setTgllahir(toDateInput(p.tgllahir || ''))
      setNowa(p.nowa || '')
      setAlamat(p.alamat || '')
      setGereja(p.gereja || '')
      setSekolah(p.pekerjaan || '')
      setPendidikan(p.pendidikan || '')
      setJurusan(p.jurusan || '')
      setProvinsiOpts(provs)
      setCabangs(cabangList)
      setPindah(pindahMine)
      if (pindahMine?.status === '') setPindahCatatan(pindahMine.catatan)

      const prov = p.provinsi || ''
      const kab = p.kabupaten || ''
      const kec = p.kecamatan || ''
      const des = p.desa || ''
      setProvinsi(prov)
      setKabupaten(kab)
      setKecamatan(kec)
      setDesa(des)

      if (prov) {
        const kabs = await listKabupaten(prov)
        if (cancelled) return
        setKabupatenOpts(kabs)
      }
      if (kab) {
        const kecs = await listKecamatan(kab)
        if (cancelled) return
        setKecamatanOpts(kecs)
      }
      if (kec) {
        const desas = await listDesa(kec)
        if (cancelled) return
        setDesaOpts(desas)
      }
      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [session, status, router])

  async function onProvinsi(id: string) {
    setProvinsi(id)
    setKabupaten('')
    setKecamatan('')
    setDesa('')
    setKecamatanOpts([])
    setDesaOpts([])
    setKabupatenOpts(id ? await listKabupaten(id) : [])
  }

  async function onKabupaten(id: string) {
    setKabupaten(id)
    setKecamatan('')
    setDesa('')
    setDesaOpts([])
    setKecamatanOpts(id ? await listKecamatan(id) : [])
  }

  async function onKecamatan(id: string) {
    setKecamatan(id)
    setDesa('')
    setDesaOpts(id ? await listDesa(id) : [])
  }

  async function refreshPindah() {
    setPindah(await getPindahKotaForMe())
  }

  function openAjukanSheet() {
    setPindahError('')
    setKotaQ('')
    setKotaSheetOpen(true)
  }

  function submitPindah(keKota: string) {
    setPindahError('')
    startPindah(async () => {
      const res = await ajukanPindahKota(keKota, pindahCatatan)
      if (!res.ok) {
        setPindahError(res.error)
        return
      }
      setKotaSheetOpen(false)
      await refreshPindah()
    })
  }

  function handleBatalPindah() {
    setPindahError('')
    startPindah(async () => {
      const res = await batalPindahKota()
      if (!res.ok) {
        setPindahError(res.error)
        return
      }
      setPindahCatatan('')
      await refreshPindah()
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!idPeserta) return
    if (!nama.trim()) {
      setError('Nama wajib diisi.')
      return
    }
    if (!nowa.trim()) {
      setError('Nomor WA wajib diisi.')
      return
    }
    setError('')
    setSaving(true)
    try {
      const idTempatKerja = sekolah.trim() ? await upsertJobsPlace(sekolah.trim()) : null
      await updatePesertaProfile(idPeserta, {
        nama: nama.trim(),
        nowa: nowa.trim(),
        gereja: gereja.trim(),
        sekolah: sekolah.trim(),
        idTempatKerja,
        gender,
        tempatlahir: tempatlahir.trim(),
        tgllahir: tgllahir.trim(),
        pendidikan: pendidikan.trim(),
        jurusan: jurusan.trim(),
        provinsi,
        kabupaten,
        kecamatan,
        desa,
        alamat: alamat.trim(),
      })
      router.push('/dashboard/profil')
      router.refresh()
    } catch {
      setError('Gagal menyimpan. Coba lagi.')
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <PaperMain>
        <p className={`${LABEL} px-5 py-10 text-center text-[12px] text-[#57534e]`}>Memuat data…</p>
      </PaperMain>
    )
  }

  return (
    <PaperMain>
      <PaperHeader
        title="Perubahan Data"
        leading={<IconButton icon="chevronLeft" label="Kembali" onClick={() => router.push('/dashboard/profil')} className="-rotate-3" />}
      >
        <p className={`${MONO} mt-1 text-[12px] leading-relaxed text-[#44403c]`}>Email terkunci. LevelUP Kota lewat pengajuan ke Sekretariat Nasional.</p>
      </PaperHeader>

      <form onSubmit={handleSubmit} noValidate className="px-5 mt-5 space-y-5 pb-6">
        <PaperSection taped icon="user" chip="bg-[#e02a2f] text-white" title="Identitas" sub="Nama, kelamin, lahir, dan WA">
          <PaperField label="Email" locked>
            <input className={PAPER_INPUT_LOCKED} value={email} disabled readOnly />
          </PaperField>
          <PaperField label="Nama lengkap">
            <input className={PAPER_INPUT} autoComplete="name" placeholder="Nama lengkap" value={nama} onChange={(e) => setNama(e.target.value)} />
          </PaperField>
          {/* Not a PaperField: a <label> around buttons would make tapping its text select the first option. */}
          <div role="group" aria-label="Jenis kelamin">
            <p className={`${LABEL} mb-1.5 text-[10px] font-bold text-[#44403c]`}>Jenis kelamin</p>
            <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-[#efe8da]/70">
              {(
                [
                  ['L', 'Laki-laki'],
                  ['P', 'Perempuan'],
                ] as const
              ).map(([v, t]) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={gender === v}
                  onClick={() => setGender(v)}
                  className={`${LABEL} py-2.5 rounded-full text-[11px] font-bold transition ${gender === v ? 'bg-[#161616] text-[#ffd83d]' : 'text-[#161616]'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <PaperField label="Tempat lahir">
            <input className={PAPER_INPUT} placeholder="Kota / kabupaten lahir" value={tempatlahir} onChange={(e) => setTempatlahir(e.target.value)} />
          </PaperField>
          <PaperField label="Tanggal lahir">
            <input className={PAPER_INPUT} type="date" value={tgllahir} onChange={(e) => setTgllahir(e.target.value)} />
          </PaperField>
          <PaperField label="Nomor WA">
            <input
              className={PAPER_INPUT}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="08123456789"
              value={nowa}
              onChange={(e) => setNowa(e.target.value)}
            />
          </PaperField>
        </PaperSection>

        <PaperSection icon="pin" chip="bg-[#ffd83d] text-[#161616]" title="Alamat" sub="Wilayah sesuai data BPS">
          <WilayahSelect label="Provinsi" placeholder="Pilih provinsi…" value={provinsi} options={provinsiOpts} onChange={(id) => void onProvinsi(id)} />
          <WilayahSelect
            label="Kabupaten / Kota"
            placeholder="Pilih kabupaten…"
            value={kabupaten}
            options={kabupatenOpts}
            disabled={!provinsi}
            onChange={(id) => void onKabupaten(id)}
          />
          <WilayahSelect
            label="Kecamatan"
            placeholder="Pilih kecamatan…"
            value={kecamatan}
            options={kecamatanOpts}
            disabled={!kabupaten}
            onChange={(id) => void onKecamatan(id)}
          />
          <WilayahSelect label="Desa / Kelurahan" placeholder="Pilih desa…" value={desa} options={desaOpts} disabled={!kecamatan} onChange={setDesa} />
          <PaperField label="Alamat lengkap">
            <textarea className={`${PAPER_INPUT} min-h-[88px] resize-y`} placeholder="Jalan, RT/RW, nomor rumah…" value={alamat} onChange={(e) => setAlamat(e.target.value)} />
          </PaperField>
        </PaperSection>

        <PaperSection icon="church" chip="bg-[#161616] text-[#ffd83d]" title="Komunitas" sub="LevelUP Kota via pengajuan">
          <PaperField label="LevelUP Kota" locked>
            <input className={PAPER_INPUT_LOCKED} value={kotaName} disabled readOnly />
          </PaperField>

          {pindah?.status === '' ? (
            <div className="rounded-[10px] border-2 border-dotted border-[#161616]/40 px-3.5 py-3 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <span className={`${STAMP} bg-[#ffd83d] text-[#161616]`}>Pending</span>
                <p className={`${MONO} flex-1 text-[12px] leading-snug`}>
                  Menunggu approval Sekretariat Nasional → <b>{pindah.keNama}</b>
                </p>
              </div>
              {pindah.catatan ? <p className={`${MONO} text-[11px] text-[#44403c]`}>Catatan: {pindah.catatan}</p> : null}
              <div className="flex gap-2 pt-1">
                <button type="button" disabled={pindahPending} onClick={openAjukanSheet} className={`${BTN_LINE} ring-[#161616]`}>
                  Ubah tujuan
                </button>
                <button type="button" disabled={pindahPending} onClick={handleBatalPindah} className={`${BTN_LINE} ring-[#c21f24] text-[#c21f24]`}>
                  Batalkan
                </button>
              </div>
            </div>
          ) : pindah?.status === '0' ? (
            <div className="rounded-[10px] border-2 border-dotted border-[#c21f24]/60 px-3.5 py-3 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <span className={`${STAMP} bg-[#e02a2f] text-white`}>Ditolak</span>
                <p className={`${MONO} flex-1 text-[12px] leading-snug`}>
                  Pengajuan ke <b>{pindah.keNama}</b> ditolak.
                </p>
              </div>
              {pindah.notenasional ? <p className={`${MONO} text-[11px] text-[#c21f24]`}>Alasan: {pindah.notenasional}</p> : null}
              <button type="button" disabled={pindahPending} onClick={openAjukanSheet} className={BTN}>
                <Strip className="py-2.5 text-[16px]">Ajukan ulang</Strip>
              </button>
            </div>
          ) : (
            <button type="button" disabled={pindahPending} onClick={openAjukanSheet} className={BTN}>
              <Strip tone="ink" className="py-2.5 text-[16px]">
                Ajukan perubahan LevelUP Kota
              </Strip>
            </button>
          )}

          {pindahError && !kotaSheetOpen ? (
            <p role="alert" className={ERROR}>
              {pindahError}
            </p>
          ) : null}

          <PaperField label="Gereja">
            <input className={PAPER_INPUT} placeholder="Nama gereja" value={gereja} onChange={(e) => setGereja(e.target.value)} />
          </PaperField>
          <PaperField label="Sekolah / Kampus / Tempat Kerja">
            <input className={`${PAPER_INPUT} placeholder:text-[13px]`} placeholder="cth: SMAN 1 Ngawi, UNIPMA, PT Maju Jaya" value={sekolah} onChange={(e) => setSekolah(e.target.value)} />
          </PaperField>
        </PaperSection>

        <PaperSection icon="sparkle" chip="bg-[#ffd83d] text-[#161616]" title="Pendidikan" sub="Opsional">
          <PaperField label="Pendidikan terakhir">
            <input className={PAPER_INPUT} placeholder="cth: SMA, S1, D3" value={pendidikan} onChange={(e) => setPendidikan(e.target.value)} />
          </PaperField>
          <PaperField label="Jurusan">
            <input className={PAPER_INPUT} placeholder="cth: Teknik Informatika" value={jurusan} onChange={(e) => setJurusan(e.target.value)} />
          </PaperField>
        </PaperSection>

        <PaperNote>Perubahan data langsung tersimpan ke kartu anggota. Email terkunci. LevelUP Kota berubah setelah Sekretariat Nasional menyetujui pengajuanmu.</PaperNote>

        {error && (
          <p role="alert" className={`${ERROR} rounded-[10px] bg-[#e02a2f]/10 px-4 py-3`}>
            {error}
          </p>
        )}

        <button type="submit" disabled={saving} className={BTN}>
          <Strip>{saving ? 'Menyimpan…' : 'Simpan'}</Strip>
        </button>
      </form>

      <Sheet
        open={kotaSheetOpen}
        onClose={() => {
          setKotaSheetOpen(false)
          setKotaQ('')
        }}
      >
        <SheetHead title="Pilih LevelUP Kota tujuan" sub="Pengajuan ditinjau Sekretariat Nasional" />
        <PaperField label="Alasan (opsional)">
          <textarea className={`${PAPER_INPUT} min-h-[72px] resize-y`} placeholder="Kenapa mau pindah kota?" value={pindahCatatan} onChange={(e) => setPindahCatatan(e.target.value)} />
        </PaperField>
        <label className="mt-3 flex items-center gap-2.5 rounded-full bg-[#efe8da]/50 ring-1 ring-[#161616]/15 px-4 py-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#161616] transition">
          <Icon name="search" className="w-5 h-5 shrink-0 text-[#c21f24]" sw={2.2} />
          <input
            type="search"
            value={kotaQ}
            onChange={(e) => setKotaQ(e.target.value)}
            placeholder="Cari kota..."
            autoFocus
            className="flex-1 min-w-0 bg-transparent outline-none text-[16px] text-[#161616] placeholder:text-[#57534e]/75"
          />
          {kotaQ ? (
            <button type="button" onClick={() => setKotaQ('')} aria-label="Hapus pencarian" className="text-[#57534e]">
              <Icon name="x" className="w-5 h-5" />
            </button>
          ) : null}
        </label>
        {/* The form behind this sheet is covered, so a failed request has to be reported here. */}
        {pindahError ? (
          <p role="alert" className={`${ERROR} mt-3`}>
            {pindahError}
          </p>
        ) : null}
        <div className="mt-3 space-y-2 max-h-[45vh] overflow-y-auto -mx-1 px-1 py-0.5">
          {(() => {
            const needle = kotaQ.trim().toLowerCase()
            const shown = needle ? cabangs.filter((c) => c.nama.toLowerCase().includes(needle)) : cabangs
            if (!shown.length) {
              return <p className={`${MONO} text-center text-[12px] text-[#57534e] py-8`}>Gak ketemu “{kotaQ.trim()}”</p>
            }
            return shown.map((c) => {
              const on = pindah?.status === '' && pindah.ke_kota === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  disabled={pindahPending}
                  onClick={() => submitPindah(c.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left transition disabled:opacity-50 ${
                    on ? 'ring-2 ring-[#161616] bg-[#ffd83d]/25' : 'ring-1 ring-[#161616]/15 bg-white'
                  }`}
                >
                  <Chip name="pin" className={on ? 'bg-[#ffd83d] text-[#161616]' : 'bg-[#161616]/[.07] text-[#161616]'} />
                  <span className="flex-1 min-w-0 font-bold text-[14.5px] text-[#161616] truncate">{c.nama}</span>
                  {on ? <Icon name="check" className="w-5 h-5 text-[#161616] shrink-0" sw={2.6} /> : null}
                </button>
              )
            })
          })()}
        </div>
      </Sheet>
    </PaperMain>
  )
}
