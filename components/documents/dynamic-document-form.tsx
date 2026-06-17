'use client'

import type { FieldSchema, TemplateSchema } from '@/components/documents/types/template-schema'

const INPUT =
  'w-full px-3 py-2.5 border border-border rounded-input text-[14px] bg-surface text-fg outline-none focus:border-accent'

function repeatSubFields(field: FieldSchema): FieldSchema[] {
  return field.fields ?? field.columns ?? []
}

function FieldWrap({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-fg2">{label}</label>
      {children}
    </div>
  )
}

function renderInput(
  field: FieldSchema,
  value: unknown,
  onChange: (value: unknown) => void,
) {
  const strVal = value == null ? '' : String(value)

  switch (field.type) {
    case 'textarea':
      return (
        <textarea
          className={INPUT + ' min-h-[80px] resize-y'}
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          required={field.required}
        />
      )
    case 'date':
      return (
        <input
          className={INPUT}
          type="date"
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        />
      )
    case 'number':
    case 'currency':
      return (
        <input
          className={INPUT}
          type="text"
          inputMode="numeric"
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          required={field.required}
        />
      )
    default:
      return (
        <input
          className={INPUT}
          type="text"
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          required={field.required}
        />
      )
  }
}

function RepeatFieldEditor({
  field,
  value,
  onChange,
}: {
  field: FieldSchema
  value: unknown
  onChange: (value: unknown) => void
}) {
  const columns = field.fields ?? field.columns ?? []
  const rows = Array.isArray(value) ? (value as Record<string, unknown>[]) : []
  const minRows = field.minRows ?? 1

  function ensureRows(list: Record<string, unknown>[]) {
    const next = [...list]
    while (next.length < minRows) {
      next.push(Object.fromEntries(columns.map((c) => [c.id, ''])))
    }
    return next
  }

  const displayRows = ensureRows(rows)

  function updateRow(index: number, colId: string, colVal: string) {
    const next = ensureRows(rows)
    next[index] = { ...next[index], [colId]: colVal }
    onChange(next)
  }

  function addRow() {
    onChange([...displayRows, Object.fromEntries(columns.map((c) => [c.id, '']))])
  }

  function removeRow(index: number) {
    if (displayRows.length <= minRows) return
    onChange(displayRows.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-3">
      {displayRows.map((row, i) => (
        <div key={i} className="border border-border rounded-input p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-muted">Baris {i + 1}</span>
            {displayRows.length > minRows && (
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="text-[12px] text-red-600 font-medium"
              >
                Hapus
              </button>
            )}
          </div>
          {columns.map((col) => (
            <FieldWrap key={col.id} label={col.label}>
              {renderInput(col, row[col.id], (v) => updateRow(i, col.id, String(v)))}
            </FieldWrap>
          ))}
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="text-[13px] font-semibold text-accent text-left"
      >
        + Tambah baris
      </button>
    </div>
  )
}

type Props = {
  schema: TemplateSchema
  formData: Record<string, unknown>
  onChange: (formData: Record<string, unknown>) => void
}

export function DynamicDocumentForm({ schema, formData, onChange }: Props) {
  function setField(id: string, value: unknown) {
    onChange({ ...formData, [id]: value })
  }

  return (
    <div className="flex flex-col gap-5">
      {schema.sections.map((section) => (
        <div key={section.id}>
          <h2 className="text-[15px] font-semibold text-fg mb-3">{section.title}</h2>
          <div className="flex flex-col gap-3">
            {section.fields.map((field) => (
              <FieldWrap key={field.id} label={field.label}>
                {field.type === 'repeat' ? (
                  <RepeatFieldEditor
                    field={field}
                    value={formData[field.id]}
                    onChange={(v) => setField(field.id, v)}
                  />
                ) : (
                  renderInput(field, formData[field.id], (v) => setField(field.id, v))
                )}
              </FieldWrap>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function validateFormData(
  schema: TemplateSchema,
  formData: Record<string, unknown>,
): boolean {
  for (const section of schema.sections) {
    for (const field of section.fields) {
      if (!field.required) continue
      const val = formData[field.id]
      if (field.type === 'repeat') {
        if (!Array.isArray(val) || val.length === 0) return false
        const cols = field.fields ?? field.columns ?? []
        for (const row of val) {
          if (typeof row !== 'object' || row === null) return false
          for (const col of cols) {
            if (col.required && !String((row as Record<string, unknown>)[col.id] ?? '').trim()) {
              return false
            }
          }
        }
      } else if (!String(val ?? '').trim()) {
        return false
      }
    }
  }
  return true
}

export function buildInitialFormData(defaults: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(defaults)) as Record<string, unknown>
}
