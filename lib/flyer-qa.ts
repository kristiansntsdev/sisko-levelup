/**
 * Paste this prompt into Cursor Automations (webhook flyer yang sudah ada).
 *
 * Kamu adalah QA reviewer flyer kegiatan sesuai Standarisasi Konten LevelUP.
 *
 * INPUT:
 * - file_url (wajib)
 * - kota (opsional)
 * - expected (opsional): { nama_kegiatan, tanggal, waktu, tempat, pembicara, sosmed }
 * - notes (opsional)
 * - template_url (opsional): jika ada dan tidak kosong, MODE = jfe (WW JFE / WFE serentak, sebutan sama). Selain itu MODE = bulanan.
 * - allowed_diff (hanya MODE jfe): ["pembicara", "tanggal", "tempat", "tema", "logo_kota"]
 *
 * MODE jfe — tambahan (selain semua aturan flyer di bawah):
 * 1) Buka template_url dan file_url. Bandingkan layout.
 * 2) Chrome/frame/logo acara/sosial/komposisi pusat HARUS sama dengan template.
 * 3) Boleh beda HANYA: foto/nama pembicara, tanggal, tempat, tema (nama kegiatan), teks/logo LevelUP kota (tetap KANAN ATAS).
 * 4) PPHTGD tetap KIRI ATAS seperti template.
 * 5) checklist.layout_pusat: "ada" jika komposisi sama template; "mismatch" jika kota mengubah layout pusat.
 * 6) checklist.elemen_tetap: "ada" jika elemen non-allowed_diff sama; "mismatch" jika diubah.
 * 7) Logo LevelUP boleh ganti nama kota, jangan pindah dari kanan atas (salah_posisi jika pindah).
 *
 * ATURAN FLYER (WAJIB DICEK, kedua mode):
 * 1) Format: portrait rasio 4:5, ideal 1080x1350. Jika bisa diukur, isi field dimensi.
 * 2) Flyer harus informatif dan SEDIKITNYA berisi:
 *    a. Logo PPHTGD di KIRI ATAS
 *    b. Logo LevelUP di KANAN ATAS
 *    c. Nama kegiatan
 *    d. Tanggal kegiatan
 *    e. Tempat / alamat kegiatan
 *    f. Waktu kegiatan
 *
 * ATURAN OUTPUT: HANYA satu JSON object. Tanpa markdown. Key level atas wajib sama seperti schema.
 * Enum item: ada | tidak | salah_posisi | tidak_jelas | mismatch
 * Enum keseluruhan: PASS | REVISI | BLOKIR
 * typo.status: bersih | ada
 * File tidak terbaca: BLOKIR, checklist tidak_jelas. Jangan mengarang teks yang tidak terbaca.
 *
 * SCHEMA: { mode, status, kota, nama_kegiatan, file_url, template_url, dimensi, checklist
 *   (logo_pphtgd_kiri_atas, logo_levelup_kanan_atas, nama_kegiatan, tanggal_kegiatan,
 *    tempat_alamat_kegiatan, waktu_kegiatan, layout_pusat, elemen_tetap, typo),
 *   typo_list, temuan, rekomendasi, expected_match }
 *
 * STATUS KESELURUHAN:
 * - BLOKIR jika file (atau template di MODE jfe) tidak terbaca
 * - PASS jika dimensi.sesuai_standar (atau portrait 4:5), logo posisi benar, field kegiatan ada, typo bersih,
 *   expected_match tanpa false, MODE jfe layout_pusat+elemen_tetap ada
 * - selain itu REVISI
 */

export type FlyerQaItemStatus = 'ada' | 'tidak' | 'salah_posisi' | 'tidak_jelas' | 'mismatch'
export type FlyerQaOverall = 'PASS' | 'REVISI' | 'BLOKIR'
export type FlyerQaTypoStatus = 'bersih' | 'ada'
export type FlyerQaState = 'reviewing' | 'done' | 'error'
export type FlyerQaMode = 'bulanan' | 'jfe'

