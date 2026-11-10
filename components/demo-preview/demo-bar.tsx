'use client'
// The only chrome that is not in the real app: a slim DEMO tab on the left edge that opens account switch + reset.
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useSyncExternalStore } from 'react'
import { ANTON, LABEL, MONO, PRESS } from '@/components/pwa/paper-ui'
import { Sheet } from '@/components/pwa/ui'
import { logoutAll } from './auth'
import { getDb, isStorageFailing, resetDb, snapshot, subscribe } from './db'
import { readSession } from './shim/session'
import { lompatHari } from './shim/actions/air-hidup'

export function DemoBar() {
  const router = useRouter()
  const db = useSyncExternalStore(subscribe, snapshot, () => null)
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(false)
  if (!db) return null

  const session = readSession()
  const pengurus = db.pengurus.find((p) => p.id_pengurus === db.session.idPengurus)
  const who = pengurus ? `${pengurus.nama} (pengurus)` : session?.user.needsRegistration ? 'Akun Google baru (belum daftar)' : session?.user.name ? `${session.user.name} · ${session.user.email}` : 'Belum masuk'

  function close() {
    setOpen(false)
    setConfirm(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Menu demo"
        className={`${LABEL} print:hidden fixed left-0 top-28 z-[60] -rotate-0 rounded-r-md bg-[#161616]/80 py-2.5 pl-0.5 pr-1 text-[8px] font-bold text-[#ffd83d] [writing-mode:vertical-rl] ${PRESS}`}
      >
        DEMO
      </button>
      <Sheet open={open} onClose={close}>
        <p className={`${ANTON} text-[22px] leading-none`}>Demo LevelUP</p>
        <p className={`${MONO} mt-2 text-[11.5px] leading-relaxed text-[#44403c]`}>
          Semua data tersimpan hanya di browser ini (localStorage). Tidak ada yang dikirim ke server.
        </p>
        <p className={`${LABEL} mt-4 text-[10px] font-bold text-[#57534e]`}>Masuk sebagai</p>
        <p className={`${MONO} text-[13px] font-bold`}>{who}</p>
        {isStorageFailing() && <p className={`${MONO} mt-2 text-[11px] font-bold text-[#c21f24]`}>Penyimpanan browser penuh/diblokir — demo jalan dari memori dan hilang saat reload.</p>}

        <p className={`${LABEL} mt-4 text-[10px] font-bold text-[#57534e]`}>Simulasi waktu Air Hidup · hari ke +{db.air_hari}</p>
        <div className="mt-1.5 grid grid-cols-3 gap-2">
          {[1, 7, 30].map((n) => (
            <button key={n} type="button" onClick={() => void lompatHari(n)} className={`${ANTON} rounded-sm py-2 text-[15px] tracking-[.03em] ring-2 ring-inset ring-[#161616] ${PRESS}`}>
              +{n} hari
            </button>
          ))}
        </div>
        <Link href="/demo-preview/landing" onClick={close} className={`${MONO} mt-2.5 inline-block text-[11.5px] font-bold underline underline-offset-4 decoration-dotted`}>
          Lihat pratinjau landing
        </Link>

        <p className={`${LABEL} mt-4 text-[10px] font-bold text-[#57534e]`}>Aktivitas terakhir</p>
        <ul className="mt-1 max-h-32 space-y-1 overflow-y-auto">
          {getDb().log.slice(0, 8).map((l) => (
            <li key={l.id} className={`${MONO} text-[10.5px] text-[#44403c]`}>
              {new Date(l.at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} · {l.msg}
            </li>
          ))}
        </ul>

        <div className="mt-5 space-y-2.5">
          <button
            type="button"
            onClick={() => {
              logoutAll()
              close()
              router.push('/demo-preview/login')
            }}
            className={`${ANTON} w-full rounded-sm py-3 text-[17px] tracking-[.03em] ring-2 ring-inset ring-[#161616] ${PRESS}`}
          >
            Ganti akun
          </button>
          {!confirm ? (
            <button type="button" onClick={() => setConfirm(true)} className={`${ANTON} w-full rounded-sm py-3 text-[17px] tracking-[.03em] ring-2 ring-inset ring-[#c21f24] text-[#c21f24] ${PRESS}`}>
              Reset semua flow
            </button>
          ) : (
            <div className="space-y-2">
              <p className={`${MONO} text-[11.5px] font-bold text-[#c21f24]`}>Semua data demo kembali ke awal. Lanjutkan?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    resetDb()
                    close()
                    router.push('/demo-preview/login')
                  }}
                  className={`${ANTON} flex-1 rounded-sm bg-[#c21f24] py-3 text-[16px] tracking-[.03em] text-white ${PRESS}`}
                >
                  Ya, reset
                </button>
                <button type="button" onClick={() => setConfirm(false)} className={`${ANTON} flex-1 rounded-sm py-3 text-[16px] tracking-[.03em] ring-2 ring-inset ring-[#161616] ${PRESS}`}>
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>
      </Sheet>
    </>
  )
}
