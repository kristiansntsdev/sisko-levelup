export type FlyerQaItemStatus = 'ada' | 'tidak' | 'salah_posisi' | 'tidak_jelas' | 'mismatch'
export type FlyerQaOverall = 'PASS' | 'REVISI' | 'BLOKIR'
export type FlyerQaTypoStatus = 'bersih' | 'ada'
export type FlyerQaState = 'reviewing' | 'done' | 'error'

export type FlyerQaChecklistItem = {
  status: FlyerQaItemStatus
  detail: string
  posisi: string | null
  teks: string | null
}

export type FlyerQaReview = {
  status: FlyerQaOverall
  kota: string | null
  acara: string | null
  file_url: string | null
  checklist: {
    logo_levelup_kota: FlyerQaChecklistItem
    logo_pphtgd: FlyerQaChecklistItem
    logo_acara: FlyerQaChecklistItem
    pembicara: FlyerQaChecklistItem
    tempat: FlyerQaChecklistItem
    tanggal: FlyerQaChecklistItem
    waktu: FlyerQaChecklistItem
    sosial_media: FlyerQaChecklistItem
    typo: { status: FlyerQaTypoStatus; detail: string; posisi: string | null; teks: string | null }
  }
  sosial_media: { platform: string; handle: string }[]
  typo_list: { lokasi: string; tertulis: string; usulan: string }[]
  temuan: string[]
  rekomendasi: string[]
  expected_match: {
    acara: boolean | null
    tanggal: boolean | null
    waktu: boolean | null
    tempat: boolean | null
    pembicara: boolean | null
  }
}

export type FlyerQaRecord = {
  state: FlyerQaState
  agentId: string
  runId: string | null
  review: FlyerQaReview | null
  diajukan: boolean
  diajukanAt: string | null
  error: string | null
}

export type FlyerQaWebhookPayload = {
  file_url: string
  kota?: string
  expected?: { acara: string; tanggal: string; waktu: string; tempat: string }
  notes?: string
}

const ITEM_STATUSES = new Set<FlyerQaItemStatus>([
  'ada', 'tidak', 'salah_posisi', 'tidak_jelas', 'mismatch',
])
const OVERALL = new Set<FlyerQaOverall>(['PASS', 'REVISI', 'BLOKIR'])
const TYPO = new Set<FlyerQaTypoStatus>(['bersih', 'ada'])
const CHECKLIST_KEYS = [
  'logo_levelup_kota', 'logo_pphtgd', 'logo_acara', 'pembicara',
  'tempat', 'tanggal', 'waktu', 'sosial_media',
] as const

export function needsFlyerReview(wwtype: string, imageUrl: string): boolean {
  return wwtype === 'bulanan' && imageUrl.trim().length > 0
}

