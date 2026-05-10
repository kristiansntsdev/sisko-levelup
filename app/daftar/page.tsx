'use client'
import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button, Input } from '@/components/ui'
import { createRegistrasi, updatePesertaProfile } from '@/lib/actions/registrasi'
import { getPesertaById } from '@/lib/actions/peserta'
import { upsertJobsPlace } from '@/lib/actions/jobs-place'

function DaftarForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = Number(searchParams.get('eventId'))
  const { data: session, status } = useSession()

  const [nama, setNama] = useState('')
  const [nowa, setNowa] = useState('')
  const [gereja, setGereja] = useState('')
  const [sekolah, setSekolah] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const idPeserta = session?.user?.idPeserta
    if (!idPeserta) return
    getPesertaById(idPeserta).then((p) => {
      if (!p) return
      setNama(p.nama)
      if (p.nowa) setNowa(p.nowa)
      if (p.gereja) setGereja(p.gereja)
      if (p.pekerjaan) setSekolah(p.pekerjaan)
    })
  }, [session?.user?.idPeserta])

  async function handleSubmit() {
    const idPeserta = session?.user?.idPeserta
    if (!idPeserta) { setError('Sesi tidak ditemukan, coba login ulang.'); return }
    if (!eventId) { setError('Event tidak ditemukan.'); return }
    if (!nowa.trim()) { setError('Nomor WA wajib diisi.'); return }

    setError('')
    setLoading(true)
    try {
      const idTempatKerja = sekolah.trim() ? await upsertJobsPlace(sekolah.trim()) : null
      await updatePesertaProfile(idPeserta, { nowa, gereja, sekolah, idTempatKerja })
      await createRegistrasi(idPeserta, eventId)
      router.push('/dashboard')
    } catch (e) {
      setError('Terjadi kesalahan. Coba lagi.')
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-sm text-muted">Memuat...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-bg pb-safe flex flex-col">

      {/* Nav */}
      <nav className="w-full sticky top-0 z-10 bg-surface border-b border-border">
        <div className="max-w-sm mx-auto px-5 pt-6 pb-4">
          <button
            onClick={() => eventId ? router.push(`/join/${eventId}`) : router.push('/')}
            className="text-sm text-muted hover:text-fg transition-colors"
          >
            ← Kembali
          </button>
        </div>
      </nav>

      <div className="flex-1 max-w-sm mx-auto w-full px-5 py-6 flex flex-col gap-6">

        <div>
          <h1 className="text-2xl font-bold text-fg">Isi Data Diri</h1>
          <p className="text-sm text-muted mt-1">Lengkapi data sebelum mendaftar acara</p>
        </div>

        <div className="flex flex-col gap-4">
          <Input label="Nama" value={nama} disabled />
          <Input
            label="Nomor WA"
            placeholder="08123456789"
            type="tel"
            value={nowa}
            onChange={(e) => setNowa(e.target.value)}
          />
          <Input
            label="Gereja"
            placeholder="Nama gereja"
            value={gereja}
            onChange={(e) => setGereja(e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <Input
              label="Sekolah / Universitas / Tempat Kerja"
              placeholder="cth: SMAN 1 Ngawi, UNIPMA, PT Maju Jaya"
              value={sekolah}
              onChange={(e) => setSekolah(e.target.value)}
            />
            <p className="text-xs text-muted px-0.5">
              Ketik nama lengkap atau singkatan — tipe akan terdeteksi otomatis
            </p>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red font-medium">{error}</p>
        )}

        <Button fullWidth size="lg" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
        </Button>

      </div>
    </main>
  )
}

export default function DaftarPage() {
  return (
    <Suspense>
      <DaftarForm />
    </Suspense>
  )
}
