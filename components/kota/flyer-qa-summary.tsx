'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { ajukanEventFlyer, pollFlyerReview, retryFlyerReview } from '@/lib/actions/event'
import {
  FLYER_QA_CHECKLIST_LABELS,
  flyerQaReviewingStep,
  type FlyerQaOverall,
  type FlyerQaRecord,
} from '@/lib/flyer-qa'

const POLL_MS = 5_000
const TIMEOUT_MS = 4 * 60 * 1_000

const BADGE: Record<FlyerQaOverall, string> = {
  PASS: 'bg-green-light text-green-dark',
  REVISI: 'bg-amber-light text-amber-dark',
  BLOKIR: 'bg-red-light text-red',
}

const CHECK_KEYS = [
  'logo_levelup_kota', 'logo_pphtgd', 'logo_acara', 'pembicara',
  'tempat', 'tanggal', 'waktu', 'sosial_media',
] as const

function ReviewingStatus({ startedAt }: { startedAt: number }) {
  const [elapsed, setElapsed] = useState(() => Date.now() - startedAt)
  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - startedAt), 400)
    return () => clearInterval(id)
  }, [startedAt])
  return (
    <div className="flex items-center gap-2.5">
      <span className="relative flex size-2.5 shrink-0">
        <span className="absolute inline-flex size-full rounded-full bg-accent opacity-60 animate-ping" />
        <span className="relative inline-flex size-2.5 rounded-full bg-accent" />
      </span>
      <p className="text-[13px] text-muted">{flyerQaReviewingStep(elapsed)}</p>
    </div>
  )
}

export function FlyerQaSummary({
  eventId,
  initial,
  editHref,
}: {
  eventId: number
  initial: FlyerQaRecord | null
  editHref: string
}) {
  const [qa, setQa] = useState(initial)
  const [timedOut, setTimedOut] = useState(false)
  const [msg, setMsg] = useState('')
  const [isPending, startTransition] = useTransition()
  const started = useRef(Date.now())
  const [reviewStartedAt, setReviewStartedAt] = useState(Date.now())

  useEffect(() => {
    if (qa?.state !== 'reviewing') return
    started.current = Date.now()
    setReviewStartedAt(Date.now())
    setTimedOut(false)
    let stop = false
    function tick() {
      if (stop) return
      if (Date.now() - started.current > TIMEOUT_MS) {
        setTimedOut(true)
        return
      }
      void pollFlyerReview(eventId).then((next) => {
        if (stop) return
        if (next) setQa(next)
        if (next?.state === 'reviewing') setTimeout(tick, POLL_MS)
      }).catch(() => {
        if (!stop) setTimeout(tick, POLL_MS)
      })
    }
    const t = setTimeout(tick, 1500)
    return () => {
      stop = true
      clearTimeout(t)
    }
  }, [eventId, qa?.state, qa?.agentId])

  if (!qa) return null

  function retry() {
    setMsg('')
    startTransition(async () => {
      try {
        const next = await retryFlyerReview(eventId)
        setQa(next)
        setTimedOut(false)
      } catch (err) {
        setMsg(err instanceof Error ? err.message : 'Gagal review ulang')
      }
    })
  }

  function ajukan() {
    setMsg('')
    startTransition(async () => {
      const res = await ajukanEventFlyer(eventId)
      if (!res.ok) {
        setMsg(res.error)
        return
      }
      setQa((prev) => prev ? { ...prev, diajukan: true, diajukanAt: new Date().toISOString() } : prev)
    })
  }

  return (
    <div className="bg-surface border border-border rounded-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-fg">Review Flyer AI</p>
        {qa.state === 'done' && qa.review && (
          <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${BADGE[qa.review.status]}`}>
            {qa.review.status}
          </span>
        )}
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        {qa.state === 'reviewing' && !timedOut && (
          <ReviewingStatus startedAt={reviewStartedAt} />
        )}

        {(qa.state === 'error' || timedOut) && (
          <>
            <p className="text-[13px] text-red">
              {timedOut ? 'Review terlalu lama. Coba lagi.' : (qa.error || 'Review gagal')}
            </p>
            <button
              type="button"
              onClick={retry}
              disabled={isPending}
              className="w-full py-3 bg-accent text-white rounded-btn text-[14px] font-semibold disabled:opacity-60"
            >
              {isPending ? 'Memulai ulang...' : 'Review ulang'}
            </button>
          </>
        )}

        {qa.state === 'done' && qa.review && (
          <>
            <div className="flex flex-col gap-1.5">
              {CHECK_KEYS.map((key) => {
                const item = qa.review!.checklist[key]
                return (
                  <div key={key} className="flex gap-2 text-[12px]">
                    <span className="text-muted w-[7.5rem] shrink-0">{FLYER_QA_CHECKLIST_LABELS[key]}</span>
                    <span className="text-fg font-medium">{item.status}</span>
                    {item.teks ? <span className="text-muted truncate">{item.teks}</span> : null}
                  </div>
                )
              })}
              <div className="flex gap-2 text-[12px]">
                <span className="text-muted w-[7.5rem] shrink-0">{FLYER_QA_CHECKLIST_LABELS.typo}</span>
                <span className="text-fg font-medium">{qa.review.checklist.typo.status}</span>
              </div>
            </div>

            {qa.review.temuan.length > 0 && (
              <div>
                <p className="text-[12px] font-semibold text-fg mb-1">Temuan</p>
                <ul className="list-disc pl-4 text-[12px] text-muted flex flex-col gap-0.5">
                  {qa.review.temuan.map((t) => <li key={t}>{t}</li>)}
                </ul>
              </div>
            )}
            {qa.review.rekomendasi.length > 0 && (
              <div>
                <p className="text-[12px] font-semibold text-fg mb-1">Rekomendasi</p>
                <ul className="list-disc pl-4 text-[12px] text-muted flex flex-col gap-0.5">
                  {qa.review.rekomendasi.map((t) => <li key={t}>{t}</li>)}
                </ul>
              </div>
            )}
            {qa.review.typo_list.length > 0 && (
              <p className="text-[12px] text-muted">
                Typo: {qa.review.typo_list.map((t) => `${t.tertulis} → ${t.usulan}`).join('; ')}
              </p>
            )}

            {qa.diajukan ? (
              <p className="text-[13px] font-semibold text-green-dark">Sudah diajukan</p>
            ) : (
              <button
                type="button"
                onClick={ajukan}
                disabled={isPending}
                className="w-full py-3 bg-accent text-white rounded-btn text-[14px] font-semibold disabled:opacity-60"
              >
                {isPending ? 'Mengajukan...' : 'Ajukan'}
              </button>
            )}
          </>
        )}

        {msg && <p className="text-[12px] text-red">{msg}</p>}

        <Link href={editHref} className="text-[12px] text-accent font-medium">
          Upload ulang poster
        </Link>
      </div>
    </div>
  )
}
