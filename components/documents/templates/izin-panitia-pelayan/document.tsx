import type { DocumentTemplateProps } from '@/components/documents/types/template-schema'
import { LetterLayout } from '@/components/documents/_shared/letter-layout'
import { FieldTable } from '@/components/documents/_shared/field-table'
import { RepeatableRows } from '@/components/documents/_shared/repeatable-rows'
import { ThreeColSignatures } from '@/components/documents/_shared/signature-block'
import { str, repeatRows } from '@/components/documents/templates/_helpers'
import '@/components/documents/_shared/document-print.css'

const TEMPLATE_ID = 'izin-panitia-pelayan'

export function IzinPanitiaPelayanDocument({ data, kotaLogo, approved, stampSlots }: DocumentTemplateProps) {
  const kota = str(data.kota)
  const acara = str(data.acara)
  return (
    <LetterLayout kota={kota} nomorSurat={str(data.nomorSurat)} tanggalSurat={str(data.tanggalSurat)} kepada={str(data.kepada)} hal={str(data.hal)}>
      <p>Dengan hormat,</p>
      <p>Kami mengajukan izin pelaksanaan tugas panitia dan pelayan untuk kegiatan:</p>
      <FieldTable rows={[{ label: "Nama Kegiatan", value: str(data.namaKegiatan) }, { label: "Tanggal", value: str(data.tanggalMulai) + " s/d " + str(data.tanggalSelesai) }, { label: "Tempat", value: str(data.tempat) }]} />
      <p>{str(data.refLampiran)}</p>
      <p>Demikian surat izin ini kami sampaikan. Atas perkenannya kami ucapkan terima kasih.</p>
      <ThreeColSignatures templateId={TEMPLATE_ID} kota={kota} acara={acara} kotaLogo={kotaLogo} approved={approved} stampSlots={stampSlots} slotIds={['ketuaPanitia','pic','korwil']} />
    </LetterLayout>
  )
}
