import type { TemplateDefinition, TemplateMeta } from '@/components/documents/types/template-schema'
import beritaAcaraThm from '@/components/documents/templates/berita-acara-thm'
import absenTownhall from '@/components/documents/templates/absen-townhall'
import suratPemberitahuanEvent from '@/components/documents/templates/surat-pemberitahuan-event'
import permohonanIzin from '@/components/documents/templates/permohonan-izin'
import lpjSupportDana from '@/components/documents/templates/lpj-support-dana'
import permohonanCoreAmbassador from '@/components/documents/templates/permohonan-core-ambassador'
import suratPeminjaman from '@/components/documents/templates/surat-peminjaman'
import permohonanPembicaraLinknas from '@/components/documents/templates/permohonan-pembicara-linknas'
import izinKeramaian from '@/components/documents/templates/izin-keramaian'
import izinKuliahKantor from '@/components/documents/templates/izin-kuliah-kantor'
import izinPanitiaPelayan from '@/components/documents/templates/izin-panitia-pelayan'

const TEMPLATES: Record<string, TemplateDefinition> = {
  'berita-acara-thm': beritaAcaraThm,
  'absen-townhall': absenTownhall,
  'surat-pemberitahuan-event': suratPemberitahuanEvent,
  'permohonan-izin': permohonanIzin,
  'lpj-support-dana': lpjSupportDana,
  'permohonan-core-ambassador': permohonanCoreAmbassador,
  'surat-peminjaman': suratPeminjaman,
  'permohonan-pembicara-linknas': permohonanPembicaraLinknas,
  'izin-keramaian': izinKeramaian,
  'izin-kuliah-kantor': izinKuliahKantor,
  'izin-panitia-pelayan': izinPanitiaPelayan,
}

export function listTemplates(): TemplateMeta[] {
  return Object.values(TEMPLATES).map((t) => t.meta)
}

export function getTemplate(id: string): TemplateDefinition | null {
  return TEMPLATES[id] ?? null
}

export function getDocumentComponent(id: string) {
  return TEMPLATES[id]?.Document ?? null
}

export const TEMPLATE_IDS = Object.keys(TEMPLATES)
