import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getRegistrasiDetail } from '@/lib/actions/registrasi'
import { AbsenEventButton } from './absen-event-button'

export default async function TiketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const idPeserta = session?.user?.idPeserta
  if (!idPeserta) redirect('/')

  const detail = await getRegistrasiDetail(Number(id))
  if (!detail || detail.id_peserta !== idPeserta) {
    return (
      <main className="min-h-screen bg-bg pb-safe flex flex-col">
        <TiketNav />
        <div className="flex-1 max-w-sm mx-auto w-full px-5 py-8">
          <p className="text-sm text-muted">Tiket tidak ditemukan.</p>
        </div>
      </main>
    )
  }

  const email = session.user?.email ?? ''
  const qrData = JSON.stringify({
    p: String(detail.id_peserta),
    e: email,
    ev: String(detail.id_event),
  })
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(qrData)}&color=1c1917&bgcolor=ffffff`
  const isOnline = detail.jenisevent === 'Online'
  const alreadyAttended = detail.status === 'attend'

  return (
    <main className="min-h-screen bg-bg pb-safe flex flex-col">
      <TiketNav brand={isOnline ? 'event online' : undefined} />

      <div className="flex-1 max-w-sm mx-auto w-full px-5 py-6 flex flex-col">
        <div className="w-full bg-bg border border-border rounded-card p-5 flex flex-col gap-5">
          <div>
            <p className="text-xs text-muted uppercase tracking-wider">Tiket Aktif</p>
            <h1 className="text-2xl font-bold text-fg mt-0.5">{detail.nama_event}</h1>
          </div>

          <div className="w-full bg-surface border border-border rounded-card p-5 flex flex-col items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrSrc}
              alt="QR Code Tiket"
              width={280}
              height={280}
              className="rounded-input"
            />
            <p className="text-xs text-muted text-center leading-relaxed">
              Tunjukkan QR ini kepada panitia saat absen.
              <br />
              Jangan bagikan kepada orang lain.
            </p>
          </div>

          {isOnline && (
            <AbsenEventButton
              idRegistrasi={detail.id_registrasi}
              tglSelesaiMs={detail.tglSelesaiMs}
              jamselesaievent={detail.jamselesaievent}
              alreadyAttended={alreadyAttended}
            />
          )}
        </div>
      </div>
    </main>
  )
}

function TiketNav({ brand }: { brand?: string }) {
  return (
    <nav className="w-full sticky top-0 z-10 bg-bg">
      <div className="max-w-sm mx-auto px-5 pt-5 pb-2 flex flex-col gap-2">
        {brand && (
          <p className="font-[family-name:var(--font-instrument-serif)] italic text-xl text-amber">
            {brand}
          </p>
        )}
        <Link
          href="/dashboard"
          className="text-sm text-muted hover:text-fg transition-colors inline-flex items-center gap-1 w-fit"
        >
          ← Kembali
        </Link>
      </div>
    </nav>
  )
}
