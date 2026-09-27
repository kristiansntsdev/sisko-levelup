'use client'
import { Table, Badge, type TableColumn } from '@/components/ui'

export type AppLogRow = {
  id: number
  level: 'info' | 'error'
  model_name: string | null
  operation: string | null
  action: string | null
  actor_type: 'pengurus' | 'peserta' | 'system' | 'unknown'
  actor_id: number | null
  actor_label: string | null
  success: boolean
  error_message: string | null
  detail: string | null
  route_path: string | null
  created_at: string
}

function formatWaktu(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'medium',
    timeStyle: 'medium',
  })
}

function actorText(row: AppLogRow): string {
  if (row.actor_type === 'unknown') return '—'
  const label = row.actor_label || `#${row.actor_id}`
  return `${row.actor_type} · ${label}`
}

// Table (components/ui) ini belum dipakai di tempat lain — closure `cell`
// tidak bisa lewat batas Server -> Client, jadi kolomnya didefinisikan di
// sini (client) dan page.tsx (server) cuma ngoper data mentah yang serializable.
const columns: TableColumn<AppLogRow>[] = [
  {
    key: 'created_at',
    header: 'Waktu',
    cell: (r) => <span className="whitespace-nowrap">{formatWaktu(r.created_at)}</span>,
  },
  {
    key: 'level',
    header: 'Level',
    cell: (r) => (
      <Badge variant={r.level === 'error' ? 'red' : 'green'}>{r.level}</Badge>
    ),
  },
  {
    key: 'action',
    header: 'Aksi',
    cell: (r) => <span className="font-mono text-[13px]">{r.action ?? '—'}</span>,
  },
  {
    key: 'model_name',
    header: 'Model',
    cell: (r) => r.model_name ?? '—',
  },
  {
    key: 'actor',
    header: 'Actor',
    cell: (r) => actorText(r),
  },
  {
    key: 'message',
    header: 'Pesan',
    cell: (r) => (
      <span className={r.level === 'error' ? 'text-red' : 'text-fg2'}>
        {r.error_message ?? '—'}
      </span>
    ),
  },
  {
    key: 'detail',
    header: 'Detail',
    cell: (r) =>
      r.detail ? (
        <details>
          <summary className="cursor-pointer text-accent text-[13px]">lihat</summary>
          <pre className="mt-1.5 max-w-md overflow-auto whitespace-pre-wrap break-all rounded-[8px] bg-bg p-2 text-[11px] text-fg2">
            {(() => {
              try {
                return JSON.stringify(JSON.parse(r.detail!), null, 2)
              } catch {
                return r.detail
              }
            })()}
          </pre>
        </details>
      ) : (
        '—'
      ),
  },
]

export function LogTable({ rows }: { rows: AppLogRow[] }) {
  return (
    <Table
      columns={columns}
      data={rows}
      keyExtractor={(r) => String(r.id)}
      emptyState="Belum ada log yang cocok dengan filter."
    />
  )
}
