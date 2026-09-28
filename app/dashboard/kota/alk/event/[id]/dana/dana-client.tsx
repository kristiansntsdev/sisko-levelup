'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { submitReimburse, type ReimburseData } from '@/lib/actions/reimburse'

const inputCls =
  'w-full px-3.5 py-3 border-[1.5px] border-border rounded-input text-[15px] bg-surface text-fg outline-none focus:border-accent transition-colors disabled:opacity-60'

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-medium text-muted">{label}</label>
      {children}
    </div>
  )
}

export function DanaClient({
  idEvent,
  namaEvent,
  tglDisplay,
  jumlahPeserta,
  reimburse,
}: {
  idEvent: number
  namaEvent: string
  tglDisplay: string
  jumlahPeserta: number
  reimburse: ReimburseData | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const [ajukan, setAjukan] = useState<'Ajukan' | 'Tidak Ajukan'>(
    reimburse?.ajukan === 'Tidak Ajukan' ? 'Tidak Ajukan' : 'Ajukan',
  )
  const [bukti, setBukti] = useState(reimburse?.bukti ?? '')
  const [laporan, setLaporan] = useState(reimburse?.laporan ?? '')
  const [danausul, setDanausul] = useState(reimburse?.danausul ?? '')
  const [danariil, setDanariil] = useState(reimburse?.danariil ?? '')
  const [norek, setNorek] = useState(reimburse?.norek ?? '')
  const [namabank, setNamabank] = useState(reimburse?.namabank ?? '')
  const [namarek, setNamarek] = useState(reimburse?.namarek ?? '')

  const isApproved = reimburse?.approvenasional === '1'
  const isRejected = reimburse?.approvenasional === '0'
  const backUrl = `/dashboard/kota/alk/event/${idEvent}`

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      try {
        await submitReimburse(idEvent, {
          ajukan,
          bukti,
          laporan,
          danausul,
          danariil,
          norek,
          namabank,
          namarek,
        })
        router.push(backUrl)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal menyimpan. Coba lagi.')
      }
    })
  }

  return (
    <main className="min-h-screen bg-bg pb-10">
      <nav className="sticky top-0 z-10 bg-surface border-b border-border">
        <div className="max-w-[480px] mx-auto px-5 pt-6 pb-4 flex items-center gap-3">
          <Link href={backUrl} className="text-sm text-muted hover:text-fg transition-colors shrink-0">
            ← Kembali
          </Link>
          <p className="text-[14px] font-semibold text-fg flex-1 text-center pr-14">
            Pengajuan Support Dana
          </p>
        </div>
      </nav>

      <form onSubmit={handleSubmit} className="max-w-[480px] mx-auto px-4 pt-5 flex flex-col gap-4">
        <div className="bg-surface border border-border rounded-card px-4 py-3">
          <p className="text-[14px] font-semibold text-fg">{namaEvent}</p>
          <p className="text-[12px] text-muted mt-0.5">{tglDisplay}</p>
        </div>

        {isApproved ? (
          <div className="bg-green-light rounded-[14px] px-4 py-3 text-center">
            <p className="text-[14px] font-semibold text-green-dark">
              Pengajuan sudah disetujui Sekretariat Nasional
            </p>
          </div>
        ) : isRejected && reimburse?.notenasional ? (
          <div className="bg-amber-light border border-border rounded-[14px] px-4 py-3">
            <p className="text-[11px] font-semibold text-amber-dark uppercase tracking-wide">
              Ditolak — alasan
            </p>
            <p className="text-[13px] text-fg mt-1.5 whitespace-pre-wrap">{reimburse.notenasional}</p>
          </div>
        ) : null}

        <div className="bg-surface border border-border rounded-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-[13px] font-semibold text-fg">Form Pengajuan Dana</p>
          </div>
          <div className="px-4 py-4 flex flex-col gap-4">
            <FormField label="Ajukan Support Dana">
              <select
                value={ajukan}
                onChange={(e) => setAjukan(e.target.value as 'Ajukan' | 'Tidak Ajukan')}
                disabled={isApproved}
                className={`${inputCls} appearance-none`}
              >
                <option value="Ajukan">Ajukan</option>
                <option value="Tidak Ajukan">Tidak Ajukan</option>
              </select>
            </FormField>

            <FormField label="Link Dokumentasi">
              <input
                type="text"
                value={bukti}
                onChange={(e) => setBukti(e.target.value)}
                disabled={isApproved}
                placeholder="https://drive.google.com/..."
                className={inputCls}
              />
            </FormField>

            <FormField label="Upload Laporan">
              <input
                type="text"
                value={laporan}
                onChange={(e) => setLaporan(e.target.value)}
                disabled={isApproved}
                placeholder="https://drive.google.com/..."
                className={inputCls}
              />
            </FormField>

            <FormField label="Jumlah Peserta">
              <p className="text-[15px] text-fg px-0.5 py-1">{jumlahPeserta}</p>
            </FormField>

            <FormField label="Pengajuan Dana">
              <input
                type="number"
                min={0}
                value={danausul}
                onChange={(e) => setDanausul(e.target.value)}
                disabled={isApproved}
                placeholder="0"
                className={inputCls}
              />
            </FormField>

            <FormField label="Penggunaan Dana Riil">
              <input
                type="number"
                min={0}
                value={danariil}
                onChange={(e) => setDanariil(e.target.value)}
                disabled={isApproved}
                placeholder="0"
                className={inputCls}
              />
            </FormField>

            <FormField label="No Rekening">
              <input
                type="text"
                value={norek}
                onChange={(e) => setNorek(e.target.value)}
                disabled={isApproved}
                className={inputCls}
              />
            </FormField>

            <FormField label="Nama Bank">
              <input
                type="text"
                value={namabank}
                onChange={(e) => setNamabank(e.target.value)}
                disabled={isApproved}
                className={inputCls}
              />
            </FormField>

            <FormField label="Atas Nama">
              <input
                type="text"
                value={namarek}
                onChange={(e) => setNamarek(e.target.value)}
                disabled={isApproved}
                className={inputCls}
              />
            </FormField>
          </div>
        </div>

        {error ? <p className="text-[13px] text-red font-medium">{error}</p> : null}

        {!isApproved && (
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-4 bg-accent text-white rounded-btn text-[16px] font-semibold disabled:opacity-60 transition-opacity"
          >
            {isPending ? 'Menyimpan...' : 'Ajukan'}
          </button>
        )}
      </form>
    </main>
  )
}
