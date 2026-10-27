'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  approveEventAlkNasional,
  approveEventBrimNasional,
  rejectEventAlkNasional,
  rejectEventBrimNasional,
} from '@/lib/actions/event'
import { ALK_BASE, CARD, FLD, Note, Pill, PlainBar } from './ui'

export type ApproveEventData = {
  id_event: number
  nama_event: string
  tglDisplay: string
  posterUrl: string
  approvenasional: string
  approvebrimnas: string
  notenasional: string
}

export function EventApproveV2Client({
  event,
  role,
  backHref = ALK_BASE,
}: {
  event: ApproveEventData
  role: 'alk' | 'brim'
  backHref?: string
}) {
  const router = useRouter()
  const [alasan, setAlasan] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)

  const alreadyApproved =
    role === 'alk' ? event.approvenasional === '1' : event.approvebrimnas === '1'
  const notes = event.notenasional.trim()

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
    <section className="min-h-screen pb-10">
      <PlainBar title="Approval Event" back={goBack} />

      <div className="px-5 pt-5 space-y-5">
        <div className={`${CARD} overflow-hidden`}>
          <div className="px-4 pt-4 pb-3">
            <p className="text-[17px] font-extrabold text-[#3b1417] leading-snug">
              {event.nama_event}
            </p>
            <p className="text-[13px] text-slate-500 mt-1">{event.tglDisplay}</p>
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              <Pill tone={event.approvenasional === '1' ? 'green' : 'amber'}>
                {event.approvenasional === '1' ? 'Approval ALK' : 'Belum ALK'}
              </Pill>
              <Pill tone={event.approvebrimnas === '1' ? 'green' : 'amber'}>
                {event.approvebrimnas === '1' ? 'Approval Brim' : 'Belum Brim'}
              </Pill>
            </div>
          </div>
          {event.posterUrl ? (
            <div className="border-t border-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={event.posterUrl}
                alt={`Flyer ${event.nama_event}`}
                className="w-full object-cover"
              />
            </div>
          ) : (
            <div className="w-full aspect-[3/4] bg-[#faf7f2] flex items-center justify-center border-t border-slate-100">
              <p className="text-[13px] text-slate-400">Belum ada flyer</p>
            </div>
          )}
        </div>

        {notes ? (
          <Note tone="gold">
            <b>Catatan nasional</b>
            <p className="mt-1 whitespace-pre-wrap">{notes}</p>
          </Note>
        ) : null}

        {alreadyApproved ? (
          <div className="rounded-2xl bg-emerald-50 ring-1 ring-emerald-200 px-4 py-3.5 text-center">
            <p className="text-[14px] font-bold text-emerald-700">
              {role === 'alk' ? 'Sudah disetujui ALK Nasional' : 'Sudah disetujui Brim Nasional'}
            </p>
          </div>
        ) : (
          <>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-bold text-[#3b1417]">Alasan Reject</span>
              <textarea
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                rows={4}
                placeholder="Isi jika reject…"
                className={`${FLD} resize-none`}
              />
            </label>

            {error ? (
              <p className="text-[13px] text-[#c9232c] font-semibold">{error}</p>
            ) : null}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleApprove}
                disabled={pending}
                className="flex-1 py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-[15px] shadow-[0_8px_20px_-8px_rgba(5,150,105,.55)] active:scale-[.99] transition disabled:opacity-50"
              >
                {pending && action === 'approve' ? '…' : 'Approve'}
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={pending}
                className="flex-1 py-3.5 rounded-2xl bg-[#c9232c] text-white font-bold text-[15px] shadow-[0_8px_20px_-8px_rgba(201,35,44,.55)] active:scale-[.99] transition disabled:opacity-50"
              >
                {pending && action === 'reject' ? '…' : 'Reject'}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
