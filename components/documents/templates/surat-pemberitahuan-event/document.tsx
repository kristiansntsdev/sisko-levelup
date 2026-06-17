import type { DocumentTemplateProps } from '@/components/documents/types/template-schema'
import { LetterLayout, DocPage } from '@/components/documents/_shared/letter-layout'
import { FieldTable } from '@/components/documents/_shared/field-table'
import { EventApprovalSignatures } from '@/components/documents/_shared/signature-block'
import { DocumentHeader } from '@/components/documents/_shared/document-header'
import { str } from '@/components/documents/templates/_helpers'
import '@/components/documents/_shared/document-print.css'

const TEMPLATE_ID = 'surat-pemberitahuan-event'

export function SuratPemberitahuanEventDocument({
  data,
  kotaLogo,
  approved,
  stampSlots,
}: DocumentTemplateProps) {
  const kota = str(data.kota)
  const acara = str(data.acara)

  const detailRows = [
    { label: 'A. Pelaksanaan Event', value: str(data.tanggalKegiatan) },
    { label: 'B. Pukul', value: str(data.jamKegiatan) },
    { label: 'C. Tempat', value: str(data.tempatKegiatan) },
    { label: 'D. Pembicara', value: str(data.pembicara) },
    { label: 'E. Jumlah kehadiran Gereja', value: str(data.jumlahKehadiran) },
    { label: 'F. Susunan Acara', value: str(data.susunanAcara) || 'Terlampir' },
    { label: 'G. Susunan Panitia', value: str(data.susunanPanitia) || 'Terlampir' },
    { label: 'H. Rencana Anggaran Dana', value: str(data.rencanaAnggaran) || 'Terlampir' },
  ]

  return (
    <>
      <LetterLayout
        kota={kota}
        nomorSurat={str(data.nomorSurat)}
        tanggalSurat={str(data.tanggalSurat)}
        kepada={str(data.kepada)}
        hal={str(data.hal)}
        kepadaLabel="Kepada"
      >
        <p className="doc-salutation">Shalom dan Salam Sejahtera Bagi kita Semua,</p>
        <p>
          Bersama dengan datangnya surat ini, kami LEVELUP {kota} menyampaikan pemberitahuan
          dan rencana kegiatan event {acara} dengan rincian kegiatan sebagai berikut:
        </p>

        <FieldTable rows={detailRows} />

        <p>
          Besar harapan kami agar Bapak/Ibu Korwil PPHTGD dapat memberikan persetujuan atas
          pelaksanaan kegiatan yang akan kami adakan.
        </p>
        <p>
          Atas perhatian dan dukungan yang tidak pernah berhenti, kami ucapkan terimakasih.
        </p>
        <p className="doc-blessing">TUHAN YESUS MEMBERKATI KITA SEMUA</p>

        <EventApprovalSignatures
          templateId={TEMPLATE_ID}
          kota={kota}
          acara={acara}
          kotaLogo={kotaLogo}
          approved={approved}
          stampSlots={stampSlots}
        />
      </LetterLayout>

      <DocPage>
        <DocumentHeader kota={kota} />
        <h2 className="doc-lampiran-title">LAMPIRAN</h2>
        <h2 className="doc-subtitle">
          {acara} — LEVELUP {kota.toUpperCase()}
        </h2>
        <div className="doc-body">
          <p>{str(data.lampiranIsi) || 'Susunan acara, susunan panitia, dan rencana anggaran terlampir.'}</p>
        </div>
      </DocPage>
    </>
  )
}
