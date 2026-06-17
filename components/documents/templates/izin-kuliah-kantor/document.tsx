import type { DocumentTemplateProps } from '@/components/documents/types/template-schema'
import { LetterLayout } from '@/components/documents/_shared/letter-layout'
import { FieldTable } from '@/components/documents/_shared/field-table'
import { SingleSignature } from '@/components/documents/_shared/signature-block'
import { str } from '@/components/documents/templates/_helpers'
import '@/components/documents/_shared/document-print.css'

const TEMPLATE_ID = 'izin-kuliah-kantor'

export function IzinKuliahKantorDocument({ data, kotaLogo, approved, stampSlots }: DocumentTemplateProps) {
  const kota = str(data.kota)
  const acara = str(data.acara)
  const mulai = str(data.tanggalMulai)
  const selesai = str(data.tanggalSelesai)
  return (
    <LetterLayout kota={kota} nomorSurat={str(data.nomorSurat)} tanggalSurat={str(data.tanggalSurat)} kepada={str(data.kepada)} hal={str(data.hal)}>
      <p>Dengan hormat,</p>
      <p>Yang bertanda tangan di bawah ini menerangkan bahwa:</p>
      <FieldTable rows={[{ label: 'Nama', value: str(data.nama) }, { label: 'NIM/NIP', value: str(data.nim) }, { label: 'Institusi', value: str(data.institusi) }]} />
      <p>Tidak dapat hadir pada tanggal {mulai}{selesai !== mulai ? ' s/d ' + selesai : ''} karena {str(data.alasan)}.</p>
      <p>Demikian surat keterangan ini dibuat untuk dipergunakan sebagaimana mestinya.</p>
      <SingleSignature templateId={TEMPLATE_ID} kota={kota} acara={acara} kotaLogo={kotaLogo} approved={approved} stampSlots={stampSlots} slotId="pic" label={'PIC LevelUP ' + kota} />
    </LetterLayout>
  )
}
