/**
 * Paste this prompt into Cursor Automations (webhook trigger, no repo).
 *
 * Kamu adalah QA reviewer Berita Acara / Surat Pemberitahuan event LevelUP.
 *
 * INPUT (semua dari form buat/edit event, plus meta):
 * - surat_url, flyer_url, kota
 * - form: snapshot lengkap field SISKO
 * - form_kosong: string[] nama field yang kosong/invalid
 * - hari_menuju_event: integer
 * - notes (opsional)
 *
 * TUGAS:
 * 1. Buka surat_url. Google Docs: pakai export teks jika edit-link. Google Drive PDF: coba baca; gagal = BLOKIR.
 * 2. Bandingkan isi dokumen vs form (SISKO).
 * 3. Cek form_kosong: setiap key = data event belum lengkap (termasuk longlatevent, jam selesai, radius Offline, target, dana, flyer, alamat).
 * 4. Cek (teks Indonesia, jangan pakai kode REJ-xx):
 *    - Pengajuan kurang dari H-14 (hari_menuju_event < 14)
 *    - Data event belum lengkap (form_kosong tidak kosong)
 *    - Berita Acara belum tersedia / tidak sesuai
 *    - Flyer resmi belum tersedia / tidak sesuai
 *    - Data SISKO tidak sesuai dokumen
 *    - Jika form.wwtype=jfe: SOP WFE/JFE Serentak. Jika bukan jfe: sop_wfe status "ada", detail "tidak berlaku".
 *
 * OUTPUT: HANYA satu JSON object. Tanpa markdown.
 * Enum item: ada | tidak | tidak_jelas | mismatch
 * Enum keseluruhan: PASS | REVISI | BLOKIR
 *
 * SCHEMA: { status, kota, acara, surat_url, checklist: { h14, form_lengkap, berita_acara, flyer, data_cocok, sop_wfe }, extracted, temuan, rekomendasi, expected_match }
 * BLOKIR jika surat tidak terbaca. PASS jika checklist (kecuali sop_wfe non-jfe) ada dan expected_match tanpa false. Selain itu REVISI.
 */

import {
  extractJsonObject,
  pollFlyerQaRun,
  type FlyerQaItemStatus,
  type FlyerQaOverall,
  type FlyerQaState,
} from '@/lib/flyer-qa'

export type BaQaItemStatus = Exclude<FlyerQaItemStatus, 'salah_posisi'>
export type BaQaOverall = FlyerQaOverall
export type BaQaState = FlyerQaState

export type BaQaChecklistItem = {
  status: BaQaItemStatus
  detail: string
}

export type BeritaAcaraQaReview = {
  status: BaQaOverall
  kota: string | null
  acara: string | null
  surat_url: string | null
  checklist: {
    h14: BaQaChecklistItem
    form_lengkap: BaQaChecklistItem
    berita_acara: BaQaChecklistItem
    flyer: BaQaChecklistItem
    data_cocok: BaQaChecklistItem
    sop_wfe: BaQaChecklistItem
  }
  extracted: {
    acara: string | null
    tanggal: string | null
    waktu: string | null
    tempat: string | null
    pembicara: string | null
    dana: string | null
  }
  temuan: string[]
  rekomendasi: string[]
  expected_match: {
    acara: boolean | null
    tanggal: boolean | null
    waktu: boolean | null
    tempat: boolean | null
    dana: boolean | null
    longlatevent: boolean | null
  }
}

export type BeritaAcaraQaRecord = {
  state: BaQaState
  agentId: string
  runId: string | null
  review: BeritaAcaraQaReview | null
  diajukan: boolean
  diajukanAt: string | null
  error: string | null
}

export type BeritaAcaraFormSnapshot = {
  nama_event: string
  jenisevent: string
  wwtype: string
  target: string
  targetpengurus: string
  targetjumlah: number
  tglevent: string
  tgleventselesai: string
  jamevent: string
  jamselesaievent: string
  alamatevent: string
  longlatevent: string
  lat: number | null
  lng: number | null
  radius: number
  danaevent: string
  suratpemberitahuan: string
  khusus: string
  flyer_ada: boolean
}

export type BeritaAcaraQaWebhookPayload = {
  surat_url: string
  flyer_url: string
  kota: string
  hari_menuju_event: number
  form_kosong: string[]
  form: BeritaAcaraFormSnapshot
  notes?: string
}

const ITEM = new Set<BaQaItemStatus>(['ada', 'tidak', 'tidak_jelas', 'mismatch'])
const OVERALL = new Set<BaQaOverall>(['PASS', 'REVISI', 'BLOKIR'])

export const BA_QA_CHECKLIST_KEYS = [
  'h14', 'form_lengkap', 'berita_acara', 'flyer', 'data_cocok', 'sop_wfe',
] as const

