import type { Draft, OrgInfo, PamfletDoc, ImageEl } from './types'
import { DEFAULT_ORG } from './types'

/** Brings a stored doc up to the current schema version. */
export function migrateDoc(doc: PamfletDoc): PamfletDoc {
  let d = doc
  // v2 → v3: ImageEl replaced cropX/cropY (%) with crop {x,y,width,height}
  if ((d.version as number) < 3) {
    d = {
      ...d,
      version: 3,
      elements: d.elements.map(el => {
        if (el.type !== 'image') return el
        const next = { ...el } as ImageEl & { cropX?: number; cropY?: number }
        delete next.cropX
        delete next.cropY
        return next as ImageEl
      }),
    }
  }
  return d
}

const LS_ORG = 'pamflet.org'
const LS_DRAFTS = 'pamflet.drafts.v2'

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const v = localStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

export function loadOrg(): OrgInfo {
  return read<OrgInfo>(LS_ORG, DEFAULT_ORG)
}

export function saveOrg(org: OrgInfo) {
  write(LS_ORG, org)
}

export function loadDrafts(): Draft[] {
  return read<Draft[]>(LS_DRAFTS, []).map(d => ({ ...d, doc: migrateDoc(d.doc) }))
}

export function saveDrafts(drafts: Draft[]) {
  write(LS_DRAFTS, drafts)
}
