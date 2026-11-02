/* eslint-disable */
// GENERATED from components/alk-v2/approval.tsx by scripts/gen-demo-preview.mjs — do not edit; change the source or the generator and re-run.
'use client'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { approveSquad, approveVolunteer } from '@/components/demo-preview/shim/actions/upgrade'
import { ANTON, BTN_SHELL, IconButton, MONO, PANEL, PaperHeader, PaperMain, Strip } from '@/components/pwa/paper-ui'
import { ALK_BASE, Empty, Note, PersonChip, Toast } from './ui'

type Item = { id_upgrade: number; nama: string; usercode: string }

export function ApprovalV2Client({ items, namaCabang, kind = 'squad' }: { items: Item[]; namaCabang: string; kind?: 'squad' | 'volunteer' }) {
  const router = useRouter()
  const [list, setList] = useState(items)
  const [pendingId, setPendingId] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function handleApprove(id: number, nama: string) {
    setPendingId(id)
    start(async () => {
      const res = kind === 'volunteer' ? await approveVolunteer(id) : await approveSquad(id)
      if (res.ok) {
        setList((prev) => prev.filter((i) => i.id_upgrade !== id))
        setToast(`${nama} sekarang ${kind === 'volunteer' ? 'Volunteer' : 'Squad'}`)
        setTimeout(() => setToast(null), 2200)
      }
      setPendingId(null)
    })
  }

  return (
    <PaperMain>
      <PaperHeader
        sticker={`${list.length} menunggu approve ${kind}`}
        title={kind === 'volunteer' ? 'Approval Volunteer' : 'Approval Member'}
        leading={<IconButton icon="chevronLeft" label="Kembali" onClick={() => router.push(ALK_BASE)} className="-rotate-3" />}
      />
      <div className="px-5 mt-5 space-y-3 pb-4">
        {list.length === 0 ? (
          <Empty>Tidak ada pengajuan.</Empty>
        ) : (
          list.map((u) => (
            <div key={u.id_upgrade} className={`p-3.5 flex items-center gap-3 ${PANEL}`}>
              <PersonChip />
              <div className="flex-1 min-w-0">
                <p className={`${ANTON} text-[16px] leading-tight tracking-[.02em] truncate`}>{u.nama}</p>
                <p className={`${MONO} mt-0.5 text-[10.5px] font-bold text-[#44403c]`}>
                  {u.usercode} · {kind === 'volunteer' ? 'TAMU → VOLUNTEER' : 'VOLUNTEER → SQUAD'}
                </p>
              </div>
              <button
                type="button"
                disabled={pending && pendingId === u.id_upgrade}
                onClick={() => handleApprove(u.id_upgrade, u.nama)}
                className={`shrink-0 ${BTN_SHELL}`}
              >
                <Strip tone="ink" className="px-3.5 py-2 text-[15px]">
                  {pending && pendingId === u.id_upgrade ? '...' : 'Approve'}
                </Strip>
              </button>
            </div>
          ))
        )}
        <Note tone="sky">
          Hanya pengajuan yang memilih <b>{namaCabang}</b> yang tampil di sini. Peserta bisa memindahkan pengajuannya ke kota lain selama belum di-approve.
        </Note>
      </div>
      <Toast msg={toast} />
    </PaperMain>
  )
}
