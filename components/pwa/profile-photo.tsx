'use client'
import { useEffect, useId, useState, type ChangeEvent } from 'react'
import { updateFotoPeserta } from '@/lib/actions/peserta-foto'
import type { MemberCardData } from '@/lib/pwa-member'
import { shrinkPhotoForUpload } from '@/lib/shrink-photo'
import { MemberCard, MemberPhoto, Silhouette } from '@/components/pwa/member-card'
import { ANTON, BTN, LIFTED, MONO, PRESS, Strip } from '@/components/pwa/paper-ui'
import { Icon, Sheet, SheetHead } from '@/components/pwa/ui'

/** Photo frame on the Profil page: tap to pick, preview on the real card, then save. */
export function ProfilePhotoPicker({ card, onSaved }: { card: MemberCardData | null; onSaved: (url: string) => void }) {
  const inputId = useId()
  const [draft, setDraft] = useState<{ blob: Blob; url: string } | null>(null)
  const [busy, setBusy] = useState<'prepare' | 'save' | null>(null)
  const [error, setError] = useState('')

  // Runs for the previous draft whenever it is replaced or cleared, and on unmount.
  useEffect(() => {
    if (!draft) return
    return () => URL.revokeObjectURL(draft.url)
  }, [draft])

  function close() {
    setDraft(null)
    setError('')
  }

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // so picking the same file again still fires change
    if (!file) return
    setError('')
    setBusy('prepare')
    try {
      const blob = await shrinkPhotoForUpload(file)
      setDraft({ blob, url: URL.createObjectURL(blob) })
    } catch {
      setDraft(null)
      setError('Foto ini tidak bisa dibuka. Coba pilih foto JPG atau PNG.')
    }
    setBusy(null)
  }

  async function save() {
    if (!draft) return
    setError('')
    setBusy('save')
    try {
      const body = new FormData()
      body.set('foto', draft.blob, 'foto.jpg')
      const res = await updateFotoPeserta(body)
      if (res.ok) {
        onSaved(res.url)
        close()
      } else {
        setError(res.error)
      }
    } catch {
      setError('Gagal menyimpan foto. Coba lagi.')
    }
    setBusy(null)
  }

  return (
    <>
      {/* Native label -> input tap, not input.click(): older iOS ignores scripted clicks on hidden file inputs. */}
      <label
        htmlFor={inputId}
        aria-label="Ganti foto profil"
        aria-busy={busy === 'prepare'}
        className={`relative block shrink-0 w-[104px] h-[132px] -rotate-5 p-1.5 rounded-[14px] bg-[#fffdf7] cursor-pointer focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-[#161616] ${!card || busy !== null ? 'opacity-60 pointer-events-none' : ''} ${LIFTED} ${PRESS}`}
      >
        <span aria-hidden className="absolute z-10 -top-2 left-1/2 -translate-x-1/2 -rotate-6 w-11 h-3.5 bg-[#e02a2f]/85" />
        <span className="relative block h-full rounded-[10px] overflow-hidden bg-[#ffd83d]">
          <MemberPhoto src={card?.photo} fallback={<Silhouette className="absolute left-1 right-1 -bottom-1 w-[calc(100%-8px)]" />} />
        </span>
        <span aria-hidden className="absolute z-10 -right-2 -bottom-2 w-8 h-8 rounded-full bg-[#161616] text-[#ffd83d] ring-2 ring-[#fffdf7] flex items-center justify-center">
          <Icon name="camera" className="w-4 h-4" sw={2} />
        </span>
      </label>
      {/* sr-only, not display:none: stays tappable via its labels and keyboard-focusable */}
      <input id={inputId} type="file" accept="image/*" disabled={!card || busy !== null} onChange={onPick} className="sr-only" />

      <Sheet open={Boolean(draft || error)} onClose={close}>
        <SheetHead title="Ganti Foto Profil" sub={draft ? 'Begini tampilannya di kartu anggotamu.' : undefined} />
        {/* The real card, not the bare photo: its name sticker covers the bottom quarter, which could hide a face. */}
        {draft && card && <MemberCard m={{ ...card, photo: draft.url }} />}
        {error && (
          <p role="alert" className={`${MONO} ${draft ? 'mt-4' : ''} text-[12px] font-bold text-[#c21f24]`}>
            {error}
          </p>
        )}
        {draft && (
          <button type="button" disabled={busy !== null} onClick={save} className={`mt-5 ${BTN}`}>
            <Strip>{busy === 'save' ? 'Menyimpan…' : 'Simpan Foto'}</Strip>
          </button>
        )}
        <label
          htmlFor={inputId}
          className={`${ANTON} mt-3 block text-center cursor-pointer w-full py-2.5 rounded-sm ring-2 ring-[#161616] text-[15px] tracking-[.03em] text-[#161616] ${busy !== null ? 'opacity-50 pointer-events-none' : ''} ${PRESS}`}
        >
          Pilih foto lain
        </label>
      </Sheet>
    </>
  )
}