export const BA_QA_CHECKLIST_LABELS: Record<(typeof BA_QA_CHECKLIST_KEYS)[number], string> = {
  h14: 'H-14',
  form_lengkap: 'Form lengkap',
  berita_acara: 'Berita acara',
  flyer: 'Flyer',
  data_cocok: 'Data cocok',
  sop_wfe: 'SOP WFE',
}

export function needsBeritaAcaraReview(suratUrl: string): boolean {
  return suratUrl.trim().length > 0
}

export function parseLatLng(longlatevent: string): { lat: number; lng: number } | null {
  const parts = longlatevent.split(',').map((s) => Number(s.trim()))
  if (parts.length < 2 || parts.some((n) => !Number.isFinite(n))) return null
  return { lat: parts[0], lng: parts[1] }
}

export function hariMenujuEvent(tglevent: Date, now = new Date()): number {
  const a = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const b = Date.UTC(tglevent.getFullYear(), tglevent.getMonth(), tglevent.getDate())
  return Math.round((b - a) / 86_400_000)
}

export function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function collectFormKosong(form: BeritaAcaraFormSnapshot): string[] {
  const empty: string[] = []
  if (!form.nama_event.trim()) empty.push('nama_event')
  if (!form.jenisevent.trim()) empty.push('jenisevent')
  if (!form.wwtype.trim()) empty.push('wwtype')
  if (!form.target.trim()) empty.push('target')
  if (!form.targetpengurus.trim()) empty.push('targetpengurus')
  if (!Number.isFinite(form.targetjumlah) || form.targetjumlah <= 0) empty.push('targetjumlah')
  if (!form.tglevent.trim()) empty.push('tglevent')
  if (!form.tgleventselesai.trim()) empty.push('tgleventselesai')
  if (!form.jamevent.trim()) empty.push('jamevent')
  if (!form.jamselesaievent.trim()) empty.push('jamselesaievent')
  if (!form.alamatevent.trim()) empty.push('alamatevent')
  if (!parseLatLng(form.longlatevent)) empty.push('longlatevent')
  if (form.jenisevent === 'Offline' && !(form.radius > 0)) empty.push('radius')
  if (!form.danaevent.trim() || form.danaevent === '0') empty.push('danaevent')
  if (!form.suratpemberitahuan.trim()) empty.push('suratpemberitahuan')
  if (!form.flyer_ada) empty.push('flyer')
  return empty
}

export function formSnapshotFromEvent(input: {
  nama_event: string
  jenisevent: string
  wwtype: string
  target: string
  targetpengurus: string
  targetjumlah: number
  tglevent: Date
  tgleventselesai: Date
  jamevent: string
  jamselesaievent: string
  alamatevent: string
  longlatevent: string
  radius: number
  danaevent: string
  suratpemberitahuan: string
  khusus: string
  flyer_ada: boolean
}): BeritaAcaraFormSnapshot {
  const ll = parseLatLng(input.longlatevent)
  return {
    nama_event: input.nama_event,
    jenisevent: input.jenisevent,
    wwtype: input.wwtype,
    target: input.target,
    targetpengurus: input.targetpengurus,
    targetjumlah: input.targetjumlah,
    tglevent: isoDate(input.tglevent),
    tgleventselesai: isoDate(input.tgleventselesai),
    jamevent: input.jamevent,
    jamselesaievent: input.jamselesaievent,
    alamatevent: input.alamatevent,
    longlatevent: input.longlatevent,
    lat: ll?.lat ?? null,
    lng: ll?.lng ?? null,
    radius: input.radius,
    danaevent: input.danaevent,
    suratpemberitahuan: input.suratpemberitahuan,
    khusus: input.khusus,
    flyer_ada: input.flyer_ada,
  }
}

export function buildBeritaAcaraQaPayload(input: {
  kota: string
  flyerUrl: string
  form: BeritaAcaraFormSnapshot
  tglevent: Date
}): BeritaAcaraQaWebhookPayload {
  return {
    surat_url: input.form.suratpemberitahuan.trim(),
    flyer_url: input.flyerUrl.trim(),
    kota: input.kota,
    hari_menuju_event: hariMenujuEvent(input.tglevent),
    form_kosong: collectFormKosong(input.form),
    form: input.form,
  }
}

