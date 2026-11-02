'use client'
import { hash } from '../hash'

// The real action returns a jobs_place row id; nothing in the demo reads it back.
export async function upsertJobsPlace(nama: string): Promise<number> {
  return hash(nama.trim().toLowerCase())
}
