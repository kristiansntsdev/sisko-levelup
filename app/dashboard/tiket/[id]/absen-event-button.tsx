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
      <p className="rounded-2xl bg-emerald-50 ring-1 ring-emerald-200 text-emerald-700 text-[14px] font-semibold text-center py-3">
        Absen berhasil tercatat.
      </p>
    )
  }

  const open = phase === 'open'
  const hint =
    phase === 'too_early'
      ? 'Absen dibuka 15 menit sebelum acara selesai.'
      : phase === 'closed'
        ? 'Jendela absen sudah ditutup.'
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

  if (!open) {
    return hint ? (
      <p className="text-[12.5px] text-slate-500 text-center py-2">{hint}</p>
    ) : null
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleAbsen}
        disabled={pending}
        className="w-full py-3.5 rounded-2xl bg-[#c9232c] text-white font-bold shadow-[0_8px_20px_-6px_rgba(201,35,44,.6)] disabled:opacity-40 active:scale-[.99] transition"
      >
        {pending ? 'Menyimpan…' : 'Absen Event'}
      </button>
      <p className="text-[11.5px] text-slate-400 text-center mt-2">
        Event online: absen mandiri dibuka 15 menit sebelum selesai, berlaku sampai akhir bulan.
      </p>
    </div>
  )
}

function computePhase(tglSelesaiMs: number, jam: string): OnlineAbsenPhase {
  if (!tglSelesaiMs || !jam) return 'unknown'
  const endAt = eventDateTime(new Date(tglSelesaiMs), jam)
  return onlineAbsenPhase(new Date(), endAt)
}
