'use server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { setActor } from '@/lib/request-context'
import { addLainnya, FEEDBACK_PILIHAN, FEEDBACK_JAWABAN_MAX } from '@/lib/feedback-app'

type Result = { ok: true } | { ok: false; error: string }

/** Satu kiriman Feedback App dari anggota yang sedang login. Boleh kirim berkali-kali. */
export async function kirimFeedbackApp(pilihan: string[], jawaban: string): Promise<Result> {
  const session = await auth()
  const id = session?.user?.idPeserta
  if (!id) return { ok: false, error: 'Masuk dulu untuk kirim feedback.' }
  setActor({ type: 'peserta', id, label: session?.user?.name ?? null })

  // Bawaan tetap urutan daftar; sisanya = ketikan sendiri, dirapikan + dibatasi lagi di server
  const preset = FEEDBACK_PILIHAN.filter((p) => pilihan.includes(p))
  const ketik = pilihan.filter((p) => !(FEEDBACK_PILIHAN as readonly string[]).includes(p))
  const { pilihan: bawaan, lainnya } = addLainnya(preset, [], ketik.join(','))
  const picked = [...FEEDBACK_PILIHAN.filter((p) => bawaan.includes(p)), ...lainnya]
  const text = jawaban.trim()
  if (!text) return { ok: false, error: 'Ceritain dulu dong, minimal satu kalimat.' }
  if (text.length > FEEDBACK_JAWABAN_MAX) return { ok: false, error: `Maksimal ${FEEDBACK_JAWABAN_MAX} karakter.` }

  await db.feedback_app.create({
    data: { id_peserta: String(id), pilihan: picked.join(', '), jawaban: text },
  })
  return { ok: true }
}
