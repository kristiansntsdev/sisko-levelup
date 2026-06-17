import { DocumentHeader } from '@/components/documents/_shared/document-header'
import { SignatureBlock } from '@/components/documents/_shared/signature-block'
import { FieldTable } from '@/components/documents/_shared/field-table'
import type { DocumentComponentProps } from '@/components/documents/types/template-schema'
import { fmtTownHallDate } from '@/lib/documents/format-date-id'
import { str, num, formatCurrency } from '@/lib/documents/form-data'
import '@/components/documents/_shared/document-print.css'

const TEMPLATE_ID = 'berita-acara-thm'

export function BeritaAcaraThmDocument({
  data,
  kotaLogo,
  approved,
  stampSlots,
}: DocumentComponentProps) {
  const kota = str(data, 'kota')
  const { hari, tanggal } = fmtTownHallDate(str(data, 'thmTanggal'))
  const kotaUpper = kota.trim().toUpperCase()
  const anggaran = num(data, 'anggaran')

  const rows = [
    { label: 'Acara', value: str(data, 'acara') },
    ...(str(data, 'tema') ? [{ label: 'Tema', value: str(data, 'tema') }] : []),
    { label: 'Tanggal', value: str(data, 'tanggalAcara') },
    { label: 'Pukul', value: str(data, 'jamAcara') },
    { label: 'Tempat', value: str(data, 'tempatAcara') },
    { label: 'Penyampai Pesan', value: str(data, 'pembicara') },
    ...(anggaran > 0
      ? [{ label: 'Anggaran', value: formatCurrency(anggaran) }]
      : []),
  ]

  return (
    <div className="doc-page">
      <DocumentHeader kota={kota} />

      <div className="doc-content">
        <h1 className="doc-title">BERITA ACARA</h1>
        <h2 className="doc-subtitle">TOWN HALL MEETING</h2>
        <h2 className="doc-subtitle">LEVELUP {kotaUpper}</h2>

        <div className="doc-body">
          <p>
            Telah dilaksanakan Town Hall Meeting LevelUP {kota.trim()}, pada hari{' '}
            {hari} tanggal {tanggal}, pukul {str(data, 'thmJam').trim()}, di{' '}
            {str(data, 'thmTempat').trim()}
          </p>
          <p>
            Dihadiri oleh Perangkat LevelUP {kota.trim()}.
            {num(data, 'jumlahCoreAmbassador') > 0 &&
              ` Jumlah Core Ambassador: ${num(data, 'jumlahCoreAmbassador')}.`}
            {str(data, 'hadirBamag') && ` Hadir BAMAG: ${str(data, 'hadirBamag')}.`}
            {str(data, 'hadirKomunitas') &&
              ` Hadir Komunitas: ${str(data, 'hadirKomunitas')}.`}
            {' '}(Terlampir daftar hadir)
          </p>
          <p>Berikut hasil keputusan town hall meeting LevelUP {kota.trim()}:</p>

          <FieldTable rows={rows} />

          <p>
            Demikian berita acara ini dibuat berdasarkan keputusan bersama yang telah
            disepakati oleh Perangkat Inti LevelUP Kota dan diketahui oleh Korwil PPHTGD,
          </p>
        </div>

        <SignatureBlock
          slots={stampSlots}
          templateId={TEMPLATE_ID}
          kota={kota}
          subject={str(data, 'acara')}
          kotaLogo={kotaLogo}
          approved={approved}
          columns={2}
        />
      </div>
    </div>
  )
}
