'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import {
  buildInitialFormData,
  DynamicDocumentForm,
  validateFormData,
} from '@/components/documents/dynamic-document-form'
import { listTemplateMetas } from '@/components/documents/registry-meta'
import type { TemplateDefinition } from '@/components/documents/types/template-schema'
import { kirimSurat } from '@/lib/actions/kirim-surat'
import {
  buildDocSession,
  buildPreviewUrl,
  saveDocPreview,
  saveDocSession,
} from '@/lib/documents/preview-storage'
import { resolveStampSlots } from '@/lib/documents/stamp-slots-loader'
import { useToast } from '@/hooks/use-toast'

export function DocumentTestClient() {
  const templates = useMemo(() => listTemplateMetas(), [])
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [template, setTemplate] = useState<TemplateDefinition | null>(null)
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false)
  const [isPreviewPending, startPreview] = useTransition()
  const [isSendPending, startSend] = useTransition()
  const { toast } = useToast()

  useEffect(() => {
    if (!templateId) {
      setTemplate(null)
      return
    }

    let cancelled = false
    setIsLoadingTemplate(true)

    import('@/components/documents/registry')
      .then(({ getTemplate }) => {
        if (cancelled) return
        const t = getTemplate(templateId)
        if (!t) {
          setTemplateId(null)
          return
        }
        setTemplate(t)
        setFormData(buildInitialFormData(t.defaults))
      })
      .finally(() => {
        if (!cancelled) setIsLoadingTemplate(false)
      })

    return () => {
      cancelled = true
    }
  }, [templateId])

  function selectTemplate(id: string) {
    setTemplateId(id)
  }

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!template || !templateId) return
    if (!validateFormData(template.schema, formData)) {
      toast({ title: 'Lengkapi semua field wajib', variant: 'error' })
      return
    }

    startPreview(() => {
      const payload = { templateId, formData: { ...formData } }
      const resolvedSlots = resolveStampSlots(template.stampSlots, formData)
      const session = buildDocSession(
        templateId,
        template.meta.version,
        formData,
        resolvedSlots,
        template.stampSlots.slots.map((s) => s.id),
      )
      saveDocPreview(payload)
      saveDocSession(session)
      window.open(buildPreviewUrl(payload), '_blank', 'noopener,noreferrer')
    })
  }

  function handleKirim() {
    if (!template || !templateId) return
    if (!validateFormData(template.schema, formData)) {
      toast({ title: 'Lengkapi semua field terlebih dahulu', variant: 'error' })
      return
    }

    startSend(async () => {
      const res = await kirimSurat({ templateId, formData })
      if (res.success) {
        toast({ title: 'Surat berhasil dikirim', variant: 'success' })
      } else {
        toast({ title: res.error ?? 'Gagal mengirim surat', variant: 'error' })
      }
    })
  }

  if (!templateId) {
    return (
      <div className="min-h-screen bg-bg">
        <div className="max-w-[480px] mx-auto px-4 py-6 pb-24">
          <div className="mb-6">
            <h1 className="text-[22px] font-bold text-fg">Test Generate Dokumen</h1>
            <p className="text-[14px] text-muted mt-1">Pilih template surat</p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => selectTemplate(t.id)}
                className="text-left bg-surface border border-border rounded-card p-4 hover:border-accent transition-colors"
              >
                <div className="text-[15px] font-semibold text-fg">{t.name}</div>
                <div className="text-[12px] text-muted mt-1">
                  {t.pageCount} halaman · v{t.version}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isLoadingTemplate || !template) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-[14px] text-muted">Memuat template…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-[480px] mx-auto px-4 py-6 pb-24">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setTemplateId(null)}
            className="text-[13px] font-semibold text-accent mb-2"
          >
            ← Ganti template
          </button>
          <h1 className="text-[22px] font-bold text-fg">{template.meta.name}</h1>
          <p className="text-[14px] text-muted mt-1">
            {template.meta.pageCount} halaman
          </p>
        </div>

        <form
          onSubmit={handleGenerate}
          className="bg-surface border border-border rounded-card p-5 flex flex-col gap-5"
        >
          <DynamicDocumentForm
            schema={template.schema}
            formData={formData}
            onChange={setFormData}
          />

          <div className="flex flex-col gap-2.5 pt-1">
            <button
              type="submit"
              disabled={isPreviewPending || isSendPending}
              className="w-full py-3 bg-accent text-white rounded-input text-[14px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {isPreviewPending ? 'Membuka preview…' : 'Generate Preview Surat'}
            </button>
            <button
              type="button"
              onClick={handleKirim}
              disabled={isPreviewPending || isSendPending}
              className="w-full py-3 border-[1.5px] border-accent text-accent rounded-input text-[14px] font-semibold hover:bg-accent-light transition-colors disabled:opacity-60"
            >
              {isSendPending ? 'Mengirim…' : 'Kirim Surat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
