'use client'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  approvePindahKota,
  rejectPindahKota,
  type PindahKotaPending,
} from '@/lib/actions/pindah-kota'
import {
  ALK_BASE,
  Avatar,
  CARD,
  FLD,
  Hero,
  LIFT,
  Note,
  Sheet,
  SheetHead,
  TintIcon,
  Toast,
  TopBar,
  fCard,
} from './ui'

export function PindahKotaV2Client({ items }: { items: PindahKotaPending[] }) {
  const router = useRouter()
  const [list, setList] = useState(items)
  const [rejectTarget, setRejectTarget] = useState<PindahKotaPending | null>(null)
  const [alasan, setAlasan] = useState('')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function flash(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  function handleApprove(item: PindahKotaPending) {
    setError('')
    setBusyId(item.id_pindah)
    start(async () => {
      const res = await approvePindahKota(item.id_pindah)
      if (!res.ok) {
        setError(res.error)
        setBusyId(null)
        return
      }
      setList((prev) => prev.filter((i) => i.id_pindah !== item.id_pindah))
      setBusyId(null)
      flash(`${item.nama} → ${item.keNama}`)
      router.refresh()
    })
  }

  function openReject(item: PindahKotaPending) {
    setRejectTarget(item)
    setAlasan('')
    setError('')
  }

  function handleReject() {
    if (!rejectTarget) return
    if (!alasan.trim()) {
      setError('Alasan reject wajib diisi')
      return
    }
    setBusyId(rejectTarget.id_pindah)
    start(async () => {
      const res = await rejectPindahKota(rejectTarget.id_pindah, alasan)
      if (!res.ok) {
        setError(res.error)
        setBusyId(null)
        return
      }
      const nama = rejectTarget.nama
      setList((prev) => prev.filter((i) => i.id_pindah !== rejectTarget.id_pindah))
      setRejectTarget(null)
      setBusyId(null)
      flash(`Ditolak: ${nama}`)
      router.refresh()
    })
  }

  return (
    <section>
      <Hero className="pt-4 md:pt-2 pb-20 rounded-b-[32px]" decor="-right-6 top-14 w-40">
        <TopBar title="Pindah LevelUP Kota" back={() => router.push(ALK_BASE)} />
        <p className="text-center text-sm text-white/80 mt-2">
          {list.length} menunggu approval nasional
        </p>
      </Hero>
      <div className="px-5 -mt-12 relative space-y-3 pb-4">
        {error && !rejectTarget ? (
          <p className="text-[13px] text-[#c9232c] font-semibold px-1">{error}</p>
        ) : null}
        {list.length === 0 ? (
          <div className={`${LIFT} px-4 py-10 text-center`}>
            <TintIcon name="check" tint="gold" size="w-12 h-12 mx-auto rounded-2xl" icon="w-6 h-6" />
            <p className="text-[13.5px] text-slate-500 mt-3">Tidak ada pengajuan.</p>
          </div>
        ) : (
          list.map((u, i) => (
            <div key={u.id_pindah} className={`${i === 0 ? LIFT : CARD} p-3.5 space-y-3`}>
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-full overflow-hidden shrink-0">
                  <Avatar g="L" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[14.5px] text-[#3b1417] truncate">{u.nama}</p>
                  <p className={`text-[12px] text-[#96792a] font-semibold ${fCard} tracking-wider`}>
                    {u.usercode}
                  </p>
                </div>
              </div>
              <p className="text-[13px] text-slate-600 leading-snug">
                <span className="font-semibold text-[#3b1417]">{u.dariNama}</span>
                {' → '}
                <span className="font-semibold text-[#c9232c]">{u.keNama}</span>
              </p>
              {u.catatan ? (
                <p className="text-[12px] text-slate-500">Catatan: {u.catatan}</p>
              ) : null}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pending && busyId === u.id_pindah}
                  onClick={() => handleApprove(u)}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-[13px] font-bold disabled:opacity-50"
                >
                  {pending && busyId === u.id_pindah ? '...' : 'Approve'}
                </button>
                <button
                  type="button"
                  disabled={pending && busyId === u.id_pindah}
                  onClick={() => openReject(u)}
                  className="flex-1 py-2.5 rounded-xl bg-[#c9232c] text-white text-[13px] font-bold disabled:opacity-50"
                >
                  Tolak
                </button>
              </div>
            </div>
          ))
        )}
        <Note tone="sky">
          Hanya <b>Sekretariat Nasional</b> yang bisa menyetujui atau menolak pindah LevelUP Kota.
          Kota anggota baru berubah setelah Approve.
        </Note>
      </div>

      <Sheet
        open={!!rejectTarget}
        onClose={() => {
          if (pending) return
          setRejectTarget(null)
          setError('')
        }}
      >
        <SheetHead
          title="Tolak pengajuan"
          sub={rejectTarget ? `${rejectTarget.nama} → ${rejectTarget.keNama}` : undefined}
        />
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold text-[#3b1417]">Alasan</span>
          <textarea
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            rows={4}
            placeholder="Alasan penolakan…"
            className={`${FLD} resize-none`}
          />
        </label>
        {error ? <p className="mt-2 text-[13px] text-[#c9232c] font-semibold">{error}</p> : null}
        <button
          type="button"
          disabled={pending}
          onClick={handleReject}
          className="mt-4 w-full py-3.5 rounded-2xl bg-[#c9232c] text-white font-bold disabled:opacity-50"
        >
          {pending ? '...' : 'Tolak pengajuan'}
        </button>
      </Sheet>
      <Toast msg={toast} />
    </section>
  )
}
