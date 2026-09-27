/**
 * Dijalankan sekali saat server instance boot (Next.js instrumentation hook).
 *
 * Vercel jalan UTC secara default. Semua perhitungan tanggal yang dibandingkan
 * dengan kolom `@db.Date` sudah eksplisit WIB (`lib/wib.ts`,
 * `lib/event-absen-window.ts`), jadi pin ini bukan penyangga utama — dia
 * jaring pengaman untuk kode baru yang tanpa sadar pakai `setHours()` /
 * `new Date(y, m, d)`, dan bikin timestamp log ikut WIB.
 *
 * Di Vercel bisa juga di-set lewat environment variable `TZ`; pin di sini
 * supaya perilakunya sama di lokal tanpa perlu ingat setting dashboard.
 */
export function register() {
  process.env.TZ = 'Asia/Jakarta'
}

/**
 * Jaring pengaman global: menangkap error apa pun di Server Component /
 * Route Handler / Server Action (bukan cuma error DB — validasi, panggilan
 * ke Telegram/Blob/QA webhook, dll) dan mencatatnya ke app_log.
 *
 * Error yang sudah dicatat oleh Prisma extension (lib/audit-log.ts) ditandai
 * __appLogWritten sebelum di-rethrow, supaya tidak dobel di sini.
 *
 * Dibatasi runtime Node — instrumentation.ts ikut dibundel untuk Edge juga,
 * dan driver MariaDB (pakai net/tls) tidak boleh ikut ke edge bundle.
 */
export async function onRequestError(
  error: unknown,
  request: { path: string; method: string; headers: NodeJS.Dict<string | string[]> },
  context: {
    routerKind: string
    routePath: string
    routeType: string
    renderSource?: string
    revalidateReason?: string
  },
) {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  if ((error as { __appLogWritten?: boolean } | null)?.__appLogWritten) return

  try {
    const [{ db }, { resolveActorFromCookieHeader }] = await Promise.all([
      import('@/lib/db'),
      import('@/lib/audit-log'),
    ])
    const cookieHeader = request.headers['cookie']
    const actor = await resolveActorFromCookieHeader(
      Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader,
      db,
    )
    await db.app_log.create({
      data: {
        level: 'error',
        actor_type: actor?.type ?? 'unknown',
        actor_id: actor?.id ?? null,
        actor_label: actor?.label ?? null,
        success: false,
        error_message: error instanceof Error ? error.message : String(error),
        detail: JSON.stringify({
          stack: error instanceof Error ? error.stack : undefined,
          routerKind: context.routerKind,
          routeType: context.routeType,
          renderSource: context.renderSource,
          method: request.method,
          path: request.path,
        }),
        route_path: context.routePath,
      },
    })
  } catch (loggingError) {
    console.error('[app_log] onRequestError failed to persist', loggingError)
  }
}
