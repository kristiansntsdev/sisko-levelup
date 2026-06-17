import type { TemplateMeta } from '@/components/documents/types/template-schema'
import beritaAcaraThm from '@/components/documents/templates/berita-acara-thm/meta.json'
import absenTownhall from '@/components/documents/templates/absen-townhall/meta.json'
import suratPemberitahuanEvent from '@/components/documents/templates/surat-pemberitahuan-event/meta.json'
import permohonanIzin from '@/components/documents/templates/permohonan-izin/meta.json'
import lpjSupportDana from '@/components/documents/templates/lpj-support-dana/meta.json'
import permohonanCoreAmbassador from '@/components/documents/templates/permohonan-core-ambassador/meta.json'
import suratPeminjaman from '@/components/documents/templates/surat-peminjaman/meta.json'
import permohonanPembicaraLinknas from '@/components/documents/templates/permohonan-pembicara-linknas/meta.json'
import izinKeramaian from '@/components/documents/templates/izin-keramaian/meta.json'
import izinKuliahKantor from '@/components/documents/templates/izin-kuliah-kantor/meta.json'
import izinPanitiaPelayan from '@/components/documents/templates/izin-panitia-pelayan/meta.json'

const METAS: TemplateMeta[] = [
  beritaAcaraThm,
  absenTownhall,
  suratPemberitahuanEvent,
  permohonanIzin,
  lpjSupportDana,
  permohonanCoreAmbassador,
  suratPeminjaman,
  permohonanPembicaraLinknas,
  izinKeramaian,
  izinKuliahKantor,
  izinPanitiaPelayan,
] as TemplateMeta[]

export function listTemplateMetas(): TemplateMeta[] {
  return METAS
}
