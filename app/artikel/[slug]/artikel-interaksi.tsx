'use client'
import { useEffect, useRef, useState, useTransition } from 'react'
import { catatViewArtikel, kirimKomentarArtikel, toggleLikeArtikel } from '@/lib/actions/artikel-public'
import { formatWaktuKomentar, KOMENTAR_ISI_MAX, KOMENTAR_NAMA_MAX } from '@/lib/artikel'
import type { KomentarItem } from '@/lib/artikel-data'
import { Heart, LIFT, MK, PRESS, Scribble, Strip, Tape, Torn } from '@/components/landing/zine'

const NAME_KEY = 'levelup-komentar-nama'

// Sticky-note colours for comments, cycled in order (same palette as /about)
const NOTES = ['bg-[#fffdf7] -rotate-1', 'bg-[#ffe36e] rotate-1', 'bg-[#d9ccff] -rotate-[.6deg]'] as const

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
    <section className="relative mt-14">
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

      <h2 className={`${MK} relative mt-16 inline-block text-[clamp(1.9rem,5.5vw,2.8rem)] leading-none uppercase`}>
        Komentar <span className="text-[#e02a2f]">{komentar.length}</span>
        <Scribble className="absolute -right-11 -top-4 w-9 text-[#e02a2f]" />
      </h2>

      <div className="relative mt-7">
        <Tape seed={36} className="-top-3 left-1/2 -translate-x-1/2 rotate-2 h-6 w-24" />
        <Torn seed={37} amp={8} sides="tb" className="rotate-[.4deg]" inner="relative bg-[#fffdf7] px-4 sm:px-6 pt-8 pb-7">
          <form onSubmit={send} className="space-y-3">
            <p className={`${MK} text-[15px] uppercase`}>Tulis di sini<span className="text-[#e02a2f]">.</span></p>
            <input
              ref={namaRef}
              maxLength={KOMENTAR_NAMA_MAX}
              placeholder="Namamu"
              aria-label="Nama"
              className="w-full bg-transparent border-0 border-b-2 border-dashed border-[#161616]/35 px-1 py-2.5 text-[16px] outline-none focus:border-solid focus:border-[#161616]"
            />
            <textarea
              value={isi}
              onChange={(e) => setIsi(e.target.value)}
              maxLength={KOMENTAR_ISI_MAX}
              rows={4}
              placeholder="Tulis komentarmu…"
              aria-label="Komentar"
              className="w-full resize-none bg-transparent border-0 px-1 py-2.5 text-[16px] leading-[2] outline-none bg-[repeating-linear-gradient(transparent,transparent_31px,rgba(22,22,22,.22)_31px,rgba(22,22,22,.22)_32px)] bg-[length:100%_32px] focus:bg-[repeating-linear-gradient(transparent,transparent_31px,#161616_31px,#161616_32px)]"
            />
            {/* Honeypot: hidden from people and assistive tech; bots fill it. */}
            <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>
                Website
                <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </label>
            </div>
            {error && <p role="alert" className="text-[13.5px] font-bold text-[#c21f24]">{error}</p>}
            <div className="pt-1">
              <button type="submit" disabled={sendPending} className={`${LIFT} ${PRESS} disabled:opacity-60`}>
                <Strip tone="red" seed={34} className="h-11 px-6 text-[15px] -rotate-1">{sendPending ? 'Mengirim…' : 'Kirim komentar'}</Strip>
              </button>
            </div>
          </form>
        </Torn>
      </div>

      <ul className="mt-10 space-y-7">
        {komentar.map((k, i) => (
          <li key={k.id} className={`relative ${NOTES[i % NOTES.length]} p-4 sm:p-5 shadow-[0_14px_22px_-12px_rgba(40,30,10,.55)]`}>
            <Tape seed={40 + i} className={`-top-2.5 ${i % 2 ? 'right-5 rotate-6' : 'left-5 -rotate-6'} h-5 w-16`} />
            <p className={`${MK} text-[17px] uppercase break-words`}>{k.nama}</p>
            <p className="text-[12px] font-bold text-stone-600">{formatWaktuKomentar(k.createdAt)}</p>
            {/* Plain text on purpose: comments are anonymous and never rendered as HTML. */}
            <p className="mt-2 whitespace-pre-wrap break-words text-[15.5px] leading-relaxed text-[#1c1917]">{k.isi}</p>
          </li>
        ))}
        {komentar.length === 0 && (
          <li className="flex items-center gap-3 text-[14.5px] text-stone-700">
            <Heart className="w-7 text-[#e02a2f] -rotate-12" />
            Jadi yang pertama berkomentar.
          </li>
        )}
      </ul>
    </section>
  )
}
