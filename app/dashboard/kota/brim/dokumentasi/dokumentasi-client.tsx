'use client'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import type { EventDashboard } from '@/lib/actions/event'
import type { DokumentasiItem } from '@/lib/actions/dokumentasi'
import { saveDokumentasiKota, deleteDokumentasiKota, getAbsenEmails } from '@/lib/actions/dokumentasi'

interface Props {
  events: EventDashboard[]
  dokumentasi: DokumentasiItem[]
}

function DriveIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12l-10 10L2 12 7 2h10z"/>
      <path d="M22 12H2"/>
      <path d="M12 22V12"/>
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

export function DokumentasiClient({ events, dokumentasi }: Props) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<number>(events[0]?.id_event ?? 0)
  const [linkInput, setLinkInput] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [saving, startSave] = useTransition()
  const [copying, startCopy] = useTransition()

  const docMap = new Map(dokumentasi.map(d => [d.id_event, d.gdrive_link]))
  const selectedEvent = events.find(e => e.id_event === selectedId)
  const currentLink = docMap.get(selectedId) ?? ''

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2400)
  }

  function handleEventChange(id: number) {
    setSelectedId(id)
    setLinkInput('')
  }

  function handleSave() {
    const link = linkInput.trim() || currentLink
    if (!link || !selectedId) return
    startSave(async () => {
      const res = await saveDokumentasiKota(selectedId, link)
      if (res.error) showToast(res.error)
      else { showToast('Link tersimpan'); setLinkInput('') }
    })
  }

  function handleDelete() {
    if (!selectedId) return
    startSave(async () => {
      await deleteDokumentasiKota(selectedId)
      showToast('Link dihapus')
    })
  }

  function handleCopyEmails() {
    if (!selectedId) return
    startCopy(async () => {
      const emails = await getAbsenEmails(selectedId)
      if (!emails.length) { showToast('Belum ada peserta hadir'); return }
      await navigator.clipboard.writeText(emails.join(', '))
      setCopied(true)
      showToast(`${emails.length} email tersalin`)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  const activeLink = linkInput.trim() || currentLink

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-surface/90 backdrop-blur border-b border-border">
        <div className="max-w-[480px] mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-fg"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div>
            <h1 className="text-[17px] font-bold text-fg leading-tight">Dokumentasi Kota</h1>
            <p className="text-[12px] text-muted">Link Google Drive per event</p>
          </div>
        </div>
      </header>

      <div className="max-w-[480px] mx-auto px-4 py-5 flex flex-col gap-5">
        {events.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl px-4 py-12 flex flex-col items-center gap-2">
            <p className="text-sm text-muted">Belum ada event.</p>
          </div>
        ) : (
          <>
            {/* Event selector */}
            <div className="flex flex-col gap-1.5">
              <p className="text-[13px] font-semibold text-fg">Pilih Event</p>
              <select
                value={selectedId}
                onChange={e => handleEventChange(Number(e.target.value))}
                className="w-full px-3.5 py-3 border-[1.5px] border-border rounded-xl text-[15px] bg-surface text-fg outline-none focus:border-accent appearance-none"
              >
                {events.map(e => (
                  <option key={e.id_event} value={e.id_event}>
                    {e.nama_event} · {e.tglDisplay}
                  </option>
                ))}
              </select>
            </div>

            {/* Drive link card */}
            <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent-light flex items-center justify-center text-accent">
                  <DriveIcon />
                </div>
                <p className="text-[15px] font-semibold text-fg">Google Drive</p>
                {currentLink && (
                  <span className="ml-auto text-[11px] font-semibold text-green bg-green-light px-2 py-0.5 rounded-full">Tersimpan</span>
                )}
              </div>

              {/* Current link display */}
              {currentLink && !linkInput && (
                <div className="bg-bg border border-border rounded-xl px-3 py-2.5 flex items-center gap-2">
                  <p className="flex-1 text-[13px] text-fg truncate">{currentLink}</p>
                  <a
                    href={currentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-[12px] font-semibold text-accent underline"
                  >
                    Buka
                  </a>
                </div>
              )}

              {/* Input */}
              <div className="flex flex-col gap-2">
                <input
                  type="url"
                  value={linkInput}
                  onChange={e => setLinkInput(e.target.value)}
                  placeholder={currentLink ? 'Ganti link baru…' : 'https://drive.google.com/…'}
                  className="w-full px-3.5 py-3 border-[1.5px] border-border rounded-xl text-[14px] bg-bg text-fg outline-none focus:border-accent placeholder:text-muted"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving || !activeLink}
                    className="flex-1 py-3 rounded-xl bg-accent text-white font-semibold text-[14px] disabled:opacity-50 transition-opacity"
                  >
                    {saving ? 'Menyimpan…' : currentLink && !linkInput ? 'Simpan' : 'Simpan Link'}
                  </button>
                  {currentLink && (
                    <button
                      onClick={handleDelete}
                      disabled={saving}
                      className="px-4 py-3 rounded-xl border border-red-200 text-red-500 font-semibold text-[14px] disabled:opacity-50"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Akses Anggota */}
            <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
              <div>
                <p className="text-[15px] font-semibold text-fg">Akses Anggota</p>
                <p className="text-[12px] text-muted mt-0.5">
                  Salin email peserta yang hadir di event ini — tempel langsung ke share Google Drive
                </p>
              </div>
              <button
                onClick={handleCopyEmails}
                disabled={copying}
                className="w-full py-3.5 rounded-xl border-[1.5px] border-border flex items-center justify-center gap-2 font-semibold text-[14px] text-fg hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
              >
                {copying ? (
                  <span className="text-muted">Mengambil data…</span>
                ) : copied ? (
                  <>
                    <span className="text-green"><CheckIcon /></span>
                    <span className="text-green">Email Tersalin!</span>
                  </>
                ) : (
                  <>
                    <CopyIcon />
                    Salin Email Peserta Hadir
                  </>
                )}
              </button>
            </div>

            {/* Event summary */}
            {selectedEvent && (
              <div className="bg-surface border border-border rounded-2xl px-4 py-3">
                <p className="text-[12px] text-muted uppercase tracking-wider mb-2">Detail Event</p>
                <p className="text-[15px] font-semibold text-fg">{selectedEvent.nama_event}</p>
                <p className="text-[13px] text-muted mt-0.5">{selectedEvent.tglDisplay} · {selectedEvent.jamevent}</p>
                <p className="text-[13px] text-muted">{selectedEvent.alamatevent}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-4 py-3 rounded-xl bg-fg text-bg text-sm font-semibold shadow-xl">
          {toast}
        </div>
      )}
    </div>
  )
}
