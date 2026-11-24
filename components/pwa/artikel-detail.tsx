'use client'
import { useEffect, useRef, useState, useTransition } from 'react'
import { catatViewArtikel, kirimKomentarArtikel, toggleLikeArtikel } from '@/lib/actions/artikel-public'
import { formatWaktuKomentar, KOMENTAR_ISI_MAX, KOMENTAR_NAMA_MAX } from '@/lib/artikel'
import type { KomentarItem } from '@/lib/artikel-data'
import { BTN, ERROR, LABEL, MONO, PANEL, PRESS, Strip } from '@/components/pwa/paper-ui'
import { ThumbUp } from '@/components/pwa/artikel-row'

const NAME_KEY = 'levelup-komentar-nama'

function wibDay() {
  return new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10)
}

/** Like, share and comments for the member (dashboard) article page. Same server actions as the public page. */
export function ArtikelDetailInteraksi({
  id,
  slug,
  judul,
  initialLikes,
  initialLiked,
  initialKomentar,
}: {
  id: number
  slug: string
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

  // One view per browser per day (WIB), same key as the public page so the two never double count.
  useEffect(() => {
    const key = `levelup-artikel-view:${id}`
    try {
      if (localStorage.getItem(key) === wibDay()) return
      localStorage.setItem(key, wibDay())
    } catch {}
    void catatViewArtikel(id)
  }, [id])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(NAME_KEY)
      if (saved && namaRef.current && !namaRef.current.value) namaRef.current.value = saved
    } catch {}
  }, [])

  const publicUrl = () => `${window.location.origin}/artikel/${slug}`

  function like() {
    startLike(async () => {
      const r = await toggleLikeArtikel(id)
      if (r.ok) {
        setLiked(r.liked)
        setLikes(r.count)
      }
    })
  }

  function copyLink() {
    void navigator.clipboard?.writeText(publicUrl())
    setInfo('Link disalin')
    setTimeout(() => setInfo(''), 2000)
  }

  function shareWa() {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${judul} — ${publicUrl()}`)}`, '_blank', 'noopener,noreferrer')
  }

  function send(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const nama = namaRef.current?.value ?? ''
    startSend(async () => {
      const r = await kirimKomentarArtikel({ id, nama, isi, website })
      if (!r.ok) {
        setError(r.error)
        return
      }
      try {
        localStorage.setItem(NAME_KEY, nama.trim())
      } catch {}
      setKomentar((k) => [r.item, ...k])
      setIsi('')
    })
  }

  const pill = `flex items-center gap-1.5 rounded-full border-2 border-[#161616] px-3.5 py-2 ${MONO} text-[12.5px] font-bold active:scale-95 transition`

  return (
    <section id="komentar" className="mt-6 scroll-mt-6">
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={like}
          disabled={likePending}
          aria-pressed={liked}
          className={`${pill} disabled:opacity-60 ${liked ? 'border-[#e02a2f] bg-[#e02a2f] text-white' : 'bg-[#fffdf7] text-[#161616] hover:bg-[#ffd83d]'}`}
        >
          <ThumbUp filled={liked} />
          {likes}
        </button>
        <button type="button" onClick={shareWa} className={`${pill} bg-[#ffd83d] text-[#161616]`}>
          Bagikan WA
        </button>
        <button type="button" onClick={copyLink} className={`${pill} bg-[#161616] text-[#ffd83d]`}>
          {info || 'Salin link'}
        </button>
      </div>

      <h3 className={`${LABEL} mt-8 text-[13px] font-bold`}>
        Komentar <span className="text-[#e02a2f]">{komentar.length}</span>
      </h3>

      <form onSubmit={send} className={`relative mt-3 space-y-2.5 p-4 ${PANEL}`}>
        <input
          ref={namaRef}
          maxLength={KOMENTAR_NAMA_MAX}
          placeholder="Namamu"
          aria-label="Nama"
          className="w-full border-0 border-b-2 border-dashed border-[#161616]/35 bg-transparent px-1 py-2.5 text-[16px] outline-none focus:border-solid focus:border-[#161616]"
        />
        <textarea
          value={isi}
          onChange={(e) => setIsi(e.target.value)}
          maxLength={KOMENTAR_ISI_MAX}
          rows={3}
          placeholder="Tulis komentarmu…"
          aria-label="Komentar"
          className="w-full resize-none border-0 bg-transparent px-1 py-2.5 text-[16px] outline-none"
        />
        {/* Honeypot: hidden from people and assistive tech; bots fill it. */}
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </label>
        </div>
        {error && <p role="alert" className={ERROR}>{error}</p>}
        <button type="submit" disabled={sendPending || !isi.trim()} className={BTN}>
          <Strip>{sendPending ? 'Mengirim…' : 'Kirim komentar'}</Strip>
        </button>
      </form>

      <ul className="mt-4 space-y-3">
        {komentar.map((k) => (
          <li key={k.id} className={`rounded-[14px] border-2 border-[#161616] bg-[#fffdf7] p-4 ${PRESS}`}>
            <p className="text-[15px] font-extrabold break-words">{k.nama}</p>
            <p className={`${LABEL} text-[9.5px] text-[#57534e]`}>{formatWaktuKomentar(k.createdAt)}</p>
            {/* Plain text on purpose: comments are anonymous and never rendered as HTML. */}
            <p className="mt-2 whitespace-pre-wrap break-words text-[14px] leading-relaxed">{k.isi}</p>
          </li>
        ))}
        {komentar.length === 0 && <li className={`${MONO} text-[12.5px] text-[#57534e]`}>Jadi yang pertama berkomentar.</li>}
      </ul>
    </section>
  )
}
