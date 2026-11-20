'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getPushConfig, hapusPush, simpanPush } from '@/lib/actions/push'
import { ANTON, BTN, BTN_OUTLINE, Chip, MONO, PANEL, PRESS, Strip } from '@/components/pwa/paper-ui'
import { Sheet, SheetHead } from '@/components/pwa/ui'
import { ambilLangganan, b64uKeUint8, daftarkanSW, deteksiPerangkat, pushDidukung } from './push-client'

export type PushState = 'memuat' | 'unsupported' | 'ios-install' | 'denied' | 'on' | 'off'

export const PUSH_LABEL: Record<PushState, string> = {
  memuat: '…',
  unsupported: 'Belum tersedia',
  'ios-install': 'Pasang ke Layar Utama dulu',
  denied: 'Diblokir',
  on: 'Aktif',
  off: 'Nonaktif',
}

export type PushApi = {
  state: PushState
  busy: boolean
  error: string | null
  /** Pesan setelah berhasil diaktifkan (notifikasi percobaan). */
  info: string | null
  ios: boolean
  safari: boolean
  aktifkan: () => Promise<void>
  matikan: () => Promise<void>
}

/** Dari tombol Aktifkan: simpan + minta notifikasi percobaan. null = gagal simpan, true/false = percobaan terkirim. */
async function kirimLangganan(sub: PushSubscription): Promise<boolean | null> {
  const j = sub.toJSON()
  const enc = (typeof PushManager !== 'undefined' && PushManager.supportedContentEncodings?.[0]) || 'aes128gcm'
  const res = await simpanPush(
    {
      endpoint: sub.endpoint,
      p256dh: j.keys?.p256dh ?? '',
      auth: j.keys?.auth ?? '',
      encoding: enc,
      userAgent: navigator.userAgent,
    },
    { uji: true },
  )
  return res.ok ? res.uji : null
}

export function usePush(): PushApi {
  const [state, setState] = useState<PushState>('memuat')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [dev, setDev] = useState({ ios: false, safari: false })
  const key = useRef<string | null>(null)

  useEffect(() => {
    let batal = false
    void (async () => {
      // Tunggu kunci dulu: setState tidak boleh jalan sinkron di badan effect.
      const cfg = await getPushConfig()
      if (batal) return
      key.current = cfg.publicKey
      const d = deteksiPerangkat()
      setDev({ ios: d.ios, safari: d.safari })
      if (!cfg.publicKey) return setState('unsupported')
      // iOS hanya membuka Web Push untuk app yang dipasang ke Layar Utama (iOS 16.4+).
      if (d.ios && !d.standalone) return setState('ios-install')
      if (!pushDidukung()) return setState('unsupported')
      if (Notification.permission === 'denied') return setState('denied')
      const sub = Notification.permission === 'granted' ? await ambilLangganan().catch(() => null) : null
      if (!batal) setState(sub ? 'on' : 'off')
    })()
    return () => {
      batal = true
    }
  }, [])

  const aktifkan = useCallback(async () => {
    if (busy || !key.current) return
    setBusy(true)
    setError(null)
    try {
      // iOS hanya menampilkan dialog izin kalau diminta sinkron di dalam tap: mulai SEBELUM await apa pun.
      const asking = Notification.permission === 'default' ? Notification.requestPermission() : Promise.resolve(Notification.permission)
      const izin = await Promise.race([
        asking,
        new Promise<'timeout'>((r) => setTimeout(() => r('timeout'), 15000)),
      ])
      if (izin === 'timeout') throw new Error('Dialog izin tidak muncul. Tutup lalu buka lagi aplikasi dari ikon Layar Utama.')
      if (izin !== 'granted') {
        setState(izin === 'denied' ? 'denied' : 'off')
        return
      }
      const reg = await daftarkanSW()
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64uKeUint8(key.current) }))
      const uji = await kirimLangganan(sub)
      if (uji === null) {
        await sub.unsubscribe().catch(() => {})
        throw new Error('Gagal menyimpan. Masuk lagi lalu coba lagi.')
      }
      setInfo(
        uji
          ? 'Notifikasi percobaan sudah dikirim ke HP ini. Kalau tidak muncul dalam 1 menit, matikan lalu aktifkan lagi.'
          : 'Notifikasi aktif, tapi notifikasi percobaan belum terkirim. Coba matikan lalu aktifkan lagi.',
      )
      setState('on')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal mengaktifkan notifikasi.')
    } finally {
      setBusy(false)
    }
  }, [busy])

  const matikan = useCallback(async () => {
    if (busy) return
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      const sub = await ambilLangganan()
      if (sub) {
        await hapusPush(sub.endpoint)
        await sub.unsubscribe()
      }
      setState('off')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal mematikan notifikasi.')
    } finally {
      setBusy(false)
    }
  }, [busy])

  return { state, busy, error, info, ios: dev.ios, safari: dev.safari, aktifkan, matikan }
}

const STEP = `${MONO} text-[12.5px] leading-snug text-[#161616]`

function Langkah({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className={`${ANTON} shrink-0 w-6 h-6 rounded-full bg-[#161616] text-[#ffd83d] text-[13px] flex items-center justify-center`}>{n}</span>
      <span className={STEP}>{children}</span>
    </li>
  )
}

