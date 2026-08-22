import type { ReactNode } from 'react'
import type { EventDashboard } from '@/lib/actions/event'
import { isEventFullyApproved } from '@/lib/event-approval'

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
const DOW_SHORT   = ['Min','Sen','Sel','Rab','Kam','Jum','Sab']

export type EventStatus = 'upcoming' | 'ongoing' | 'past'

export function eventMatchesQuery(event: EventDashboard, q: string): boolean {
  const s = q.trim().toLowerCase()
  if (!s) return true
  return (
    event.nama_event.toLowerCase().includes(s) ||
    event.alamatevent.toLowerCase().includes(s) ||
    event.tglDisplay.toLowerCase().includes(s) ||
    String(event.id_event).includes(s)
  )
}

export function getEventStatus(tglMs: number): EventStatus {
  const diff = Math.floor((tglMs - Date.now()) / 86_400_000)
  if (diff < -1) return 'past'
  if (diff <= 1) return 'ongoing'
  return 'upcoming'
}

const STATUS_LABEL: Record<EventStatus, string> = {
  upcoming: 'Mendatang',
  ongoing: 'Berjalan',
  past: 'Selesai',
}

interface EventDateCardProps {
  event: EventDashboard
  onClick?: () => void
  /** Optional footer action (e.g. full-width approve) — click does not trigger card onClick */
  action?: ReactNode
}

export function EventDateCard({ event, onClick, action }: EventDateCardProps) {
  const tglMs = Number(event.tglMs)
  const d = Number.isFinite(tglMs) ? new Date(tglMs) : null
  const day = d?.getDate()
  const month = d?.getMonth()
  const dow = d?.getDay()
  const status = getEventStatus(Number.isFinite(tglMs) ? tglMs : 0)

  const dateBlockCls =
    status === 'ongoing'
      ? 'bg-accent text-white'
      : status === 'past'
      ? 'bg-bg opacity-55'
      : 'bg-bg'

  const statusCls =
    status === 'ongoing'
      ? 'bg-green-light text-green'
      : status === 'past'
      ? 'bg-bg text-muted border border-border'
      : 'bg-accent-light text-accent-dark'

  return (
    <div
      onClick={onClick}
      className={`bg-surface border border-border rounded-[16px] overflow-hidden transition-all duration-150 ${
        onClick ? 'cursor-pointer shadow-sm hover:border-accent hover:shadow-md active:scale-[0.99]' : ''
      }`}
    >
      <div className="p-[14px] flex gap-[14px]">
        {/* Date block */}
        <div
          className={`w-14 shrink-0 rounded-[12px] flex flex-col items-center justify-center py-2 gap-0.5 ${dateBlockCls}`}
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.8px] opacity-70">
            {month != null ? MONTH_SHORT[month] : '—'}
          </span>
          <span className="text-[22px] font-bold leading-none">
            {day != null && Number.isFinite(day) ? day : '—'}
          </span>
          <span className="text-[10px] font-medium opacity-70">
            {dow != null ? DOW_SHORT[dow] : '—'}
          </span>
        </div>

        {/* Event info */}
        <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 flex flex-col gap-1.5">
            <p className="text-[15px] font-bold leading-snug text-fg line-clamp-2">{event.nama_event}</p>
            <p className="text-[12px] text-muted flex items-center gap-1.5 flex-wrap">
              {event.alamatevent && <span>{event.alamatevent}</span>}
              {event.alamatevent && event.jamevent && (
                <span className="w-[3px] h-[3px] rounded-full bg-subtle inline-block" />
              )}
              {event.jamevent && <span>{event.jamevent}</span>}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusCls}`}>
              {status === 'ongoing' && (
                <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
              )}
              {STATUS_LABEL[status]}
            </span>
            {isEventFullyApproved(event) ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-light text-green-dark">
                Disetujui
              </span>
            ) : (
              <>
                {event.approvenasional === '1' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-light text-green-dark">
                    Approval ALK
                  </span>
                ) : null}
                {event.approvebrimnas === '1' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-light text-green-dark">
                    Approval Brim
                  </span>
                ) : null}
                {event.approvenasional !== '1' && event.approvebrimnas !== '1' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-light text-amber-dark">
                    Belum Approve
                  </span>
                ) : event.approvenasional === '1' && event.approvebrimnas !== '1' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-light text-amber-dark">
                    Belum Brim
                  </span>
                ) : event.approvebrimnas === '1' && event.approvenasional !== '1' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-light text-amber-dark">
                    Belum ALK
                  </span>
                ) : null}
              </>
            )}
            {event.khusus === '1' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent-light text-accent-dark">
                Khusus
              </span>
            )}
          </div>
        </div>
      </div>

      {action ? (
        <div
          className="border-t border-border px-[14px] py-2.5"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {action}
        </div>
      ) : null}
    </div>
  )
}
