'use client'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { logoutPengurus } from '@/app/admin/actions'
import {
  ALK_BASE,
  Avatar,
  CARD,
  Hero,
  Icon,
  LIFT,
  Pill,
  Row,
  Sheet,
  SheetHead,
  TintIcon,
  Toast,
} from './ui'

export function LainnyaClient({
  nama,
  namaCabang,
  username,
}: {
  nama: string
  namaCabang: string
  username: string
}) {
  const router = useRouter()
  const [soon, setSoon] = useState<string | null>(null)
  const [regOpen, setRegOpen] = useState(false)
  const [pending, startLogout] = useTransition()
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const regLink = `${origin}/daftar`

  function flash(msg: string) {
    setSoon(msg)
    setTimeout(() => setSoon(null), 2200)
  }

  return (
    <section>
      <Hero className="pt-6 md:pt-4 pb-24 rounded-b-[32px]">
        <div className="flex items-center gap-4">
          <span className="w-16 h-16 shrink-0 rounded-full overflow-hidden ring-4 ring-white/30">
            <Avatar g="L" />
          </span>
          <div className="min-w-0">
            <p className="font-extrabold text-lg truncate">{namaCabang}</p>
            <p className="text-[13px] text-white/80 truncate">Sekretariat · {nama}</p>
          </div>
        </div>
      </Hero>
      <div className="px-5 -mt-16 relative space-y-4 pb-4">
        <div className={`${LIFT} divide-y divide-slate-100 overflow-hidden`}>
          <Row
            icon="box"
            title="Nama PIC"
            sub="Alokasi stok & klaim"
            right={<Pill tone="gold">Segera</Pill>}
            onClick={() => flash('Alokasi stok & klaim')}
          />
          <Row
            icon="receipt"
            title="ALK"
            sub="Status dana per kegiatan"
            right={<Pill tone="gold">Segera</Pill>}
            onClick={() => flash('Status dana per kegiatan')}
          />
          <Row icon="link" title="VOL" sub="Pendaftaran anggota baru" onClick={() => setRegOpen(true)} />
          <Row
            icon="chat"
            title="Pengaduan ke Pusat"
            sub="Laporkan kendala ke admin pusat"
            right={<Pill tone="gold">Segera</Pill>}
            onClick={() => flash('Pengaduan ke Pusat')}
          />
        </div>
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className={`w-full flex items-center gap-3 p-4 ${CARD} text-left`}
        >
          <TintIcon name="card" tint="red" />
          <span className="flex-1">
            <span className="block font-bold text-[15px] text-[#3b1417]">Beralih ke Kartu Saya</span>
            <span className="block text-[12px] text-slate-500">Kartu anggota &amp; tiket pribadi</span>
          </span>
          <Icon name="chevron" className="w-5 h-5 text-slate-300" sw={2} />
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => startLogout(async () => { await logoutPengurus() })}
          className={`w-full py-3.5 ${CARD} text-rose-600 font-semibold flex items-center justify-center gap-2 disabled:opacity-50`}
        >
          <Icon name="logout" className="w-5 h-5" sw={2} />
          Keluar dari akun pengurus
        </button>
        <p className="text-center text-[11px] text-slate-400">LevelUP Sekretariat · {username}</p>
      </div>

      <Sheet open={regOpen} onClose={() => setRegOpen(false)}>
        <SheetHead title="Link Pendaftaran" sub="Bagikan ke calon anggota baru" />
        <p className="text-[13px] text-slate-600 break-all bg-slate-50 rounded-xl p-3 ring-1 ring-slate-200">{regLink || `${ALK_BASE}`}</p>
        <button
          type="button"
          className="mt-4 w-full py-3 rounded-2xl bg-[#c9232c] text-white font-bold"
          onClick={() => {
            void navigator.clipboard?.writeText(regLink)
            setRegOpen(false)
            flash('Link disalin')
          }}
        >
          Salin Link
        </button>
      </Sheet>
      <Toast msg={soon ? (soon.startsWith('Link') ? soon : `Fitur belum tersedia: ${soon}`) : null} />
    </section>
  )
}
