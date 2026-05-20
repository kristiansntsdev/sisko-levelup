'use client'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Draft, OrgInfo, PamfletDoc } from './lib/types'
import { DEFAULT_ORG } from './lib/types'
import { loadOrg, saveOrg, loadDrafts, saveDrafts } from './lib/storage'
import { TemplatePicker } from './components/TemplatePicker'
import { Editor } from './components/Editor'
import { OrgModal, DraftsSheet, SaveDraftSheet } from './components/Sheets'

interface Props {
  kotaLogo: string
}

export function PamfletClient({ kotaLogo }: Props) {
  const router = useRouter()
  const onBack = useCallback(() => router.push('/dashboard/kota/brim'), [router])
  const [org, setOrg] = useState<OrgInfo>(DEFAULT_ORG)
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [doc, setDoc] = useState<PamfletDoc | null>(null)
  const [showOrg, setShowOrg] = useState(false)
  const [showDrafts, setShowDrafts] = useState(false)
  const [showSave, setShowSave] = useState(false)
  const [toast, setToast] = useState<{ msg: string; kind: 'success' | 'error' } | null>(null)

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setOrg(loadOrg()); setDrafts(loadDrafts()) }, [])

  const showToast = useCallback((msg: string, kind: 'success' | 'error' = 'success') => {
    setToast({ msg, kind })
    setTimeout(() => setToast(null), 2400)
  }, [])

  const updateOrg = useCallback((next: OrgInfo) => {
    setOrg(next); saveOrg(next)
    showToast('Info organisasi tersimpan')
  }, [showToast])

  const setDocFn = useCallback((updater: (doc: PamfletDoc) => PamfletDoc) => {
    setDoc(d => d ? updater(d) : d)
  }, [])

  const saveDraft = useCallback((name: string) => {
    if (!doc) return
    const d: Draft = {
      id: 'd-' + Date.now(),
      savedAt: Date.now(),
      name: name.trim() || 'Tanpa judul',
      doc,
    }
    const next = [d, ...drafts].slice(0, 30)
    setDrafts(next); saveDrafts(next)
    showToast('Draft tersimpan')
  }, [doc, drafts, showToast])

  const pickDraft = useCallback((d: Draft) => {
    setDoc(d.doc)
    setShowDrafts(false)
    showToast('Draft dimuat')
  }, [showToast])

  const deleteDraft = useCallback((id: string) => {
    const next = drafts.filter(d => d.id !== id)
    setDrafts(next); saveDrafts(next)
  }, [drafts])

  return (
    <>
      {doc ? (
        <Editor
          doc={doc}
          setDoc={setDocFn}
          kotaLogo={kotaLogo}
          onBack={() => { if (confirm('Kembali ke pilihan template? Perubahan yang belum disimpan akan hilang.')) setDoc(null) }}
          onSave={() => setShowSave(true)}
          onSwitchTemplate={() => { if (confirm('Ganti template? Perubahan saat ini akan hilang.')) setDoc(null) }}
          showToast={showToast}
        />
      ) : (
        <TemplatePicker
          org={org}
          onPick={setDoc}
          onBack={onBack}
          onOpenOrg={() => setShowOrg(true)}
          onOpenDrafts={() => setShowDrafts(true)}
          draftCount={drafts.length}
        />
      )}

      <OrgModal open={showOrg} org={org} onChange={updateOrg} onClose={() => setShowOrg(false)} />
      <DraftsSheet open={showDrafts} drafts={drafts}
        onPick={pickDraft} onDelete={deleteDraft}
        onClose={() => setShowDrafts(false)} />
      <SaveDraftSheet open={showSave}
        defaultName={`Pamflet ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`}
        onSave={saveDraft}
        onClose={() => setShowSave(false)} />

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] px-4 py-3 rounded-xl text-white text-sm font-semibold shadow-xl"
          style={{ background: toast.kind === 'error' ? '#dc2626' : '#1c1917' }}>
          {toast.msg}
        </div>
      )}
    </>
  )
}