/** Isi bantuan per status: dipakai kartu Beranda dan sheet di Profil / Lainnya. */
export function PushPenjelasan({ push }: { push: PushApi }) {
  if (push.state === 'ios-install') {
    return (
      <div className="space-y-3">
        <p className={STEP}>Di iPhone, notifikasi hanya bisa untuk aplikasi yang sudah dipasang ke Layar Utama (iOS 16.4+).</p>
        {push.safari ? (
          <ol className="space-y-2.5">
            <Langkah n={1}>Ketuk tombol <b>Bagikan</b> (kotak berpanah) di Safari.</Langkah>
            <Langkah n={2}>Pilih <b>Tambah ke Layar Utama</b>, lalu <b>Tambah</b>.</Langkah>
            <Langkah n={3}>Buka LevelUP dari ikon di Layar Utama, lalu aktifkan notifikasi di sini.</Langkah>
          </ol>
        ) : (
          <p className={STEP}>Buka link ini di <b>Safari</b> dulu (bukan Chrome atau browser di dalam aplikasi lain), lalu ikuti langkah Tambah ke Layar Utama.</p>
        )}
      </div>
    )
  }
  if (push.state === 'denied') {
    return <p className={STEP}>Notifikasi diblokir. Izinkan lagi lewat pengaturan {push.ios ? 'iPhone → LevelUP → Notifikasi' : 'browser / aplikasi (ikon gembok di address bar, atau Pengaturan → Aplikasi → LevelUP → Notifikasi)'}.</p>
  }
  if (push.state === 'unsupported') return <p className={STEP}>Browser ini belum mendukung notifikasi, atau notifikasi belum dinyalakan di server.</p>
  return (
    <p className={STEP}>
      {push.state === 'on'
        ? 'Notifikasi aktif di HP ini: event baru, pengingat, dan kabar lain akan masuk, dengan angka di ikon aplikasi.'
        : 'Aktifkan supaya tidak ketinggalan event baru, pengingat absensi, dan kabar lain dari LevelUP.'}
    </p>
  )
}

/** Sheet bantuan + tombol aktif/matikan. */
export function PushSheet({ push, open, onClose }: { push: PushApi; open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose}>
      <SheetHead title="Notifikasi HP" sub={`Status: ${PUSH_LABEL[push.state]}`} />
      <PushPenjelasan push={push} />
      {push.error && <p className={`${MONO} mt-3 text-[12px] font-bold text-[#c21f24]`}>{push.error}</p>}
      {push.info && push.state === 'on' && (
        <p className={`${MONO} mt-3 rounded-[10px] bg-[#ffd83d]/60 px-3 py-2.5 text-[12px] font-bold leading-snug`}>{push.info}</p>
      )}
      {(push.state === 'off' || push.state === 'on') && (
        <button
          type="button"
          disabled={push.busy}
          onClick={() => void (push.state === 'on' ? push.matikan() : push.aktifkan())}
          className={`mt-4 ${push.state === 'on' ? BTN_OUTLINE : BTN}`}
        >
          {push.state === 'on' ? 'Matikan' : <Strip>{push.busy ? 'Memproses…' : 'Aktifkan Notifikasi'}</Strip>}
        </button>
      )}
    </Sheet>
  )
}

const CTA_KEY = 'levelup-push-cta'

/** Kartu "Aktifkan Notifikasi" di Beranda: hanya saat belum aktif, belum ditolak, dan belum ditutup. */
export function PushCard() {
  const push = usePush()
  const [tutup, setTutup] = useState(() => {
    if (typeof window === 'undefined') return true
    try {
      return localStorage.getItem(CTA_KEY) === '1'
    } catch {
      return false
    }
  })
  const [help, setHelp] = useState(false)
  const tutupKartu = () => {
    setTutup(true)
    try {
      localStorage.setItem(CTA_KEY, '1')
    } catch {}
  }
  // Baru saja diaktifkan dari kartu ini: tunjukkan hasilnya sampai ditutup.
  if (push.state === 'on' && push.info && !tutup) {
    return (
      <section role="status" className={`${PANEL} p-4 flex items-start gap-3`}>
        <Chip name="check" className="bg-[#161616] text-[#ffd83d]" />
        <div className="flex-1 min-w-0">
          <p className={`${ANTON} text-[17px] leading-tight tracking-[.02em]`}>Notifikasi aktif</p>
          <p className={`${MONO} mt-1 text-[11.5px] leading-snug text-[#44403c]`}>{push.info}</p>
        </div>
        <button type="button" aria-label="Tutup" className={`${PRESS} ${MONO} shrink-0 text-[18px] leading-none px-1 text-[#57534e]`} onClick={tutupKartu}>
          ×
        </button>
      </section>
    )
  }
  const tampil = !tutup && (push.state === 'off' || push.state === 'ios-install')
  if (!tampil) return null
  return (
    <section className={`${PANEL} p-4 flex items-start gap-3`}>
      <Chip name="bell" className="bg-[#ffd83d] text-[#161616]" />
      <div className="flex-1 min-w-0">
        <p className={`${ANTON} text-[17px] leading-tight tracking-[.02em]`}>Aktifkan notifikasi</p>
        <p className={`${MONO} mt-1 text-[11.5px] leading-snug text-[#44403c]`}>
          Biar tidak ketinggalan event baru, ulang tahun, dan pengingat absensi.
        </p>
        <button
          type="button"
          disabled={push.busy}
          onClick={() => (push.state === 'ios-install' ? setHelp(true) : void push.aktifkan())}
          className={`mt-3 ${BTN}`}
        >
          <Strip className="py-2.5 text-[16px]">{push.state === 'ios-install' ? 'Cara pasang' : push.busy ? 'Memproses…' : 'Aktifkan'}</Strip>
        </button>
        {push.error && <p className={`${MONO} mt-2 text-[11.5px] font-bold text-[#c21f24]`}>{push.error}</p>}
      </div>
      <button
        type="button"
        aria-label="Tutup"
        className={`${PRESS} ${MONO} shrink-0 text-[18px] leading-none px-1 text-[#57534e]`}
        onClick={tutupKartu}
      >
        ×
      </button>
      <PushSheet push={push} open={help} onClose={() => setHelp(false)} />
    </section>
  )
}
