'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { getRegistrasiByPeserta } from '@/lib/actions/registrasi'
import { PageHero, TintIcon } from '@/components/pwa/ui'

type Registrasi = Awaited<ReturnType<typeof getRegistrasiByPeserta>>[number]

export default function RiwayatPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [regs, setRegs] = useState<Registrasi[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=/dashboard/riwayat')
      return
    }
    const id = session?.user?.idPeserta
    if (!id) return
    getRegistrasiByPeserta(id).then((r) => {
      setRegs(r)
      setLoading(false)
    })
  }, [session, status, router])

  return (
    <main>
      <PageHero title="Milestone" sub="Riwayat kehadiran & event" pb="pb-14" />
      <div className="px-5 -mt-8 relative z-10 space-y-4">
        <div className="bg-white rounded-2xl ring-1 ring-slate-100 p-4 grid grid-cols-2 gap-3 text-center">
          <div>
            <p className="text-[26px] font-extrabold text-[#c9232c] leading-none">{regs.length}</p>
            <p className="text-[12px] text-slate-500 mt-1.5">Event terdaftar</p>
          </div>
          <div>
            <p className="text-[26px] font-extrabold text-[#96792a] leading-none">
              {regs.filter((r) => r.status === 'absence' || r.status === 'confirmed').length}
            </p>
            <p className="text-[12px] text-slate-500 mt-1.5">Tiket bulan ini</p>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-sm text-slate-400 py-6">Memuat...</p>
        ) : regs.length === 0 ? (
          <p className="bg-white rounded-2xl ring-1 ring-slate-100 text-center text-[13px] text-slate-400 py-8">
            Belum ada riwayat. Ambil tiket event untuk mulai.
          </p>
        ) : (
          <div className="space-y-2">
            {regs.map((r) => (
              <Link
                key={r.id_registrasi}
                href={`/dashboard/tiket/${r.id_registrasi}`}
                className="flex items-center gap-3 bg-white rounded-2xl ring-1 ring-slate-100 p-3.5"
              >
                <TintIcon name="history" tint="gold" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-[14px] truncate">{r.nama_event}</span>
                  <span className="block text-[12px] text-slate-500">{r.tglDisplay} · {r.status}</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
