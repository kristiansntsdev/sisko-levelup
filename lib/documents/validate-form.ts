import type { FieldSchema, TemplateSchema } from '@/components/documents/types/template-schema'

function isEmpty(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (typeof value === 'number') return false
  if (Array.isArray(value)) return value.length === 0
  return false
}

function repeatSubFields(field: FieldSchema): FieldSchema[] {
  return field.fields ?? field.columns ?? []
}

function validateField(field: FieldSchema, value: unknown): boolean {
  if (field.type === 'repeat') {
    const rows = Array.isArray(value) ? value : []
    const min = field.minRows ?? 1
    if (field.required !== false && rows.length < min) return false
    const subs = repeatSubFields(field)
    if (subs.length === 0) return true
    return rows.every((row) =>
      subs.every((sub) => {
        if (!sub.required) return true
        const rowObj = row as Record<string, unknown>
        return !isEmpty(rowObj[sub.id])
      }),
    )
  }

  if (!field.required) return true
  return !isEmpty(value)
}

export function validateFormData(
  schema: TemplateSchema,
  formData: Record<string, unknown>,
): boolean {
  for (const section of schema.sections) {
    for (const field of section.fields) {
      if (!validateField(field, formData[field.id])) return false
    }
  }
  return true
}

export function getEmptyRepeatRow(field: FieldSchema): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  for (const sub of repeatSubFields(field)) {
    if (sub.type === 'number' || sub.type === 'currency') row[sub.id] = 0
    else row[sub.id] = ''
  }
  return row
}