export function formatFlyerExpectedTanggal(d: Date): string {
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function emptyFlyerQa(partial?: Partial<FlyerQaRecord>): FlyerQaRecord {
  return {
    state: 'reviewing',
    agentId: '',
    runId: null,
    review: null,
    diajukan: false,
    diajukanAt: null,
    error: null,
    ...partial,
  }
}

export function stringifyFlyerQa(rec: FlyerQaRecord): string {
  return JSON.stringify(rec)
}

/** Strip markdown fences then parse the first JSON object. */
export function extractJsonObject(text: string): unknown {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const body = (fenced ? fenced[1] : trimmed).trim()
  const start = body.indexOf('{')
  const end = body.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('Tidak ada JSON object')
  return JSON.parse(body.slice(start, end + 1)) as unknown
}

function asString(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function asNullableString(v: unknown): string | null {
  if (v == null) return null
  return typeof v === 'string' ? v : String(v)
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.map((x) => (typeof x === 'string' ? x : String(x)))
}

function asBoolNull(v: unknown): boolean | null {
  if (v == null) return null
  return Boolean(v)
}

function parseChecklistItem(raw: unknown): FlyerQaChecklistItem {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const status = ITEM_STATUSES.has(o.status as FlyerQaItemStatus)
    ? (o.status as FlyerQaItemStatus)
    : 'tidak_jelas'
  return {
    status,
    detail: asString(o.detail),
    posisi: asNullableString(o.posisi ?? null),
    teks: asNullableString(o.teks ?? null),
  }
}

export function parseFlyerQaReview(raw: unknown): FlyerQaReview | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const status = OVERALL.has(o.status as FlyerQaOverall) ? (o.status as FlyerQaOverall) : null
  if (!status) return null
  const cl = o.checklist && typeof o.checklist === 'object'
    ? (o.checklist as Record<string, unknown>)
    : {}
  const typoRaw = cl.typo && typeof cl.typo === 'object' ? (cl.typo as Record<string, unknown>) : {}
  const typoStatus = TYPO.has(typoRaw.status as FlyerQaTypoStatus)
    ? (typoRaw.status as FlyerQaTypoStatus)
    : 'bersih'
  const em = o.expected_match && typeof o.expected_match === 'object'
    ? (o.expected_match as Record<string, unknown>)
    : {}
  const checklist = {
    logo_levelup_kota: parseChecklistItem(cl.logo_levelup_kota),
    logo_pphtgd: parseChecklistItem(cl.logo_pphtgd),
    logo_acara: parseChecklistItem(cl.logo_acara),
    pembicara: parseChecklistItem(cl.pembicara),
    tempat: parseChecklistItem(cl.tempat),
    tanggal: parseChecklistItem(cl.tanggal),
    waktu: parseChecklistItem(cl.waktu),
    sosial_media: parseChecklistItem(cl.sosial_media),
    typo: {
      status: typoStatus,
      detail: asString(typoRaw.detail),
      posisi: asNullableString(typoRaw.posisi ?? null),
      teks: asNullableString(typoRaw.teks ?? null),
    },
  }
  const sosial = Array.isArray(o.sosial_media)
    ? o.sosial_media.map((row) => {
        const r = row && typeof row === 'object' ? (row as Record<string, unknown>) : {}
        return { platform: asString(r.platform), handle: asString(r.handle) }
      }).filter((r) => r.platform || r.handle)
    : []
  const typos = Array.isArray(o.typo_list)
    ? o.typo_list.map((row) => {
        const r = row && typeof row === 'object' ? (row as Record<string, unknown>) : {}
        return {
          lokasi: asString(r.lokasi),
          tertulis: asString(r.tertulis),
          usulan: asString(r.usulan),
        }
      })
    : []
  return {
    status,
    kota: asNullableString(o.kota ?? null),
    acara: asNullableString(o.acara ?? null),
    file_url: asNullableString(o.file_url ?? null),
    checklist,
    sosial_media: sosial,
    typo_list: typos,
    temuan: asStringArray(o.temuan),
    rekomendasi: asStringArray(o.rekomendasi),
    expected_match: {
      acara: asBoolNull(em.acara),
      tanggal: asBoolNull(em.tanggal),
      waktu: asBoolNull(em.waktu),
      tempat: asBoolNull(em.tempat),
      pembicara: asBoolNull(em.pembicara),
    },
  }
}

export function parseFlyerQa(raw: string | null | undefined): FlyerQaRecord | null {
  const s = (raw ?? '').trim()
  if (!s) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(s) as unknown
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== 'object') return null
  const o = parsed as Record<string, unknown>
  const state = o.state === 'done' || o.state === 'error' || o.state === 'reviewing'
    ? o.state
    : null
  if (!state) return null
  return {
    state,
    agentId: asString(o.agentId),
    runId: asNullableString(o.runId ?? null),
    review: parseFlyerQaReview(o.review),
    diajukan: Boolean(o.diajukan),
    diajukanAt: asNullableString(o.diajukanAt ?? null),
    error: asNullableString(o.error ?? null),
  }
}

export function flyerQaTelegramFields(review: FlyerQaReview | null): Record<string, string> {
  return { 'QA flyer': review?.status ?? 'tidak ada' }
}

