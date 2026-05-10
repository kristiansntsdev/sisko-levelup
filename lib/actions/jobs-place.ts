'use server'
import { db } from '@/lib/db'
import { jobs_place_type } from '@/lib/generated/enums'

const SEKOLAH_PREFIXES = /^(sd|mi|smp|mts|sma|smk|man|ma|sman|smkn|smkn|smpn|sdn)\b/i
const KULIAH_PREFIXES = /^(universitas|univ|institut|stikes|stmik|stie|politeknik|poltekkes|akademi)\b/i
const ACRONYM = /^[a-z]{2,8}$/i

function detectType(nama: string): jobs_place_type {
  const trimmed = nama.trim()
  if (SEKOLAH_PREFIXES.test(trimmed)) return jobs_place_type.sekolah
  if (KULIAH_PREFIXES.test(trimmed)) return jobs_place_type.universitas
  if (ACRONYM.test(trimmed)) return jobs_place_type.universitas
  return jobs_place_type.perusahaan
}

export async function upsertJobsPlace(nama: string): Promise<number> {
  const type = detectType(nama)
  const existing = await db.jobs_place.findFirst({ where: { nama }, select: { id_jobs_place: true } })
  if (existing) return existing.id_jobs_place
  const created = await db.jobs_place.create({ data: { nama, type }, select: { id_jobs_place: true } })
  return created.id_jobs_place
}
