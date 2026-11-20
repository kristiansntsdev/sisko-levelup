/* eslint-disable */
// GENERATED from components/pwa/pengumuman.tsx by scripts/gen-demo-preview.mjs — do not edit; change the source or the generator and re-run.
'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getPengumumanSaya } from '@/components/demo-preview/shim/actions/pengumuman-saya'
import type { PengumumanAnggota } from '@/lib/push/pengumuman'
import { ANTON, BackBar, BTN, Chip, IconButton, LABEL, LIFTED, MONO, PANEL, PaperHeader, PaperMain, PRESS, Strip } from '@/components/pwa/paper-ui'
import { Icon, Sheet } from '@/components/pwa/ui'
import { useDibaca } from '@/components/pwa/pengumuman-dibaca'

const detailHref = (id: number) => `/demo-preview/dashboard/pengumuman/${id}`

function TandaiSemua({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${LABEL} shrink-0 rounded-full bg-[#e02a2f]/10 text-[#c21f24] px-3 py-1.5 text-[9.5px] font-bold ${PRESS}`}
    >
      Tandai dibaca
    </button>
  )
}

/** Satu baris pengumuman: belum dibaca = latar kuning tipis + titik merah. */
function Baris({ p, belum, onOpen }: { p: PengumumanAnggota; belum: boolean; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className={`w-full flex items-start gap-3 px-5 py-3.5 text-left transition ${belum ? 'bg-[#ffd83d]/20' : ''}`}>
      <Chip name="megaphone" className={belum ? 'bg-[#e02a2f] text-white' : 'bg-[#161616]/[.07]'} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className={`${LABEL} min-w-0 truncate text-[9px] text-[#57534e]`}>{p.waktu}</span>
          {p.baru && <span className={`${LABEL} shrink-0 -rotate-3 bg-[#161616] text-[#ffd83d] px-1.5 py-0.5 text-[8px] font-bold`}>Baru</span>}
        </span>
        <span className="mt-1 flex items-start gap-1.5">
          {belum && <span aria-label="Belum dibaca" className="mt-[7px] w-2 h-2 shrink-0 rounded-full bg-[#e02a2f]" />}
          <span className={`${ANTON} text-[16px] leading-tight tracking-[.02em] break-words ${belum ? 'text-[#161616]' : 'text-[#44403c]'}`}>{p.judul}</span>
        </span>
        <span className={`${MONO} block mt-1 text-[12px] leading-snug text-[#57534e] line-clamp-2 break-words`}>{p.isi}</span>
      </span>
      {p.gambar && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.gambar} alt="" loading="lazy" className="w-12 h-12 shrink-0 rounded-[8px] object-cover bg-[#d6d0c4]" />
      )}
    </button>
  )
}

/**
 * Lonceng Beranda: angka belum dibaca + modal daftar pengumuman (seperti pphtgd).
 * Ketuk satu pengumuman = ditandai dibaca lalu dibuka; "Tandai dibaca" menandai semuanya.
 */
export function PengumumanBell() {
  const router = useRouter()
  const [data, setData] = useState<{ pembaca: string; items: PengumumanAnggota[] } | null>(null)
  const [open, setOpen] = useState(false)
  const { siap, dibaca, tandai } = useDibaca(data?.pembaca ?? null)

  useEffect(() => {
    let batal = false
    const muat = () => {
      getPengumumanSaya()
        .then((d) => {
          if (!batal) setData(d)
        })
        .catch(() => {})
    }
    muat()
    // Pengumuman baru bisa datang saat app di latar belakang: muat ulang saat app tampil lagi.
    const saatTampil = () => {
      if (document.visibilityState === 'visible') muat()
    }
    document.addEventListener('visibilitychange', saatTampil)
    // Push masuk saat app terbuka (service worker mengirim 'push-received'): angka lonceng langsung bertambah.
    const saatPush = (e: MessageEvent) => {
      if ((e.data as { type?: string } | null)?.type === 'push-received') muat()
    }
    const sw = 'serviceWorker' in navigator ? navigator.serviceWorker : null
    sw?.addEventListener('message', saatPush)
    return () => {
      batal = true
      document.removeEventListener('visibilitychange', saatTampil)
      sw?.removeEventListener('message', saatPush)
    }
  }, [])

  const items = data?.items ?? []
  const belum = siap ? items.filter((p) => !dibaca.has(p.id)) : []

  return (
    <>
      <span className="relative">
        <IconButton icon="bell" label={belum.length ? `Pengumuman, ${belum.length} belum dibaca` : 'Pengumuman'} onClick={() => setOpen(true)} />
        {belum.length > 0 && (
          <span
            aria-hidden
            className={`${MONO} pointer-events-none absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-[#e02a2f] text-white text-[10.5px] font-bold flex items-center justify-center ring-2 ring-[#efe8da]`}
          >
            {belum.length > 9 ? '9+' : belum.length}
          </span>
        )}
      </span>

      <Sheet open={open} onClose={() => setOpen(false)}>
        <div className="sticky -top-5 z-10 -mx-5 -mt-5 px-5 pt-5 pb-3 bg-white border-b-2 border-dotted border-[#161616]/20 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={`${ANTON} text-[24px] leading-none tracking-[.01em] text-[#161616]`}>Pengumuman</p>
            <p className={`${MONO} mt-1.5 text-[11.5px] text-[#57534e]`}>
              {belum.length > 0 && <b className="text-[#c21f24]">{belum.length} belum dibaca · </b>}
            </p>
          </div>
          {belum.length > 0 && <TandaiSemua onClick={() => tandai(belum.map((p) => p.id))} />}
        </div>
        <div className="-mx-5 divide-y-2 divide-dotted divide-[#161616]/15">
          {items.length === 0 ? (
            <p className={`${MONO} px-5 py-10 text-center text-[12.5px] text-[#57534e]`}>Belum ada pengumuman</p>
          ) : (
            items.map((p) => (
              <Baris
                key={p.id}
                p={p}
                belum={siap && !dibaca.has(p.id)}
                onOpen={() => {
                  tandai([p.id])
                  setOpen(false)
                  router.push(detailHref(p.id))
                }}
              />
            ))
          )}
        </div>
        {items.length > 0 && (
          <Link
            href="/demo-preview/dashboard/pengumuman"
            onClick={() => setOpen(false)}
            className={`${LABEL} mt-4 block text-center text-[10.5px] font-bold text-[#161616] underline underline-offset-4 decoration-dotted`}
          >
            Lihat semua pengumuman
          </Link>
        )}
      </Sheet>
    </>
  )
}

