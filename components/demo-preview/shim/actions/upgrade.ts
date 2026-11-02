'use client'
import { addLog, getDb, mutate } from '../../db'
import { sessionPeserta } from '../util'

export type * from '@/lib/actions/upgrade'
type Result = { ok: true } | { ok: false; error: string }

// Demo deviation: in the real app Join Volunteer is instant. Here it files a request an admin approves.
export async function joinVolunteer(): Promise<Result> {
  const me = sessionPeserta()
  if (!me) return { ok: false, error: 'Tidak login' }
  if (me.userlevel !== '0') return { ok: false, error: 'Hanya Tamu yang bisa join Volunteer' }
  mutate((d) => {
    if (!d.upgrade.some((u) => u.id_peserta === me.id_peserta && u.member === '1')) {
      d.upgrade.push({ id_upgrade: d.nextId++, id_peserta: me.id_peserta, member: '1', at: new Date().toISOString() })
      addLog(d, `${me.nama} mengajukan Join Volunteer`)
    }
  })
  return { ok: true }
}

export async function getPendingVolunteerForMe(): Promise<boolean> {
  const me = sessionPeserta()
  return !!me && getDb().upgrade.some((u) => u.id_peserta === me.id_peserta && u.member === '1')
}

export async function joinSquad(kotalevelup: string): Promise<Result> {
  const me = sessionPeserta()
  if (!me) return { ok: false, error: 'Tidak login' }
  if (me.userlevel !== '1') return { ok: false, error: 'Hanya Volunteer yang bisa join Squad' }
  if (!getDb().cabang.some((c) => String(c.id_cabang) === kotalevelup)) return { ok: false, error: 'LevelUP kota tidak valid' }
  mutate((d) => {
    const p = d.peserta.find((x) => x.id_peserta === me.id_peserta)
    if (p) p.kotalevelup = kotalevelup
    if (!d.upgrade.some((u) => u.id_peserta === me.id_peserta && u.member === '2')) {
      d.upgrade.push({ id_upgrade: d.nextId++, id_peserta: me.id_peserta, member: '2', at: new Date().toISOString() })
    }
    addLog(d, `${me.nama} mengajukan Join Squad`)
  })
  return { ok: true }
}

export async function getPendingSquadForMe(): Promise<boolean> {
  const me = sessionPeserta()
  return !!me && getDb().upgrade.some((u) => u.id_peserta === me.id_peserta && u.member === '2')
}

function pendingFor(member: '1' | '2', kota: string) {
  const d = getDb()
  return d.upgrade
    .filter((u) => u.member === member)
    .sort((a, b) => b.id_upgrade - a.id_upgrade)
    .flatMap((u) => {
      const p = d.peserta.find((x) => x.id_peserta === u.id_peserta && x.kotalevelup === kota)
      return p ? [{ id_upgrade: u.id_upgrade, nama: p.nama, usercode: p.usercode }] : []
    })
}

export async function getPendingSquadApprovals() {
  const me = getDb().pengurus.find((p) => p.id_pengurus === getDb().session.idPengurus)
  return me ? pendingFor('2', me.kotalevelup) : []
}

export async function getPendingVolunteerApprovals() {
  const me = getDb().pengurus.find((p) => p.id_pengurus === getDb().session.idPengurus)
  return me ? pendingFor('1', me.kotalevelup) : []
}

export async function countPendingSquadApprovals(): Promise<number> {
  return (await getPendingSquadApprovals()).length
}

async function approve(idUpgrade: number, level: '1' | '2'): Promise<Result> {
  const row = getDb().upgrade.find((u) => u.id_upgrade === idUpgrade)
  if (!row) return { ok: false, error: 'Pengajuan tidak ditemukan' }
  mutate((d) => {
    const p = d.peserta.find((x) => x.id_peserta === row.id_peserta)
    if (p) {
      p.userlevel = level
      addLog(d, `${p.nama} disetujui jadi ${level === '1' ? 'Volunteer' : 'Squad'}`)
    }
    d.upgrade = d.upgrade.filter((u) => u.id_upgrade !== idUpgrade)
  })
  return { ok: true }
}

export async function approveSquad(idUpgrade: number): Promise<Result> {
  return approve(idUpgrade, '2')
}

export async function approveVolunteer(idUpgrade: number): Promise<Result> {
  return approve(idUpgrade, '1')
}
