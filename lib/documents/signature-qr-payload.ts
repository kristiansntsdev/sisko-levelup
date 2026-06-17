export function buildSignatureQrPayload(
  templateId: string,
  kota: string,
  slotId: string,
  subject?: string,
): string {
  const params = new URLSearchParams({
    type: templateId,
    kota: kota.trim(),
    role: slotId,
  })
  if (subject?.trim()) {
    params.set('subject', subject.trim())
  }
  return `https://levelupgen.com/verify?${params.toString()}`
}
