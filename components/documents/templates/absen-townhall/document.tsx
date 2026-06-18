import { fmtTownHallDate } from '@/lib/documents/format-date-id'
import type { DocumentTemplateProps } from '@/components/documents/types/template-schema'
import { DocumentHeader } from '@/components/documents/_shared/document-header'
import { RepeatableRows } from '@/components/documents/_shared/repeatable-rows'
import { TwoColSignatures } from '@/components/documents/_shared/signature-block'
import { str, repeatRows } from '@/components/documents/templates/_helpers'
import '@/components/documents/_shared/document-print.css'

const TEMPLATE_ID = 'absen-townhall'

export function AbsenTownhallDocument({ data, kotaLogo, approved, stampSlots }: DocumentTemplateProps) {
  const kota = str(data.kota)
  const acara = str(data.acara)
  const { hari, tanggal } = fmtTownHallDate(str(data.thmTanggal))
  return (
    <div className="doc-page">
      <DocumentHeader kota={kota} />
      <h1 className="doc-title">DAFTAR HADIR</h1>
      <h2 className="doc-subtitle">TOWN HALL MEETING LEVELUP {kota.toUpperCase()}</h2>
      <div className="doc-body">
        <p>Acara: {acara}</p>
        <p>Hari/Tanggal: {hari}, {tanggal} — Pukul {str(data.thmJam)}</p>
        <p>Tempat: {str(data.thmTempat)}</p>
      </div>
      <RepeatableRows columns={[{ id: 'nama', label: 'Nama' }, { id: 'asal', label: 'Asal' }]} rows={repeatRows(data, 'daftarHadir')} />
      <TwoColSignatures templateId={TEMPLATE_ID} kota={kota} acara={acara} kotaLogo={kotaLogo} approved={approved} stampSlots={stampSlots} slotIds={['korwil', 'coreAmbassador']} labels={['Korwil PPHTGD', 'Core Ambassador LevelUP ' + kota]} />
    </div>
  )
}
