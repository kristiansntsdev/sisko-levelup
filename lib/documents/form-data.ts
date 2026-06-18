export function str(data: Record<string, unknown>, key: string): string {
  const v = data[key]
  if (typeof v === 'string') return v
  if (v == null) return ''
  return String(v)
}

export function num(data: Record<string, unknown>, key: string): number {
  const v = data[key]
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/[^\d.-]/g, ''))
    return Number.isNaN(n) ? 0 : n
  }
  return 0
}

export function repeatRows(
  data: Record<string, unknown>,
  key: string,
): Record<string, unknown>[] {
  const v = data[key]
  return Array.isArray(v) ? (v as Record<string, unknown>[]) : []
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}
