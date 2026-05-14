'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { Badge, Card } from '@/components/ui'
import { getRegistrasiByPeserta } from '@/lib/actions/registrasi'
import { getPesertaById } from '@/lib/actions/peserta'

type Registrasi = Awaited<ReturnType<typeof getRegistrasiByPeserta>>[number]

const JOIN_LABELS: Record<number, string> = {
  0: 'join member →',
  1: 'join squad →',
  2: 'join core →',
}

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [registrasi, setRegistrasi] = useState<Registrasi[]>([])
  const [nama, setNama] = useState('')
  const [userLevel, setUserLevel] = useState<number | null>(null)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    const idPeserta = session?.user?.idPeserta
    if (!idPeserta) return
    Promise.all([
      getRegistrasiByPeserta(idPeserta),
      getPesertaById(idPeserta),
    ]).then(([regs, p]) => {
      setRegistrasi(regs)
      if (p) { setNama(p.nama); setUserLevel(Number(p.userlevel)) }
      setDataLoading(false)
    })
  }, [session?.user?.idPeserta])

  const isLoading = status === 'loading' || dataLoading

  const tiketAktif = registrasi.slice(0, 3)

  const now = new Date()
  const eventTerdekat = registrasi.find((r) => {
    if (!r.tglMs) return false
    const d = new Date(r.tglMs)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }) ?? null

  return (
    <main className="min-h-screen bg-bg pb-safe flex flex-col">

      {/* Nav — full width */}
      <nav className="w-full sticky top-0 z-10 bg-surface border-b border-border">
        <div className="max-w-sm mx-auto px-5 pt-4 pb-4 flex items-center justify-end gap-3">
          {userLevel !== null && userLevel < 3 && (
            <button
              onClick={() => router.push('/join/1')}
              className="text-xs font-medium text-accent bg-accent-light px-3 py-1.5 rounded-full"
            >
              {JOIN_LABELS[userLevel]}
            </button>
          )}
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-xs font-medium text-muted bg-surface border border-border px-3 py-1.5 rounded-full"
          >
            keluar
          </button>
        </div>
      </nav>

      <div className="flex-1 max-w-sm mx-auto w-full px-5 py-5 flex flex-col gap-6">

        {/* Greeting */}
        <div>
          <p className="text-sm text-muted">Hallo,</p>
          {isLoading
            ? <div className="h-8 w-40 rounded-lg bg-border animate-pulse mt-1" />
            : <h1 className="text-2xl font-bold text-fg">{nama}</h1>
          }
        </div>

        {/* Tiket Aktif */}
        {isLoading ? (
          <section className="flex flex-col gap-3 animate-pulse">
            <div className="h-5 w-28 rounded bg-border" />
            <div className="rounded-card border border-border bg-surface p-5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-border shrink-0" />
              <div className="flex flex-col gap-2 flex-1">
                <div className="h-3 w-16 rounded bg-border" />
                <div className="h-4 w-32 rounded bg-border" />
              </div>
            </div>
          </section>
        ) : tiketAktif.length > 0 ? (
          <section className="flex flex-col gap-3">
            <p className="font-semibold text-fg">Tiket Aktif</p>
            {tiketAktif.map((tiket) => (
              <div
                key={tiket.id_registrasi}
                onClick={() => router.push(`/dashboard/tiket/${tiket.id_registrasi}`)}
                className="cursor-pointer"
              >
                <Card variant="elevated" className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-accent-light flex items-center justify-center shrink-0">
                        <TicketIcon />
                      </div>
                      <div>
                        <p className="text-xs text-muted uppercase tracking-wider mb-0.5">{tiket.tglDisplay || 'Tiket'}</p>
                        <p className="font-semibold text-fg">{tiket.nama_event}</p>
                      </div>
                    </div>
                    <span className="text-muted text-lg">→</span>
                  </div>
                </Card>
              </div>
            ))}
          </section>
        ) : null}

        {/* Event Terdekat */}
        {isLoading ? (
          <section className="flex flex-col gap-3 animate-pulse">
            <div className="h-5 w-36 rounded bg-border" />
            <div className="rounded-card border border-border bg-surface p-4 flex items-center justify-between gap-3">
              <div className="flex flex-col gap-2">
                <div className="h-4 w-28 rounded bg-border" />
                <div className="h-3 w-20 rounded bg-border" />
              </div>
              <div className="h-7 w-16 rounded-full bg-border" />
            </div>
          </section>
        ) : eventTerdekat ? (
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-fg">Event Terdekat</p>
              <Badge variant="amber">bulan ini</Badge>
            </div>
            <Card className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-fg">{eventTerdekat.nama_event}</p>
                  <p className="text-xs text-muted mt-0.5">{eventTerdekat.tglDisplay}</p>
                </div>
                <button
                  onClick={() => router.push(`/join/${eventTerdekat.id_event}`)}
                  className="text-xs font-medium text-accent bg-accent-light px-3 py-1.5 rounded-full shrink-0"
                >
                  Detail
                </button>
              </div>
            </Card>
          </section>
        ) : null}

        {/* Footer link */}
        <button
          onClick={() => router.push('/events')}
          className="w-full py-3 text-sm font-medium text-accent text-center border border-accent/20 rounded-card bg-accent-light/40 hover:bg-accent-light transition-colors"
        >
          List Semua Event →
        </button>

        {/* Dokumentasi */}
        <section className="flex flex-col gap-3">
          <div>
            <p className="font-semibold text-fg">Dokumentasi</p>
            <p className="text-xs text-muted mt-0.5">Terbuka apabila kamu sudah absen acara</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {['Dokumentasi 1', 'Dokumentasi 2'].map((label) => (
              <Card key={label} className="p-4 flex flex-col items-center justify-center gap-2.5 aspect-square opacity-60">
                <LockIcon />
                <p className="text-xs text-muted text-center">{label}</p>
              </Card>
            ))}
          </div>
        </section>

      </div>
    </main>
  )
}

function TicketIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
      <path d="M2 9a3 3 0 010 6v2a2 2 0 002 2h16a2 2 0 002-2v-2a3 3 0 010-6V7a2 2 0 00-2-2H4a2 2 0 00-2 2v2z" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  )
}
