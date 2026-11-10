import { ANTON, LABEL, MONO } from '@/components/pwa/paper-ui'
import { AIR_STAGE_LABEL, hariLabel, type KotaAir } from '@/lib/air-hidup'

export const WATER = '#2f7fc1'

const FILL: Record<KotaAir['stage'], string> = {
  melimpah: WATER,
  segar: WATER,
  haus: '#e02a2f',
  kering: '#e02a2f',
  belum: '#d6d0c4',
}

const STAMP: Record<KotaAir['stage'], string> = {
  melimpah: 'bg-[#2f7fc1] text-white',
  segar: 'bg-[#2f7fc1] text-white',
  haus: 'bg-[#e02a2f] text-white',
  kering: 'bg-[#161616] text-[#ffd83d]',
  belum: 'ring-2 ring-[#57534e] text-[#57534e]',
}

export function DropIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.5c-.4 0-.8.2-1 .5C8.2 6.6 5.5 10 5.5 13.8a6.5 6.5 0 0 0 13 0C18.5 10 15.8 6.6 13 3c-.2-.3-.6-.5-1-.5Z" />
    </svg>
  )
}

export function StageStamp({ stage }: { stage: KotaAir['stage'] }) {
  return <span className={`${MONO} shrink-0 -rotate-3 rounded-[4px] px-2 py-1 text-[9.5px] font-bold uppercase ${STAMP[stage]}`}>{AIR_STAGE_LABEL[stage]}</span>
}

/** Satu bar air per kota: isi turun tiap hari, habis di hari ke-40. Besar = dashboard PIC, kecil = daftar. */
export function AirBar({ kota, size = 'sm', showName = true }: { kota: KotaAir; size?: 'sm' | 'lg'; showName?: boolean }) {
  const pct = Math.round(kota.level * 100)
  const lg = size === 'lg'
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        {showName ? (
          <p className={`${ANTON} min-w-0 truncate leading-none tracking-[.01em] ${lg ? 'text-[24px]' : 'text-[17px]'}`}>{kota.namaKota}</p>
        ) : (
          <span />
        )}
        <StageStamp stage={kota.stage} />
      </div>
      <div
        role="progressbar"
        aria-label={`Air Hidup ${kota.namaKota}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className={`relative mt-2 overflow-hidden rounded-full border-2 ${kota.stage === 'belum' ? 'border-dotted border-[#161616]/40' : 'border-[#161616]'} bg-[#fffdf7] ${lg ? 'h-9' : 'h-5'}`}
      >
        <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${pct}%`, background: FILL[kota.stage] }} />
        {kota.stage !== 'belum' && (
          <span className={`${MONO} absolute inset-y-0 right-3 flex items-center font-bold ${lg ? 'text-[13px]' : 'text-[10px]'} ${pct > 85 ? 'text-white' : 'text-[#161616]'}`}>{pct}%</span>
        )}
      </div>
      <p className={`${LABEL} mt-1.5 text-[9.5px] text-[#57534e]`}>Terakhir minum: {hariLabel(kota.hari)}</p>
    </div>
  )
}
