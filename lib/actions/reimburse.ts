'use server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { setActor } from '@/lib/request-context'
import { NASIONAL_EVENT_CABANG } from '@/lib/event-cabang'
import { requireSekretariatNasional } from '@/lib/actions/event'
import {
  notifyTelegram,
  formatTelegramMessage,
  eventActionButtons,
  eventTelegramScope,
} from '@/lib/telegram'

export type ReimburseData = {
  id_reimburse: number
  id_event: string
  ajukan: string
  namabank: string
  norek: string
  namarek: string
  danausul: string
  danariil: string
  laporan: string
  bukti: string
  approvenasional: string
  notenasional: string
}

function toReimburseData(r: {
  id_reimburse: number
  id_event: string
  ajukan: string
  namabank: string
  norek: string
  namarek: string
  danausul: string
  danariil: string
  laporan: string
  bukti: string
  approvenasional: string
  notenasional: string
}): ReimburseData {
  return {
    id_reimburse: r.id_reimburse,
    id_event: r.id_event,
    ajukan: r.ajukan,
    namabank: r.namabank,
    norek: r.norek,
    namarek: r.namarek,
    danausul: r.danausul,
    danariil: r.danariil,
    laporan: r.laporan,
    bukti: r.bukti,
    approvenasional: r.approvenasional,
    notenasional: r.notenasional,
  }
}

export async function getReimburseForEvent(idEvent: number): Promise<ReimburseData | null> {
  const row = await db.reimburse.findFirst({ where: { id_event: String(idEvent) } })
  return row ? toReimburseData(row) : null
}

async function requireAlkPengurus(): Promise<void> {
  const pengurusId = (await cookies()).get('pengurus_id')?.value
  if (!pengurusId) throw new Error('Unauthorized')
  const pengurus = await db.pengurus.findUnique({
    where: { id_pengurus: Number(pengurusId) },
    select: { divisi: true, username: true },
  })
  if (!pengurus || pengurus.divisi !== 'alk') throw new Error('Unauthorized')
  setActor({ type: 'pengurus', id: Number(pengurusId), label: pengurus.username })
}

export type SubmitReimburseInput = {
  ajukan: 'Ajukan' | 'Tidak Ajukan'
  bukti: string
  laporan: string
  danausul: string
  danariil: string
  norek: string
  namabank: string
  namarek: string
}

/** ALK Kota: create/update pengajuan support dana untuk satu event (satu baris per event). */
export async function submitReimburse(idEvent: number, input: SubmitReimburseInput): Promise<void> {
  await requireAlkPengurus()

  const existing = await db.reimburse.findFirst({ where: { id_event: String(idEvent) } })
  if (existing?.approvenasional === '1') {
    throw new Error('Pengajuan sudah disetujui, tidak bisa diedit')
  }

  const data = {
    id_event: String(idEvent),
    ajukan: input.ajukan,
    bukti: input.bukti.trim(),
    laporan: input.laporan.trim(),
    danausul: input.danausul,
    danariil: input.danariil,
    norek: input.norek.trim(),
    namabank: input.namabank.trim(),
    namarek: input.namarek.trim(),
    approvenasional: '',
    notenasional: '',
  }

  if (existing) {
    await db.reimburse.update({ where: { id_reimburse: existing.id_reimburse }, data })
  } else {
    await db.reimburse.create({
      data: {
        ...data,
        reimburse: '',
        approvepphtgd: '',
        approvekeuangan: '',
        notepphtgd: '',
        notekeuangan: '',
        approveadmin: '',
        noteadmin: '',
        buktitf: '',
      },
    })
  }

  revalidatePath(`/dashboard/kota/alk/event/${idEvent}`)
  revalidatePath(`/dashboard/kota/alk/event/${idEvent}/dana`)
  revalidatePath('/dashboard/kota/alk')
}

