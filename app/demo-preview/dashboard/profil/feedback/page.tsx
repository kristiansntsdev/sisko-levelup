/* eslint-disable */
// GENERATED from app/dashboard/profil/feedback/page.tsx by scripts/gen-demo-preview.mjs — do not edit; change the source or the generator and re-run.
'use client'
import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/components/demo-preview/shim/session'
import { kirimFeedbackApp } from '@/components/demo-preview/shim/actions/feedback-app'
import { addLainnya, FEEDBACK_JAWABAN_MAX, FEEDBACK_LAINNYA_LEN, FEEDBACK_LAINNYA_MAX, FEEDBACK_PILIHAN } from '@/lib/feedback-app'
import {
  ANTON,
  BTN,
  BTN_OUTLINE,
  ERROR,
  IconButton,
  LABEL,
  MONO,
  PANEL,
  PAPER_INPUT,
  PaperField,
  PaperHeader,
  PaperMain,
  PaperSection,
  PRESS,
  Strip,
  TAPE,
  TAPE_RIGHT,
} from '@/components/pwa/paper-ui'
import { Icon } from '@/components/pwa/ui'

const PICK = `${MONO} rounded-full px-3 py-2 text-[12px] font-bold ${PRESS}`
const PICK_ON = 'bg-[#161616] text-[#ffd83d]'

