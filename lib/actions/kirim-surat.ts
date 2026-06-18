'use server'

export async function kirimSurat(_data: {
  templateId: string
  formData: Record<string, unknown>
}): Promise<{ success: boolean; error?: string }> {
  // TODO: integrasi API project stamping
  await new Promise((r) => setTimeout(r, 600))
  return { success: true }
}
