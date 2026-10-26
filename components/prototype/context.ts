'use client'
import { createContext, useContext, type ReactNode } from 'react'
import type { Absen, Account, Ev, EventStatus, KMember, KTicket, Person, Reg, Reimburse, Testimony, Upgrade } from './data'
import type { Gender } from './data'
import type { ScreenId } from './screens'

export interface Proto {
  go: (s: ScreenId) => void
  toast: (msg: string) => void
  soon: (name: string) => void
  sheet: (node: ReactNode) => void
  closeSheet: () => void
  tick: () => string            // prototype clock HH:mm, +1 menit tiap absen baru

  // PWA anggota
  // Satu HP = 1 sesi peserta (Google) + 1 sesi pengurus (email + password)
  me: Account                   // peserta yang login (fallback akun contoh saat belum ada sesi)
  pesertaOn: boolean
  pengurusOn: boolean
  pengurus: { key: string; name: string; email: string; g: Gender }
  allAccounts: Account[]        // akun Google yang sudah terdaftar sebagai peserta
  signIn: (id: string) => void  // ganti sesi peserta (yang lama otomatis keluar)
  signInPengurus: () => void
  logoutPengurus: () => void
  toKartu: () => void           // ke sisi peserta; minta login Google kalau belum ada sesi
  register: (a: Account) => void
  daftarStep: 'intro' | 'form' | 'done'
  setDaftarStep: (s: 'intro' | 'form' | 'done') => void
  joinVolunteer: () => void
  joinSquad: (cabang: string) => void
  upgrades: Upgrade[]
  approveUpgrade: (id: number) => void
  photos: Record<string, string>
  setPhoto: (id: string, url: string) => void
  logout: () => void            // keluar sesi peserta; sesi pengurus tetap
  testimonies: Testimony[]
  addTestimony: (t: Testimony) => void
  push: boolean
  setPush: (on: boolean) => void
  notifUnread: boolean
  readNotif: () => void
  eventKota: string             // filter Events: cabang id atau 'all'
  setEventKota: (cabang: string) => void
  viewEventId: string
  openViewEvent: (id: string) => void
  ticketId: string              // `${eventId}:${key}`
  openTicket: (eventId: string, key: string) => void

  // Event, tiket & absensi (dipakai kedua mode)
  events: Ev[]
  addEvent: (e: Ev) => void
  setEventStatus: (id: string, status: EventStatus) => void
  regs: Reg[]
  addReg: (r: Reg) => void
  absen: Absen[]
  addAbsen: (a: Absen) => void
  people: Person[]

  // Sekretariat — members = pengurus kota (bukan peserta); set email + password saja
  members: KMember[]
  addMember: (m: KMember) => void
  updateMember: (key: string, patch: Pick<KMember, 'email' | 'password'>) => void
  eventId: string
  openEvent: (id: string) => void
  scanEventId: string
  setScanEventId: (id: string) => void
  openScan: (eventId: string) => void
  reimburse: Reimburse[]
  submitReimburse: (eventId: string, amount: number) => void
  tickets: KTicket[]
  addTicket: (t: KTicket) => void
}

export const ProtoContext = createContext<Proto | null>(null)

export function useProto() {
  const ctx = useContext(ProtoContext)
  if (!ctx) throw new Error('useProto must be used inside PrototypeApp')
  return ctx
}
