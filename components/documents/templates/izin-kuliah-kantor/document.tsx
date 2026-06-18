import type { DocumentTemplateProps } from '@/components/documents/types/template-schema'
import { LetterLayout } from '@/components/documents/_shared/letter-layout'
import { FieldTable } from '@/components/documents/_shared/field-table'
import { SingleSignature } from '@/components/documents/_shared/signature-block'
import { str } from '@/components/documents/templates/_helpers'
import '@/components/documents/_shared/document-print.css'

const TEMPLATE_ID = 'izin-kuliah-kantor'

export function IzinKuliahKantorDocument({
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
      kepadaLabel="Kepada"
      nomorLabel="No. Surat"
      metaOrder={['kepada', 'hal', 'nomor']}
    >
      <p className="doc-salutation">Dengan Hormat,</p>
      <p>
        Sehubungan dengan akan dilaksanakan kegiatan <strong>{acara}</strong> pada tanggal{' '}
        {str(data.tanggalKegiatan)} yang bertempat di {str(data.tempatKegiatan)}, dengan ini
        kami selaku Pengurus LevelUP {kota} memohon kepada Bapak / Ibu untuk memberikan izin
        kepada :
      </p>

      <FieldTable
        className="doc-keputusan doc-keputusan-wide"
        rows={[
          { label: 'Nama', value: str(data.nama) },
          { label: 'Jabatan/NIM', value: str(data.jabatanNim) },
          { label: 'Jurusan', value: str(data.jurusan) },
        ]}
      />

      <p>
        Bahwa yang bersangkutan tidak dapat mengikuti pembelajaran dikarenakan mengikuti
        kegiatan <strong>{acara}</strong> sebagai perwakilan dari LevelUP {kota}.
      </p>
      <p>
        Demikian surat ini kami ajukan, atas perhatian dan dukungan dari Bapak/Ibu, kami
        mengucapkan terima kasih.
      </p>

      <SingleSignature
        templateId={TEMPLATE_ID}
        kota={kota}
        acara={acara}
        kotaLogo={kotaLogo}
        approved={approved}
        stampSlots={stampSlots}
        slotId="pic"
        label={`Leader/CPIC LevelUP ${kota}`}
        mengetahuiLabel="Hormat kami,"
      />
    </LetterLayout>
  )
}
