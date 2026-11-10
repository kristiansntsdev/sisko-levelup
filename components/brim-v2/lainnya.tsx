'use client'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { logoutPengurus } from '@/app/admin/actions'
import { ANTON, MONO, PANEL, PaperHeader, PaperMain, PRESS, ROWS } from '@/components/pwa/paper-ui'
import { BlackStrip, Icon, Row } from '@/components/alk-v2/ui'
import { BRIM_DANA_BASE, BRIM_LEGACY } from './paths'

export function LainnyaClient({ nama, username }: { nama: string; username: string }) {
  const router = useRouter()
  const [pending, startLogout] = useTransition()
  return (
    <PaperMain>
      <PaperHeader sticker={`BRIM · ${nama}`} title="Lainnya" />
      <div className="px-5 mt-5 space-y-4 pb-4">
        <div className={`${PANEL} ${ROWS} overflow-hidden`}>
          <Row icon="receipt" tint="red" title="Pengajuan Dana" sub="Review dana kota sebelum dikirim ke Korwil" onClick={() => router.push(BRIM_DANA_BASE)} />
          <Row icon="image" tint="gold" title="Flyer Generator" sub="Buat pamflet acara dalam hitungan detik" onClick={() => router.push(`${BRIM_LEGACY}/pamflet`)} />
          <Row icon="image" title="Flyer WW JFE serentak" sub="Template pusat WFE per bulan" onClick={() => router.push(`${BRIM_LEGACY}/wfe-flyer`)} />
          <Row icon="link" tint="slate" title="Dokumentasi Kota" sub="Link Drive & akses anggota per event" onClick={() => router.push(`${BRIM_LEGACY}/dokumentasi`)} />
          <Row icon="edit" tint="slate" title="Pengaturan Logo" sub="Logo untuk elemen flyer (dashboard lama)" onClick={() => router.push(BRIM_LEGACY)} />
        </div>
        <BlackStrip icon="card" title="Beralih ke Kartu Saya" sub="Kartu anggota & tiket pribadi" onClick={() => router.push('/dashboard')} />
        <button
          type="button"
          disabled={pending}
          onClick={() => startLogout(async () => { await logoutPengurus() })}
          className={`w-full px-4 py-3 flex items-center gap-3 text-left disabled:opacity-50 ${PANEL} ${PRESS}`}
        >
          <span className="w-9 h-9 shrink-0 rounded-[10px] -rotate-3 ring-2 ring-[#c21f24] text-[#c21f24] flex items-center justify-center">
            <Icon name="logout" className="w-[18px] h-[18px]" />
          </span>
          <span className={`${ANTON} flex-1 text-[16px] tracking-[.02em] text-[#c21f24]`}>Keluar dari akun pengurus</span>
        </button>
        <p className={`${MONO} text-center text-[11px] text-[#57534e] break-words`}>LevelUP BRIM Nasional · {username}</p>
      </div>
    </PaperMain>
  )
}
