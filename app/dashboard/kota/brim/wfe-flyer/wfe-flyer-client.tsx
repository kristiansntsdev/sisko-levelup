'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { saveWfeSerentak, type WfeSerentakRow } from '@/lib/actions/wfe-serentak'

function ymFromIso(iso: string): string {
  return iso.slice(0, 7)
}

function labelRange(row: WfeSerentakRow): string {
  const a = new Date(`${row.bulan_mulai}T00:00:00`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  const b = new Date(`${row.bulan_selesai}T00:00:00`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  return a === b ? a : `${a} – ${b}`
}

export function WfeFlyerClient({ campaigns }: { campaigns: WfeSerentakRow[] }) {
  const router = useRouter()
  const [mulai, setMulai] = useState('')
  const [selesai, setSelesai] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [isPending, startTransition] = useTransition()

  function onFile(f: File | null) {
    setFile(f)
    setPreview(f ? URL.createObjectURL(f) : '')
  }

  return (
    <main className="min-h-screen bg-bg pb-10">
      <div className="max-w-[480px] mx-auto px-4 pt-5 flex flex-col gap-4">
        <Link href="/dashboard/kota/brim" className="text-[13px] text-accent font-medium">
          ← Beranda BRIM
        </Link>
        <div>
          <h1 className="text-[22px] font-bold text-fg">Flyer WW JFE serentak</h1>
          <p className="text-[12px] text-muted mt-0.5">WFE — template pusat. Kota hanya ganti foto pembicara, tanggal, tempat, tema, logo kota.</p>
        </div>

        <form
          className="bg-surface border border-border rounded-card px-4 py-4 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            setErr('')
            setMsg('')
            if (!file) {
              setErr('Unggah flyer pusat')
              return
            }
            startTransition(async () => {
              const res = await saveWfeSerentak(mulai, selesai || mulai, file)
              if (!res.ok) {
                setErr(res.error)
                return
              }
              setMsg('Flyer pusat tersimpan')
              setFile(null)
              setPreview('')
              router.refresh()
            })
          }}
        >
          <label className="flex flex-col gap-1">
            <span className="text-[12px] text-muted">Bulan mulai</span>
            <input
              type="month"
              required
              value={mulai}
              onChange={(e) => setMulai(e.target.value)}
              className="w-full rounded-[12px] border border-border bg-bg px-3 py-2.5 text-[14px] text-fg"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[12px] text-muted">Bulan selesai</span>
            <input
              type="month"
              required
              value={selesai}
              onChange={(e) => setSelesai(e.target.value)}
              className="w-full rounded-[12px] border border-border bg-bg px-3 py-2.5 text-[14px] text-fg"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[12px] text-muted">Flyer pusat</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              className="text-[13px] text-fg file:mr-3 file:px-3 file:py-1.5 file:rounded-full file:border-0 file:bg-accent file:text-white file:text-[13px] file:font-medium"
            />
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Preview flyer pusat" className="mt-2 w-full rounded-[12px] border border-border object-cover" />
            )}
          </label>
          {err && <p className="text-[13px] text-red">{err}</p>}
          {msg && <p className="text-[13px] text-green-dark">{msg}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 bg-accent text-white rounded-btn text-[14px] font-semibold disabled:opacity-60"
          >
            {isPending ? 'Menyimpan...' : 'Simpan template'}
          </button>
        </form>

        {campaigns.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-[13px] font-semibold text-fg">Kampanye tersimpan</p>
            {campaigns.map((c) => (
              <div key={c.id} className="bg-surface border border-border rounded-card overflow-hidden">
                <p className="px-4 py-2 text-[13px] font-medium text-fg">{labelRange(c)}</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.image_url} alt={`Flyer ${labelRange(c)}`} className="w-full object-cover" />
                <button
                  type="button"
                  className="w-full py-2 text-[12px] text-accent font-medium"
                  onClick={() => {
                    setMulai(ymFromIso(c.bulan_mulai))
                    setSelesai(ymFromIso(c.bulan_selesai))
                  }}
                >
                  Pakai periode ini (ganti flyer)
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
