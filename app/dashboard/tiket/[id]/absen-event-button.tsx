'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { absenOnlineSelf } from '@/lib/actions/absen'
import {
  eventDateTime,
  onlineAbsenPhase,
  type OnlineAbsenPhase,
} from '@/lib/event-absen-window'
import { useToast } from '@/hooks/use-toast'

type Props = {
  idRegistrasi: number
  tglSelesaiMs: number
  jamselesaievent: string
  alreadyAttended: boolean
}

export function AbsenEventButton({
  idRegistrasi,
  tglSelesaiMs,
  jamselesaievent,
  alreadyAttended,
}: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()
  const [phase, setPhase] = useState<OnlineAbsenPhase>(() => computePhase(tglSelesaiMs, jamselesaievent))
  const [done, setDone] = useState(alreadyAttended)

  useEffect(() => {
    const tick = () => setPhase(computePhase(tglSelesaiMs, jamselesaievent))
    tick()
    const id = setInterval(tick, 15_000)
    return () => clearInterval(id)
  }, [tglSelesaiMs, jamselesaievent])

  if (done) {
    return (
      <p className="w-full text-center text-sm font-medium text-green py-3">
        Absen berhasil tercatat.
      </p>
    )
  }

  const open = phase === 'open'
  const hint =
    phase === 'too_early'
      ? 'Absen dibuka 15 menit sebelum acara selesai.'
      : phase === 'closed'
        ? 'Waktu absen sudah berakhir (lewat bulan event).'
        : phase === 'unknown'
          ? 'Jadwal selesai event belum lengkap.'
          : null

  function handleAbsen() {
    startTransition(async () => {
      const res = await absenOnlineSelf(idRegistrasi)
      if (res.success) {
        setDone(true)
        toast({ title: 'Absen berhasil', variant: 'success' })
        router.refresh()
        return
      }
      const msg = {
        unauthenticated: 'Silakan login ulang.',
        not_found: 'Tiket tidak ditemukan.',
        forbidden: 'Tiket ini bukan milikmu.',
        not_online: 'Absen mandiri hanya untuk event online.',
        window_closed: 'Di luar jendela absen (dibuka 15 menit sebelum selesai, berlaku sampai akhir bulan).',
        already_scanned: 'Kamu sudah absen.',
        error: 'Gagal menyimpan absen. Coba lagi.',
      } as const
      if (res.reason === 'already_scanned') setDone(true)
      toast({
        title: msg[res.reason],
        variant: res.reason === 'already_scanned' ? 'info' : 'error',
      })
      setPhase(computePhase(tglSelesaiMs, jamselesaievent))
    })
  }

  return (
    <div className="w-full flex flex-col gap-2">
      <button
        type="button"
        onClick={handleAbsen}
        disabled={!open || pending}
        className="w-full py-3.5 rounded-full border border-fg bg-[#c8e7f5] text-fg text-[15px] font-semibold cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed hover:brightness-95 transition"
      >
        {pending ? 'Menyimpan…' : 'Absen Event'}
      </button>
      {hint && <p className="text-xs text-muted text-center">{hint}</p>}
    </div>
  )
}

function computePhase(tglSelesaiMs: number, jam: string): OnlineAbsenPhase {
  if (!tglSelesaiMs || !jam) return 'unknown'
  const endAt = eventDateTime(new Date(tglSelesaiMs), jam)
  return onlineAbsenPhase(new Date(), endAt)
}
