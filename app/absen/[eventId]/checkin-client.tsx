'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Button, Input } from '@/components/ui'
import {
  onlineCheckin,
  type OnlineAbsenEvent,
  type OnlineCheckinProfile,
  type OnlineCheckinSesi,
} from '@/lib/actions/absen-online'
import { getOnlineAbsenWindow } from '@/lib/event-absen-window'

type View =
  | { kind: 'working' }
  | { kind: 'attended' }
  | { kind: 'waiting'; opensAtMs: number | null; closed: boolean }
  | { kind: 'profile' }
  | { kind: 'sesi'; sesi: OnlineCheckinSesi[] }
  | { kind: 'error'; message: string }

const FAIL_MESSAGE: Record<string, string> = {
  unauthenticated: 'Sesi login habis. Muat ulang halaman ini untuk login lagi.',
  not_found: 'Event tidak ditemukan.',
  not_online: 'Event ini bukan event online.',
  invalid_profile: 'Nama dan No. WA wajib diisi.',
  error: 'Gagal menyimpan. Coba lagi.',
}

export function CheckinClient({
  event,
  defaultProfile,
}: {
  event: OnlineAbsenEvent
  defaultProfile: OnlineCheckinProfile
}) {
  const [view, setView] = useState<View>({ kind: 'working' })
  const [profile, setProfile] = useState<OnlineCheckinProfile>(defaultProfile)
  const [formError, setFormError] = useState('')
  const started = useRef(false)

  const run = useCallback(
    async (input?: { profile?: OnlineCheckinProfile; idSesi?: number }) => {
      setView({ kind: 'working' })
      const res = await onlineCheckin(event.id_event, input)
      switch (res.status) {
        case 'attended':
          setView({ kind: 'attended' })
          return
        case 'need_profile':
          setView({ kind: 'profile' })
          return
        case 'need_sesi':
          setView({ kind: 'sesi', sesi: res.sesi })
          return
        case 'registered': {
          const window = res.endAtMs ? getOnlineAbsenWindow(new Date(res.endAtMs)) : null
          setView({
            kind: 'waiting',
            opensAtMs: window?.opensAt.getTime() ?? null,
            closed: res.phase === 'closed',
          })
          return
        }
        default:
          setView({ kind: 'error', message: FAIL_MESSAGE[res.reason] ?? FAIL_MESSAGE.error })
      }
    },
    [event.id_event],
  )

  // Registrasi + absen langsung jalan saat halaman dibuka.
  useEffect(() => {
    if (started.current) return
    started.current = true
    void run()
  }, [run])

  return (
    <main className="min-h-screen bg-bg pb-safe flex flex-col items-center">
      <div className="w-full max-w-sm px-5 py-6 flex flex-col gap-5">
        <EventHeader event={event} />

        {view.kind === 'working' && <Working />}

        {view.kind === 'attended' && <Attended eventName={event.nama_event} />}

        {view.kind === 'waiting' && (
          <Waiting
            opensAtMs={view.opensAtMs}
            closed={view.closed}
            jamselesai={event.jamselesaievent}
            onOpen={() => void run()}
          />
        )}

        {view.kind === 'profile' && (
          <ProfileForm
            profile={profile}
            error={formError}
            onChange={(patch) => setProfile((p) => ({ ...p, ...patch }))}
            onSubmit={() => {
              if (!profile.nama.trim() || !profile.nowa.trim()) {
                setFormError('Nama dan No. WA wajib diisi.')
                return
              }
              setFormError('')
              void run({ profile })
            }}
          />
        )}

        {view.kind === 'sesi' && (
          <SesiPicker sesi={view.sesi} onPick={(idSesi) => void run({ idSesi })} />
        )}

        {view.kind === 'error' && (
          <div className="border border-border rounded-card p-5 flex flex-col gap-3">
            <p className="text-sm text-red font-medium">{view.message}</p>
            <Button fullWidth variant="secondary" onClick={() => void run()}>
              Coba Lagi
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}

function EventHeader({ event }: { event: OnlineAbsenEvent }) {
  return (
    <div className="flex items-center gap-3">
      {event.posterUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={event.posterUrl}
          alt={event.nama_event}
          className="w-14 h-14 rounded-input object-cover shrink-0 border border-border"
        />
      ) : null}
      <div className="min-w-0">
        <p className="text-[11px] text-muted uppercase tracking-wider">Absen Event Online</p>
        <h1 className="text-lg font-bold text-fg leading-tight truncate">{event.nama_event}</h1>
        <p className="text-xs text-muted mt-0.5">
          {event.tglDisplay} · {event.jamevent}
        </p>
      </div>
    </div>
  )
}

function Working() {
  return (
    <div className="border border-border rounded-card p-8 flex flex-col items-center gap-3">
      <span className="w-7 h-7 rounded-full border-2 border-border border-t-fg animate-spin" />
      <p className="text-sm text-muted">Mendaftarkan & mencatat absen…</p>
    </div>
  )
}

function Attended({ eventName }: { eventName: string }) {
  return (
    <div className="border border-border rounded-card p-6 flex flex-col items-center gap-3 text-center">
      <div className="w-14 h-14 rounded-full bg-[#c8e7f5] border border-fg flex items-center justify-center text-2xl">
        ✓
      </div>
      <div>
        <p className="text-base font-bold text-fg">Absen tercatat</p>
        <p className="text-sm text-muted mt-1">
          Kamu terdaftar dan hadir di <span className="text-fg">{eventName}</span>.
        </p>
      </div>
      <Link href="/dashboard" className="text-sm text-fg underline mt-1">
        Ke Dashboard
      </Link>
    </div>
  )
}

function Waiting({
  opensAtMs,
  closed,
  jamselesai,
  onOpen,
}: {
  opensAtMs: number | null
  closed: boolean
  jamselesai: string
  onOpen: () => void
}) {
  const [remaining, setRemaining] = useState(() => msUntil(opensAtMs))
  const fired = useRef(false)
  // Ref supaya interval tidak dipasang ulang tiap detik saat countdown render.
  const onOpenRef = useRef(onOpen)
  useEffect(() => {
    onOpenRef.current = onOpen
  }, [onOpen])

  useEffect(() => {
    if (closed || opensAtMs == null) return
    const tick = () => {
      const left = msUntil(opensAtMs)
      setRemaining(left)
      if (left <= 0 && !fired.current) {
        fired.current = true
        onOpenRef.current()
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [opensAtMs, closed])

  if (closed) {
    return (
      <div className="border border-border rounded-card p-6 flex flex-col gap-2 text-center">
        <p className="text-base font-bold text-fg">Registrasi tercatat</p>
        <p className="text-sm text-muted">
          Waktu absen sudah berakhir (lewat bulan event). Hubungi panitia kalau kamu hadir.
        </p>
      </div>
    )
  }

  if (opensAtMs == null) {
    return (
      <div className="border border-border rounded-card p-6 flex flex-col gap-2 text-center">
        <p className="text-base font-bold text-fg">Registrasi tercatat</p>
        <p className="text-sm text-muted">
          Jadwal selesai event belum lengkap, jadi absen belum bisa dibuka. Hubungi panitia.
        </p>
      </div>
    )
  }

  return (
    <div className="border border-border rounded-card p-6 flex flex-col items-center gap-3 text-center">
      <div>
        <p className="text-base font-bold text-fg">Registrasi tercatat</p>
        <p className="text-sm text-muted mt-1">
          Absen dibuka 15 menit sebelum acara selesai
          {jamselesai ? ` (${jamselesai})` : ''}.
        </p>
      </div>
      <p className="text-3xl font-bold text-fg tabular-nums">{formatCountdown(remaining)}</p>
      <p className="text-xs text-muted">
        Biarkan halaman ini terbuka — absen tercatat otomatis saat waktunya tiba.
      </p>
    </div>
  )
}

function ProfileForm({
  profile,
  error,
  onChange,
  onSubmit,
}: {
  profile: OnlineCheckinProfile
  error: string
  onChange: (patch: Partial<OnlineCheckinProfile>) => void
  onSubmit: () => void
}) {
  return (
    <div className="border border-border rounded-card p-5 flex flex-col gap-4">
      <div>
        <p className="text-base font-bold text-fg">Lengkapi data sekali saja</p>
        <p className="text-sm text-muted mt-0.5">
          Setelah ini kamu langsung terdaftar dan absen.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Input
          label="Nama"
          placeholder="Nama lengkap"
          value={profile.nama}
          onChange={(e) => onChange({ nama: e.target.value })}
        />
        <Input
          label="Nomor WA"
          placeholder="08123456789"
          type="tel"
          value={profile.nowa}
          onChange={(e) => onChange({ nowa: e.target.value })}
        />
        <Input
          label="Gereja"
          placeholder="Nama gereja"
          value={profile.gereja}
          onChange={(e) => onChange({ gereja: e.target.value })}
        />
        <Input
          label="Sekolah / Universitas / Tempat Kerja"
          placeholder="cth: SMAN 1 Ngawi, UNIPMA, PT Maju Jaya"
          value={profile.sekolah}
          onChange={(e) => onChange({ sekolah: e.target.value })}
        />
      </div>

      {error && <p className="text-sm text-red font-medium">{error}</p>}

      <Button fullWidth size="lg" onClick={onSubmit}>
        Daftar & Absen
      </Button>
    </div>
  )
}

function SesiPicker({
  sesi,
  onPick,
}: {
  sesi: OnlineCheckinSesi[]
  onPick: (idSesi: number) => void
}) {
  return (
    <div className="border border-border rounded-card p-5 flex flex-col gap-4">
      <div>
        <p className="text-base font-bold text-fg">Pilih sesi</p>
        <p className="text-sm text-muted mt-0.5">Registrasi sudah tercatat. Pilih sesi yang kamu ikuti.</p>
      </div>
      <div className="flex flex-col gap-2">
        {sesi.map((s) => (
          <button
            key={s.id_sesi}
            type="button"
            onClick={() => onPick(s.id_sesi)}
            className="w-full text-left px-4 py-3 rounded-input border-[1.5px] border-border hover:border-accent transition"
          >
            <p className="text-[15px] font-medium text-fg">{s.nama}</p>
            <p className="text-xs text-muted mt-0.5">
              {s.jam_mulai} – {s.jam_selesai}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}

function msUntil(target: number | null): number {
  if (target == null) return 0
  return Math.max(0, target - Date.now())
}

function formatCountdown(ms: number): string {
  const total = Math.ceil(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}
