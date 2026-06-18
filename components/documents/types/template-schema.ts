import type { ComponentType } from 'react'

export type FieldType =
  | 'text'
  | 'date'
  | 'time'
  | 'textarea'
  | 'number'
  | 'currency'
  | 'repeat'

export type FieldSchema = {
  id: string
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  /** Sub-fields when type is repeat */
  fields?: FieldSchema[]
  /** Alias for fields in repeat rows */
  columns?: FieldSchema[]
  minRows?: number
}

export type SectionSchema = {
  id: string
  title: string
  fields: FieldSchema[]
}

export type TemplateSchema = {
  sections: SectionSchema[]
}

export type TemplateMeta = {
  id: string
  version: string
  name: string
  pdfReference: string
  pageCount: number
}

export type StampSlotSchema = {
  id: string
  label: string
  signerNameField: string
  /** Optional template for label, e.g. "PIC LevelUP {kota}" */
  labelTemplate?: string
  page: number
  qrSize: number
  pdf: { x: number; y: number; width: number; height: number }
}

export type StampSlotsConfig = {
  slots: StampSlotSchema[]
}

export type ResolvedDocStampSlot = {
  id: string
  label: string
  signerName: string
  page: number
  qrSize: number
  pdf: { x: number; y: number; width: number; height: number }
}

export type DocumentComponentProps = {
  data: Record<string, unknown>
  kotaLogo: string | null
  approved: Record<string, boolean>
  stampSlots: ResolvedDocStampSlot[]
}

/** Alias used by template document components */
export type DocumentTemplateProps = DocumentComponentProps

export type DocumentComponent = ComponentType<DocumentComponentProps>

export type TemplateDefinition = {
  meta: TemplateMeta
  schema: TemplateSchema
  defaults: Record<string, unknown>
  stampSlots: StampSlotsConfig
  Document: DocumentComponent
}

/** Alias used by template index modules */
export type TemplateModule = TemplateDefinition
