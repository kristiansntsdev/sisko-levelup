'use client'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { approveSquad } from '@/lib/actions/upgrade'
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

type Item = { id_upgrade: number; nama: string; usercode: string }

export function ApprovalV2Client({ items, namaCabang }: { items: Item[]; namaCabang: string }) {
  const router = useRouter()
  const [list, setList] = useState(items)
  const [pendingId, setPendingId] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function handleApprove(id: number, nama: string) {
    setPendingId(id)
    start(async () => {
      const res = await approveSquad(id)
      if (res.ok) {
        setList((prev) => prev.filter((i) => i.id_upgrade !== id))
        setToast(`${nama} sekarang Squad`)
        setTimeout(() => setToast(null), 2200)
      }
      setPendingId(null)
    })
  }

  return (
    <section>
      <Hero className="pt-4 md:pt-2 pb-20 rounded-b-[32px]" decor="-right-6 top-14 w-40">
        <TopBar title="Approval Member" back={() => router.push(ALK_BASE)} />
        <p className="text-center text-sm text-white/80 mt-2">{list.length} menunggu approve squad</p>
      </Hero>
      <div className="px-5 -mt-12 relative space-y-3 pb-4">
        {list.length === 0 ? (
          <div className={`${LIFT} px-4 py-10 text-center`}>
            <TintIcon name="check" tint="gold" size="w-12 h-12 mx-auto rounded-2xl" icon="w-6 h-6" />
            <p className="text-[13.5px] text-slate-500 mt-3">Tidak ada pengajuan.</p>
          </div>
        ) : (
          list.map((u, i) => (
            <div key={u.id_upgrade} className={`${i === 0 ? LIFT : CARD} p-3.5 flex items-center gap-3`}>
              <span className="w-11 h-11 rounded-full overflow-hidden shrink-0">
                <Avatar g="L" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[14.5px] text-[#3b1417] truncate">{u.nama}</p>
                <p className={`text-[12px] text-[#96792a] font-semibold ${fCard} tracking-wider`}>
                  {u.usercode} · VOLUNTEER → SQUAD
                </p>
              </div>
              <button
                type="button"
                disabled={pending && pendingId === u.id_upgrade}
                onClick={() => handleApprove(u.id_upgrade, u.nama)}
                className="shrink-0 px-4 py-2 rounded-xl bg-[#c9232c] text-white text-[13px] font-bold shadow-[0_6px_14px_-6px_rgba(201,35,44,.7)] active:scale-95 transition disabled:opacity-50"
              >
                {pending && pendingId === u.id_upgrade ? '...' : 'Approve'}
              </button>
            </div>
          ))
        )}
        <Note tone="sky">
          Hanya pengajuan yang memilih <b>{namaCabang}</b> yang tampil di sini. Peserta bisa memindahkan pengajuannya ke kota lain selama belum di-approve.
        </Note>
      </div>
      <Toast msg={toast} />
    </section>
  )
}
