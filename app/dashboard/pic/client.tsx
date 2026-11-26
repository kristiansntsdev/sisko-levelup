'use client'
import { toggleAmin, kirimLaporanWw, perbaruiLaporanWw } from '@/lib/actions/air-hidup'
import { AliranScreen, EditLaporScreen, LaporScreen, PicScreen } from '@/components/air-hidup/screens'
import type { AirAnggota, AliranData, EditData, PicData } from '@/lib/air-hidup'

// Server action tidak bisa dilempar langsung dari Server Component ke komponen layar, jadi dibungkus di sini.
const BERANDA = '/dashboard'
const PIC = '/dashboard/pic'
const LAPOR = '/dashboard/pic/lapor'
const FEED = '/dashboard/air-hidup'

export const PicPage = ({ data }: { data: PicData }) => <PicScreen data={data} berandaHref={BERANDA} laporHref={LAPOR} feedHref={FEED} editHref={(id) => `/dashboard/pic/edit/${id}`} toggleAmin={toggleAmin} />
export const LaporPage = ({ namaKota, today, anggota }: { namaKota: string; today: string; anggota: AirAnggota[] }) => (
  <LaporScreen namaKota={namaKota} today={today} anggota={anggota} picHref={PIC} onSubmit={kirimLaporanWw} />
)
export const AliranPage = ({ data }: { data: AliranData }) => <AliranScreen data={data} berandaHref={BERANDA} toggleAmin={toggleAmin} />
export const EditPage = ({ data }: { data: EditData }) => <EditLaporScreen data={data} picHref={PIC} onSubmit={perbaruiLaporanWw} />
