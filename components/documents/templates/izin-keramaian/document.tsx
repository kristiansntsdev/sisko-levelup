import type { DocumentTemplateProps } from '@/components/documents/types/template-schema'
import { LetterLayout } from '@/components/documents/_shared/letter-layout'
import { FieldTable } from '@/components/documents/_shared/field-table'
import { RepeatableRows } from '@/components/documents/_shared/repeatable-rows'
import { ThreeColSignatures } from '@/components/documents/_shared/signature-block'
import { str, repeatRows } from '@/components/documents/templates/_helpers'
import '@/components/documents/_shared/document-print.css'

const TEMPLATE_ID = 'izin-keramaian'

export function IzinKeramaianDocument({ data, kotaLogo, approved, stampSlots }: DocumentTemplateProps) {
  const kota = str(data.kota)
  const acara = str(data.acara)
  return (
    <LetterLayout kota={kota} nomorSurat={str(data.nomorSurat)} tanggalSurat={str(data.tanggalSurat)} kepada={str(data.kepada)} hal={str(data.hal)}>
      <p>Dengan hormat,</p>
      <p>Bersama ini kami mengajukan permohonan izin keramaian untuk kegiatan:</p>
      <FieldTable rows={[{ label: "Nama Kegiatan", value: str(data.namaKegiatan) }, { label: "Tanggal", value: str(data.tanggalKegiatan) }, { label: "Jam", value: str(data.jamKegiatan) }, { label: "Tempat", value: str(data.tempatKegiatan) }, { label: "Jumlah Peserta", value: str(data.jumlahPeserta) }]} />
      <p>Terlampir: {str(data.lampiran1)}{str(data.lampiran2) ? ", " + str(data.lampiran2) : ""}</p>
      <p>Demikian permohonan ini kami sampaikan. Atas perhatiannya kami ucapkan terima kasih.</p>
      <ThreeColSignatures templateId={TEMPLATE_ID} kota={kota} acara={acara} kotaLogo={kotaLogo} approved={approved} stampSlots={stampSlots} slotIds={['ketuaPanitia','pic','korwil']} />
    </LetterLayout>
  )
}
