import type { DocumentTemplateProps } from '@/components/documents/types/template-schema'
import { LetterLayout } from '@/components/documents/_shared/letter-layout'
import { FieldTable } from '@/components/documents/_shared/field-table'
import { ThreeColSignatures } from '@/components/documents/_shared/signature-block'
import { str } from '@/components/documents/templates/_helpers'
import '@/components/documents/_shared/document-print.css'

const TEMPLATE_ID = 'permohonan-izin'

export function PermohonanIzinDocument({
  data,
  kotaLogo,
  approved,
  stampSlots,
}: DocumentTemplateProps) {
  const kota = str(data.kota)
  const acara = str(data.acara)

  return (
    <LetterLayout
      kota={kota}
      nomorSurat={str(data.nomorSurat)}
      tanggalSurat={str(data.tanggalSurat)}
      kepada={str(data.kepada)}
      hal={str(data.hal)}
    >
      <p>Dengan hormat,</p>
      <p>Yang bertanda tangan di bawah ini:</p>
      <FieldTable
        rows={[
          { label: 'Nama', value: str(data.namaPemohon) },
          { label: 'Jabatan', value: str(data.jabatan) },
          { label: 'Instansi', value: str(data.instansi) },
          { label: 'Alamat', value: str(data.alamat) },
        ]}
      />
      <p>Dengan ini mengajukan permohonan izin untuk melaksanakan kegiatan pada:</p>
      <FieldTable
        rows={[
          { label: 'Tanggal', value: str(data.tanggalKegiatan) },
          { label: 'Jam', value: str(data.jamKegiatan) },
          { label: 'Tempat', value: str(data.tempatKegiatan) },
        ]}
      />
      <p>{str(data.keterangan)}</p>
      <p>
        Demikian permohonan ini kami sampaikan. Atas perhatian dan izin Bapak/Ibu, kami
        ucapkan terima kasih.
      </p>
      <ThreeColSignatures
        templateId={TEMPLATE_ID}
        kota={kota}
        acara={acara}
        kotaLogo={kotaLogo}
        approved={approved}
        stampSlots={stampSlots}
        slotIds={['ketuaPanitia', 'pic', 'korwil']}
      />
    </LetterLayout>
  )
}
