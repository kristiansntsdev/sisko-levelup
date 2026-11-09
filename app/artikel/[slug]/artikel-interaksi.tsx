'use client'
import { useEffect, useRef, useState, useTransition } from 'react'
import { catatViewArtikel, kirimKomentarArtikel, toggleLikeArtikel } from '@/lib/actions/artikel-public'
import { formatWaktuKomentar, KOMENTAR_ISI_MAX, KOMENTAR_NAMA_MAX } from '@/lib/artikel'
import type { KomentarItem } from '@/lib/artikel-data'
import { LIFT, MK, PRESS, Strip } from '@/components/landing/zine'

const NAME_KEY = 'levelup-komentar-nama'

function wibDay() {
  return new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10)
}

export function ArtikelInteraksi({
  id,
  judul,
  initialLikes,
  initialLiked,
  initialKomentar,
}: {
  id: number
  judul: string
  initialLikes: number
  initialLiked: boolean
  initialKomentar: KomentarItem[]
}) {
  const [likes, setLikes] = useState(initialLikes)
  const [liked, setLiked] = useState(initialLiked)
  const [komentar, setKomentar] = useState(initialKomentar)
  const namaRef = useRef<HTMLInputElement>(null)
  const [isi, setIsi] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [likePending, startLike] = useTransition()
  const [sendPending, startSend] = useTransition()

  // One view per browser per day (WIB). Storage can be blocked: then every load counts, which is acceptable.
  useEffect(() => {
    const key = `levelup-artikel-view:${id}`
    try {
      if (localStorage.getItem(key) === wibDay()) return
      localStorage.setItem(key, wibDay())
    } catch {}
    void catatViewArtikel(id)
  }, [id])

  // Remembered name goes straight into the DOM input (uncontrolled), so no state update is needed in the effect.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(NAME_KEY)
      if (saved && namaRef.current && !namaRef.current.value) namaRef.current.value = saved
    } catch {}
  }, [])

  function like() {
    startLike(async () => {
      const res = await toggleLikeArtikel(id)
      if (res.ok) {
        setLiked(res.liked)
        setLikes(res.count)
      }
    })
  }

  function copyLink() {
    void navigator.clipboard?.writeText(window.location.href)
    setInfo('Link disalin')
    setTimeout(() => setInfo(''), 2000)
  }

  function shareWa() {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${judul} — ${window.location.href}`)}`, '_blank', 'noopener,noreferrer')
  }

  function send(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const nama = namaRef.current?.value ?? ''
    startSend(async () => {
      const res = await kirimKomentarArtikel({ id, nama, isi, website })
      if (!res.ok) {
        setError(res.error)
        return
      }
      try {
        localStorage.setItem(NAME_KEY, nama.trim())
      } catch {}
      setKomentar((k) => [res.item, ...k])
      setIsi('')
    })
  }

  return (
    <section className="mt-14">
      <div className="flex flex-wrap items-center gap-3.5">
        <button type="button" onClick={like} disabled={likePending} aria-pressed={liked} className={`${LIFT} ${PRESS} disabled:opacity-60`}>
          <Strip tone={liked ? 'red' : 'paper'} seed={31} className="h-11 px-5 text-[15px] -rotate-1">
            <span>{liked ? '♥' : '♡'}</span> {likes}
          </Strip>
        </button>
        <button type="button" onClick={shareWa} className={`${LIFT} ${PRESS}`}>
          <Strip tone="yellow" seed={32} className="h-11 px-5 text-[15px] rotate-1">Bagikan WA</Strip>
        </button>
        <button type="button" onClick={copyLink} className={`${LIFT} ${PRESS}`}>
          <Strip tone="ink" seed={33} className="h-11 px-5 text-[15px] -rotate-1">{info || 'Salin link'}</Strip>
        </button>
      </div>

      <h2 className={`${MK} mt-14 text-[clamp(1.8rem,5vw,2.6rem)] leading-none uppercase`}>
        Komentar <span className="text-[#e02a2f]">{komentar.length}</span>
      </h2>

      <form onSubmit={send} className="mt-6 relative bg-[#fffdf7] p-4 sm:p-5 shadow-[0_14px_24px_-12px_rgba(40,30,10,.5)] space-y-3">
        <input
          ref={namaRef}
          maxLength={KOMENTAR_NAMA_MAX}
          placeholder="Namamu"
          aria-label="Nama"
          className="w-full bg-[#efe8da]/50 ring-1 ring-[#161616]/15 px-3.5 py-3 text-[16px] outline-none focus:bg-white focus:ring-2 focus:ring-[#161616]"
        />
        <textarea
          value={isi}
          onChange={(e) => setIsi(e.target.value)}
          maxLength={KOMENTAR_ISI_MAX}
          rows={4}
          placeholder="Tulis komentarmu…"
          aria-label="Komentar"
          className="w-full resize-none bg-[#efe8da]/50 ring-1 ring-[#161616]/15 px-3.5 py-3 text-[16px] outline-none focus:bg-white focus:ring-2 focus:ring-[#161616]"
        />
        {/* Honeypot: hidden from people and assistive tech; bots fill it. */}
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </label>
        </div>
        {error && <p role="alert" className="text-[13.5px] font-bold text-[#c21f24]">{error}</p>}
        <button type="submit" disabled={sendPending} className={`${LIFT} ${PRESS} disabled:opacity-60`}>
          <Strip tone="red" seed={34} className="h-11 px-6 text-[15px] -rotate-1">{sendPending ? 'Mengirim…' : 'Kirim komentar'}</Strip>
        </button>
      </form>

      <ul className="mt-8 space-y-4">
        {komentar.map((k) => (
          <li key={k.id} className="bg-[#fffdf7] p-4 shadow-[0_10px_18px_-12px_rgba(40,30,10,.5)]">
            <p className="text-[15px] font-extrabold break-words">{k.nama}</p>
            <p className="text-[12px] text-stone-500">{formatWaktuKomentar(k.createdAt)}</p>
            {/* Plain text on purpose: comments are anonymous and never rendered as HTML. */}
            <p className="mt-2 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-stone-800">{k.isi}</p>
          </li>
        ))}
        {komentar.length === 0 && <li className="text-[14.5px] text-stone-600">Jadi yang pertama berkomentar.</li>}
      </ul>
    </section>
  )
}
