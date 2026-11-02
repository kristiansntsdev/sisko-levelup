/* eslint-disable */
// GENERATED from app/dashboard/kartu/page.tsx by scripts/gen-demo-preview.mjs — do not edit; change the source or the generator and re-run.
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/components/demo-preview/shim/session'
import { getMemberCardForPeserta, getPesertaById } from '@/components/demo-preview/shim/actions/peserta'
import { parseDob, USERLEVEL_LABEL, type MemberCardData } from '@/lib/pwa-member'
import { MemberCard } from '@/components/pwa/member-card'
import { IconButton, InfoRow, LABEL, PANEL, PaperHeader, PaperMain, ROWS } from '@/components/pwa/paper-ui'
import type { IconName } from '@/components/pwa/ui'

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
      router.replace('/demo-preview/login?callbackUrl=/demo-preview/dashboard/kartu')
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
      <PaperMain>
        <p className={`${LABEL} py-10 text-center text-[12px] text-[#57534e]`}>Memuat...</p>
      </PaperMain>
    )
  }

  const birth = parseDob(card.dob)?.long ?? card.dob
  const rows: [IconName, string, string][] = [
    ['card', 'No. Anggota', card.no],
    ['user', 'Nama', card.name],
    ['shield', 'Level', USERLEVEL_LABEL[level] ?? 'Tamu'],
    ['pin', 'LevelUP Kota', card.city],
    ['church', 'Gereja', card.church],
    ['mail', 'Email', email || '—'],
    ['phone', 'No. WA', nowa || '—'],
    ['cake', 'Tempat, Tgl Lahir', [card.pob, birth].filter((v) => v && v !== '—').join(', ') || '—'],
  ]

  return (
    <PaperMain>
      <PaperHeader
        sticker="Status Aktif"
        title="Detail Kartu Anggota"
        leading={<IconButton icon="back" label="Kembali" onClick={() => router.push('/demo-preview/dashboard')} className="-rotate-3" />}
      />
      <div className="px-5 mt-4 space-y-5 pb-8">
        <MemberCard m={card} />
        <section aria-label="Data anggota" className={`px-4 ${ROWS} ${PANEL}`}>
          {rows.map(([icon, k, v]) => (
            <InfoRow key={k} icon={icon} label={k}>
              {v}
            </InfoRow>
          ))}
        </section>
      </div>
    </PaperMain>
  )
}
