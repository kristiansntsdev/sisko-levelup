// Pemuridan series shown in the member PWA. The interactive story for each slug lives in components/pemuridan/stories.ts.
export type Seri = {
  slug: string
  no: number
  tema: string
  judul: string
  sub: string
  ayat: string
  /** Number of parts, cover and penutup included; must match the story's scene count. */
  bagian: number
}

export const PEMURIDAN: Seri[] = [
  { slug: 'pola-pikir', no: 1, tema: 'Pola Pikir', judul: 'Mereka Keluar', sub: 'Tetapi Gagal Masuk', ayat: '1 Korintus 10', bagian: 10 },
]

export const findSeri = (slug: string) => PEMURIDAN.find((s) => s.slug === slug)

/** localStorage key for the part the member last opened; progress stays on the device. */
export const progressKey = (slug: string) => `levelup-pemuridan:${slug}`
