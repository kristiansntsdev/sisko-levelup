'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { approveSquad } from '@/lib/actions/upgrade'

// ponytail: membership approval baru sampai squad (userlevel 2). Core (3) belum.

type Item = { id_upgrade: number; nama: string; usercode: string }

export function ApprovalClient({ items }: { items: Item[] }) {
  const router = useRouter()
  const [list, setList] = useState(items)
  const [pendingId, setPendingId] = useState<number | null>(null)
  const [pending, startTransition] = useTransition()

  function handleApprove(id: number) {
    setPendingId(id)
    startTransition(async () => {
      const res = await approveSquad(id)
      if (res.ok) setList((prev) => prev.filter((i) => i.id_upgrade !== id))
      setPendingId(null)
    })
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-10 bg-surface/90 backdrop-blur border-b border-border">
        <div className="max-w-[480px] mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/kota/alk')}
            className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-fg"
            aria-label="Kembali"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div>
            <h1 className="text-[17px] font-bold text-fg leading-tight">Approval Member</h1>
            <p className="text-[12px] text-muted">{list.length} menunggu approve squad</p>
          </div>
        </div>
      </header>

      <div className="max-w-[480px] mx-auto px-4 py-4 flex flex-col gap-2.5 pb-10">
        {list.length === 0 ? (
          <div className="bg-surface border border-border rounded-card px-4 py-8 flex flex-col items-center">
            <p className="text-[13px] text-muted">Tidak ada pengajuan.</p>
          </div>
        ) : (
          list.map((item) => (
            <div
              key={item.id_upgrade}
              className="bg-surface border border-border rounded-card px-4 py-3.5 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-fg truncate">{item.nama}</p>
                <p className="text-[12px] text-muted mt-0.5">{item.usercode}</p>
              </div>
              <button
                onClick={() => handleApprove(item.id_upgrade)}
                disabled={pending && pendingId === item.id_upgrade}
                className="shrink-0 px-3.5 py-2 bg-accent text-white rounded-full text-[13px] font-semibold disabled:opacity-50"
              >
                {pending && pendingId === item.id_upgrade ? '...' : 'Approve'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
