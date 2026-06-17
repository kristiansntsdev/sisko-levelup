import type { DocumentTemplateProps } from '@/components/documents/types/template-schema'
import { LetterLayout } from '@/components/documents/_shared/letter-layout'
import { FieldTable } from '@/components/documents/_shared/field-table'
import { RepeatableRows } from '@/components/documents/_shared/repeatable-rows'
import { ThreeColSignatures } from '@/components/documents/_shared/signature-block'
import { str, repeatRows } from '@/components/documents/templates/_helpers'
import '@/components/documents/_shared/document-print.css'

const TEMPLATE_ID = 'permohonan-core-ambassador'

export function PermohonanCoreAmbassadorDocument({ data, kotaLogo, approved, stampSlots }: DocumentTemplateProps) {
  const kota = str(data.kota)
  const acara = str(data.acara)
  return (
    <LetterLayout kota={kota} nomorSurat={str(data.nomorSurat)} tanggalSurat={str(data.tanggalSurat)} kepada={str(data.kepada)} hal={str(data.hal)}>
      <p>Dengan hormat,</p>
      <p>Bersama ini kami mengajukan calon Core Ambassador LevelUP {kota} sebagai berikut:</p>
      <FieldTable rows={[{ label: "Nama", value: str(data.namaCalon) }, { label: "Asal Komunitas", value: str(data.asalKomunitas) }]} />
      <p>{str(data.alasan)}</p>
      <p>Demikian surat permohonan ini kami sampaikan. Atas perhatiannya kami ucapkan terima kasih.</p>
      <ThreeColSignatures templateId={TEMPLATE_ID} kota={kota} acara={acara} kotaLogo={kotaLogo} approved={approved} stampSlots={stampSlots} slotIds={['ketuaPanitia','pic','korwil']} />
    </LetterLayout>
  )
}
