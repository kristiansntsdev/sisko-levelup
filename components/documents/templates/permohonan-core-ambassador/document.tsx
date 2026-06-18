import type { DocumentTemplateProps } from '@/components/documents/types/template-schema'
import { LetterLayout } from '@/components/documents/_shared/letter-layout'
import { TwoTierApprovalSignatures } from '@/components/documents/_shared/signature-block'
import { str } from '@/components/documents/templates/_helpers'
import '@/components/documents/_shared/document-print.css'

const TEMPLATE_ID = 'permohonan-core-ambassador'

export function PermohonanCoreAmbassadorDocument({
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
      tanggalAlign="nomor"
    >
      <p className="doc-salutation">Dengan Hormat,</p>
      <p>
        Saat ini, LevelUP sedang mengerjakan program terbaru yaitu Core Ambassador yang akan
        dilaksanakan di berbagai kota di Indonesia. Core Ambassador adalah Perwakilan dari Gereja
        yang telah menyatakan dukungannya terhadap LevelUP. Perwakilan gereja tersebut akan
        menjadi bagian dari LevelUP Kota dalam hal ini LevelUP {kota}, dengan tujuan untuk
        meningkatkan dan menjaga Unity (Persatuan) Gereja di kota {kota}.
      </p>
      <p>
        Tugas Core Ambassador ialah menjadi sarana penghubung antara LevelUP dengan gereja
        ataupun sebaliknya serta mengkomunikasikan segala hal yang berkaitan dengan kegerakan
        kepemudaan di Kota {kota} kepada Gereja.
      </p>
      <p>
        Sehubungan dengan hal tersebut, maka kami memohon Kepada Bapak / Ibu Gembala / Pimpinan
        Gereja setempat mengutus 1 (satu) orang pemuda / remaja untuk menjadi Core Ambassador.
      </p>
      <p>
        Demikian permohonan ini, atas perhatian dan kerjasamanya, diucapkan terima kasih.
      </p>
      <p className="doc-blessing">Tuhan Yesus Memberkati. Amin!</p>
      <p>
        Jika ada hal yang ingin ditanyakan dapat menghubungi :
        <br />
        {str(data.kontakLeaderCpic)}
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
