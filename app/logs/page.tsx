import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import type { Prisma, app_log_level, app_log_actor_type } from '@/lib/generated/client'
import { LOGS_COOKIE, verifySessionCookieValue } from '@/lib/logs-auth'
import { logoutLogs } from './actions'
import { LogTable, type AppLogRow } from './log-table'

const PAGE_SIZE = 50

type SearchParams = { [key: string]: string | string[] | undefined }

function one(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? '') : (v ?? '')
}

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const cookieStore = await cookies()
  if (!verifySessionCookieValue(cookieStore.get(LOGS_COOKIE)?.value)) {
    redirect('/logs/login')
  }

  const sp = await searchParams
  const level = one(sp.level)
  const modelName = one(sp.model)
  const action = one(sp.action)
  const actorType = one(sp.actor_type)
  const actorIdRaw = one(sp.actor_id)
  const from = one(sp.from)
  const to = one(sp.to)
  const q = one(sp.q).trim()
  const page = Math.max(1, Number(one(sp.page)) || 1)

  const where: Prisma.app_logWhereInput = {
    ...(level ? { level: level as app_log_level } : {}),
    ...(modelName ? { model_name: modelName } : {}),
    ...(action ? { action: { contains: action } } : {}),
    ...(actorType ? { actor_type: actorType as app_log_actor_type } : {}),
    ...(actorIdRaw ? { actor_id: Number(actorIdRaw) } : {}),
    ...(from || to
      ? {
          created_at: {
            ...(from ? { gte: new Date(`${from}T00:00:00+07:00`) } : {}),
            ...(to ? { lte: new Date(`${to}T23:59:59+07:00`) } : {}),
          },
        }
      : {}),
    ...(q
      ? {
          OR: [
            { error_message: { contains: q } },
            { detail: { contains: q } },
            { action: { contains: q } },
            { actor_label: { contains: q } },
          ],
        }
      : {}),
  }

  const [rows, total, modelRows] = await Promise.all([
    db.app_log.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.app_log.count({ where }),
    db.app_log.findMany({
      where: { model_name: { not: null } },
      distinct: ['model_name'],
      select: { model_name: true },
      orderBy: { model_name: 'asc' },
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const models = modelRows.map((r) => r.model_name!).filter(Boolean)

  const displayRows: AppLogRow[] = rows.map((r) => ({
    id: r.id,
    level: r.level,
    model_name: r.model_name,
    operation: r.operation,
    action: r.action,
    actor_type: r.actor_type,
    actor_id: r.actor_id,
    actor_label: r.actor_label,
    success: r.success,
    error_message: r.error_message,
    detail: r.detail,
    route_path: r.route_path,
    created_at: r.created_at.toISOString(),
  }))

  function pageHref(p: number): string {
    const params = new URLSearchParams()
    if (level) params.set('level', level)
    if (modelName) params.set('model', modelName)
    if (action) params.set('action', action)
    if (actorType) params.set('actor_type', actorType)
    if (actorIdRaw) params.set('actor_id', actorIdRaw)
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    if (q) params.set('q', q)
    params.set('page', String(p))
    return `/logs?${params.toString()}`
  }

  return (
    <main className="max-w-5xl mx-auto min-h-screen bg-bg px-4 py-8 pb-safe flex flex-col gap-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-fg">Log Sistem</h1>
          <p className="text-sm text-muted mt-0.5">{total} baris cocok dengan filter</p>
        </div>
        <form action={logoutLogs}>
          <button type="submit" className="text-sm text-muted hover:text-fg transition-colors">
            Keluar
          </button>
        </form>
      </header>

      <form
        method="get"
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface border border-border rounded-card p-4"
      >
        <select
          name="level"
          defaultValue={level}
          className="px-3 py-2 border-[1.5px] border-border rounded-input text-[14px] bg-surface text-fg"
        >
          <option value="">Semua level</option>
          <option value="info">info</option>
          <option value="error">error</option>
        </select>

        <select
          name="model"
          defaultValue={modelName}
          className="px-3 py-2 border-[1.5px] border-border rounded-input text-[14px] bg-surface text-fg"
        >
          <option value="">Semua model</option>
          {models.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <select
          name="actor_type"
          defaultValue={actorType}
          className="px-3 py-2 border-[1.5px] border-border rounded-input text-[14px] bg-surface text-fg"
        >
          <option value="">Semua actor</option>
          <option value="pengurus">pengurus</option>
          <option value="peserta">peserta</option>
          <option value="system">system</option>
          <option value="unknown">unknown</option>
        </select>

        <input
          type="text"
          name="action"
          placeholder="action (mis. upgrade.update)"
          defaultValue={action}
          className="px-3 py-2 border-[1.5px] border-border rounded-input text-[14px] bg-surface text-fg"
        />

        <input
          type="date"
          name="from"
          defaultValue={from}
          className="px-3 py-2 border-[1.5px] border-border rounded-input text-[14px] bg-surface text-fg"
        />

        <input
          type="date"
          name="to"
          defaultValue={to}
          className="px-3 py-2 border-[1.5px] border-border rounded-input text-[14px] bg-surface text-fg"
        />

        <input
          type="text"
          name="q"
          placeholder="Cari pesan/detail…"
          defaultValue={q}
          className="col-span-2 px-3 py-2 border-[1.5px] border-border rounded-input text-[14px] bg-surface text-fg"
        />

        <button
          type="submit"
          className="col-span-2 sm:col-span-4 bg-accent text-white rounded-btn py-2 text-[14px] font-semibold hover:opacity-90"
        >
          Terapkan Filter
        </button>
      </form>

      <LogTable rows={displayRows} />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <Link
            href={pageHref(Math.max(1, page - 1))}
            aria-disabled={page <= 1}
            className={`px-3 py-1.5 rounded-[8px] border border-border ${page <= 1 ? 'pointer-events-none opacity-40' : 'hover:border-accent'}`}
          >
            ← Sebelumnya
          </Link>
          <span className="text-muted">
            Halaman {page} / {totalPages}
          </span>
          <Link
            href={pageHref(Math.min(totalPages, page + 1))}
            aria-disabled={page >= totalPages}
            className={`px-3 py-1.5 rounded-[8px] border border-border ${page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:border-accent'}`}
          >
            Berikutnya →
          </Link>
        </div>
      )}
    </main>
  )
}
