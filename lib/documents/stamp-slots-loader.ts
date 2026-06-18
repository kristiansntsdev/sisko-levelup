import type {
  ResolvedDocStampSlot,
  StampSlotsConfig,
} from '@/components/documents/types/template-schema'
import { str } from '@/lib/documents/form-data'

function resolveLabel(
  slot: StampSlotsConfig['slots'][number],
  formData: Record<string, unknown>,
): string {
  const kota = str(formData, 'kota')
  if (slot.labelTemplate) {
    return slot.labelTemplate.replace(/\{kota\}/g, kota.trim())
  }
  return slot.label
}

export function resolveStampSlots(
  config: StampSlotsConfig,
  formData: Record<string, unknown>,
): ResolvedDocStampSlot[] {
  return config.slots.map((slot) => ({
    id: slot.id,
    label: resolveLabel(slot, formData),
    signerName: str(formData, slot.signerNameField),
    page: slot.page,
    qrSize: slot.qrSize,
    pdf: slot.pdf,
  }))
}

export function defaultApprovalMap(
  config: StampSlotsConfig,
): Record<string, boolean> {
  return Object.fromEntries(config.slots.map((s) => [s.id, false]))
}
