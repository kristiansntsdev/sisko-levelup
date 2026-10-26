'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { getMemberCardForPeserta, getPesertaById } from '@/lib/actions/peserta'
import { USERLEVEL_LABEL, type MemberCardData } from '@/lib/pwa-member'
import { Hero, Icon, MemberCard, PAGE_BG, Pill } from '@/components/pwa/ui'

export default function KartuPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [card, setCard] = useState<MemberCardData | null>(null)
  const [email, setEmail] = useState('')
  const [nowa, setNowa] = useState('')
  const [level, setLevel] = useState('0')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=/dashboard/kartu')
      return
    }
    const id = session?.user?.idPeserta
    if (!id) return
    Promise.all([getMemberCardForPeserta(id), getPesertaById(id)]).then(([c, p]) => {
      setCard(c)
      if (p) {
        setEmail(p.email)
        setNowa(p.nowa)
        setLevel(p.userlevel)
      }
      setLoading(false)
    })
  }, [session, status, router])

  if (loading || !card) {
    return (
      <main className={`min-h-screen ${PAGE_BG} flex items-center justify-center`}>
        <p className="text-sm text-slate-500">Memuat...</p>
      </main>
    )
  }

  const rows: [string, string][] = [
    ['No. Anggota', card.no],
    ['Nama', card.name],
    ['Level', USERLEVEL_LABEL[level] ?? 'Tamu'],
    ['LevelUP Kota', card.city],
    ['Gereja', card.church],
    ['Email', email || '—'],
    ['No. WA', nowa || '—'],
    ['Tempat, Tgl Lahir', [card.pob, card.dob].filter((v) => v && v !== '—').join(', ') || '—'],
  ]

  return (
    <main>
      <Hero className="pt-4 pb-16 rounded-b-[32px]">
        <div className="relative flex items-center h-11">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            aria-label="Kembali"
            className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full active:bg-white/10"
          >
            <Icon name="back" className="w-6 h-6" sw={2.2} />
          </button>
          <h2 className="absolute left-1/2 -translate-x-1/2 font-bold text-[17px]">Detail Kartu Anggota</h2>
        </div>
        <div className="mt-3 flex justify-center">
          <Pill tone="green">Status Aktif</Pill>
        </div>
      </Hero>
      <div className="px-5 -mt-10 space-y-5 pb-8">
        <MemberCard m={card} />
        <div className="bg-white rounded-2xl ring-1 ring-slate-100 divide-y divide-slate-100">
          {rows.map(([k, v]) => (
            <div key={k} className="px-4 py-3 flex justify-between gap-3">
              <span className="text-[12.5px] text-slate-500 shrink-0">{k}</span>
              <span className="text-[13.5px] font-semibold text-[#3b1417] text-right break-words">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
