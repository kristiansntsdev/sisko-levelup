'use client'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  approvePindahKota,
  rejectPindahKota,
  type PindahKotaPending,
} from '@/lib/actions/pindah-kota'
import { ANTON, BTN, ERROR, IconButton, MONO, PANEL, PaperHeader, PaperMain, Strip } from '@/components/pwa/paper-ui'
import { ALK_BASE, Decide, Empty, FLD, Field, Note, PersonChip, Sheet, SheetHead, Toast } from './ui'

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
    <PaperMain>
      <PaperHeader
        sticker={`${list.length} menunggu approval nasional`}
        title="Pindah LevelUP Kota"
        leading={<IconButton icon="chevronLeft" label="Kembali" onClick={() => router.push(ALK_BASE)} className="-rotate-3" />}
      />
      <div className="px-5 mt-5 space-y-3 pb-4">
        {error && !rejectTarget ? (
          <p role="alert" className={`${ERROR} px-1`}>{error}</p>
        ) : null}
        {list.length === 0 ? (
          <Empty>Tidak ada pengajuan.</Empty>
        ) : (
          list.map((u) => (
            <div key={u.id_pindah} className={`p-3.5 space-y-3 ${PANEL}`}>
              <div className="flex items-center gap-3">
                <PersonChip />
                <div className="flex-1 min-w-0">
                  <p className={`${ANTON} text-[16px] leading-tight tracking-[.02em] truncate`}>{u.nama}</p>
                  <p className={`${MONO} mt-0.5 text-[10.5px] font-bold text-[#44403c]`}>{u.usercode}</p>
                </div>
              </div>
              <p className={`${MONO} text-[12px] leading-snug font-bold`}>
                {u.dariNama}
                {' → '}
                <span className="text-[#c21f24]">{u.keNama}</span>
              </p>
              {u.catatan ? <p className={`${MONO} text-[11px] text-[#44403c] break-words`}>Catatan: {u.catatan}</p> : null}
              <Decide
                approve={pending && busyId === u.id_pindah ? '...' : 'Approve'}
                reject="Tolak"
                disabled={pending && busyId === u.id_pindah}
                onApprove={() => handleApprove(u)}
                onReject={() => openReject(u)}
              />
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
        <Field label="Alasan">
          <textarea
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            rows={4}
            placeholder="Alasan penolakan…"
            className={`${FLD} resize-none`}
          />
        </Field>
        {error ? <p role="alert" className={`${ERROR} mt-2`}>{error}</p> : null}
        <button type="button" disabled={pending} onClick={handleReject} className={`mt-4 ${BTN}`}>
          <Strip>{pending ? '...' : 'Tolak pengajuan'}</Strip>
        </button>
      </Sheet>
      <Toast msg={toast} />
    </PaperMain>
  )
}
