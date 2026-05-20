'use client'
import { TEMPLATE_LIST, makeBlankDoc, makeDocFromTemplate } from '../lib/templates'
import type { OrgInfo, PamfletDoc } from '../lib/types'
import { Thumbnail } from './Thumbnail'

interface Props {
  org: OrgInfo
  onPick: (doc: PamfletDoc) => void
  onBack: () => void
  onOpenOrg: () => void
  onOpenDrafts: () => void
  draftCount: number
}

export function TemplatePicker({ org, onPick, onBack, onOpenOrg, onOpenDrafts, draftCount }: Props) {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="sticky top-0 z-10 bg-surface/85 backdrop-blur border-b border-border">
        <div className="max-w-md mx-auto w-full px-4 py-3 flex items-center gap-3">
          <button onClick={onBack}
            className="w-10 h-10 rounded-xl border border-border bg-bg flex items-center justify-center text-fg"
            aria-label="Kembali">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-muted">Pamflet</p>
            <h1 className="text-base font-bold text-fg leading-tight">Pilih Template</h1>
          </div>
          <button onClick={onOpenDrafts}
            className="relative w-10 h-10 rounded-xl border border-border bg-bg flex items-center justify-center text-fg"
            aria-label="Draft">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"/>
              <polyline points="2 17 12 22 22 17"/>
              <polyline points="2 12 12 17 22 12"/>
            </svg>
            {draftCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center border-2 border-surface">
                {draftCount}
              </span>
            )}
          </button>
          <button onClick={onOpenOrg}
            className="w-10 h-10 rounded-xl border border-border bg-bg flex items-center justify-center text-fg"
            aria-label="Info organisasi">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-5">
        <div className="grid grid-cols-2 gap-3">
          {/* Blank tile */}
          <button onClick={() => onPick(makeBlankDoc())}
            className="aspect-[3/4] rounded-2xl border-2 border-dashed border-border bg-surface flex flex-col items-center justify-center gap-2 text-muted hover:border-accent hover:text-accent transition-colors">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span className="text-sm font-semibold">Buat desain kosong</span>
          </button>

          {TEMPLATE_LIST.map(t => {
            const doc = makeDocFromTemplate(t.id, org)
            return (
              <button key={t.id} onClick={() => onPick(doc)}
                className="rounded-2xl border border-border bg-surface overflow-hidden hover:border-accent transition-colors text-left group">
                <div className="aspect-[3/4] bg-bg flex items-center justify-center overflow-hidden">
                  <div className="aspect-square w-full">
                    <Thumbnail doc={doc} />
                  </div>
                </div>
                <div className="px-3 py-2.5 border-t border-border">
                  <div className="text-sm font-bold text-fg">{t.name}</div>
                  <div className="text-[11px] text-muted mt-0.5">{t.sub}</div>
                </div>
              </button>
            )
          })}
        </div>
      </main>
    </div>
  )
}
