'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { PengumumanAnggota } from '@/lib/push/pengumuman'
import { ANTON, BackBar, BTN, Chip, IconButton, LABEL, LIFTED, MONO, PANEL, PaperHeader, PaperMain, PRESS, Strip } from '@/components/pwa/paper-ui'
import { Icon } from '@/components/pwa/ui'

export function PengumumanListView({ items }: { items: PengumumanAnggota[] }) {
  const router = useRouter()
  return (
    <PaperMain>
      <PaperHeader
        sticker="Kabar dari LevelUP"
        title="Pengumuman"
        leading={<IconButton icon="chevronLeft" label="Kembali" onClick={() => router.push('/dashboard')} className="-rotate-3" />}
      />
      <div className="px-5 mt-5 pb-6 space-y-3">
        {items.length === 0 ? (
          <p className={`${LABEL} rounded-[14px] border-2 border-dotted border-[#161616]/30 text-center text-[11px] text-[#57534e] py-10 px-4`}>
            Belum ada pengumuman untukmu
          </p>
        ) : (
          items.map((p) => {
            return (
              <Link key={p.id} href={`/dashboard/pengumuman/${p.id}`} className={`flex gap-3 p-3.5 ${PANEL} ${PRESS}`}>
                {p.gambar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.gambar} alt="" className="w-16 h-16 shrink-0 rounded-[8px] object-cover bg-[#d6d0c4] -rotate-2" />
                ) : (
                  <Chip name="megaphone" className="bg-[#ffd83d] text-[#161616]" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`${LABEL} min-w-0 truncate text-[9.5px] text-[#57534e]`}>{p.waktu}</p>
                    {p.baru && <span className={`${LABEL} shrink-0 -rotate-3 bg-[#e02a2f] text-white px-1.5 py-0.5 text-[8.5px] font-bold`}>Baru</span>}
                  </div>
                  <p className={`${ANTON} mt-1 text-[17px] leading-tight tracking-[.02em] break-words`}>{p.judul}</p>
                  <p className={`${MONO} mt-1 text-[12px] leading-snug text-[#44403c] line-clamp-2 break-words`}>{p.isi}</p>
                </div>
                <Icon name="chevron" className="w-5 h-5 shrink-0 self-center" sw={2} />
              </Link>
            )
          })
        )}
      </div>
    </PaperMain>
  )
}

export function PengumumanDetailView({ item }: { item: PengumumanAnggota | null }) {
  const router = useRouter()
  return (
    <PaperMain>
      <BackBar title="Pengumuman" onBack={() => router.push('/dashboard/pengumuman')} />
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
