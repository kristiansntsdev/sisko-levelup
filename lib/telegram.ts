import { NASIONAL_EVENT_CABANG, NASIONAL_KHUSUS_VALUE } from '@/lib/event-cabang'

const POSTER_BASE = 'https://sisko.levelupgen.com/uploads/poster/'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Public base for Telegram buttons — localhost ditolak Bot API. */
function publicAppBase(): string {
  return (process.env.TELEGRAM_APP_URL ?? process.env.AUTH_URL ?? '').replace(/\/$/, '')
}

/** Telegram inline URL button rejects localhost / non-http(s). */
export function isTelegramButtonUrl(url: string): boolean {
  try {
    const u = new URL(url)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false
    const host = u.hostname.toLowerCase()
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return false
    return true
  } catch {
    return false
  }
}

export function eventJoinLink(idEvent: number): string {
  return `${publicAppBase()}/join/${idEvent}`
}

export function eventApproveLink(idEvent: number): string {
  return `${publicAppBase()}/dashboard/kota/alk/event/${idEvent}/approve`
}

export function eventBrimApproveLink(idEvent: number): string {
  return `${publicAppBase()}/dashboard/kota/brim/event/${idEvent}/approve`
}

export function eventDetailLink(idEvent: number): string {
  return `${publicAppBase()}/dashboard/kota/alk/event/${idEvent}`
}

