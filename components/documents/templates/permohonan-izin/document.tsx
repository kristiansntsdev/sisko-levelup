import type { DocumentTemplateProps } from '@/components/documents/types/template-schema'
import { LetterLayout } from '@/components/documents/_shared/letter-layout'
import { FieldTable } from '@/components/documents/_shared/field-table'
import { TwoTierApprovalSignatures } from '@/components/documents/_shared/signature-block'
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
      kepadaLabel="Kepada"
      nomorLabel="No. Surat"
      metaOrder={['kepada', 'hal', 'nomor']}
    >
      <p className="doc-salutation">Dengan Hormat,</p>
      <p>
        Sehubungan dengan akan dilaksanakan kegiatan {acara} pada tanggal{' '}
        {str(data.tanggalKegiatan)} yang bertempat di {str(data.tempatKegiatan)}, dengan ini
        kami selaku panitia Acara {str(data.namaPanitia)} memohon kepada Bapak / Ibu untuk
        memberikan izin kepada :
      </p>

      <FieldTable
        className="doc-keputusan doc-keputusan-wide"
        rows={[
          { label: 'Nama', value: str(data.namaPemohon) },
          { label: 'Alamat', value: str(data.alamat) },
          { label: 'Jabatan/NIM/Kelas', value: str(data.jabatanNimKelas) },
        ]}
      />

      <p>
        Bahwa yang bersangkutan pada tanggal {str(data.tanggalTidakHadir)} tidak dapat
        melaksanakan kewajiban pekerjaannya/perkuliahan/pembelajaran dikarenakan mengikuti
        kegiatan pelayanan pada {str(data.tanggalPelayanan)} sebagai{' '}
        {str(data.peranPelayanan)}.
      </p>
      <p>
        Demikian surat ini kami ajukan, atas perhatian dan dukungan dari Bapak/Ibu, kami
        mengucapkan terima kasih.
      </p>

      <TwoTierApprovalSignatures
        templateId={TEMPLATE_ID}
        kota={kota}
        acara={acara}
        kotaLogo={kotaLogo}
        approved={approved}
        stampSlots={stampSlots}
        hormatLabel="Hormat kami,"
        hormatAlign="right"
        approvalLabel="Mengetahui,"
        ketuaRole="Ketua Panitia (bila ada)"
        picRole={`LEADER/CPIC Level Up ${kota.trim()}`}
        korwilRole="Korwil PPHTGD"
      />
    </LetterLayout>
  )
}
