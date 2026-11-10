'use server'
// No-login actions behind /dana/{token}: the token IS the auth. Each role has its own token, every write is
// conditional on the current step (a double tap or a stale tab cannot decide twice), and a resubmit by the ALK
// Kota replaces all tokens so old links stop working.
import { del, put } from '@vercel/blob'
import { db } from '@/lib/db'
import { setActor } from '@/lib/request-context'
import { loadDanaByToken } from '@/lib/dana-approval'
import { danaTelegram, revalidateDana, sendDanaGroupNotif } from '@/lib/dana-flow'

export type DanaLinkResult = { ok: true; notifGagal?: boolean } | { ok: false; error: string }

const LINK_MATI = 'Link ini sudah tidak berlaku. Minta link terbaru ke pengaju.'
const SUDAH_DIPROSES = 'Pengajuan ini sudah diproses. Muat ulang halaman untuk melihat statusnya.'
const MAX_ALASAN = 1000
const MAX_BUKTI_BYTES = 4 * 1024 * 1024
const BUKTI_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
}

function cleanAlasan(keputusan: 'setuju' | 'tolak', alasan: string | undefined): string | { error: string } {
  if (keputusan === 'setuju') return ''
  const reason = (alasan ?? '').trim()
  if (!reason) return { error: 'Alasan penolakan wajib diisi' }
  if (reason.length > MAX_ALASAN) return { error: `Alasan maksimal ${MAX_ALASAN} karakter` }
  return reason
}

/** Korwil PPHTGD (setelah Sekretariat & BRIM Nasional setuju): Setujui → link PIC LevelUP Pusat ke grup WA pphtgd. Tolak → kembali ke ALK Kota. */
export async function decideDanaKorwil(
  token: string,
  keputusan: 'setuju' | 'tolak',
  alasan?: string,
): Promise<DanaLinkResult> {
  const res = await loadDanaByToken(token)
  if (!res || res.peran !== 'korwil') return { ok: false, error: LINK_MATI }
  if (res.view.stage !== 'korwil') {
    return {
      ok: false,
      error: res.view.stage === 'review' ? 'Pengajuan belum disetujui Sekretariat & BRIM Nasional' : SUDAH_DIPROSES,
    }
  }
  const reason = cleanAlasan(keputusan, alasan)
  if (typeof reason !== 'string') return { ok: false, error: reason.error }

  setActor({ type: 'system', id: null, label: `Link Dana · Korwil PPHTGD · ${res.view.korwil?.koordinator ?? res.view.korwil?.nama ?? '-'}` })
  const idReimburse = res.view.idReimburse
  const updated = await db.$transaction(async (tx) => {
    // Re-check the token inside the transaction: a resubmit may have replaced it since the page loaded.
    const still = await tx.reimburse_approval.findFirst({ where: { id_reimburse: idReimburse, token_korwil: token } })
    if (!still) return 0
    const u = await tx.reimburse.updateMany({
      where: { id_reimburse: idReimburse, approvesekre: '1', approvebrim: '1', approvepphtgd: '', approvenasional: '' },
      data: keputusan === 'setuju' ? { approvepphtgd: '1' } : { approvepphtgd: '0', notepphtgd: reason },
    })
    if (u.count) await tx.reimburse_approval.update({ where: { id_reimburse: idReimburse }, data: { korwil_at: new Date() } })
    return u.count
  })
  if (!updated) return { ok: false, error: SUDAH_DIPROSES }

  revalidateDana(res.view.idEvent)
  const fresh = await loadDanaByToken(token)
  if (!fresh) return { ok: true }
  if (keputusan === 'tolak') {
    await danaTelegram(fresh.view, 'Dana Ditolak Korwil', { Alasan: reason })
    return { ok: true }
  }
  const sent = await sendDanaGroupNotif(fresh.view, fresh.tokens, 'pic')
  await danaTelegram(fresh.view, 'Dana Disetujui Korwil', sent.ok ? {} : { 'Notif WA grup': 'GAGAL, kirim ulang dari Status Dana' })
  return { ok: true, notifGagal: !sent.ok }
}

