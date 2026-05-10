'use client'
import { useRouter } from 'next/navigation'
import { Button, Input } from '@/components/ui'

export default function DaftarPage() {
  const router = useRouter()

  return (
    <main className="max-w-sm mx-auto min-h-screen bg-bg px-4 py-8 pb-safe flex flex-col">
      <button
        onClick={() => router.back()}
        className="text-sm text-muted hover:text-fg transition-colors mb-6 self-start"
      >
        ← Kembali
      </button>

      <h1 className="text-xl font-semibold text-fg mb-1">Isi Data Diri</h1>
      <p className="text-sm text-muted mb-6">Lengkapi data diri kamu untuk mendaftar</p>

      <div className="flex flex-col gap-4">
        <Input label="Nama" placeholder="Nama lengkap" />
        <Input label="Nomor WA" placeholder="+62 812 3456 7890" type="tel" />
        <Input label="Gereja" placeholder="Nama gereja" />
        <Input label="Sekolah" placeholder="Nama sekolah / universitas" />
      </div>

      <div className="mt-8">
        <Button fullWidth size="lg" onClick={() => router.push('/tiket')}>
          Submit
        </Button>
      </div>
    </main>
  )
}
