import type { DocumentTemplateProps } from '@/components/documents/types/template-schema'
import { LetterLayout } from '@/components/documents/_shared/letter-layout'
import { FieldTable } from '@/components/documents/_shared/field-table'
import { RepeatableRows } from '@/components/documents/_shared/repeatable-rows'
import { ThreeColSignatures } from '@/components/documents/_shared/signature-block'
import { str, repeatRows } from '@/components/documents/templates/_helpers'
import '@/components/documents/_shared/document-print.css'

const TEMPLATE_ID = 'surat-peminjaman'

export function SuratPeminjamanDocument({ data, kotaLogo, approved, stampSlots }: DocumentTemplateProps) {
  const kota = str(data.kota)
  const acara = str(data.acara)
  return (
    <LetterLayout kota={kota} nomorSurat={str(data.nomorSurat)} tanggalSurat={str(data.tanggalSurat)} kepada={str(data.kepada)} hal={str(data.hal)}>
      <p>Dengan hormat,</p>
      <p>Kami bermaksud meminjam barang-barang berikut untuk keperluan kegiatan LevelUP {kota}:</p>
      <FieldTable rows={[{ label: "Tanggal Pinjam", value: str(data.tanggalPinjam) }, { label: "Tanggal Kembali", value: str(data.tanggalKembali) }, { label: "Keperluan", value: str(data.keperluan) }]} />
      <RepeatableRows columns={[{ id: "namaBarang", label: "Nama Barang" }, { id: "jumlah", label: "Jumlah" }]} rows={repeatRows(data, "daftarBarang")} />
      <p>Barang akan dikembalikan dalam keadaan baik. Demikian surat peminjaman ini kami sampaikan.</p>
      <ThreeColSignatures templateId={TEMPLATE_ID} kota={kota} acara={acara} kotaLogo={kotaLogo} approved={approved} stampSlots={stampSlots} slotIds={['ketuaPanitia','pic','korwil']} />
    </LetterLayout>
  )
}
