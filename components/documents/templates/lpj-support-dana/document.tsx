import type { DocumentTemplateProps } from '@/components/documents/types/template-schema'
import { LetterLayout, DocPage } from '@/components/documents/_shared/letter-layout'
import { FieldTable } from '@/components/documents/_shared/field-table'
import { RepeatableRows } from '@/components/documents/_shared/repeatable-rows'
import { TwoColSignatures } from '@/components/documents/_shared/signature-block'
import { DocumentHeader } from '@/components/documents/_shared/document-header'
import { str, repeatRows } from '@/components/documents/templates/_helpers'
import '@/components/documents/_shared/document-print.css'

const TEMPLATE_ID = 'lpj-support-dana'

function fmtRp(v: string) {
  const n = Number(v.replace(/[^0-9]/g, ''))
  return Number.isFinite(n) ? 'Rp ' + n.toLocaleString('id-ID') : v
}

export function LpjSupportDanaDocument({ data, kotaLogo, approved, stampSlots }: DocumentTemplateProps) {
  const kota = str(data.kota)
  const acara = str(data.acara)
  const rincian = repeatRows(data, 'rincianKeuangan')
  const total = rincian.reduce((sum, row) => sum + (Number(String(row.jumlah).replace(/[^0-9]/g, '')) || 0), 0)
  return (
    <>
      <LetterLayout kota={kota} nomorSurat={str(data.nomorSurat)} tanggalSurat={str(data.tanggalSurat)} kepada={str(data.kepada)} hal={str(data.hal)}>
        <p>Dengan hormat,</p>
        <p>Kami mengajukan permohonan support dana untuk kegiatan <strong>{acara}</strong> LevelUP {kota} sebesar <strong>{fmtRp(str(data.jumlahDana))}</strong>.</p>
        <p>{str(data.keteranganDana)}</p>
        <p>Demikian permohonan ini kami sampaikan. Atas perkenannya kami ucapkan terima kasih.</p>
        <TwoColSignatures templateId={TEMPLATE_ID} kota={kota} acara={acara} kotaLogo={kotaLogo} approved={approved} stampSlots={stampSlots} slotIds={['korwil','pic']} labels={['Korwil PPHTGD', 'PIC LevelUP ' + kota]} mengetahuiLabel="Hormat kami," />
      </LetterLayout>
      <DocPage>
        <DocumentHeader kota={kota} />
        <h1 className="doc-title">LAPORAN PERTANGGUNGJAWABAN (LPJ)</h1>
        <h2 className="doc-subtitle">{acara} — LEVELUP {kota.toUpperCase()}</h2>
        <FieldTable rows={[{ label: 'Tanggal', value: str(data.tanggalKegiatan) }, { label: 'Tempat', value: str(data.tempatKegiatan) }]} />
        <div className="doc-body">
          <p><strong>Ringkasan:</strong> {str(data.ringkasanKegiatan)}</p>
          <p><strong>Hasil:</strong> {str(data.hasilKegiatan)}</p>
        </div>
        <TwoColSignatures templateId={TEMPLATE_ID} kota={kota} acara={acara} kotaLogo={kotaLogo} approved={approved} stampSlots={stampSlots} slotIds={['korwil','pic']} labels={['Korwil PPHTGD', 'PIC LevelUP ' + kota]} />
      </DocPage>
      <DocPage>
        <DocumentHeader kota={kota} />
        <h2 className="doc-lampiran-title">RINCIAN KEUANGAN</h2>
        <RepeatableRows columns={[{ id: 'uraian', label: 'Uraian' }, { id: 'jumlah', label: 'Jumlah (Rp)' }]} rows={rincian.map((r) => ({ ...r, jumlah: fmtRp(r.jumlah) }))} />
        <div className="doc-financial-total">Total: {fmtRp(String(total))}</div>
        <TwoColSignatures templateId={TEMPLATE_ID} kota={kota} acara={acara} kotaLogo={kotaLogo} approved={approved} stampSlots={stampSlots} slotIds={['picKeuangan','picKegiatan']} labels={['PIC Keuangan', 'PIC Kegiatan']} />
      </DocPage>
    </>
  )
}
