import type {
  TemplateModule,
  TemplateMeta,
  TemplateSchema,
  StampSlotsConfig,
} from '@/components/documents/types/template-schema'
import metaJson from './meta.json'
import schemaJson from './schema.json'
import defaultsJson from './defaults.json'
import stampSlotsJson from './stamp-slots.json'
import { PermohonanIzinDocument } from './document'

const templateDefinition: TemplateModule = {
  meta: metaJson as TemplateMeta,
  schema: schemaJson as TemplateSchema,
  defaults: defaultsJson as Record<string, unknown>,
  stampSlots: stampSlotsJson as StampSlotsConfig,
  Document: PermohonanIzinDocument,
}

export default templateDefinition
