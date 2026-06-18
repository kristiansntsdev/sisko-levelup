import type { DocumentTemplateProps } from '@/components/documents/types/template-schema'
import { LetterLayout } from '@/components/documents/_shared/letter-layout'
import { FieldTable } from '@/components/documents/_shared/field-table'
import { TwoTierApprovalSignatures } from '@/components/documents/_shared/signature-block'
import { str } from '@/components/documents/templates/_helpers'
import '@/components/documents/_shared/document-print.css'

const TEMPLATE_ID = 'permohonan-pembicara-linknas'

export function PermohonanPembicaraLinknasDocument({
  data,
  kotaLogo,
  approved,
  stampSlots,
}: DocumentTemplateProps) {
  const kota = str(data.kota)
  const acara = str(data.acara)
  const kotaUpper = kota.toUpperCase()

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
        Dalam kasih Kristus, LevelUP {kota} bekerjasama dengan{' '}
        <strong>{str(data.namaPartnerKerjasama)}</strong> akan mengadakan acara{' '}
        <strong>{acara}</strong>, yang akan dilaksanakan pada :
      </p>

      <FieldTable
        className="doc-keputusan doc-keputusan-wide"
        rows={[
          { label: 'Hari, Tanggal', value: str(data.hariTanggal) },
          { label: 'Waktu', value: str(data.waktu) },
          { label: 'Tempat', value: str(data.tempat) },
        ]}
      />

      <p>
        Kami mohon kesediaan dari Tim Pelayanan Nasional LevelUP Indonesia untuk melayani dalam
        event tersebut. Demikian surat permohonan ini kami sampaikan, atas dukungan dan perhatian
        Tim Pelayanan Nasional LevelUP Indonesia kami ucapkan terima kasih.
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
        ketuaRole="Ketua Panitia"
        picRole={`LEADER/CPIC LEVELUP ${kotaUpper}`}
        korwilRole="Korwil PPHTGD"
      />
    </LetterLayout>
  )
}
