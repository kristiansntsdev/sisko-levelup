import { cookies } from 'next/headers'
import { connection } from 'next/server'
import { likedIdsBy, listArtikelTerbit } from '@/lib/artikel-data'
import { LABEL, PaperHeader, PaperMain } from '@/components/pwa/paper-ui'
import { ArtikelRow } from '@/components/pwa/artikel-row'

export default async function DashboardArtikelPage() {
  await connection()
  const artikel = await listArtikelTerbit()
  const visitor = (await cookies()).get('lup_vid')?.value
  const liked = await likedIdsBy(artikel.map((a) => a.id), visitor)
  return (
    <PaperMain>
      <PaperHeader sticker="Baca dulu" title="Artikel" />
      <div className="px-5 mt-5">
        {artikel.length === 0 ? (
          <p className={`${LABEL} rounded-[14px] border-2 border-dotted border-[#161616]/30 text-center text-[11px] text-[#57534e] py-7 px-4`}>
            Belum ada artikel. Tunggu ya!
          </p>
        ) : (
          <div className="space-y-5">
            {artikel.map((a) => (
              <ArtikelRow key={a.id} a={a} liked={liked.has(a.id)} />
            ))}
          </div>
        )}
      </div>
    </PaperMain>
  )
}
