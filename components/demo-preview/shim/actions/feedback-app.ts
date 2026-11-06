'use client'
/* eslint-disable @typescript-eslint/no-unused-vars */
// Feedback in the demo goes nowhere: the screen just shows the thank-you state.
type Result = { ok: true } | { ok: false; error: string }

export async function kirimFeedbackApp(_pilihan: string[], jawaban: string): Promise<Result> {
  if (!jawaban.trim()) return { ok: false, error: 'Ceritain dulu dong, minimal satu kalimat.' }
  return { ok: true }
}
