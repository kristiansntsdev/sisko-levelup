import Link from 'next/link'
import { auth } from '@/auth'
import { getRegistrasiDetail } from '@/lib/actions/registrasi'

export default async function TiketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [detail, session] = await Promise.all([
    getRegistrasiDetail(Number(id)),
    auth(),
  ])

  const email = (session?.user as any)?.email ?? ''
  const qrData = detail
    ? JSON.stringify({ p: String(detail.id_peserta), e: email, ev: String(detail.id_event) })
    : ''
  const qrSrc = qrData
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(qrData)}&color=1c1917&bgcolor=ffffff`
    : null

  return (
    <main className="min-h-screen bg-bg pb-safe flex flex-col">

      {/* Nav */}
      <nav className="w-full sticky top-0 z-10 bg-surface border-b border-border">
        <div className="max-w-sm mx-auto px-5 pt-6 pb-4">
          <Link
            href="/dashboard"
            className="text-sm text-muted hover:text-fg transition-colors flex items-center gap-1"
          >
            ← Kembali
          </Link>
        </div>
      </nav>

      <div className="flex-1 max-w-sm mx-auto w-full px-5 py-8 flex flex-col items-center gap-6">

        {detail ? (
          <>
            <div className="w-full">
              <p className="text-xs text-muted uppercase tracking-wider">Tiket Aktif</p>
              <h1 className="text-2xl font-bold text-fg mt-0.5">{detail.nama_event}</h1>
            </div>

            {qrSrc && (
              <div className="w-full bg-surface border border-border rounded-card p-6 flex flex-col items-center gap-4">
                <img
                  src={qrSrc}
                  alt="QR Code Tiket"
                  width={280}
                  height={280}
                  className="rounded-input"
                />
                <p className="text-xs text-muted text-center leading-relaxed">
                  Tunjukkan QR ini kepada panitia saat absen.<br />
                  Jangan bagikan kepada orang lain.
                </p>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted">Tiket tidak ditemukan.</p>
        )}

      </div>
    </main>
  )
}