export type FlyerQaChecklistItem = {
  status: FlyerQaItemStatus
  detail: string
  posisi: string | null
  teks: string | null
}

export type FlyerQaDimensi = {
  width: number | null
  height: number | null
  rasio: string | null
  sesuai_standar: boolean | null
  detail: string
}

export type FlyerQaReview = {
  mode: FlyerQaMode
  status: FlyerQaOverall
  kota: string | null
  nama_kegiatan: string | null
  file_url: string | null
  template_url: string | null
  dimensi: FlyerQaDimensi | null
  checklist: {
    logo_pphtgd_kiri_atas: FlyerQaChecklistItem
    logo_levelup_kanan_atas: FlyerQaChecklistItem
    nama_kegiatan: FlyerQaChecklistItem
    tanggal_kegiatan: FlyerQaChecklistItem
    tempat_alamat_kegiatan: FlyerQaChecklistItem
    waktu_kegiatan: FlyerQaChecklistItem
    layout_pusat: FlyerQaChecklistItem
    elemen_tetap: FlyerQaChecklistItem
    typo: { status: FlyerQaTypoStatus; detail: string; posisi: string | null; teks: string | null }
  }
  typo_list: { lokasi: string; tertulis: string; usulan: string }[]
  temuan: string[]
  rekomendasi: string[]
  expected_match: {
    nama_kegiatan: boolean | null
    tanggal: boolean | null
    waktu: boolean | null
    tempat: boolean | null
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

export type FlyerQaExpected = {
  nama_kegiatan: string | null
  tanggal: string | null
  waktu: string | null
  tempat: string | null
  pembicara: string | null
  sosmed: string | null
}

export type FlyerQaWebhookPayload = {
  file_url: string
  kota?: string
  expected?: FlyerQaExpected
  notes?: string
  template_url?: string | null
  allowed_diff?: string[]
}

export const FLYER_QA_ALLOWED_DIFF = ['pembicara', 'tanggal', 'tempat', 'tema', 'logo_kota'] as const

const ITEM_STATUSES = new Set<FlyerQaItemStatus>([
  'ada', 'tidak', 'salah_posisi', 'tidak_jelas', 'mismatch',
])
const OVERALL = new Set<FlyerQaOverall>(['PASS', 'REVISI', 'BLOKIR'])
const TYPO = new Set<FlyerQaTypoStatus>(['bersih', 'ada'])

export const FLYER_QA_CHECKLIST_KEYS = [
  'logo_pphtgd_kiri_atas',
  'logo_levelup_kanan_atas',
  'nama_kegiatan',
  'tanggal_kegiatan',
  'tempat_alamat_kegiatan',
  'waktu_kegiatan',
] as const

export const FLYER_QA_JFE_KEYS = ['layout_pusat', 'elemen_tetap'] as const

export function needsFlyerReview(wwtype: string, imageUrl: string): boolean {
  return wwtype === 'bulanan' && imageUrl.trim().length > 0
}

export function needsWfeFlyerReview(
  wwtype: string,
  imageUrl: string,
  templateUrl: string | null | undefined,
): boolean {
  return wwtype === 'jfe' && imageUrl.trim().length > 0 && Boolean(templateUrl?.trim())
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

function asNumNull(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
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

function naItem(): FlyerQaChecklistItem {
  return { status: 'ada', detail: 'tidak berlaku', posisi: null, teks: null }
}

function parseDimensi(raw: unknown): FlyerQaDimensi | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  return {
    width: asNumNull(o.width),
    height: asNumNull(o.height),
    rasio: asNullableString(o.rasio ?? null),
    sesuai_standar: o.sesuai_standar == null ? null : Boolean(o.sesuai_standar),
    detail: asString(o.detail),
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
  const mode: FlyerQaMode = o.mode === 'jfe' || Boolean(asString(o.template_url)) ? 'jfe' : 'bulanan'
  const layout = cl.layout_pusat ? parseChecklistItem(cl.layout_pusat) : naItem()
  const tetap = cl.elemen_tetap ? parseChecklistItem(cl.elemen_tetap) : naItem()
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
    mode,
    status,
    kota: asNullableString(o.kota ?? null),
    nama_kegiatan: asNullableString(o.nama_kegiatan ?? o.acara ?? null),
    file_url: asNullableString(o.file_url ?? null),
    template_url: asNullableString(o.template_url ?? null),
    dimensi: parseDimensi(o.dimensi),
    checklist: {
      logo_pphtgd_kiri_atas: parseChecklistItem(cl.logo_pphtgd_kiri_atas ?? cl.logo_pphtgd),
      logo_levelup_kanan_atas: parseChecklistItem(cl.logo_levelup_kanan_atas ?? cl.logo_levelup_kota),
      nama_kegiatan: parseChecklistItem(cl.nama_kegiatan ?? cl.logo_acara),
      tanggal_kegiatan: parseChecklistItem(cl.tanggal_kegiatan ?? cl.tanggal),
      tempat_alamat_kegiatan: parseChecklistItem(cl.tempat_alamat_kegiatan ?? cl.tempat),
      waktu_kegiatan: parseChecklistItem(cl.waktu_kegiatan ?? cl.waktu),
      layout_pusat: layout,
      elemen_tetap: tetap,
      typo: {
        status: typoStatus,
        detail: asString(typoRaw.detail),
        posisi: asNullableString(typoRaw.posisi ?? null),
        teks: asNullableString(typoRaw.teks ?? null),
      },
    },
    typo_list: typos,
    temuan: asStringArray(o.temuan),
    rekomendasi: asStringArray(o.rekomendasi),
    expected_match: {
      nama_kegiatan: asBoolNull(em.nama_kegiatan ?? em.acara),
      tanggal: asBoolNull(em.tanggal),
      waktu: asBoolNull(em.waktu),
      tempat: asBoolNull(em.tempat),
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
  token?: string,
): Promise<{ status: string; runId: string | null; result: string | null }> {
  const auth = token ?? qaAuth().token
  const headers = { Authorization: `Bearer ${auth}` }
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

export const FLYER_QA_CHECKLIST_LABELS: Record<
  (typeof FLYER_QA_CHECKLIST_KEYS)[number] | (typeof FLYER_QA_JFE_KEYS)[number] | 'typo',
  string
> = {
  logo_pphtgd_kiri_atas: 'Logo PPHTGD',
  logo_levelup_kanan_atas: 'Logo LevelUP',
  nama_kegiatan: 'Nama kegiatan',
  tanggal_kegiatan: 'Tanggal',
  tempat_alamat_kegiatan: 'Tempat',
  waktu_kegiatan: 'Waktu',
  layout_pusat: 'Layout pusat',
  elemen_tetap: 'Elemen tetap',
  typo: 'Typo',
}

export const FLYER_QA_REVIEWING_STEPS = [
  'AI kami sedang menyiapkan review…',
  'Poster sedang diunduh…',
  'Sedang membaca flyer…',
  'Mengecek rasio 4:5…',
  'Mengecek logo PPHTGD kiri atas…',
  'Mengecek logo LevelUP kanan atas…',
  'Membaca nama, tanggal, waktu, dan tempat…',
  'Membandingkan ke flyer pusat…',
  'Memeriksa ejaan dan typo…',
  'Menyusun ringkasan review…',
] as const

const REVIEWING_STEP_MS = 4_000

export function flyerQaReviewingStep(elapsedMs: number, stepMs = REVIEWING_STEP_MS): string {
  const n = FLYER_QA_REVIEWING_STEPS.length
  const i = Math.floor(Math.max(0, elapsedMs) / stepMs) % n
  return FLYER_QA_REVIEWING_STEPS[i]
}
