import type { ReactNode } from 'react'
import { DocumentHeader } from '@/components/documents/_shared/document-header'
import { fmtTownHallDate } from '@/lib/documents/format-date-id'

type Props = {
  kota: string
  nomorSurat: string
  tanggalSurat: string
  kepada: string
  hal: string
  children: ReactNode
  /** Default "Kepada Yth." — SPH event pakai "Kepada" saja */
  kepadaLabel?: string
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
}: Props) {
  return (
    <div className="doc-page">
      <DocumentHeader kota={kota} />

      <div className="doc-content">
        <div className="doc-letter-head">
          <table className="doc-letter-meta-table">
            <tbody>
              <tr>
                <td className="doc-letter-label">Nomor</td>
                <td className="doc-letter-sep">:</td>
                <td className="doc-letter-value">{nomorSurat}</td>
              </tr>
              <tr>
                <td className="doc-letter-label">{kepadaLabel}</td>
                <td className="doc-letter-sep">:</td>
                <td className="doc-letter-value doc-letter-to-name">{kepada}</td>
              </tr>
              <tr>
                <td className="doc-letter-label">Hal</td>
                <td className="doc-letter-sep">:</td>
                <td className="doc-letter-value">{hal}</td>
              </tr>
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
