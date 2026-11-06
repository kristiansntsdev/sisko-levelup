/** Ide cepat di Feedback App. Disimpan apa adanya di feedback_app.pilihan (dipisah koma). */
export const FEEDBACK_PILIHAN = [
  'Renungan harian',
  'Rencana baca Alkitab',
  'Pengingat doa',
  'Pokok doa bareng',
  'Lagu & playlist worship',
  'Video / podcast pendek',
  'Kelompok kecil & mentor',
  'Info event terdekat',
  'Tanya jawab iman',
  'Info kerja & kuliah',
] as const

export const FEEDBACK_JAWABAN_MAX = 2000
/** Pilihan "Lainnya" yang diketik sendiri: maksimal jumlah dan panjang per item. */
export const FEEDBACK_LAINNYA_MAX = 5
export const FEEDBACK_LAINNYA_LEN = 40

/** Rapikan satu pilihan ketikan sendiri. Koma dibuang karena pilihan disimpan dipisah koma. */
export function cleanLainnya(raw: string): string {
  return raw.replace(/,/g, ' ').replace(/\s+/g, ' ').trim().slice(0, FEEDBACK_LAINNYA_LEN).trim()
}

/**
 * Gabungkan ketikan "Lainnya" (boleh beberapa, dipisah koma) ke pilihan yang ada.
 * Yang sama dengan pilihan bawaan ikut mencentang pilihan bawaan; duplikat diabaikan.
 */
export function addLainnya(pilihan: string[], lainnya: string[], text: string): { pilihan: string[]; lainnya: string[] } {
  const preset = new Map<string, string>(FEEDBACK_PILIHAN.map((p) => [p.toLowerCase(), p]))
  const nextPilihan = [...pilihan]
  const nextLainnya = [...lainnya]
  const seen = new Set(nextLainnya.map((x) => x.toLowerCase()))
  for (const item of text.split(',').map(cleanLainnya).filter(Boolean)) {
    const key = item.toLowerCase()
    const p = preset.get(key)
    if (p) {
      if (!nextPilihan.includes(p)) nextPilihan.push(p)
    } else if (!seen.has(key) && nextLainnya.length < FEEDBACK_LAINNYA_MAX) {
      seen.add(key)
      nextLainnya.push(item)
    }
  }
  return { pilihan: nextPilihan, lainnya: nextLainnya }
}
