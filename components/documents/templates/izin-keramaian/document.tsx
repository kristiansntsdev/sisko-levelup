import type { DocumentTemplateProps } from '@/components/documents/types/template-schema'
import { LetterLayout } from '@/components/documents/_shared/letter-layout'
import { FieldTable } from '@/components/documents/_shared/field-table'
import { TwoTierApprovalSignatures } from '@/components/documents/_shared/signature-block'
import { str } from '@/components/documents/templates/_helpers'
import '@/components/documents/_shared/document-print.css'

const TEMPLATE_ID = 'izin-keramaian'

export function IzinKeramaianDocument({
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
        Sehubungan dengan adanya kegiatan rohani yang akan kami adakan di{' '}
        <strong>{str(data.lokasiKegiatan)}</strong>, kami memohon ijin sekaligus bantuan keamanan
        (bila perlu) kepada <strong>{str(data.instansiTerkait)}</strong> untuk dapat melaksanakan
        kegiatan tersebut pada :
      </p>

      <FieldTable
        className="doc-keputusan doc-keputusan-wide"
        rows={[
          { label: 'Hari/Tanggal', value: str(data.hariTanggal) },
          { label: 'Pukul', value: str(data.pukul) },
          { label: 'Bentuk Kegiatan', value: str(data.bentukKegiatan) },
          { label: 'Pembicara/Narasumber', value: str(data.pembicaraNarasumber) },
          { label: 'Susunan Panitia', value: str(data.susunanPanitia) },
          { label: 'Susunan Acara', value: str(data.susunanAcara) },
        ]}
      />

      <p>
        Demikian yang dapat kami sampaikan, atas perhatian dan kerja sama yang baik dalam rangka
        untuk mendukung kegiatan ini, kami ucapkan terimakasih.
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
