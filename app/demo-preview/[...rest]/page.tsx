import Link from 'next/link'
import { ANTON, BTN, MONO, PaperHeader, PaperMain, Strip } from '@/components/pwa/paper-ui'

// Any real route the demo does not reproduce (nasional-only screens, QR /absen, etc.) lands here instead of a 404.
export default function DemoNotAvailable() {
  return (
    <PaperMain standalone>
      <PaperHeader sticker="Demo" title="Belum ada di demo" />
      <div className="px-5 mt-5">
        <p className={`${MONO} text-[13px] leading-relaxed text-[#44403c]`}>
          Halaman ini ada di aplikasi asli, tapi belum dibuat untuk demo. Kembali ke beranda untuk lanjut mencoba alur lain.
        </p>
        <Link href="/demo-preview/login" className={`${BTN} mt-6 block`}>
          <Strip>
            <span className={ANTON}>Ke halaman masuk</span>
          </Strip>
        </Link>
      </div>
    </PaperMain>
  )
}
