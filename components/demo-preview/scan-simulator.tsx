'use client'
// Demo-only helper under the real scanner: desktops and some phones have no BarcodeDetector camera, so the visitor can
// still "scan" a ticket. It calls the same createAbsen path the camera uses.
import { useState } from 'react'
import { LABEL, MONO, PANEL, PRESS } from '@/components/pwa/paper-ui'
import { getDb } from './db'
import { createAbsen } from './shim/actions/absen'

const REASON: Record<string, string> = { already_scanned: 'Sudah diabsen', sesi_required: 'Pilih sesi dulu', invalid_payload: 'QR tidak valid' }

export function ScanSimulator({ eventId }: { eventId?: number }) {
  const [msg, setMsg] = useState('')
  const [tick, setTick] = useState(0)
  const [picked, setPicked] = useState(eventId)
  const d = getDb()
  const ev = d.event.find((e) => e.id_event === picked)
  if (!ev) return null
  void tick
  const rows = d.registrasi
    .filter((r) => r.id_event === ev.id_event && r.status !== 'cancelled')
    .map((r) => d.peserta.find((p) => p.id_peserta === r.id_peserta))
    .filter((p): p is NonNullable<typeof p> => !!p)

  async function scan(idPeserta: number, email: string) {
    const res = await createAbsen({ p: String(idPeserta), e: email, ev: String(ev!.id_event) }, null, null)
    setMsg(res.success ? `Berhasil: ${res.nama}` : (REASON[res.reason] ?? res.reason))
    setTick((t) => t + 1)
  }

  return (
    <section className="mx-auto w-full max-w-[430px] px-5 pb-6">
      <div className={`border-2 border-dashed border-[#161616]/40 p-4 ${PANEL}`}>
        <p className={`${LABEL} text-[10px] font-bold text-[#57534e]`}>Demo · simulasi scan tiket</p>
        <p className={`${MONO} mt-1 text-[11px] text-[#44403c]`}>Tanpa kamera: tap peserta untuk menjalankan scan QR tiketnya di event yang dipilih.</p>
        <select value={ev.id_event} onChange={(e) => { setPicked(Number(e.target.value)); setMsg('') }} className="mt-3 w-full rounded-[10px] bg-[#efe8da]/50 px-3.5 py-3 text-[16px] ring-1 ring-[#161616]/15">
          {d.event.filter((e) => e.id_cabang === ev.id_cabang).map((e) => (
            <option key={e.id_event} value={e.id_event}>{e.nama_event}</option>
          ))}
        </select>
        <div className="mt-3 space-y-2">
          {rows.length === 0 && <p className={`${MONO} text-[11px]`}>Belum ada tiket di event ini.</p>}
          {rows.map((p) => {
            const done = d.absen.some((a) => a.id_event === ev.id_event && a.id_peserta === p.id_peserta)
            return (
              <button key={p.id_peserta} type="button" disabled={done} onClick={() => scan(p.id_peserta, p.email)} className={`${MONO} flex w-full items-center justify-between rounded-[10px] bg-[#efe8da]/60 px-3 py-2.5 text-left text-[12px] font-bold ring-1 ring-[#161616]/15 disabled:opacity-50 ${PRESS}`}>
                <span className="truncate">{p.nama}</span>
                <span className={`${LABEL} shrink-0 text-[9.5px]`}>{done ? 'Hadir' : 'Scan'}</span>
              </button>
            )
          })}
        </div>
        {msg && <p role="status" className={`${MONO} mt-3 text-[12px] font-bold`}>{msg}</p>}
      </div>
    </section>
  )
}
