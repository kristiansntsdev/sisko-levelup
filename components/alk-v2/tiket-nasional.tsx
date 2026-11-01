'use client'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  approveTiketNasional,
  rejectTiketNasional,
  type TiketNasionalPending,
} from '@/lib/actions/registrasi'
import { ANTON, ERROR, IconButton, MONO, PANEL, PaperHeader, PaperMain } from '@/components/pwa/paper-ui'
import { ALK_BASE, Decide, Empty, Note, PersonChip, Toast } from './ui'

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
    <PaperMain>
      <PaperHeader
        sticker={`${list.length} menunggu approval nasional`}
        title="Tiket Event Nasional"
        leading={<IconButton icon="chevronLeft" label="Kembali" onClick={() => router.push(ALK_BASE)} className="-rotate-3" />}
      />
      <div className="px-5 mt-5 space-y-3 pb-4">
        {error ? (
          <p role="alert" className={`${ERROR} px-1`}>{error}</p>
        ) : null}
        {list.length === 0 ? (
          <Empty>Tidak ada pengajuan.</Empty>
        ) : (
          list.map((u) => (
            <div key={u.id_registrasi} className={`p-3.5 space-y-3 ${PANEL}`}>
              <div className="flex items-center gap-3">
                <PersonChip />
                <div className="flex-1 min-w-0">
                  <p className={`${ANTON} text-[16px] leading-tight tracking-[.02em] truncate`}>{u.nama}</p>
                  <p className={`${MONO} mt-0.5 text-[10.5px] font-bold text-[#44403c]`}>
                    {u.usercode} · {u.level}
                  </p>
                </div>
              </div>
              <div className={`${MONO} text-[12px] leading-snug space-y-0.5`}>
                <p className="font-bold">{u.eventName}</p>
                <p className="text-[#44403c]">
                  {u.tglDisplay}
                  {u.kotaNama !== '—' ? ` · ${u.kotaNama}` : ''}
                </p>
              </div>
              <Decide
                approve={pending && busyId === u.id_registrasi ? '...' : 'Approve'}
                reject="Tolak"
                disabled={pending && busyId === u.id_registrasi}
                onApprove={() => handleApprove(u)}
                onReject={() => handleReject(u)}
              />
            </div>
          ))
        )}
        <Note tone="sky">
          Hanya <b>Sekretariat Nasional</b> yang bisa menyetujui tiket event nasional. Tolak
          melepas kuota; peserta bisa mengajukan ulang.
        </Note>
      </div>
      <Toast msg={toast} />
    </PaperMain>
  )
}
