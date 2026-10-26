import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getRegistrasiDetail } from '@/lib/actions/registrasi'
import { TicketDetailClient } from './ticket-detail-client'

export default async function TiketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const idPeserta = session?.user?.idPeserta
  if (!idPeserta) redirect('/login?callbackUrl=/dashboard')

  const detail = await getRegistrasiDetail(Number(id))
  if (!detail || detail.id_peserta !== idPeserta) {
    return (
      <TicketDetailClient
        missing
        qrText=""
        ticketCode=""
        state="Tidak hadir"
        namaEvent=""
        category=""
        posterUrl={null}
        rows={[]}
        alamat=""
        isOnline={false}
        absen={null}
      />
    )
  }

  const email = session.user?.email ?? ''
  const qrData = JSON.stringify({
    p: String(detail.id_peserta),
    e: email,
    ev: String(detail.id_event),
  })
  const ticketCode = `EV${detail.id_event}-${detail.id_peserta}`
  const isOnline = detail.jenisevent === 'Online'
  const alreadyAttended = detail.status === 'attend'
  const state =
    detail.status === 'attend' ? 'Hadir'
      : detail.status === 'absence' ? 'Tidak hadir'
        : 'Terdaftar'

  const tgl =
    detail.tglSelesaiDisplay && detail.tglSelesaiDisplay !== detail.tglDisplay
      ? `${detail.tglDisplay} - ${detail.tglSelesaiDisplay}`
      : detail.tglDisplay
  const waktu = [detail.jamevent, detail.jamselesaievent].filter(Boolean).join('–')
  const rows: [string, string][] = [
    ['Tanggal', tgl],
    ['Waktu', waktu ? `${waktu} WIB` : '—'],
    ['Peserta', detail.pesertaNama],
    ['No. Tiket', ticketCode],
  ]

  return (
    <TicketDetailClient
      missing={false}
      qrText={qrData}
      ticketCode={ticketCode}
      state={state}
      namaEvent={detail.nama_event}
      category={detail.jenisevent || 'Event'}
      posterUrl={detail.posterUrl}
      rows={rows}
      alamat={detail.alamatevent}
      isOnline={isOnline}
      absen={
        isOnline
          ? {
              idRegistrasi: detail.id_registrasi,
              tglSelesaiMs: detail.tglSelesaiMs,
              jamselesaievent: detail.jamselesaievent,
              alreadyAttended,
            }
          : null
      }
    />
  )
}
