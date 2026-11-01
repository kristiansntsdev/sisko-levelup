'use client'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { logoutPengurus } from '@/app/admin/actions'
import { BTN, MONO, PANEL, PaperHeader, PaperMain, PRESS, ROWS, Strip, ANTON } from '@/components/pwa/paper-ui'
import { ALK_BASE, BlackStrip, Icon, Row, Sheet, SheetHead, SoonTag, Toast } from './ui'

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
    <PaperMain>
      <PaperHeader sticker={`Sekretariat · ${nama}`} title={namaCabang} />
      <div className="px-5 mt-5 space-y-4 pb-4">
        <div className={`${PANEL} ${ROWS} overflow-hidden`}>
          <Row icon="box" title="Nama PIC" sub="Alokasi stok & klaim" right={<SoonTag />} onClick={() => flash('Alokasi stok & klaim')} />
          <Row icon="receipt" tint="gold" title="ALK" sub="Status dana per kegiatan" right={<SoonTag />} onClick={() => flash('Status dana per kegiatan')} />
          <Row icon="link" title="VOL" sub="Pendaftaran anggota baru" onClick={() => setRegOpen(true)} />
          <Row icon="chat" tint="gold" title="Pengaduan ke Pusat" sub="Laporkan kendala ke admin pusat" right={<SoonTag />} onClick={() => flash('Pengaduan ke Pusat')} />
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
        <p className={`${MONO} text-center text-[11px] text-[#57534e] break-words`}>LevelUP Sekretariat · {username}</p>
      </div>

      <Sheet open={regOpen} onClose={() => setRegOpen(false)}>
        <SheetHead title="Link Pendaftaran" sub="Bagikan ke calon anggota baru" />
        <p className={`${MONO} text-[12.5px] text-[#161616] break-all rounded-[10px] border-2 border-dotted border-[#161616]/25 p-3`}>{regLink || `${ALK_BASE}`}</p>
        <button
          type="button"
          className={`mt-4 ${BTN}`}
          onClick={() => {
            void navigator.clipboard?.writeText(regLink)
            setRegOpen(false)
            flash('Link disalin')
          }}
        >
          <Strip>Salin Link</Strip>
        </button>
      </Sheet>
      <Toast msg={soon ? (soon.startsWith('Link') ? soon : `Fitur belum tersedia: ${soon}`) : null} />
    </PaperMain>
  )
}