export function emptyBeritaAcaraQa(partial?: Partial<BeritaAcaraQaRecord>): BeritaAcaraQaRecord {
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

export function stringifyBeritaAcaraQa(rec: BeritaAcaraQaRecord): string {
  return JSON.stringify(rec)
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

function parseItem(raw: unknown): BaQaChecklistItem {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const status = ITEM.has(o.status as BaQaItemStatus) ? (o.status as BaQaItemStatus) : 'tidak_jelas'
  return { status, detail: asString(o.detail) }
}

export function parseBeritaAcaraQaReview(raw: unknown): BeritaAcaraQaReview | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const status = OVERALL.has(o.status as BaQaOverall) ? (o.status as BaQaOverall) : null
  if (!status) return null
  const cl = o.checklist && typeof o.checklist === 'object' ? (o.checklist as Record<string, unknown>) : {}
  const ex = o.extracted && typeof o.extracted === 'object' ? (o.extracted as Record<string, unknown>) : {}
  const em = o.expected_match && typeof o.expected_match === 'object' ? (o.expected_match as Record<string, unknown>) : {}
  return {
    status,
    kota: asNullableString(o.kota ?? null),
    acara: asNullableString(o.acara ?? null),
    surat_url: asNullableString(o.surat_url ?? null),
    checklist: {
      h14: parseItem(cl.h14),
      form_lengkap: parseItem(cl.form_lengkap),
      berita_acara: parseItem(cl.berita_acara),
      flyer: parseItem(cl.flyer),
      data_cocok: parseItem(cl.data_cocok),
      sop_wfe: parseItem(cl.sop_wfe),
    },
    extracted: {
      acara: asNullableString(ex.acara ?? null),
      tanggal: asNullableString(ex.tanggal ?? null),
      waktu: asNullableString(ex.waktu ?? null),
      tempat: asNullableString(ex.tempat ?? null),
      pembicara: asNullableString(ex.pembicara ?? null),
      dana: asNullableString(ex.dana ?? null),
    },
    temuan: asStringArray(o.temuan),
    rekomendasi: asStringArray(o.rekomendasi),
    expected_match: {
      acara: asBoolNull(em.acara),
      tanggal: asBoolNull(em.tanggal),
      waktu: asBoolNull(em.waktu),
      tempat: asBoolNull(em.tempat),
      dana: asBoolNull(em.dana),
      longlatevent: asBoolNull(em.longlatevent),
    },
  }
}

export function parseBeritaAcaraQa(raw: string | null | undefined): BeritaAcaraQaRecord | null {
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
  const state = o.state === 'done' || o.state === 'error' || o.state === 'reviewing' ? o.state : null
  if (!state) return null
  return {
    state,
    agentId: asString(o.agentId),
    runId: asNullableString(o.runId ?? null),
    review: parseBeritaAcaraQaReview(o.review),
    diajukan: Boolean(o.diajukan),
    diajukanAt: asNullableString(o.diajukanAt ?? null),
    error: asNullableString(o.error ?? null),
  }
}

export function beritaAcaraQaTelegramFields(review: BeritaAcaraQaReview | null): Record<string, string> {
  return { 'QA berita acara': review?.status ?? 'tidak ada' }
}

export function beritaAcaraQaTelegramBanner(status: BaQaOverall | null | undefined): string | undefined {
  return status === 'REVISI' ? '🚨🚨🚨 Butuh Revisi 🚨🚨🚨' : undefined
}

function baAuth(): { url: string; token: string } {
  const url = process.env.QA_BERITA_ACARA_REVIEWER_WEBHOOK_URL?.trim()
  const token = process.env.QA_BERITA_ACARA_REVIEWER_WEBHOOK_AUTH?.trim()
  if (!url || !token) throw new Error('Webhook QA berita acara belum di-set.')
  return { url, token }
}

export async function startBeritaAcaraQaWebhook(
  payload: BeritaAcaraQaWebhookPayload,
): Promise<{ agentId: string }> {
  const { url, token } = baAuth()
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Webhook QA berita acara gagal (${res.status})`)
  let body: unknown
  try {
    body = JSON.parse(text) as unknown
  } catch {
    throw new Error('Webhook QA berita acara tidak mengembalikan JSON')
  }
  const o = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  const agentId = asString(o.backgroundComposerId)
  if (!agentId) throw new Error('Webhook QA berita acara tidak mengembalikan agent id')
  return { agentId }
}

/** Poll Cursor run using berita-acara webhook token (same Cloud Agents API as flyer). */
export async function pollBeritaAcaraQaRun(
  agentId: string,
  runId?: string | null,
): Promise<{ status: string; runId: string | null; result: string | null }> {
  const { token } = baAuth()
  return pollFlyerQaRun(agentId, runId, token)
}

export { extractJsonObject }

export const BA_QA_REVIEWING_STEPS = [
  'AI kami sedang menyiapkan review berita acara…',
  'Membuka link surat…',
  'Sedang membaca dokumen…',
  'Mengecek field form yang kosong…',
  'Mengecek pengajuan H-14…',
  'Membandingkan tanggal, jam, tempat…',
  'Mengecek flyer dan anggaran…',
  'Mengecek format SOP…',
  'Menyusun ringkasan review…',
] as const

const STEP_MS = 4_000

export function beritaAcaraQaReviewingStep(elapsedMs: number, stepMs = STEP_MS): string {
  const n = BA_QA_REVIEWING_STEPS.length
  const i = Math.floor(Math.max(0, elapsedMs) / stepMs) % n
  return BA_QA_REVIEWING_STEPS[i]
}
