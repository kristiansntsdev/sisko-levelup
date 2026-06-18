import type { DocumentTemplateProps } from '@/components/documents/types/template-schema'
import { LetterLayout } from '@/components/documents/_shared/letter-layout'
import { FieldTable } from '@/components/documents/_shared/field-table'
import { TwoTierApprovalSignatures } from '@/components/documents/_shared/signature-block'
import { str } from '@/components/documents/templates/_helpers'
import '@/components/documents/_shared/document-print.css'

const TEMPLATE_ID = 'izin-panitia-pelayan'

export function IzinPanitiaPelayanDocument({
  data,
  kotaLogo,
  approved,
  stampSlots,
}: DocumentTemplateProps) {
  const kota = str(data.kota)
  const acara = str(data.acara)
  const partner = str(data.namaPartnerKerjasama)
  const kerjasamaText = partner ? ` bekerja sama dengan ${partner}` : ''

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
        Dalam upaya mewujudkan Kesatuan Tubuh Kristus dan menuntaskan Amanat Agung, serta dalam
        rangka {str(data.tujuanKegiatan)}, kami LevelUP {kota}
        {kerjasamaText} akan mengadakan <strong>{acara}</strong>, yang akan dilaksanakan pada :
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
        Kami memohon izin kepada Bapak/Ibu Gembala, bahwa Saudara/Saudari ( terlampir ) untuk
        menjadi panitia dan atau penatalayan pada acara tersebut diatas. Demikian surat izin ini
        kami sampaikan, atas dukungan dan perhatian Bapak/Ibu kami ucapkan terima kasih.
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
