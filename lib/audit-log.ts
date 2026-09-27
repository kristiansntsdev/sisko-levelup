import { after } from 'next/server'
import type { PrismaClient } from './generated/client'
import { getActor } from './request-context'

const MUTATING_OPS = new Set([
  'create',
  'createMany',
  'update',
  'updateMany',
  'upsert',
  'delete',
  'deleteMany',
])

const SENSITIVE_KEY = /password|token|secret|rahasia/i
const MAX_STRING_LEN = 2000
const MAX_DEPTH = 6

/** Redact field bernuansa kredensial + potong string panjang, sebelum disimpan sebagai JSON di app_log.detail. */
export function sanitizeArgs(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return '[truncated]'
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map((v) => sanitizeArgs(v, depth + 1))
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEY.test(k) ? '[redacted]' : sanitizeArgs(v, depth + 1)
    }
    return out
  }
  if (typeof value === 'string' && value.length > MAX_STRING_LEN) {
    return value.slice(0, MAX_STRING_LEN) + '…[truncated]'
  }
  return value
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, (_k, v) => (typeof v === 'bigint' ? v.toString() : v))
  } catch {
    return '[unserializable]'
  }
}

/**
 * Prisma Client Extension: mencegat semua operasi tulis di semua model,
 * mencatat sukses/gagal ke app_log lewat after() (tidak menambah latency
 * request — DB-nya remote).
 *
 * `raw` adalah client SEBELUM di-$extends() (dioper lewat parameter, bukan
 * import { db } dari lib/db.ts) — supaya penulisan log itu sendiri tidak
 * memicu ulang extension ini (selain guard model === 'app_log' di bawah).
 */
export function createAuditLogExtension(raw: PrismaClient) {
  return {
    name: 'audit-log',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: {
          model?: string
          operation: string
          args: unknown
          query: (args: unknown) => Promise<unknown>
        }) {
          if (!model || model === 'app_log') return query(args)
          if (!MUTATING_OPS.has(operation)) return query(args)

          const actor = getActor()
          try {
            const result = await query(args)
            after(() =>
              raw.app_log
                .create({
                  data: {
                    level: 'info',
                    model_name: model,
                    operation,
                    action: actor.actionLabel ?? `${model}.${operation}`,
                    actor_type: actor.type,
                    actor_id: actor.id,
                    actor_label: actor.label,
                    success: true,
                    detail: safeStringify(sanitizeArgs(args)),
                  },
                })
                .catch((e) => console.error('[app_log] write failed', e)),
            )
            return result
          } catch (err) {
            ;(err as { __appLogWritten?: boolean }).__appLogWritten = true
            after(() =>
              raw.app_log
                .create({
                  data: {
                    level: 'error',
                    model_name: model,
                    operation,
                    action: actor.actionLabel ?? `${model}.${operation}`,
                    actor_type: actor.type,
                    actor_id: actor.id,
                    actor_label: actor.label,
                    success: false,
                    error_message: err instanceof Error ? err.message : String(err),
                    detail: safeStringify(sanitizeArgs(args)),
                  },
                })
                .catch((e) => console.error('[app_log] write failed', e)),
            )
            throw err
          }
        },
      },
    },
  }
}

/**
 * Dipakai instrumentation.ts (onRequestError) — request itu sendiri belum
 * tentu lewat setActor() (mis. render error), jadi ambil pengurus_id
 * langsung dari raw Cookie header yang dikasih Next, bukan lewat
 * request-context. Tidak coba decode cookie session NextAuth (peserta) —
 * cukup kompleks untuk manfaat marginal di error path.
 */
type PengurusLookup = {
  pengurus: {
    findUnique: (args: {
      where: { id_pengurus: number }
      select: { username: true }
    }) => Promise<{ username: string | null } | null>
  }
}

export async function resolveActorFromCookieHeader(
  cookieHeader: string | undefined,
  db: PengurusLookup,
): Promise<{ type: 'pengurus'; id: number; label: string | null } | null> {
  if (!cookieHeader) return null
  const match = cookieHeader.match(/(?:^|;\s*)pengurus_id=([^;]+)/)
  if (!match) return null
  const id = Number(decodeURIComponent(match[1]))
  if (!Number.isFinite(id)) return null
  try {
    const pengurus = await db.pengurus.findUnique({
      where: { id_pengurus: id },
      select: { username: true },
    })
    return { type: 'pengurus', id, label: pengurus?.username ?? null }
  } catch {
    return { type: 'pengurus', id, label: null }
  }
}