export function PengumumanListView({ items, pembaca }: { items: PengumumanAnggota[]; pembaca: string }) {
  const router = useRouter()
  const { siap, dibaca, tandai } = useDibaca(pembaca)
  const belum = siap ? items.filter((p) => !dibaca.has(p.id)) : []
  return (
    <PaperMain>
      <PaperHeader
        sticker={belum.length ? `${belum.length} belum dibaca` : 'Kabar dari LevelUP'}
        title="Pengumuman"
        leading={<IconButton icon="chevronLeft" label="Kembali" onClick={() => router.push('/demo-preview/dashboard')} className="-rotate-3" />}
        action={belum.length > 0 ? <TandaiSemua onClick={() => tandai(belum.map((p) => p.id))} /> : undefined}
      />
      <div className="px-5 mt-5 pb-6">
        {items.length === 0 ? (
          <p className={`${LABEL} rounded-[14px] border-2 border-dotted border-[#161616]/30 text-center text-[11px] text-[#57534e] py-10 px-4`}>
            Belum ada pengumuman untukmu
          </p>
        ) : (
          <div className={`${PANEL} overflow-hidden divide-y-2 divide-dotted divide-[#161616]/15`}>
            {items.map((p) => (
              <Baris
                key={p.id}
                p={p}
                belum={siap && !dibaca.has(p.id)}
                onOpen={() => {
                  tandai([p.id])
                  router.push(detailHref(p.id))
                }}
              />
            ))}
          </div>
        )}
      </div>
    </PaperMain>
  )
}

export function PengumumanDetailView({ item, pembaca }: { item: PengumumanAnggota | null; pembaca: string }) {
  const router = useRouter()
  const { tandai } = useDibaca(pembaca)
  // Dibuka dari tap notifikasi / link langsung: tetap dihitung sudah dibaca.
  useEffect(() => {
    if (item) tandai([item.id])
  }, [item, tandai])

  return (
    <PaperMain>
      <BackBar title="Pengumuman" onBack={() => router.push('/demo-preview/dashboard/pengumuman')} />
      {!item ? (
        <div className="px-5 mt-6">
          <p className={`${LABEL} rounded-[14px] border-2 border-dotted border-[#161616]/30 text-center text-[11px] text-[#57534e] py-10 px-4`}>
            Pengumuman tidak ditemukan
          </p>
        </div>
      ) : (
        <article className="pb-8">
          {item.gambar && (
            <figure className={`relative mx-4 mt-5 p-1.5 rounded-[6px] bg-[#fffdf7] -rotate-[.6deg] ${LIFTED}`}>
              <span aria-hidden className="absolute z-10 -top-2.5 left-1/2 -translate-x-1/2 -rotate-3 w-20 h-5 bg-[#ffd83d]/85" />
              {/* eslint-disable-next-line @next/next/no-img-element -- gambar utuh, tanpa crop */}
              <img src={item.gambar} alt="" className="w-full h-auto block bg-[#d6d0c4]" />
            </figure>
          )}
          <div className="px-5 pt-5 space-y-4">
            <p className={`${LABEL} text-[10px] font-bold text-[#57534e]`}>{item.waktu} WIB</p>
            <h1 className={`${ANTON} text-[32px] leading-[1.05] tracking-[.01em] break-words`}>{item.judul}</h1>
            <section className={`${PANEL} p-4`}>
              <p className={`${MONO} text-[14px] leading-relaxed whitespace-pre-line break-words`}>{item.isi}</p>
            </section>
            <p className={`${MONO} flex items-center gap-2 text-[11.5px] text-[#57534e]`}>
              <Icon name="megaphone" className="w-4 h-4" />
              Dikirim oleh <b className="text-[#161616]">LevelUP Pusat</b>
            </p>
            {item.url && (
              <Link href={item.url} className={BTN}>
                <Strip>
                  <Icon name="link" className="w-5 h-5" />
                  Buka halaman terkait
                </Strip>
              </Link>
            )}
          </div>
        </article>
      )}
    </PaperMain>
  )
}
