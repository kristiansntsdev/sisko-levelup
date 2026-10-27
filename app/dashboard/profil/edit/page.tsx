'use client'
import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { getPesertaById, getMemberCardForPeserta } from '@/lib/actions/peserta'
import { upsertJobsPlace } from '@/lib/actions/jobs-place'
import { updatePesertaProfile } from '@/lib/actions/registrasi'
import {
  listDesa,
  listKabupaten,
  listKecamatan,
  listProvinsi,
  type WilayahOption,
} from '@/lib/actions/wilayah'
import { BTN_RED, FLD, Field, Hero } from '@/components/pwa/ui'
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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=/dashboard/profil/edit')
      return
    }
    const id = session?.user?.idPeserta
    if (!id) return

    let cancelled = false
    ;(async () => {
      const [p, card, provs] = await Promise.all([
        getPesertaById(id),
        getMemberCardForPeserta(id),
        listProvinsi(),
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
          Email & LevelUP Kota terkunci. Data lain bisa kamu ubah.
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

        <SectionCard icon="church" tint="red" title="Komunitas" sub="LevelUP Kota terkunci">
          <Field label="LevelUP Kota">
            <input className={FLD_LOCKED} value={kotaName} disabled readOnly />
          </Field>
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
          Perubahan langsung tersimpan ke kartu anggota. Email & LevelUP Kota hanya bisa diubah lewat pengurus.
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
    </main>
  )
}
