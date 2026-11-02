'use client'
/* eslint-disable @typescript-eslint/no-unused-vars */
import type { WfeSerentakRow } from '@/lib/actions/wfe-serentak'

export type * from '@/lib/actions/wfe-serentak'

export async function getWfeSerentak(): Promise<WfeSerentakRow[]> {
  return []
}
export async function getWfeSerentakForDate(_date?: Date | string): Promise<WfeSerentakRow | null> {
  return null
}
