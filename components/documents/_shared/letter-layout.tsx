import type { ReactNode } from 'react'
import { DocumentHeader } from '@/components/documents/_shared/document-header'
import { fmtTownHallDate } from '@/lib/documents/format-date-id'

type MetaRow = 'nomor' | 'kepada' | 'hal'

type MetaRowData = { key: MetaRow; label: string; value: string; bold?: boolean }

type Props = {
  kota: string
  nomorSurat: string
  tanggalSurat: string
  kepada: string
  hal: string
  children: ReactNode
  /** Default "Kepada Yth." — SPH event pakai "Kepada" saja */
  kepadaLabel?: string
  /** Default "Nomor" — permohonan izin pakai "No. Surat" */
  nomorLabel?: string
  /** Default: Nomor → Kepada → Hal. Permohonan izin: Kepada → Hal → No. Surat */
  metaOrder?: MetaRow[]
  /** @deprecated Tanggal selalu disejajarkan dengan baris meta pertama */
  tanggalAlign?: MetaRow
}

function formatTanggalSurat(raw: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const { tanggal } = fmtTownHallDate(raw)
    return tanggal
  }
  return raw
}

export function LetterLayout({
  kota,
  nomorSurat,
  tanggalSurat,
  kepada,
  hal,
  children,
  kepadaLabel = 'Kepada Yth.',
  nomorLabel = 'Nomor',
  metaOrder = ['nomor', 'kepada', 'hal'],
}: Props) {
  const metaRows: MetaRowData[] = [
    { key: 'nomor', label: nomorLabel, value: nomorSurat },
    { key: 'kepada', label: kepadaLabel, value: kepada, bold: true },
    { key: 'hal', label: 'Hal', value: hal },
  ]

  const orderedRows = metaOrder
    .map((key) => metaRows.find((row) => row.key === key))
    .filter((row): row is MetaRowData => row != null)

  return (
    <div className="doc-page">
      <DocumentHeader kota={kota} />

      <div className="doc-content">
        <div className="doc-letter-head">
          <table className="doc-letter-meta-table">
            <tbody>
              {orderedRows.map((row) => (
                <tr key={row.key}>
                  <td className="doc-letter-label">{row.label}</td>
                  <td className="doc-letter-sep">:</td>
                  <td
                    className={
                      row.bold
                        ? 'doc-letter-value doc-letter-to-name'
                        : 'doc-letter-value'
                    }
                  >
                    {row.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="doc-letter-right">
            <div className="doc-tempat-tanggal">
              {kota.trim()}, {formatTanggalSurat(tanggalSurat)}
            </div>
          </div>
        </div>

        <div className="doc-body">{children}</div>
      </div>
    </div>
  )
}

export function DocPage({ children }: { children: ReactNode }) {
  return <div className="doc-page">{children}</div>
}
