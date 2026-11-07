// Server-only side effects of the support-dana flow, shared by the ALK/Nasional actions (lib/actions/reimburse.ts)
// and the no-login link actions (lib/actions/dana-link.ts). Not a 'use server' module, so nothing here is an endpoint.
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { danaLinkUrl } from '@/lib/dana-link'
import type { DanaTokens, DanaView } from '@/lib/dana-approval'
import { notifyPphtgdDana, type DanaNotifyResult } from '@/lib/pphtgd-notify'
import { NASIONAL_EVENT_CABANG } from '@/lib/event-cabang'
import { danaReviewLink, eventTelegramScope, formatTelegramMessage, notifyTelegram } from '@/lib/telegram'
import { ALK_BASE } from '@/components/alk-v2/paths'

export function revalidateDana(idEvent: number) {
  revalidatePath(`/dashboard/kota/alk/event/${idEvent}`)
  revalidatePath(`/dashboard/kota/alk/event/${idEvent}/dana`)
  revalidatePath(`/dashboard/kota/alk/event/${idEvent}/approve`)
  revalidatePath('/dashboard/kota/alk')
  revalidatePath(ALK_BASE)
  revalidatePath(`${ALK_BASE}/reimburse`)
  revalidatePath(`${ALK_BASE}/reimburse/${idEvent}`)
  revalidatePath(`${ALK_BASE}/event/${idEvent}`)
  revalidatePath(`${ALK_BASE}/event/${idEvent}/dana`)
}

/**
 * Ask pphtgd to post the next link to the pengajuan kegiatan WhatsApp group: PIC LevelUP (after Korwil) or
 * Keuangan (after PIC). Records notif_*_at on success; a failure leaves it NULL so Nasional sees it and can resend.
 */
export async function sendDanaGroupNotif(
  view: DanaView,
  tokens: DanaTokens,
  stage: 'pic' | 'keuangan',
): Promise<DanaNotifyResult> {
  const res = await notifyPphtgdDana({
    stage,
    kota: view.kota,
    event: view.namaEvent,
    tanggal: view.tanggal,
    korwil: view.korwil?.nama ?? '-',
    koordinator: view.korwil?.koordinator ?? null,
    hadir: view.hadir,
    dana: view.dana,
    bank: view.reimburse.namabank,
    norek: view.reimburse.norek,
    namarek: view.reimburse.namarek,
    link: danaLinkUrl(stage === 'pic' ? tokens.token_pic : tokens.token_keuangan),
  })
  if (res.ok) {
    await db.reimburse_approval.update({
      where: { id_reimburse: view.idReimburse },
      data: stage === 'pic' ? { notif_pic_at: new Date() } : { notif_keuangan_at: new Date() },
    })
  } else {
    console.error('[dana] pphtgd notify failed', { idEvent: view.idEvent, stage, error: res.error })
  }
  return res
}

function rupiah(n: number): string {
  return n > 0 ? `Rp ${n.toLocaleString('id-ID')}` : '-'
}

/** Status-only Telegram card for the LevelUP ops group; the button opens the Nasional tracker (login), never a /dana link. */
export async function danaTelegram(view: DanaView, action: string, extra: Record<string, string> = {}) {
  const event = await db.event.findUnique({
    where: { id_event: view.idEvent },
    select: { khusus: true, id_cabang: true, tglevent: true, tgleventselesai: true },
  })
  if (!event) return
  const scope = eventTelegramScope({
    idCabang: event.id_cabang,
    khusus: event.khusus ?? '',
    cabangName: event.id_cabang === NASIONAL_EVENT_CABANG ? null : view.namaCabang || null,
    tglevent: event.tglevent,
    tgleventselesai: event.tgleventselesai,
  })
  void notifyTelegram(
    formatTelegramMessage({
      tag: scope.tag,
      action,
      eventName: view.namaEvent,
      fields: {
        ...scope.fields,
        'Pengajuan Dana': rupiah(view.dana),
        ...(view.korwil ? { Korwil: view.korwil.nama } : {}),
        ...extra,
        ID: view.idEvent,
      },
    }),
    { buttons: [{ text: '🔎 Status Dana', url: danaReviewLink(view.idEvent) }] },
  )
}
