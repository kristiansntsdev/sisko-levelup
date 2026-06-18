import type { DocumentTemplateProps } from '@/components/documents/types/template-schema'
import { LetterLayout } from '@/components/documents/_shared/letter-layout'
import { FieldTable } from '@/components/documents/_shared/field-table'
import { TwoTierApprovalSignatures } from '@/components/documents/_shared/signature-block'
import { str, repeatRows } from '@/components/documents/templates/_helpers'
import '@/components/documents/_shared/document-print.css'

const TEMPLATE_ID = 'surat-peminjaman'

function formatBarangLabel(row: Record<string, string>) {
  const nama = str(row.namaBarang)
  const jumlah = str(row.jumlah)
  return jumlah ? `${nama} (${jumlah})` : nama
}

export function SuratPeminjamanDocument({
  data,
  kotaLogo,
  approved,
  stampSlots,
}: DocumentTemplateProps) {
  const kota = str(data.kota)
  const acara = str(data.acara)
  const kategoriBarang = str(data.kategoriBarang)
  const daftarBarang = repeatRows(data, 'daftarBarang').filter((row) => str(row.namaBarang))

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
        Bersama dengan datangnya surat ini kami dari LevelUp {kota} memohon izin kepada Bapak/Ibu{' '}
        <strong>{str(data.namaGembala)}</strong> selaku Gembala{' '}
        <strong>{str(data.namaGereja)}</strong> berkenan untuk meminjamkan{' '}
        <strong>{kategoriBarang}</strong>, yaitu :
      </p>

      <ul className="doc-list-bullet">
        {daftarBarang.map((row, i) => (
          <li key={i}>{formatBarangLabel(row)}</li>
        ))}
      </ul>

      <p>
        Adapun keperluan peminjaman barang tersebut adalah untuk mendukung kegiatan{' '}
        <strong>{acara}</strong> yang akan dilaksanakan pada :
      </p>

      <FieldTable
        className="doc-keputusan doc-keputusan-wide"
        rows={[
          { label: 'Hari/Tanggal', value: str(data.hariTanggal) },
          { label: 'Pukul', value: str(data.pukul) },
          { label: 'Acara', value: acara },
          { label: 'Tema', value: str(data.tema) },
          { label: 'Tempat', value: str(data.tempat) },
        ]}
      />

      <p>
        Kami sangat berharap Bapak/Ibu dapat menerima permohonan kami, dan mengizinkan kami untuk
        meminjam <strong>{kategoriBarang}</strong> tersebut di atas.
      </p>
      <p>
        Demikian surat permohonan ini kami sampaikan. Atas perhatian dan dukungan Bapak/Ibu
        diucapkan terima kasih.
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
