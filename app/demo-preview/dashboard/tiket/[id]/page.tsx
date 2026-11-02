'use client'
// Client version of app/dashboard/tiket/[id]/page.tsx (a server component in the real app).
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getRegistrasiDetail } from '@/components/demo-preview/shim/actions/registrasi'
import { useSession } from '@/components/demo-preview/shim/session'
import { TicketDetailClient } from './ticket-detail-client'

type Props = React.ComponentProps<typeof TicketDetailClient>

const MISSING: Props = { missing: true, qrText: '', ticketCode: '', state: 'Tidak hadir', namaEvent: '', category: '', posterUrl: null, rows: [], alamat: '', isOnline: false, absen: null }

export default function TiketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [props, setProps] = useState<Props>()
  const idPeserta = session?.user?.idPeserta

  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && !idPeserta)) router.replace('/demo-preview/login?callbackUrl=/demo-preview/dashboard')
  }, [status, idPeserta, router])

  useEffect(() => {
    if (!idPeserta) return
    getRegistrasiDetail(Number(id)).then((detail) => {
      if (!detail || detail.id_peserta !== idPeserta) return setProps(MISSING)
      const ticketCode = `EV${detail.id_event}-${detail.id_peserta}`
      const isOnline = detail.jenisevent === 'Online'
      const tgl = detail.tglSelesaiDisplay && detail.tglSelesaiDisplay !== detail.tglDisplay ? `${detail.tglDisplay} - ${detail.tglSelesaiDisplay}` : detail.tglDisplay
      const waktu = [detail.jamevent, detail.jamselesaievent].filter(Boolean).join('–')
      setProps({
        missing: false,
        qrText: JSON.stringify({ p: String(detail.id_peserta), e: session?.user?.email ?? '', ev: String(detail.id_event) }),
        ticketCode,
        state: detail.status === 'attend' ? 'Hadir' : detail.status === 'absence' ? 'Tidak hadir' : 'Terdaftar',
        namaEvent: detail.nama_event,
        category: detail.jenisevent || 'Event',
        posterUrl: detail.posterUrl,
        rows: [
          ['Tanggal', tgl],
          ['Waktu', waktu ? `${waktu} WIB` : '—'],
          ['Peserta', detail.pesertaNama],
          ['No. Tiket', ticketCode],
        ],
        alamat: detail.alamatevent,
        isOnline,
        absen: isOnline ? { idRegistrasi: detail.id_registrasi, tglSelesaiMs: detail.tglSelesaiMs, jamselesaievent: detail.jamselesaievent, alreadyAttended: detail.status === 'attend' } : null,
      })
    })
  }, [id, idPeserta, session?.user?.email])

  if (!props) return null
  return <TicketDetailClient {...props} />
}
