import { auth } from '@/auth'
import { setActor } from '@/lib/request-context'

/**
 * Pemilik data anggota = peserta yang sedang login.
 *
 * Setiap export di file `'use server'` adalah endpoint publik yang bisa
 * dipanggil siapa saja dengan argumen apa pun. Action yang menerima
 * `idPeserta` dari client WAJIB mencocokkannya dengan sesi di sini (VA-001,
 * Broken Object Level Authorization): tanpa itu anggota A bisa membaca /
 * mengubah data anggota B hanya dengan mengganti angka id.
 */

/** id peserta dari sesi login, null kalau belum login. */
export async function sessionPesertaId(): Promise<number | null> {
  const session = await auth()
  const id = session?.user?.idPeserta
  if (!id) return null
  setActor({ type: 'peserta', id, label: session?.user?.name ?? null })
  return id
}

/**
 * `idPeserta` dari client sama dengan peserta yang login → id-nya.
 * Belum login atau id milik orang lain → null (pembaca mengembalikan kosong).
 */
export async function ownPesertaId(idPeserta: number): Promise<number | null> {
  const self = await sessionPesertaId()
  if (self == null || Number(idPeserta) !== self) return null
  return self
}

/** Versi untuk aksi tulis: lempar error kalau bukan pemiliknya. */
export async function requireOwnPeserta(idPeserta: number): Promise<number> {
  const self = await ownPesertaId(idPeserta)
  if (self == null) throw new Error('Akses ditolak: data anggota lain.')
  return self
}
