import type { ResolvedDocStampSlot } from '@/components/documents/types/template-schema'
import { defaultApprovalMap } from '@/lib/documents/stamp-slots-loader'

export const DOC_PREVIEW_KEY = 'sisko-doc-preview'
export const DOC_SESSION_KEY = 'sisko-doc-session'
export const DOC_APPROVED_KEY = 'sisko-doc-is-approved'

export type DocApprovalMap = Record<string, boolean>

export type DocPreviewPayload = {
  templateId: string
  formData: Record<string, unknown>
}

export type DocSessionState = {
  templateId: string
  templateVersion: string
  formData: Record<string, unknown>
  stampSlots: ResolvedDocStampSlot[]
  approved: DocApprovalMap
  createdAt: string
}

function readStorage(key: string, storage: Storage): string | null {
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string, storage: Storage) {
  try {
    storage.setItem(key, value)
  } catch {
    // ignore quota errors
  }
}

function parseApproval(raw: string | null): DocApprovalMap | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as DocApprovalMap
    if (typeof parsed === 'object' && parsed !== null) return parsed
  } catch {
    if (raw === 'true') return { korwil: true, pic: true }
    if (raw === 'false') return { korwil: false, pic: false }
  }
  return null
}

export function saveDocPreview(payload: DocPreviewPayload) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(DOC_PREVIEW_KEY, JSON.stringify(payload))
}

export function loadDocPreview(): DocPreviewPayload | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(DOC_PREVIEW_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DocPreviewPayload & Record<string, unknown>
    if (parsed.templateId && parsed.formData) {
      return parsed as DocPreviewPayload
    }
    // Legacy: bare form data without templateId
    return {
      templateId: 'berita-acara-thm',
      formData: parsed as Record<string, unknown>,
    }
  } catch {
    return null
  }
}

export function buildDocSession(
  templateId: string,
  templateVersion: string,
  formData: Record<string, unknown>,
  stampSlots: ResolvedDocStampSlot[],
  slotIds: string[],
): DocSessionState {
  const approved = Object.fromEntries(slotIds.map((id) => [id, false]))
  return {
    templateId,
    templateVersion,
    formData,
    stampSlots,
    approved,
    createdAt: new Date().toISOString(),
  }
}

function syncApprovalToStorages(approved: DocApprovalMap) {
  const json = JSON.stringify(approved)
  writeStorage(DOC_APPROVED_KEY, json, sessionStorage)
  writeStorage(DOC_APPROVED_KEY, json, localStorage)
}

export function saveDocSession(session: DocSessionState) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(DOC_SESSION_KEY, JSON.stringify(session))
  syncApprovalToStorages(session.approved)
}

export function loadDocSession(): DocSessionState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(DOC_SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as DocSessionState & {
      isApproved?: boolean
      approved?: DocApprovalMap
    }

    if (session.isApproved !== undefined && !session.approved) {
      const legacy = Boolean(session.isApproved)
      session.approved = { korwil: legacy, pic: legacy }
    }
    delete (session as { isApproved?: boolean }).isApproved

    session.approved = getDocApprovals()
    return session
  } catch {
    return null
  }
}

export function getDocApprovals(): DocApprovalMap {
  if (typeof window === 'undefined') return {}
  const fromSession = parseApproval(readStorage(DOC_APPROVED_KEY, sessionStorage))
  const fromLocal = parseApproval(readStorage(DOC_APPROVED_KEY, localStorage))
  return fromSession ?? fromLocal ?? {}
}

export function isSlotApproved(slotId: string): boolean {
  return Boolean(getDocApprovals()[slotId])
}

export function countApproved(approved: DocApprovalMap, slotIds: string[]): number {
  return slotIds.filter((id) => Boolean(approved[id])).length
}

export function setSlotApproved(slotId: string, approved: boolean) {
  if (typeof window === 'undefined') return
  const next = { ...getDocApprovals(), [slotId]: approved }
  syncApprovalToStorages(next)

  const raw = sessionStorage.getItem(DOC_SESSION_KEY)
  if (raw) {
    try {
      const session = JSON.parse(raw) as DocSessionState
      session.approved = next
      sessionStorage.setItem(DOC_SESSION_KEY, JSON.stringify(session))
    } catch {
      // ignore
    }
  }
}

export function encodeDocPreview(payload: DocPreviewPayload): string {
  return btoa(encodeURIComponent(JSON.stringify(payload)))
}

export function decodeDocPreview(encoded: string): DocPreviewPayload | null {
  try {
    const parsed = JSON.parse(decodeURIComponent(atob(encoded))) as DocPreviewPayload &
      Record<string, unknown>
    if (parsed.templateId && parsed.formData) {
      return parsed as DocPreviewPayload
    }
    return {
      templateId: 'berita-acara-thm',
      formData: parsed as Record<string, unknown>,
    }
  } catch {
    return null
  }
}

export function buildPreviewUrl(payload: DocPreviewPayload): string {
  return `/test/document/preview?d=${encodeDocPreview(payload)}`
}

export { defaultApprovalMap }