export function flyerQaTelegramBanner(status: FlyerQaOverall | null | undefined): string | undefined {
  return status === 'REVISI' ? '🚨🚨🚨 Butuh Revisi 🚨🚨🚨' : undefined
}

function qaAuth(): { url: string; token: string } {
  const url = process.env.QA_FLYER_WW_BULANAN_REVIEWER_WEBHOOK_URL?.trim()
  const token = process.env.QA_FLYER_WW_BULANAN_REVIEWER_WEBHOOK_AUTH?.trim()
  if (!url || !token) throw new Error('Webhook QA flyer belum di-set.')
  return { url, token }
}

export async function startFlyerQaWebhook(
  payload: FlyerQaWebhookPayload,
): Promise<{ agentId: string }> {
  const { url, token } = qaAuth()
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Webhook QA flyer gagal (${res.status})`)
  let body: unknown
  try {
    body = JSON.parse(text) as unknown
  } catch {
    throw new Error('Webhook QA flyer tidak mengembalikan JSON')
  }
  const o = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  const agentId = asString(o.backgroundComposerId)
  if (!agentId) throw new Error('Webhook QA flyer tidak mengembalikan agent id')
  return { agentId }
}

export async function pollFlyerQaRun(
  agentId: string,
  runId?: string | null,
): Promise<{ status: string; runId: string | null; result: string | null }> {
  const { token } = qaAuth()
  const headers = { Authorization: `Bearer ${token}` }
  let id = runId ?? null
  if (!id) {
    const agentRes = await fetch(`https://api.cursor.com/v1/agents/${agentId}`, { headers })
    if (!agentRes.ok) throw new Error(`Gagal cek status review (${agentRes.status})`)
    const agent = (await agentRes.json()) as { latestRunId?: string }
    id = agent.latestRunId ?? null
  }
  if (!id) return { status: 'CREATING', runId: null, result: null }
  const runRes = await fetch(`https://api.cursor.com/v1/agents/${agentId}/runs/${id}`, { headers })
  if (!runRes.ok) throw new Error(`Gagal cek run review (${runRes.status})`)
  const run = (await runRes.json()) as { status?: string; result?: string }
  return {
    status: asString(run.status) || 'RUNNING',
    runId: id,
    result: typeof run.result === 'string' ? run.result : null,
  }
}

export const FLYER_QA_CHECKLIST_LABELS: Record<(typeof CHECKLIST_KEYS)[number] | 'typo', string> = {
  logo_levelup_kota: 'Logo LevelUP kota',
  logo_pphtgd: 'Logo PPHTGD',
  logo_acara: 'Logo acara',
  pembicara: 'Pembicara',
  tempat: 'Tempat',
  tanggal: 'Tanggal',
  waktu: 'Waktu',
  sosial_media: 'Sosial media',
  typo: 'Typo',
}

export const FLYER_QA_REVIEWING_STEPS = [
  'AI kami sedang menyiapkan review…',
  'Poster sedang diunduh…',
  'Sedang membaca flyer…',
  'Mengecek logo LevelUP kota…',
  'Mengecek logo PPHTGD…',
  'Membaca judul acara…',
  'Membaca tanggal, waktu, dan tempat…',
  'Mencari nama pembicara…',
  'Memeriksa sosial media…',
  'Memeriksa ejaan dan typo…',
  'AI kami sedang mereview poster…',
  'Menyusun ringkasan review…',
] as const

const REVIEWING_STEP_MS = 4_000

/** Sequential steps, then wrap so the line keeps moving while Cursor still runs. */
export function flyerQaReviewingStep(elapsedMs: number, stepMs = REVIEWING_STEP_MS): string {
  const n = FLYER_QA_REVIEWING_STEPS.length
  const i = Math.floor(Math.max(0, elapsedMs) / stepMs) % n
  return FLYER_QA_REVIEWING_STEPS[i]
}
