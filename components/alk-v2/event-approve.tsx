'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import {
  approveEventAlkNasional,
  approveEventBrimNasional,
  rejectEventAlkNasional,
  rejectEventBrimNasional,
} from '@/lib/actions/event'
import { ANTON, BackBar, ERROR, LIFTED, MONO, PANEL, PaperMain, Poster } from '@/components/pwa/paper-ui'
import { ALK_BASE, Decide, FLD, Field, Note, Pill } from './ui'

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
  qa,
}: {
  event: ApproveEventData
  role: 'alk' | 'brim'
  backHref?: string
  /** Extra review panels (QA flyer / berita acara) rendered under the flyer. */
  qa?: ReactNode
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
    <PaperMain>
      <BackBar title="Approval Event" onBack={goBack} />

      <div className="px-5 pt-5 pb-10 space-y-5">
        <div>
          <h1 className={`${ANTON} text-[34px] leading-[1.05] tracking-[.01em] break-words`}>{event.nama_event}</h1>
          <p className={`${MONO} text-[12px] font-bold text-[#44403c] mt-1.5`}>{event.tglDisplay}</p>
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
          <figure className={`relative -mx-1 p-1.5 rounded-[6px] bg-[#fffdf7] -rotate-[.6deg] ${LIFTED}`}>
            <span aria-hidden className="absolute z-10 -top-2.5 left-1/2 -translate-x-1/2 -rotate-3 w-20 h-5 bg-[#ffd83d]/85" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={event.posterUrl} alt={`Flyer ${event.nama_event}`} className="w-full h-auto block bg-[#d6d0c4]" />
          </figure>
        ) : (
          <div className={`relative ${PANEL} overflow-hidden`}>
            <Poster src="" className="w-full aspect-[16/9]" />
            <p className={`${MONO} py-3 text-center text-[12px] text-[#57534e]`}>Belum ada flyer</p>
          </div>
        )}

        {qa}

        {notes ? (
          <Note tone="gold">
            <b>Catatan nasional</b>
            <p className="mt-1 whitespace-pre-wrap break-words">{notes}</p>
          </Note>
        ) : null}

        {alreadyApproved ? (
          <p className={`${ANTON} rounded-[14px] bg-[#ffd83d] px-4 py-3.5 text-center text-[17px] tracking-[.02em]`}>
            {role === 'alk' ? 'Sudah disetujui ALK Nasional' : 'Sudah disetujui Brim Nasional'}
          </p>
        ) : (
          <div className={`p-4 space-y-4 ${PANEL}`}>
            <Field label="Alasan Reject">
              <textarea
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                rows={4}
                placeholder="Isi jika reject…"
                className={`${FLD} resize-none`}
              />
            </Field>

            {error ? <p role="alert" className={ERROR}>{error}</p> : null}

            <Decide
              approve={pending && action === 'approve' ? '…' : 'Approve'}
              reject={pending && action === 'reject' ? '…' : 'Reject'}
              disabled={pending}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          </div>
        )}
      </div>
    </PaperMain>
  )
}
