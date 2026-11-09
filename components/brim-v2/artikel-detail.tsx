'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ArtikelAdminDetail } from '@/lib/artikel-data'
import { deleteArtikel, deleteKomentar, setArtikelStatus, setKomentarHidden } from '@/lib/actions/artikel'
import { formatTanggalArtikel, formatWaktuKomentar } from '@/lib/artikel'
import { ANTON, BackBar, BTN, BTN_OUTLINE, ERROR, LABEL, MONO, PANEL, PaperMain, PaperToast, Strip } from '@/components/pwa/paper-ui'
import { Empty, Icon, Pill } from '@/components/alk-v2/ui'
import { BRIM_ARTIKEL_BASE } from './paths'

function Traffic({ harian }: { harian: { tanggal: string; views: number }[] }) {
  const max = Math.max(1, ...harian.map((h) => h.views))
  return (
    <div>
      <div className="flex items-end gap-[3px] h-24" role="img" aria-label="Views per hari, 30 hari terakhir">
        {harian.map((h) => (
          <div key={h.tanggal} className="flex-1 min-w-0 flex flex-col justify-end h-full" title={`${h.tanggal}: ${h.views}`}>
            <div
              className={h.views ? 'bg-[#e02a2f]' : 'bg-[#161616]/15'}
              style={{ height: h.views ? `${Math.max(6, (h.views / max) * 100)}%` : '3px' }}
            />
          </div>
        ))}
      </div>
      <div className={`${MONO} mt-1.5 flex justify-between text-[10px] text-[#57534e]`}>
        <span>{harian[0]?.tanggal.slice(5).replace('-', '/')}</span>
        <span>{harian[harian.length - 1]?.tanggal.slice(5).replace('-', '/')}</span>
      </div>
    </div>
  )
}

