'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { getRegistrasiByPeserta } from '@/lib/actions/registrasi'
import { ANTON, LABEL, MONO, PANEL, PaperHeader, PaperMain, PRESS, StateStamp, TAPE } from '@/components/pwa/paper-ui'

type Registrasi = Awaited<ReturnType<typeof getRegistrasiByPeserta>>[number]

const DOT: Record<string, string> = {
  Hadir: 'bg-[#e02a2f]',
  Terdaftar: 'bg-[#161616]',
  'Tidak hadir': 'bg-[#efe8da] ring-2 ring-inset ring-[#57534e]',
}

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
    <PaperMain>
      <PaperHeader sticker="Riwayat kehadiran & event" title="Milestone" />
      <div className="px-5 mt-4 space-y-6">
        <section aria-label="Ringkasan" className={`relative grid grid-cols-2 py-4 ${PANEL}`}>
          <span aria-hidden className={`${TAPE} -left-4 -top-1`} />
          <div className="text-center border-r-2 border-dotted border-[#161616]/25">
            <p className={`${ANTON} text-[44px] leading-none text-[#e02a2f]`}>{regs.length}</p>
            <p className={`${LABEL} mt-2 text-[9.5px] text-[#57534e]`}>Event terdaftar</p>
          </div>
          <div className="text-center">
            <p className={`${ANTON} text-[44px] leading-none`}>
              {regs.filter((r) => r.status === 'absence' || r.status === 'confirmed').length}
            </p>
            <p className={`${LABEL} mt-2 text-[9.5px] text-[#57534e]`}>Tiket bulan ini</p>
          </div>
        </section>

        {loading ? (
          <p className={`${LABEL} text-center text-[12px] text-[#57534e] py-6`}>Memuat...</p>
        ) : regs.length === 0 ? (
          <p className={`${LABEL} rounded-[14px] border-2 border-dotted border-[#161616]/30 text-center text-[11px] leading-relaxed text-[#57534e] py-8 px-5`}>
            Belum ada riwayat. Ambil tiket event untuk mulai.
          </p>
        ) : (
          <ol className="relative space-y-3 pl-6 before:absolute before:left-[7px] before:top-3 before:bottom-3 before:border-l-2 before:border-dotted before:border-[#161616]/35">
            {regs.map((r) => (
              <li key={r.id_registrasi} className="relative">
                <span aria-hidden className={`absolute -left-6 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${DOT[r.ticketState] ?? DOT.Terdaftar}`} />
                <Link href={`/dashboard/tiket/${r.id_registrasi}`} className={`flex items-center gap-3 p-3.5 ${PANEL} ${PRESS}`}>
                  <span className="min-w-0 flex-1">
                    <span className={`${ANTON} block text-[17px] leading-[1.15] tracking-[.01em] line-clamp-2`}>{r.nama_event}</span>
                    <span className={`${MONO} block mt-1 text-[11px] font-bold text-[#44403c]`}>{r.tglDisplay}</span>
                  </span>
                  <StateStamp state={r.ticketState} />
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>
    </PaperMain>
  )
}