async function telegramScopeForReimburseEvent(event: {
  id_cabang: string
  khusus: string | null
  tglevent: Date
  tgleventselesai: Date
}) {
  let cabangName: string | null = null
  if (event.id_cabang !== NASIONAL_EVENT_CABANG) {
    const cabangId = Number(event.id_cabang)
    if (Number.isFinite(cabangId)) {
      const row = await db.cabang.findUnique({
        where: { id_cabang: cabangId },
        select: { namacabang: true },
      })
      cabangName = row?.namacabang ?? null
    }
  }
  return eventTelegramScope({
    idCabang: event.id_cabang,
    khusus: event.khusus ?? '',
    cabangName,
    tglevent: event.tglevent,
    tgleventselesai: event.tgleventselesai,
  })
}

function fmtDanaTelegram(raw: string): string {
  const n = parseInt(String(raw).replace(/\D/g, ''), 10)
  return Number.isFinite(n) && n > 0 ? `Rp ${n.toLocaleString('id-ID')}` : '-'
}

export type ReimburseApprovalResult = { ok: true } | { ok: false; error: string }

/** Sekretariat Nasional approve pengajuan support dana → approvenasional = 1 */
export async function approveReimburseNasional(idReimburse: number): Promise<ReimburseApprovalResult> {
  const gate = await requireSekretariatNasional()
  if (!gate.ok) return gate

  const row = await db.reimburse.findUnique({ where: { id_reimburse: idReimburse } })
  if (!row) return { ok: false, error: 'Pengajuan dana tidak ditemukan' }

  await db.reimburse.update({ where: { id_reimburse: idReimburse }, data: { approvenasional: '1' } })

  const idEvent = Number(row.id_event)
  revalidatePath(`/dashboard/kota/alk/event/${idEvent}`)
  revalidatePath(`/dashboard/kota/alk/event/${idEvent}/approve`)

  const event = await db.event.findUnique({
    where: { id_event: idEvent },
    select: { nama_event: true, khusus: true, id_cabang: true, tglevent: true, tgleventselesai: true },
  })
  if (event) {
    const scope = await telegramScopeForReimburseEvent(event)
    void notifyTelegram(
      formatTelegramMessage({
        tag: scope.tag,
        action: 'Approved Dana',
        eventName: event.nama_event,
        fields: {
          ...scope.fields,
          'Pengajuan Dana': fmtDanaTelegram(row.danausul),
          'Dana Riil': fmtDanaTelegram(row.danariil),
          ID: idEvent,
        },
      }),
      { buttons: eventActionButtons(idEvent) },
    )
  }
  return { ok: true }
}

/** Sekretariat Nasional reject pengajuan support dana → approvenasional = 0, catat alasan */
export async function rejectReimburseNasional(
  idReimburse: number,
  alasan: string,
): Promise<ReimburseApprovalResult> {
  const gate = await requireSekretariatNasional()
  if (!gate.ok) return gate

  const reason = alasan.trim()
  if (!reason) return { ok: false, error: 'Alasan reject wajib diisi' }

  const row = await db.reimburse.findUnique({ where: { id_reimburse: idReimburse } })
  if (!row) return { ok: false, error: 'Pengajuan dana tidak ditemukan' }

  await db.reimburse.update({
    where: { id_reimburse: idReimburse },
    data: { approvenasional: '0', notenasional: reason },
  })

  const idEvent = Number(row.id_event)
  revalidatePath(`/dashboard/kota/alk/event/${idEvent}`)
  revalidatePath(`/dashboard/kota/alk/event/${idEvent}/approve`)

  const event = await db.event.findUnique({
    where: { id_event: idEvent },
    select: { nama_event: true, khusus: true, id_cabang: true, tglevent: true, tgleventselesai: true },
  })
  if (event) {
    const scope = await telegramScopeForReimburseEvent(event)
    void notifyTelegram(
      formatTelegramMessage({
        tag: scope.tag,
        action: 'Rejected Dana',
        eventName: event.nama_event,
        fields: { ...scope.fields, Alasan: reason, ID: idEvent },
      }),
      { buttons: eventActionButtons(idEvent) },
    )
  }
  return { ok: true }
}
