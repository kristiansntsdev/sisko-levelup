/** Dual nasional reject notes share `notenasional` (append, prefixed). */
export type NasionalRejectRole = 'alk' | 'brim'

const PREFIX: Record<NasionalRejectRole, string> = {
  alk: 'ALK Nasional : ',
  brim: 'Brim Nasional: ',
}

export function formatNasionalRejectLine(
  role: NasionalRejectRole,
  reason: string,
): string {
  return `${PREFIX[role]}${reason.trim()}`
}

export function appendNotenasional(
  existing: string | null | undefined,
  role: NasionalRejectRole,
  reason: string,
): string {
  const line = formatNasionalRejectLine(role, reason)
  const prev = (existing ?? '').trim()
  return prev ? `${prev}\n${line}` : line
}
