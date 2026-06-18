'use client'

import { Suspense, useEffect, useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { getDocumentComponent, getTemplate } from '@/components/documents/registry'
import { getKotaLogo } from '@/lib/actions/kota-logo'
import { resolveStampSlots } from '@/lib/documents/stamp-slots-loader'
import {
  countApproved,
  decodeDocPreview,
  DOC_APPROVED_KEY,
  getDocApprovals,
  loadDocPreview,
  loadDocSession,
  type DocApprovalMap,
} from '@/lib/documents/preview-storage'
import type { ResolvedDocStampSlot } from '@/components/documents/types/template-schema'

function approvalLabel(approved: DocApprovalMap, slotIds: string[]): string {
  const total = slotIds.length
  const count = countApproved(approved, slotIds)
  if (count === total) return 'Semua TTD disetujui'
  if (count > 0) return `${count}/${total} TTD disetujui`
  return 'Menunggu persetujuan'
}

function approvalBadgeClass(approved: DocApprovalMap, slotIds: string[]): string {
  const total = slotIds.length
  const count = countApproved(approved, slotIds)
  if (count === total) return 'bg-green-light text-green-dark'
  if (count > 0) return 'bg-accent-light text-accent-dark'
  return 'bg-amber-light text-amber-dark'
}

function PreviewContent() {
  const searchParams = useSearchParams()
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, unknown> | null>(null)
  const [stampSlots, setStampSlots] = useState<ResolvedDocStampSlot[]>([])
  const [approved, setApproved] = useState<DocApprovalMap>({})
  const [kotaLogo, setKotaLogo] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [, startTransition] = useTransition()

  useEffect(() => {
    const encoded = searchParams.get('d')
    const fromUrl = encoded ? decodeDocPreview(encoded) : null
    const preview = fromUrl ?? loadDocPreview()

    if (preview) {
      setTemplateId(preview.templateId)
      setFormData(preview.formData)
    }

    const session = loadDocSession()
    const tid = preview?.templateId ?? session?.templateId ?? null

    if (session && session.templateId === tid) {
      setStampSlots(session.stampSlots)
    } else if (preview && tid) {
      const t = getTemplate(tid)
      if (t) {
        setStampSlots(resolveStampSlots(t.stampSlots, preview.formData))
      }
    }

    setApproved(getDocApprovals())
    setReady(true)

    startTransition(async () => {
      setKotaLogo(await getKotaLogo())
    })
  }, [searchParams])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === DOC_APPROVED_KEY || e.key === null) {
        setApproved(getDocApprovals())
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const template = templateId ? getTemplate(templateId) : null
  const DocumentComponent = templateId ? getDocumentComponent(templateId) : null
  const slotIds = stampSlots.map((s) => s.id)

  if (!ready) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-[14px] text-muted">Memuat surat…</p>
      </div>
    )
  }

  if (!formData || !templateId || !template || !DocumentComponent) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-[15px] font-semibold text-fg">Data surat tidak ditemukan</p>
          <p className="text-[13px] text-muted mt-2">
            Buka halaman form dan klik Generate Preview Surat terlebih dahulu.
          </p>
          <a
            href="/test/document"
            className="inline-block mt-4 px-5 py-2.5 bg-accent text-white rounded-input text-[13px] font-semibold"
          >
            Kembali ke Form
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3 flex items-center justify-between print:hidden">
        <a href="/test/document" className="text-[13px] font-semibold text-accent">
          ← Kembali
        </a>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted hidden sm:inline">{template.meta.name}</span>
          <span
            className={`text-[11px] font-semibold px-2 py-1 rounded-full ${approvalBadgeClass(approved, slotIds)}`}
          >
            {approvalLabel(approved, slotIds)}
          </span>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 bg-accent text-white rounded-input text-[13px] font-semibold"
          >
            Cetak / PDF
          </button>
        </div>
      </div>

      <div className="px-2 py-4 sm:px-4 print:p-0">
        <div className="bg-[#ddd9d3] rounded-card p-2 sm:p-4 overflow-x-auto print:bg-transparent print:p-0 max-w-[220mm] mx-auto">
          <div className="doc-print-area" style={{ boxShadow: '0 4px 28px rgba(0,0,0,.12)' }}>
            <DocumentComponent
              data={formData}
              kotaLogo={kotaLogo}
              approved={approved}
              stampSlots={stampSlots}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export function DocumentPreviewClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg flex items-center justify-center">
          <p className="text-[14px] text-muted">Memuat surat…</p>
        </div>
      }
    >
      <PreviewContent />
    </Suspense>
  )
}
