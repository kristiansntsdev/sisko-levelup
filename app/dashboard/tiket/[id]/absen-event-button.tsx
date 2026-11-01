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
import { BTN, MONO, Strip } from '@/components/pwa/paper-ui'

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
      <p className={`${MONO} rounded-[14px] bg-[#ffd83d] text-[#161616] text-[13px] font-bold text-center py-3`}>Absen berhasil tercatat.</p>
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
      <p className={`${MONO} rounded-[14px] border-2 border-dotted border-[#161616]/30 text-[12px] leading-relaxed text-[#44403c] text-center py-3 px-4`}>{hint}</p>
    ) : null
  }

  return (
    <div>
      <button type="button" onClick={handleAbsen} disabled={pending} className={BTN}>
        <Strip>{pending ? 'Menyimpan…' : 'Absen Event'}</Strip>
      </button>
      <p className={`${MONO} text-[11px] leading-relaxed text-[#44403c] text-center mt-2`}>
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