export function eventFlyerLink(posterevent: string): string {
  const name = posterevent.trim()
  if (!name) return ''
  if (/^https?:\/\//i.test(name)) return name
  return `${POSTER_BASE}${name}`
}

/** `longlatevent` stored as "lat,lng" → Google Maps open pin. */
export function eventMapsLink(longlatevent: string): string {
  const parts = longlatevent.split(',').map((p) => p.trim())
  if (parts.length < 2) return ''
  const lat = Number(parts[0])
  const lng = Number(parts[1])
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return ''
  return `https://maps.google.com/?q=${lat},${lng}`
}

export type TelegramButton = { text: string; url: string }

/** Standard action row: Link Event · Flyer · Maps · Approval */
export function eventActionButtons(
  idEvent: number,
  opts?: { poster?: string; longlatevent?: string },
): TelegramButton[] {
  const buttons: TelegramButton[] = [
    { text: '🔗 Link Event', url: eventDetailLink(idEvent) },
  ]
  const flyer = opts?.poster ? eventFlyerLink(opts.poster) : ''
  if (flyer) buttons.push({ text: '🖼 Lihat Flyer', url: flyer })
  const maps = opts?.longlatevent ? eventMapsLink(opts.longlatevent) : ''
  if (maps) buttons.push({ text: '📍 Maps', url: maps })
  buttons.push({ text: '✅ Approval ALK', url: eventApproveLink(idEvent) })
  buttons.push({ text: '✅ Approval Brim', url: eventBrimApproveLink(idEvent) })
  return buttons
}

export type TelegramCardLayout = 'default' | 'peserta'

/**
 * HTML Telegram card.
 * - Bold `[tag]` + event name
 * - `peserta` layout: title → bold name → fields
 */
export function formatTelegramMessage(opts: {
  tag?: string
  action: string
  eventName: string
  fields?: Record<string, string | number>
  layout?: TelegramCardLayout
}): string {
  const tag = opts.tag ?? 'Event Nasional'
  const layout = opts.layout ?? 'default'
  const lines: string[] = [
    `<b>[${escapeHtml(tag)}]</b> ${escapeHtml(opts.action)}`,
  ]

  if (layout === 'peserta') {
    lines.push(`<b>${escapeHtml(opts.eventName)}</b>`)
  } else {
    lines.push(`Nama: <b>${escapeHtml(opts.eventName)}</b>`)
  }

  for (const [key, value] of Object.entries(opts.fields ?? {})) {
    lines.push(`${escapeHtml(key)}: ${escapeHtml(String(value))}`)
  }

  return lines.join('\n')
}

export function nasionalScopeLabel(khusus: string): string {
  return khusus === NASIONAL_KHUSUS_VALUE ? 'khusus' : 'seluruh_kota'
}

export function eventTelegramDateLabel(mulai: Date, selesai: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  const a = fmt(mulai)
  const b = fmt(selesai)
  return a === b ? `${a} (1 hari)` : `${a} - ${b} (beberapa hari)`
}

/** Kota vs nasional for Telegram: cabang name, never nasional scope on a city event. */
export function eventTelegramScope(input: {
  idCabang: string
  khusus: string
  cabangName?: string | null
  tglevent?: Date | null
  tgleventselesai?: Date | null
}): { tag: 'Event Nasional' | 'Event Kota'; fields: Record<string, string> } {
  const fields: Record<string, string> = {}
  const tag = input.idCabang === NASIONAL_EVENT_CABANG ? 'Event Nasional' : 'Event Kota'
  if (tag === 'Event Nasional') {
    fields['Tipe'] = nasionalScopeLabel(input.khusus)
  } else {
    const cabang = input.cabangName?.trim()
    fields['Cabang'] = cabang || input.idCabang
  }
  if (input.tglevent instanceof Date && Number.isFinite(input.tglevent.getTime())) {
    const selesai =
      input.tgleventselesai instanceof Date && Number.isFinite(input.tgleventselesai.getTime())
        ? input.tgleventselesai
        : input.tglevent
    fields['Tanggal Event'] = eventTelegramDateLabel(input.tglevent, selesai)
  }
  return { tag, fields }
}

const TARGET_PESERTA_LABEL: Record<string, string> = {
  '0': 'Umum',
  '1': 'Volunteer',
  '2': 'Squad',
  '3': 'Core',
  '4': 'Leader',
  '5': 'Tim Nasional',
}
const TARGET_PENGURUS_LABEL: Record<string, string> = {
  '1': 'Admin LK',
  '2': 'BRIM',
}

function decodeCsvLabels(csv: string, map: Record<string, string>): string {
  return csv
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
    .map((v) => map[v] ?? v)
    .join(', ')
}

function fmtDateId(d: Date): string {
  return d.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function fmtDana(raw: string): string {
  const n = parseInt(String(raw).replace(/\D/g, ''), 10)
  if (!Number.isFinite(n) || n <= 0) return ''
  return `Rp ${n.toLocaleString('id-ID')}`
}

/** Full event-form snapshot for Telegram (skip empty). */
export function eventFormTelegramFields(input: {
  cabangLabel: string
  isNasional?: boolean
  khusus?: string
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
  longlatevent?: string
  radius: number
  danaevent: string
  suratpemberitahuan?: string
  id: number
}): Record<string, string | number> {
  const fields: Record<string, string | number> = {
    Cabang: input.cabangLabel,
  }
  if (input.isNasional) {
    fields['Scope'] = nasionalScopeLabel(input.khusus ?? '')
  }
  fields['Jenis'] = input.jenisevent
  fields['Tipe WW'] = input.wwtype === 'jfe' ? 'JFE' : 'Bulanan'

  const target = decodeCsvLabels(input.target, TARGET_PESERTA_LABEL)
  if (target) fields['Target Peserta'] = target
  const pengurus = decodeCsvLabels(input.targetpengurus, TARGET_PENGURUS_LABEL)
  if (pengurus) fields['Target Pengurus'] = pengurus
  if (input.targetjumlah > 0) fields['Target Jumlah'] = `${input.targetjumlah} orang`

  const tglMulai = fmtDateId(input.tglevent)
  const tglSelesai = fmtDateId(input.tgleventselesai)
  fields['Tanggal'] =
    tglMulai === tglSelesai ? tglMulai : `${tglMulai} – ${tglSelesai}`

  const jamMulai = input.jamevent.trim()
  const jamSelesai = input.jamselesaievent.trim()
  if (jamMulai || jamSelesai) {
    fields['Jam'] = jamSelesai ? `${jamMulai || '—'} – ${jamSelesai}` : jamMulai
  }

  if (input.alamatevent.trim()) fields['Alamat'] = input.alamatevent.trim()
  const maps = input.longlatevent ? eventMapsLink(input.longlatevent) : ''
  if (maps) fields['Maps'] = maps
  if (input.jenisevent === 'Offline' && input.radius > 0) {
    fields['Radius'] = `${input.radius} m`
  }

  const dana = fmtDana(input.danaevent)
  if (dana) fields['Dana'] = dana

  const surat = input.suratpemberitahuan?.trim()
  if (surat) fields['Surat'] = surat

  fields['ID'] = input.id
  return fields
}

export type NotifyTelegramOpts = {
  buttons?: TelegramButton[]
  /** @deprecated use buttons */
  buttonUrl?: string
  buttonText?: string
}

/** Fire-and-forget Bot API sendMessage (HTML + optional URL buttons). */
export async function notifyTelegram(
  text: string,
  opts?: NotifyTelegramOpts,
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim()
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim()
  if (!token || !chatId) return

  const rawButtons: TelegramButton[] = opts?.buttons?.length
    ? opts.buttons
    : opts?.buttonUrl
      ? [{ text: opts.buttonText ?? '🔗 Lihat Event', url: opts.buttonUrl }]
      : []

  const safe = rawButtons.filter((b) => isTelegramButtonUrl(b.url.trim()))
  if (rawButtons.length && !safe.length) {
    console.warn('[telegram] skip buttons (URL not public)')
  }

  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  }

  if (safe.length) {
    // one row of action buttons
    body.reply_markup = {
      inline_keyboard: [safe.map((b) => ({ text: b.text, url: b.url.trim() }))],
    }
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      console.error('[telegram]', res.status, errBody.slice(0, 200))
    }
  } catch (err) {
    console.error('[telegram]', err)
  }
}