/** PIC LevelUP Pusat: Setujui → link Keuangan PPHTGD dikirim ke grup WA pphtgd. Tolak → kembali ke ALK Kota. */
export async function decideDanaPic(
  token: string,
  keputusan: 'setuju' | 'tolak',
  alasan?: string,
): Promise<DanaLinkResult> {
  const res = await loadDanaByToken(token)
  if (!res || res.peran !== 'pic') return { ok: false, error: LINK_MATI }
  if (res.view.stage !== 'pusat') {
    return { ok: false, error: res.view.stage === 'korwil' ? 'Pengajuan belum disetujui Korwil' : SUDAH_DIPROSES }
  }
  const reason = cleanAlasan(keputusan, alasan)
  if (typeof reason !== 'string') return { ok: false, error: reason.error }

  setActor({ type: 'system', id: null, label: 'Link Dana · PIC LevelUP Pusat' })
  const idReimburse = res.view.idReimburse
  const updated = await db.$transaction(async (tx) => {
    const still = await tx.reimburse_approval.findFirst({ where: { id_reimburse: idReimburse, token_pic: token } })
    if (!still) return 0
    const u = await tx.reimburse.updateMany({
      where: { id_reimburse: idReimburse, approvepphtgd: '1', approvenasional: '' },
      data: keputusan === 'setuju' ? { approvenasional: '1' } : { approvenasional: '0', notenasional: reason },
    })
    if (u.count) await tx.reimburse_approval.update({ where: { id_reimburse: idReimburse }, data: { pic_at: new Date() } })
    return u.count
  })
  if (!updated) return { ok: false, error: SUDAH_DIPROSES }

  revalidateDana(res.view.idEvent)
  const fresh = await loadDanaByToken(token)
  if (!fresh) return { ok: true }
  if (keputusan === 'tolak') {
    await danaTelegram(fresh.view, 'Dana Ditolak PIC LevelUP', { Alasan: reason })
    return { ok: true }
  }
  const sent = await sendDanaGroupNotif(fresh.view, fresh.tokens, 'keuangan')
  await danaTelegram(fresh.view, 'Dana Disetujui PIC LevelUP', sent.ok ? {} : { 'Notif WA grup': 'GAGAL, kirim ulang dari Status Dana' })
  return { ok: true, notifGagal: !sent.ok }
}

/** Keuangan PPHTGD: tandai sudah ditransfer, bukti transfer (gambar / PDF) opsional. */
export async function markDanaCair(token: string, formData: FormData): Promise<DanaLinkResult> {
  const res = await loadDanaByToken(token)
  if (!res || res.peran !== 'keuangan') return { ok: false, error: LINK_MATI }
  if (res.view.stage !== 'keuangan') {
    return { ok: false, error: res.view.stage === 'cair' ? SUDAH_DIPROSES : 'Pengajuan belum disetujui PIC LevelUP Pusat' }
  }

  const file = formData.get('bukti')
  let url = ''
  if (file instanceof File && file.size > 0) {
    const ext = BUKTI_TYPES[file.type]
    if (!ext) return { ok: false, error: 'Bukti transfer harus foto (JPG/PNG/WebP) atau PDF' }
    if (file.size > MAX_BUKTI_BYTES) return { ok: false, error: 'Ukuran bukti transfer maksimal 4 MB' }
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN
    if (!blobToken) throw new Error('BLOB_READ_WRITE_TOKEN belum di-set.')
    const uploaded = await put(`reimburse/buktitf/${res.view.idReimburse}.${ext}`, file, {
      access: 'public',
      addRandomSuffix: true,
      contentType: file.type,
      token: blobToken,
    })
    url = uploaded.url
  }

  setActor({ type: 'system', id: null, label: 'Link Dana · Keuangan PPHTGD' })
  const idReimburse = res.view.idReimburse
  const updated = await db.$transaction(async (tx) => {
    const still = await tx.reimburse_approval.findFirst({ where: { id_reimburse: idReimburse, token_keuangan: token } })
    if (!still) return 0
    const u = await tx.reimburse.updateMany({
      where: { id_reimburse: idReimburse, approvenasional: '1', NOT: { approvekeuangan: '1' } },
      data: { approvekeuangan: '1', buktitf: url },
    })
    if (u.count) await tx.reimburse_approval.update({ where: { id_reimburse: idReimburse }, data: { cair_at: new Date() } })
    return u.count
  })
  if (!updated) {
    if (url) await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN }).catch(() => {})
    return { ok: false, error: SUDAH_DIPROSES }
  }

  revalidateDana(res.view.idEvent)
  const fresh = await loadDanaByToken(token)
  if (fresh) await danaTelegram(fresh.view, 'Dana Cair', url ? { 'Bukti Transfer': 'terlampir di Status Dana' } : {})
  return { ok: true }
}