export function ArtikelDetailClient({ artikel }: { artikel: ArtikelAdminDetail }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<string | null>(null)
  const published = artikel.status === 'published'
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const publicUrl = `${origin}/artikel/${artikel.slug}`

  function flash(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  function run(fn: () => Promise<{ ok: true } | { ok: false; error: string }>, after?: () => void) {
    setError('')
    startTransition(async () => {
      const res = await fn()
      if (!res.ok) {
        setError(res.error)
        return
      }
      after?.()
      router.refresh()
    })
  }

  // Destructive actions need a second tap on the same button (no browser confirm dialogs in the PWA).
  function twoTap(key: string, fn: () => void) {
    if (confirm !== key) {
      setConfirm(key)
      setTimeout(() => setConfirm((c) => (c === key ? null : c)), 3000)
      return
    }
    setConfirm(null)
    fn()
  }

  return (
    <PaperMain>
      <BackBar title="Detail Artikel" onBack={() => router.push(BRIM_ARTIKEL_BASE)} />
      <div className="px-5 pt-5 pb-10 space-y-5">
        <div>
          <h1 className={`${ANTON} text-[30px] leading-[1.05] tracking-[.01em] break-words`}>{artikel.judul}</h1>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <Pill tone={published ? 'green' : 'amber'}>{published ? 'Terbit' : 'Draft'}</Pill>
            {artikel.publishedAt && <span className={`${MONO} text-[11px] font-bold text-[#44403c]`}>{formatTanggalArtikel(artikel.publishedAt)}</span>}
          </div>
        </div>

        {published && (
          <div className={`p-4 ${PANEL}`}>
            <p className={`${LABEL} text-[10px] font-bold text-[#44403c]`}>Link publik</p>
            <p className={`${MONO} mt-1.5 break-all text-[12.5px]`}>{publicUrl}</p>
            <div className="mt-3 flex gap-2.5">
              <a href={`/artikel/${artikel.slug}`} target="_blank" rel="noreferrer" className={`${BTN_OUTLINE} ${ANTON} flex-1`}>Buka</a>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText(publicUrl)
                  flash('Link disalin')
                }}
                className={`${BTN_OUTLINE} ${ANTON} flex-1`}
              >
                Salin
              </button>
            </div>
          </div>
        )}

        <section aria-label="Traffic" className={`p-4 space-y-4 ${PANEL}`}>
          <div className="grid grid-cols-4 divide-x-2 divide-dotted divide-[#161616]/20 text-center">
            {([
              [artikel.viewsTotal, 'Views', 'text-[#e02a2f]'],
              [artikel.views7, '7 hari', 'text-[#161616]'],
              [artikel.views30, '30 hari', 'text-[#161616]'],
              [artikel.likes, 'Like', 'text-[#161616]'],
            ] as [number, string, string][]).map(([v, l, c]) => (
              <div key={l} className="px-1">
                <p className={`${ANTON} text-[28px] leading-none ${c}`}>{v.toLocaleString('id-ID')}</p>
                <p className={`${LABEL} mt-1.5 text-[9px] text-[#57534e]`}>{l}</p>
              </div>
            ))}
          </div>
          <Traffic harian={artikel.harian} />
        </section>

        <section aria-label="Komentar">
          <h2 className={`${ANTON} mb-3 flex items-center gap-2 text-[24px] leading-none`}>
            Komentar <span className={`${MONO} text-[13px] font-bold text-[#57534e]`}>{artikel.komentar.length}</span>
          </h2>
          {artikel.komentar.length === 0 ? (
            <Empty>Belum ada komentar.</Empty>
          ) : (
            <div className="space-y-2.5">
              {artikel.komentar.map((k) => (
                <article key={k.id} className={`p-3.5 ${PANEL} ${k.hidden ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={`${ANTON} text-[16px] leading-tight break-words`}>{k.nama}</p>
                      <p className={`${MONO} text-[10.5px] text-[#57534e]`}>{formatWaktuKomentar(k.createdAt)}</p>
                    </div>
                    {k.hidden && <Pill tone="slate">Disembunyikan</Pill>}
                  </div>
                  <p className={`${MONO} mt-2 whitespace-pre-wrap break-words text-[13px] leading-relaxed`}>{k.isi}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => setKomentarHidden(k.id, !k.hidden))}
                      className={`${MONO} inline-flex items-center gap-1.5 rounded-[6px] bg-[#161616]/[.07] px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-50`}
                    >
                      <Icon name={k.hidden ? 'eye' : 'eyeOff'} className="w-3.5 h-3.5" sw={2} />
                      {k.hidden ? 'Tampilkan' : 'Sembunyikan'}
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => twoTap(`k${k.id}`, () => run(() => deleteKomentar(k.id)))}
                      className={`${MONO} rounded-[6px] px-2.5 py-1.5 text-[11px] font-bold text-[#c21f24] ring-1 ring-[#c21f24] disabled:opacity-50`}
                    >
                      {confirm === `k${k.id}` ? 'Tap lagi: hapus' : 'Hapus'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {error ? <p role="alert" className={ERROR}>{error}</p> : null}

        <div className="space-y-2.5">
          <button type="button" onClick={() => router.push(`${BRIM_ARTIKEL_BASE}/${artikel.id}/edit`)} className={BTN}>
            <Strip>Edit Artikel</Strip>
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => setArtikelStatus(artikel.id, !published), () => flash(published ? 'Dijadikan draft' : 'Artikel terbit'))}
            className={`${BTN_OUTLINE} ${ANTON}`}
          >
            {published ? 'Jadikan Draft' : 'Terbitkan'}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => twoTap('del', () => run(() => deleteArtikel(artikel.id), () => router.push(BRIM_ARTIKEL_BASE)))}
            className={`${ANTON} w-full rounded-sm py-3 text-[16px] tracking-[.03em] text-[#c21f24] ring-2 ring-inset ring-[#c21f24] disabled:opacity-50`}
          >
            {confirm === 'del' ? 'Tap lagi untuk hapus artikel' : 'Hapus Artikel'}
          </button>
        </div>
      </div>
      <PaperToast msg={toast} />
    </PaperMain>
  )
}