export default function FeedbackAppPage() {
  const router = useRouter()
  const { status } = useSession()
  const [pilihan, setPilihan] = useState<string[]>([])
  const [lainnya, setLainnya] = useState<string[]>([])
  const [lainnyaOpen, setLainnyaOpen] = useState(false)
  const [lainnyaText, setLainnyaText] = useState('')
  const [jawaban, setJawaban] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/demo-preview/login?callbackUrl=/demo-preview/dashboard/profil/feedback')
  }, [status, router])

  function toggle(p: string) {
    setPilihan((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]))
  }

  function tambahLainnya() {
    const next = addLainnya(pilihan, lainnya, lainnyaText)
    setPilihan(next.pilihan)
    setLainnya(next.lainnya)
    setLainnyaText('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!jawaban.trim()) {
      setError('Ceritain dulu dong, minimal satu kalimat.')
      return
    }
    setError('')
    setSending(true)
    // Ketikan "Lainnya" yang belum ditambah tetap ikut terkirim
    const final = addLainnya(pilihan, lainnya, lainnyaText)
    try {
      const res = await kirimFeedbackApp([...final.pilihan, ...final.lainnya], jawaban)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setSent(true)
      setPilihan([])
      setLainnya([])
      setLainnyaText('')
      setLainnyaOpen(false)
      setJawaban('')
    } catch {
      setError('Gagal mengirim. Coba lagi.')
    } finally {
      setSending(false)
    }
  }

  const back = <IconButton icon="chevronLeft" label="Kembali" onClick={() => router.push('/demo-preview/dashboard/profil')} className="-rotate-3" />

  if (sent) {
    return (
      <PaperMain>
        <PaperHeader title="Feedback App" leading={back} />
        <div className="px-5 mt-6 space-y-4 pb-6">
          <section className={`relative px-5 py-7 text-center ${PANEL}`}>
            <span aria-hidden className={`${TAPE} -left-4 -top-1`} />
            <span className="mx-auto w-14 h-14 rounded-full bg-[#ffd83d] text-[#161616] flex items-center justify-center -rotate-6">
              <Icon name="check" className="w-7 h-7" sw={2.6} />
            </span>
            <h2 className={`${ANTON} mt-4 text-[30px] leading-none tracking-[.01em]`}>Makasih banyak!</h2>
            <p className={`${MONO} mt-3 text-[12.5px] leading-relaxed text-[#44403c]`}>
              Masukanmu udah masuk dan bakal dibaca tim LevelUP buat ngembangin app ini. Ada ide lain? Kirim aja lagi.
            </p>
          </section>
          <button type="button" onClick={() => setSent(false)} className={BTN}>
            <Strip>Kirim Ide Lain</Strip>
          </button>
          <button type="button" onClick={() => router.push('/demo-preview/dashboard/profil')} className={BTN_OUTLINE}>
            Kembali ke Profil
          </button>
        </div>
      </PaperMain>
    )
  }

  return (
    <PaperMain>
      <PaperHeader title="Feedback App" leading={back}>
        <p className={`${MONO} mt-1 text-[12px] leading-relaxed text-[#44403c]`}>App ini dibikin buat kamu. Bantu kami tahu apa yang kamu butuhin.</p>
      </PaperHeader>

      <form onSubmit={handleSubmit} noValidate className="px-5 mt-5 space-y-5 pb-6">
        <section className="relative -rotate-1 rounded-[14px] bg-[#161616] text-[#fbf6ec] px-5 py-5">
          <span aria-hidden className={TAPE_RIGHT} />
          <p className={`${LABEL} text-[10px] font-bold text-[#ffd83d]`}>Pertanyaan buat kamu</p>
          <h2 className={`${ANTON} mt-2 text-[24px] leading-[1.12] tracking-[.01em]`}>
            Sebagai pemuda Kristen, kamu butuh apa sih?
          </h2>
          <p className={`${MONO} mt-2 text-[12.5px] leading-relaxed text-[#fbf6ec]/80`}>
            Apa yang pengen ada di app LevelUP ini, yang pengen kamu dapetin tiap hari? Jujur aja, bebas.
          </p>
        </section>

        <PaperSection taped icon="sparkle" chip="bg-[#ffd83d] text-[#161616]" title="Pengen ada apa?" sub="Pilih atau tambah sendiri, boleh lebih dari satu">
          <div className="flex flex-wrap gap-2">
            {FEEDBACK_PILIHAN.map((p) => {
              const on = pilihan.includes(p)
              return (
                <button
                  key={p}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(p)}
                  className={`${PICK} ${on ? PICK_ON : 'ring-1 ring-[#161616]/25 text-[#161616]'}`}
                >
                  {on && <Icon name="check" className="inline w-3.5 h-3.5 -mt-0.5 mr-1" sw={2.6} />}
                  {p}
                </button>
              )
            })}
            {lainnya.map((p) => (
              <button
                key={p}
                type="button"
                aria-label={`Hapus ${p}`}
                onClick={() => setLainnya((cur) => cur.filter((x) => x !== p))}
                className={`${PICK} ${PICK_ON} max-w-full break-words text-left`}
              >
                {p}
                <Icon name="x" className="inline w-3.5 h-3.5 -mt-0.5 ml-1.5" sw={2.6} />
              </button>
            ))}
            {!lainnyaOpen && lainnya.length < FEEDBACK_LAINNYA_MAX && (
              <button
                type="button"
                aria-expanded={false}
                onClick={() => setLainnyaOpen(true)}
                className={`${MONO} rounded-full border border-dashed border-[#161616]/60 px-[11px] py-[7px] text-[12px] font-bold text-[#161616] ${PRESS}`}
              >
                <Icon name="plus" className="inline w-3.5 h-3.5 -mt-0.5 mr-1" sw={2.6} />
                Lainnya
              </button>
            )}
          </div>

          {lainnyaOpen && lainnya.length < FEEDBACK_LAINNYA_MAX && (
            <div>
              <div className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  enterKeyHint="done"
                  aria-label="Tambah pilihan sendiri"
                  placeholder="Tulis ide kamu…"
                  maxLength={FEEDBACK_LAINNYA_LEN * FEEDBACK_LAINNYA_MAX}
                  value={lainnyaText}
                  onChange={(e) => setLainnyaText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter') return
                    e.preventDefault()
                    tambahLainnya()
                  }}
                  className={`${PAPER_INPUT} flex-1`}
                />
                <button
                  type="button"
                  disabled={!lainnyaText.trim()}
                  onClick={tambahLainnya}
                  className={`${ANTON} shrink-0 rounded-[10px] bg-[#161616] px-4 text-[15px] tracking-[.03em] text-[#ffd83d] disabled:opacity-40 ${PRESS}`}
                >
                  Tambah
                </button>
              </div>
              <p className={`${MONO} mt-1.5 text-[11px] text-[#57534e]`}>
                Maks {FEEDBACK_LAINNYA_MAX} ide sendiri. Pisahkan pakai koma untuk nambah beberapa sekaligus.
              </p>
            </div>
          )}
          {lainnya.length >= FEEDBACK_LAINNYA_MAX && (
            <p className={`${MONO} text-[11px] text-[#57534e]`}>Udah {FEEDBACK_LAINNYA_MAX} ide sendiri. Hapus salah satu kalau mau ganti.</p>
          )}
        </PaperSection>

        <PaperSection icon="chat" chip="bg-[#e02a2f] text-white" title="Ceritain dong" sub="Yang pengen kamu dapetin tiap hari">
          <PaperField label="Jawabanmu">
            <textarea
              className={`${PAPER_INPUT} min-h-[160px] resize-y`}
              placeholder="Contoh: tiap pagi pengen dapet ayat + renungan singkat, terus bisa saling doain sama temen satu kota…"
              maxLength={FEEDBACK_JAWABAN_MAX}
              value={jawaban}
              onChange={(e) => setJawaban(e.target.value)}
            />
          </PaperField>
          <p className={`${MONO} -mt-2 text-right text-[11px] text-[#57534e]`}>
            {jawaban.length}/{FEEDBACK_JAWABAN_MAX}
          </p>
        </PaperSection>

        {error && <p className={ERROR}>{error}</p>}

        <button type="submit" disabled={sending} className={BTN}>
          <Strip>
            <Icon name="send" className="w-5 h-5" sw={2.2} />
            {sending ? 'Mengirim…' : 'Kirim Feedback'}
          </Strip>
        </button>
      </form>
    </PaperMain>
  )
}
