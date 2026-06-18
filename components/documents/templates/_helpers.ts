function str(value: unknown): string {
  return String(value ?? '').trim()
}

function repeatRows(
  data: Record<string, unknown>,
  fieldId: string,
): Record<string, string>[] {
  const raw = data[fieldId]
  if (!Array.isArray(raw)) return []
  return raw.map((row) => {
    if (typeof row !== 'object' || row === null) return {}
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(row)) {
      out[k] = str(v)
    }
    return out
  })
}

export { str, repeatRows }
