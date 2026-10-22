import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getOnlineAbsenEvent } from '@/lib/actions/absen-online'
import { getCabangs } from '@/lib/actions/event'
import { getPesertaById } from '@/lib/actions/peserta'
import { isOnlineEvent } from '@/lib/event-link'
import { CheckinClient } from './checkin-client'

/**
 * Scan QR event Online → halaman ini. Login (sekali tap Google), registrasi,
 * dan absen dijalankan otomatis tanpa pindah halaman.
 */
export default async function AbsenOnlinePage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  const id = Number(eventId)
  const event = await getOnlineAbsenEvent(id)

  if (!event) {
    return (
      <main className="min-h-screen bg-bg px-5 py-12 flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted">Event tidak ditemukan.</p>
        <Link href="/dashboard" className="text-sm text-fg underline">
          Ke Dashboard
        </Link>
      </main>
    )
  }

  // QR event Offline tetap ke halaman poster + tombol Join.
  if (!isOnlineEvent(event.jenisevent)) redirect(`/join/${id}`)

  const session = await auth()
  const idPeserta = session?.user?.idPeserta
  if (!idPeserta) {
    // `auto=1` → langsung lempar ke Google, tanpa tap tombol login dulu.
    redirect(`/login?auto=1&callbackUrl=${encodeURIComponent(`/absen/${id}`)}`)
  }

  const [peserta, cabangs] = await Promise.all([getPesertaById(idPeserta), getCabangs()])

  return (
    <CheckinClient
      event={event}
      cabangs={cabangs}
      defaultProfile={{
        nama: peserta?.nama?.trim() || session?.user?.name || '',
        nowa: peserta?.nowa ?? '',
        // Peserta baru (No. WA kosong) dapat kotalevelup default di auth.ts —
        // kosongkan supaya dipilih sendiri.
        kotalevelup: peserta?.nowa ? peserta.kotalevelup : '',
        gereja: peserta?.gereja ?? '',
        sekolah: peserta?.pekerjaan ?? '',
      }}
    />
  )
}
