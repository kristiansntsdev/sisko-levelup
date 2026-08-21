import { NASIONAL_KHUSUS_VALUE } from '@/lib/event-cabang'

/** Plain-text Telegram message: title + `Key: value` lines. */
export function formatTelegramMessage(
  title: string,
  fields: Record<string, string | number>,
): string {
  const lines = [title]
  for (const [key, value] of Object.entries(fields)) {
    lines.push(`${key}: ${value}`)
  }
  return lines.join('\n')
}

export function nasionalScopeLabel(khusus: string): string {
  return khusus === NASIONAL_KHUSUS_VALUE ? 'khusus' : 'seluruh_kota'
}

/** Fire-and-forget Bot API sendMessage. No-op if env missing; never throws. */
export async function notifyTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim()
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim()
  if (!token || !chatId) return

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error('[telegram]', res.status, body.slice(0, 200))
    }
  } catch (err) {
    console.error('[telegram]', err)
  }
}
