'use client'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  approveTiketNasional,
  rejectTiketNasional,
  type TiketNasionalPending,
} from '@/lib/actions/registrasi'
import {
  ALK_BASE,
  Avatar,
  CARD,
  Hero,
  LIFT,
  Note,
  TintIcon,
  Toast,
  TopBar,
  fCard,
} from './ui'

export function TiketNasionalV2Client({ items }: { items: TiketNasionalPending[] }) {
  const router = useRouter()
  const [list, setList] = useState(items)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function flash(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  function handleApprove(item: TiketNasionalPending) {
    setError('')
    setBusyId(item.id_registrasi)
    start(async () => {
      const res = await approveTiketNasional(item.id_registrasi)
      if (!res.ok) {
        setError(res.error)
        setBusyId(null)
        return
      }
      setList((prev) => prev.filter((i) => i.id_registrasi !== item.id_registrasi))
      setBusyId(null)
      flash(`Disetujui: ${item.nama}`)
      router.refresh()
    })
  }

  function handleReject(item: TiketNasionalPending) {
    setError('')
    setBusyId(item.id_registrasi)
    start(async () => {
      const res = await rejectTiketNasional(item.id_registrasi)
      if (!res.ok) {
        setError(res.error)
        setBusyId(null)
        return
      }
      setList((prev) => prev.filter((i) => i.id_registrasi !== item.id_registrasi))
      setBusyId(null)
      flash(`Ditolak: ${item.nama}`)
      router.refresh()
    })
  }

  return (
    <section>
      <Hero className="pt-4 md:pt-2 pb-20 rounded-b-[32px]" decor="-right-6 top-14 w-40">
        <TopBar title="Tiket Event Nasional" back={() => router.push(ALK_BASE)} />
        <p className="text-center text-sm text-white/80 mt-2">
          {list.length} menunggu approval nasional
        </p>
      </Hero>
      <div className="px-5 -mt-12 relative space-y-3 pb-4">
        {error ? (
          <p className="text-[13px] text-[#c9232c] font-semibold px-1">{error}</p>
        ) : null}
        {list.length === 0 ? (
          <div className={`${LIFT} px-4 py-10 text-center`}>
            <TintIcon name="check" tint="gold" size="w-12 h-12 mx-auto rounded-2xl" icon="w-6 h-6" />
            <p className="text-[13.5px] text-slate-500 mt-3">Tidak ada pengajuan.</p>
          </div>
        ) : (
          list.map((u, i) => (
            <div key={u.id_registrasi} className={`${i === 0 ? LIFT : CARD} p-3.5 space-y-3`}>
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-full overflow-hidden shrink-0">
                  <Avatar g="L" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[14.5px] text-[#3b1417] truncate">{u.nama}</p>
                  <p className={`text-[12px] text-[#96792a] font-semibold ${fCard} tracking-wider`}>
                    {u.usercode} · {u.level}
                  </p>
                </div>
              </div>
              <div className="text-[13px] text-slate-600 leading-snug space-y-0.5">
                <p className="font-semibold text-[#3b1417]">{u.eventName}</p>
                <p>
                  {u.tglDisplay}
                  {u.kotaNama !== '—' ? ` · ${u.kotaNama}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pending && busyId === u.id_registrasi}
                  onClick={() => handleApprove(u)}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-[13px] font-bold disabled:opacity-50"
                >
                  {pending && busyId === u.id_registrasi ? '...' : 'Approve'}
                </button>
                <button
                  type="button"
                  disabled={pending && busyId === u.id_registrasi}
                  onClick={() => handleReject(u)}
                  className="flex-1 py-2.5 rounded-xl bg-[#c9232c] text-white text-[13px] font-bold disabled:opacity-50"
                >
                  Tolak
                </button>
              </div>
            </div>
          ))
        )}
        <Note tone="sky">
          Hanya <b>Sekretariat Nasional</b> yang bisa menyetujui tiket event nasional. Tolak
          melepas kuota; peserta bisa mengajukan ulang.
        </Note>
      </div>
      <Toast msg={toast} />
    </section>
  )
}
