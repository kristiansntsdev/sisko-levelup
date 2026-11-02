'use client'
/* eslint-disable @typescript-eslint/no-unused-vars */
// Pindah kota needs Sekretariat Nasional approval, which the demo does not model: nothing is ever pending.
import type { PindahKotaMine, PindahKotaPending } from '@/lib/actions/pindah-kota'

export type * from '@/lib/actions/pindah-kota'
type Result = { ok: true } | { ok: false; error: string }
const NA: Result = { ok: false, error: 'Pindah kota tidak tersedia di demo' }

export async function getPindahKotaForMe(): Promise<PindahKotaMine | null> {
  return null
}
export async function ajukanPindahKota(_keKota?: string, _catatan?: string): Promise<Result> {
  return NA
}
export async function batalPindahKota(): Promise<Result> {
  return NA
}
export async function listPendingPindahKota(): Promise<PindahKotaPending[]> {
  return []
}
export async function countPendingPindahKota(): Promise<number> {
  return 0
}
export async function approvePindahKota(): Promise<Result> {
  return NA
}
export async function rejectPindahKota(): Promise<Result> {
  return NA
}
