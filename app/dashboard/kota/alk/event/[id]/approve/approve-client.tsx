'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { EventDetailFull } from '@/lib/actions/event'
import {
  approveEventAlkNasional,
  approveEventBrimNasional,
  rejectEventAlkNasional,
  rejectEventBrimNasional,
} from '@/lib/actions/event'
import { FlyerQaSummary } from '@/components/kota/flyer-qa-summary'

export function EventApproveClient({
  event,
  role,
}: {
  event: EventDetailFull
  role: 'alk' | 'brim'
}) {
  const router = useRouter()
  const [alasan, setAlasan] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)

  const alreadyApproved =
    role === 'alk' ? event.approvenasional === '1' : event.approvebrimnas === '1'
  const notes = event.notenasional.trim()
  const backHref = role === 'alk' ? '/dashboard/kota/alk' : '/dashboard/kota/brim'

  function goBack() {
    router.push(backHref)
    router.refresh()
  }

  function handleApprove() {
    setError('')
    setAction('approve')
    startTransition(async () => {
      const res =
        role === 'alk'
          ? await approveEventAlkNasional(event.id_event)
          : await approveEventBrimNasional(event.id_event)
      if (!res.ok) {
        setError(res.error)
        setAction(null)
        return
      }
      goBack()
    })
  }

  function handleReject() {
    setError('')
    if (!alasan.trim()) {
      setError('Alasan reject wajib diisi')
      return
    }
    setAction('reject')
    startTransition(async () => {
      const res =
        role === 'alk'
          ? await rejectEventAlkNasional(event.id_event, alasan)
          : await rejectEventBrimNasional(event.id_event, alasan)
      if (!res.ok) {
        setError(res.error)
        setAction(null)
        return
      }
      goBack()
    })
  }

  return (
    <main className="min-h-screen bg-bg pb-10">
      <nav className="sticky top-0 z-10 bg-surface border-b border-border">
        <div className="max-w-[480px] mx-auto px-5 pt-6 pb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            className="text-sm text-muted hover:text-fg transition-colors shrink-0 cursor-pointer"
          >
            ← Kembali
          </button>
          <p className="text-[14px] font-semibold text-fg truncate flex-1 text-center">
            Approval Event
          </p>
          <span className="w-14 shrink-0" />
        </div>
      </nav>

      <div className="max-w-[480px] mx-auto px-4 pt-5 flex flex-col gap-4">
        <div className="bg-surface border border-border rounded-[16px] overflow-hidden">
          <div className="px-4 pt-4 pb-3">
            <p className="text-[17px] font-bold text-fg leading-snug">{event.nama_event}</p>
            <p className="text-[12px] text-muted mt-1">{event.tglDisplay}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {event.approvenasional === '1' ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-light text-green-dark">
                  Approval ALK
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-light text-amber-dark">
                  Belum ALK
                </span>
              )}
              {event.approvebrimnas === '1' ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-light text-green-dark">
                  Approval Brim
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-light text-amber-dark">
                  Belum Brim
                </span>
              )}
            </div>
          </div>
          {event.posterUrl ? (
            <div className="border-t border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={event.posterUrl}
                alt={`Flyer ${event.nama_event}`}
                className="w-full object-cover"
              />
            </div>
          ) : (
            <div className="w-full aspect-[3/4] bg-bg flex items-center justify-center border-t border-border">
              <p className="text-[13px] text-muted">Belum ada flyer</p>
            </div>
          )}
        </div>

        <FlyerQaSummary eventId={event.id_event} initial={event.flyerQa} live={false} />

        {notes ? (
          <div className="bg-amber-light border border-border rounded-[14px] px-4 py-3">
            <p className="text-[11px] font-semibold text-amber-dark uppercase tracking-wide">
              Catatan nasional
            </p>
            <p className="text-[13px] text-fg mt-1.5 whitespace-pre-wrap">{notes}</p>
          </div>
        ) : null}

        {alreadyApproved ? (
          <div className="bg-green-light rounded-[14px] px-4 py-3 text-center">
            <p className="text-[14px] font-semibold text-green-dark">
              {role === 'alk' ? 'Sudah disetujui ALK Nasional' : 'Sudah disetujui Brim Nasional'}
            </p>
          </div>
        ) : (
          <>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-fg">Alasan Reject</span>
              <textarea
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                rows={4}
                placeholder="Isi jika reject…"
                className="w-full rounded-[14px] border border-border bg-surface px-3.5 py-3 text-[14px] text-fg placeholder:text-subtle resize-none focus:outline-none focus:border-accent"
              />
            </label>

            {error ? (
              <p className="text-[13px] text-red font-medium">{error}</p>
            ) : null}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleApprove}
                disabled={pending}
                className="flex-1 py-3.5 rounded-[14px] bg-green text-white font-semibold text-[15px] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {pending && action === 'approve' ? '…' : 'Approve'}
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={pending}
                className="flex-1 py-3.5 rounded-[14px] bg-red text-white font-semibold text-[15px] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {pending && action === 'reject' ? '…' : 'Reject'}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
