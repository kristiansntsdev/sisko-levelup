import type { EventDashboard } from '@/lib/actions/event'

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
const DOW_SHORT   = ['Min','Sen','Sel','Rab','Kam','Jum','Sab']

export type EventStatus = 'upcoming' | 'ongoing' | 'past'

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
}

export function EventDateCard({ event, onClick }: EventDateCardProps) {
  const d = new Date(event.tglMs)
  const status = getEventStatus(event.tglMs)

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
      className={`bg-surface border border-border rounded-[16px] p-[14px] flex gap-[14px] transition-all duration-150 ${
        onClick ? 'cursor-pointer hover:border-accent active:scale-[0.99]' : ''
      }`}
    >
      {/* Date block */}
      <div
        className={`w-14 shrink-0 rounded-[12px] flex flex-col items-center justify-center py-2 gap-0.5 ${dateBlockCls}`}
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.8px] opacity-70">
          {MONTH_SHORT[d.getMonth()]}
        </span>
        <span className="text-[22px] font-bold leading-none">{d.getDate()}</span>
        <span className="text-[10px] font-medium opacity-70">{DOW_SHORT[d.getDay()]}</span>
      </div>

      {/* Event info */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[15px] font-bold leading-snug text-fg line-clamp-2">{event.nama_event}</p>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusCls}`}>
              {status === 'ongoing' && (
                <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
              )}
              {STATUS_LABEL[status]}
            </span>
            {event.approvenasional === '1' ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-light text-green-dark">
                Disetujui
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-light text-amber-dark">
                Belum Approve
              </span>
            )}
          </div>
        </div>
        <p className="text-[12px] text-muted flex items-center gap-1.5 flex-wrap">
          {event.alamatevent && <span>{event.alamatevent}</span>}
          {event.alamatevent && event.jamevent && (
            <span className="w-[3px] h-[3px] rounded-full bg-subtle inline-block" />
          )}
          {event.jamevent && <span>{event.jamevent}</span>}
        </p>
      </div>
    </div>
  )
}
