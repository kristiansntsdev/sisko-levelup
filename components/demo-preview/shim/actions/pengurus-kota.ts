'use client'
import type { PengurusKotaRow, PesertaKotaRow } from '@/lib/actions/pengurus-kota'
import { addLog, getDb, mutate } from '../../db'
import { sessionPengurus } from '../util'

export type * from '@/lib/actions/pengurus-kota'
type Result = { ok: true } | { ok: false; error: string }

export async function listPengurusKota(): Promise<PengurusKotaRow[]> {
  const me = sessionPengurus()
  return getDb()
    .pengurus.filter((p) => p.kotalevelup === me?.kotalevelup)
    .map((p) => ({ ...p, me: p.id_pengurus === me?.id_pengurus }))
}

export async function listPesertaKota(): Promise<PesertaKotaRow[]> {
  const me = sessionPengurus()
  return getDb()
    .peserta.filter((p) => p.kotalevelup === me?.kotalevelup)
    .sort((a, b) => a.nama.localeCompare(b.nama))
    .map(({ id_peserta, nama, usercode, email, userlevel, gereja, tgllahir }) => ({ id_peserta, nama, usercode, email, userlevel, gereja, tgllahir }))
}

export async function createPengurusKota(input: { nama?: string; email: string; password: string; role: 'Admin LK' | 'BRIM' }): Promise<Result> {
  const me = sessionPengurus()
  const email = input.email.trim().toLowerCase()
  if (!email.includes('@')) return { ok: false, error: 'Email tidak valid' }
  if (getDb().pengurus.some((p) => p.username === email)) return { ok: false, error: 'Email sudah dipakai' }
  mutate((d) => {
    d.pengurus.push({ id_pengurus: d.nextId++, nama: email.split('@')[0], username: email, password: input.password, divisi: input.role === 'BRIM' ? 'brim' : 'alk', kotalevelup: me?.kotalevelup ?? '' })
    addLog(d, `Pengurus ${email} ditambahkan`)
  })
  return { ok: true }
}

export async function updatePengurusKota(input: { id: number; email: string; password?: string; role: 'Admin LK' | 'BRIM' }): Promise<Result> {
  mutate((d) => {
    const p = d.pengurus.find((x) => x.id_pengurus === input.id)
    if (!p) return
    p.username = input.email.trim().toLowerCase()
    if (input.password) p.password = input.password
    p.divisi = input.role === 'BRIM' ? 'brim' : 'alk'
  })
  return { ok: true }
}
