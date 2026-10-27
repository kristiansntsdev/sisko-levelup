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
  BTN_RED,
  FLD,
  Field,
  Hero,
  Icon,
  Pill,
  Sheet,
  SheetHead,
  TintIcon,
} from '@/components/pwa/ui'
import { Note, SectionCard, Seg, TopBar } from '@/components/alk-v2/ui'

const FLD_LOCKED = `${FLD} opacity-60 cursor-not-allowed bg-slate-100 focus:bg-slate-100 focus:ring-1 focus:ring-slate-200`

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
      <main className="px-5 py-10 text-center text-sm text-slate-500">
        Memuat data…
      </main>
    )
  }

  return (
    <main>
      <Hero className="pt-3 pb-16 rounded-b-[32px]">
        <TopBar title="Perubahan Data" back={() => router.push('/dashboard/profil')} />
        <p className="text-[13px] text-white/80 mt-2 px-0.5">
          Email terkunci. LevelUP Kota lewat pengajuan ke Sekretariat Nasional.
        </p>
      </Hero>

      <form onSubmit={handleSubmit} noValidate className="px-5 -mt-8 relative z-10 space-y-4 pb-6">
        <SectionCard lift icon="user" tint="red" title="Identitas" sub="Nama, kelamin, lahir, dan WA">
          <Field label="Email">
            <input className={FLD_LOCKED} value={email} disabled readOnly />
          </Field>
          <Field label="Nama lengkap">
            <input
              className={FLD}
              autoComplete="name"
              placeholder="Nama lengkap"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
            />
          </Field>
          <Field label="Jenis kelamin">
            <Seg
              options={[
                ['L', 'Laki-laki'],
                ['P', 'Perempuan'],
              ]}
              value={gender}
              onChange={(v) => setGender(v === 'P' ? 'P' : 'L')}
            />
          </Field>
          <Field label="Tempat lahir">
            <input
              className={FLD}
              placeholder="Kota / kabupaten lahir"
              value={tempatlahir}
              onChange={(e) => setTempatlahir(e.target.value)}
            />
          </Field>
          <Field label="Tanggal lahir">
            <input
              className={FLD}
              type="date"
              value={tgllahir}
              onChange={(e) => setTgllahir(e.target.value)}
            />
          </Field>
          <Field label="Nomor WA">
            <input
              className={FLD}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="08123456789"
              value={nowa}
              onChange={(e) => setNowa(e.target.value)}
            />
          </Field>
        </SectionCard>

        <SectionCard icon="pin" tint="gold" title="Alamat" sub="Wilayah sesuai data BPS">
          <Field label="Provinsi">
            <select
              className={`${FLD} ${provinsi ? '' : 'text-slate-400'}`}
              value={provinsi}
              onChange={(e) => void onProvinsi(e.target.value)}
            >
              <option value="">Pilih provinsi…</option>
              {provinsiOpts.map((o) => (
                <option key={o.id} value={o.id} className="text-slate-900">
                  {o.nama}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Kabupaten / Kota">
            <select
              className={`${FLD} ${kabupaten ? '' : 'text-slate-400'}`}
              value={kabupaten}
              disabled={!provinsi}
              onChange={(e) => void onKabupaten(e.target.value)}
            >
              <option value="">Pilih kabupaten…</option>
              {kabupatenOpts.map((o) => (
                <option key={o.id} value={o.id} className="text-slate-900">
                  {o.nama}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Kecamatan">
            <select
              className={`${FLD} ${kecamatan ? '' : 'text-slate-400'}`}
              value={kecamatan}
              disabled={!kabupaten}
              onChange={(e) => void onKecamatan(e.target.value)}
            >
              <option value="">Pilih kecamatan…</option>
              {kecamatanOpts.map((o) => (
                <option key={o.id} value={o.id} className="text-slate-900">
                  {o.nama}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Desa / Kelurahan">
            <select
              className={`${FLD} ${desa ? '' : 'text-slate-400'}`}
              value={desa}
              disabled={!kecamatan}
              onChange={(e) => setDesa(e.target.value)}
            >
              <option value="">Pilih desa…</option>
              {desaOpts.map((o) => (
                <option key={o.id} value={o.id} className="text-slate-900">
                  {o.nama}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Alamat lengkap">
            <textarea
              className={`${FLD} min-h-[88px] resize-y`}
              placeholder="Jalan, RT/RW, nomor rumah…"
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
            />
          </Field>
        </SectionCard>

        <SectionCard icon="church" tint="red" title="Komunitas" sub="LevelUP Kota via pengajuan">
          <Field label="LevelUP Kota">
            <input className={FLD_LOCKED} value={kotaName} disabled readOnly />
          </Field>

          {pindah?.status === '' ? (
            <div className="rounded-xl bg-amber-50 ring-1 ring-amber-200 px-3.5 py-3 space-y-2">
              <div className="flex items-start gap-2">
                <Pill tone="amber">Pending</Pill>
                <p className="text-[13px] text-amber-900 leading-snug flex-1">
                  Menunggu approval Sekretariat Nasional → <b>{pindah.keNama}</b>
                </p>
              </div>
              {pindah.catatan ? (
                <p className="text-[12px] text-slate-600">Catatan: {pindah.catatan}</p>
              ) : null}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  disabled={pindahPending}
                  onClick={openAjukanSheet}
                  className="flex-1 py-2.5 rounded-xl bg-white ring-1 ring-slate-200 text-[13px] font-bold text-[#3b1417] disabled:opacity-50"
                >
                  Ubah tujuan
                </button>
                <button
                  type="button"
                  disabled={pindahPending}
                  onClick={handleBatalPindah}
                  className="flex-1 py-2.5 rounded-xl bg-white ring-1 ring-rose-200 text-[13px] font-bold text-rose-600 disabled:opacity-50"
                >
                  Batalkan
                </button>
              </div>
            </div>
          ) : pindah?.status === '0' ? (
            <div className="rounded-xl bg-rose-50 ring-1 ring-rose-200 px-3.5 py-3 space-y-2">
              <div className="flex items-start gap-2">
                <Pill tone="red">Ditolak</Pill>
                <p className="text-[13px] text-rose-800 leading-snug flex-1">
                  Pengajuan ke <b>{pindah.keNama}</b> ditolak.
                </p>
              </div>
              {pindah.notenasional ? (
                <p className="text-[12px] text-rose-700">Alasan: {pindah.notenasional}</p>
              ) : null}
              <button
                type="button"
                disabled={pindahPending}
                onClick={openAjukanSheet}
                className={`w-full py-2.5 text-[13px] ${BTN_RED}`}
              >
                Ajukan ulang
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={pindahPending}
              onClick={openAjukanSheet}
              className="w-full py-3 rounded-xl bg-[#fbeceb] ring-1 ring-[#f3d3d3] text-[#c9232c] text-[13.5px] font-bold disabled:opacity-50"
            >
              Ajukan perubahan LevelUP Kota
            </button>
          )}

          {pindahError ? (
            <p role="alert" className="text-[12.5px] text-rose-600 font-medium">
              {pindahError}
            </p>
          ) : null}

          <Field label="Gereja">
            <input
              className={FLD}
              placeholder="Nama gereja"
              value={gereja}
              onChange={(e) => setGereja(e.target.value)}
            />
          </Field>
          <Field label="Sekolah / Kampus / Tempat Kerja">
            <input
              className={FLD}
              placeholder="cth: SMAN 1 Ngawi, UNIPMA, PT Maju Jaya"
              value={sekolah}
              onChange={(e) => setSekolah(e.target.value)}
            />
          </Field>
        </SectionCard>

        <SectionCard icon="sparkle" tint="gold" title="Pendidikan" sub="Opsional">
          <Field label="Pendidikan terakhir">
            <input
              className={FLD}
              placeholder="cth: SMA, S1, D3"
              value={pendidikan}
              onChange={(e) => setPendidikan(e.target.value)}
            />
          </Field>
          <Field label="Jurusan">
            <input
              className={FLD}
              placeholder="cth: Teknik Informatika"
              value={jurusan}
              onChange={(e) => setJurusan(e.target.value)}
            />
          </Field>
        </SectionCard>

        <Note>
          Perubahan data langsung tersimpan ke kartu anggota. Email terkunci. LevelUP Kota berubah setelah Sekretariat Nasional menyetujui pengajuanmu.
        </Note>

        {error && (
          <p role="alert" className="px-4 py-3 rounded-xl bg-rose-50 ring-1 ring-rose-200 text-[13px] text-rose-700 font-medium">
            {error}
          </p>
        )}

        <button type="submit" disabled={saving} className={`w-full py-3.5 ${BTN_RED}`}>
          {saving ? 'Menyimpan…' : 'Simpan'}
        </button>
      </form>

      <Sheet
        open={kotaSheetOpen}
        onClose={() => {
          setKotaSheetOpen(false)
          setKotaQ('')
        }}
      >
        <SheetHead
          title="Pilih LevelUP Kota tujuan"
          sub="Pengajuan ditinjau Sekretariat Nasional"
        />
        <Field label="Alasan (opsional)">
          <textarea
            className={`${FLD} min-h-[72px] resize-y`}
            placeholder="Kenapa mau pindah kota?"
            value={pindahCatatan}
            onChange={(e) => setPindahCatatan(e.target.value)}
          />
        </Field>
        <label className="mt-3 flex items-center gap-2.5 rounded-full bg-slate-50 ring-1 ring-slate-200 px-4 py-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#c9232c] transition">
          <Icon name="search" className="w-5 h-5 text-[#c9232c]" />
          <input
            type="search"
            value={kotaQ}
            onChange={(e) => setKotaQ(e.target.value)}
            placeholder="Cari kota..."
            autoFocus
            className="flex-1 min-w-0 bg-transparent outline-none text-[16px] placeholder:text-slate-400"
          />
          {kotaQ ? (
            <button
              type="button"
              onClick={() => setKotaQ('')}
              aria-label="Hapus pencarian"
              className="text-slate-400 active:text-slate-600"
            >
              <Icon name="x" className="w-5 h-5" />
            </button>
          ) : null}
        </label>
        <div className="mt-3 space-y-2 max-h-[45vh] overflow-y-auto -mx-1 px-1">
          {(() => {
            const needle = kotaQ.trim().toLowerCase()
            const shown = needle
              ? cabangs.filter((c) => c.nama.toLowerCase().includes(needle))
              : cabangs
            if (!shown.length) {
              return (
                <p className="text-center text-[13px] text-slate-400 py-8">
                  Gak ketemu “{kotaQ.trim()}”
                </p>
              )
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
                    on ? 'ring-2 ring-[#c9232c] bg-[#fbeceb]/60' : 'ring-1 ring-[#efe3cc] bg-white'
                  }`}
                >
                  <TintIcon
                    name="pin"
                    tint={on ? 'red' : 'gold'}
                    size="w-9 h-9 rounded-xl"
                    icon="w-[18px] h-[18px]"
                  />
                  <span
                    className={`flex-1 min-w-0 font-bold text-[14.5px] truncate ${
                      on ? 'text-[#c9232c]' : 'text-[#3b1417]'
                    }`}
                  >
                    {c.nama}
                  </span>
                  {on ? <Icon name="check" className="w-5 h-5 text-[#c9232c] shrink-0" sw={2.6} /> : null}
                </button>
              )
            })
          })()}
        </div>
      </Sheet>
    </main>
  )
}
