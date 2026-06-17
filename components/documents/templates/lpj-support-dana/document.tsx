import type { DocumentTemplateProps } from '@/components/documents/types/template-schema'
import { DocPage } from '@/components/documents/_shared/letter-layout'
import { FieldTable } from '@/components/documents/_shared/field-table'
import { TwoColSignatures, SignatureCell } from '@/components/documents/_shared/signature-block'
import { DocumentHeader } from '@/components/documents/_shared/document-header'
import { str, repeatRows } from '@/components/documents/templates/_helpers'
import { fmtLetterDate } from '@/lib/documents/format-date-id'
import { formatCurrency } from '@/lib/documents/form-data'
import '@/components/documents/_shared/document-print.css'

const TEMPLATE_ID = 'lpj-support-dana'
const MIN_FINANCIAL_ROWS = 14

function fmtRp(v: unknown) {
  const raw = String(v ?? '')
  const n = Number(raw.replace(/[^0-9]/g, ''))
  return Number.isFinite(n) && n > 0 ? formatCurrency(n) : raw
}

function parseRp(v: unknown) {
  return Number(String(v ?? '').replace(/[^0-9]/g, '')) || 0
}

function formatTanggalSurat(raw: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return fmtLetterDate(raw)
  return raw
}

function pickSlot(stampSlots: DocumentTemplateProps['stampSlots'], id: string) {
  return stampSlots.find((s) => s.id === id)
}

export function LpjSupportDanaDocument({
  data,
  kotaLogo,
  approved,
  stampSlots,
}: DocumentTemplateProps) {
  const kota = str(data.kota)
  const kotaUpper = kota.toUpperCase()
  const acara = str(data.acara)
  const tanggalSurat = formatTanggalSurat(str(data.tanggalSurat))
  const tanggalLaporanKeuangan = formatTanggalSurat(str(data.tanggalLaporanKeuangan))

  const rincian = repeatRows(data, 'rincianKeuangan')
  const financialRows = Array.from({ length: Math.max(MIN_FINANCIAL_ROWS, rincian.length) }, (_, i) => {
    const row = rincian[i]
    const pengeluaran = row ? parseRp(row.pengeluaran) : 0
    const pemasukan = row ? parseRp(row.pemasukan) : 0
    return {
      tanggal: row?.tanggal ?? '',
      item: row?.item ?? '',
      jumlahSatuan: row?.jumlahSatuan ?? '',
      pengeluaran,
      pemasukan,
    }
  })

  let runningSaldo = 0
  const rowsWithSaldo = financialRows.map((row) => {
    runningSaldo += row.pemasukan - row.pengeluaran
    return { ...row, saldo: runningSaldo }
  })

  const totalPemasukan = financialRows.reduce((sum, row) => sum + row.pemasukan, 0)
  const totalPengeluaran = financialRows.reduce((sum, row) => sum + row.pengeluaran, 0)
  const saldoAkhir = totalPemasukan - totalPengeluaran

  const picKeuangan = pickSlot(stampSlots, 'picKeuangan')
  const picKegiatan = pickSlot(stampSlots, 'picKegiatan')

  return (
    <>
      {/* Halaman 1 — Permohonan Support Dana */}
      <DocPage>
        <DocumentHeader kota={kota} />
        <div className="doc-content">
          <div className="doc-letter-head">
            <table className="doc-letter-meta-table">
              <tbody>
                <tr>
                  <td className="doc-letter-label">Kepada</td>
                  <td className="doc-letter-sep">:</td>
                  <td className="doc-letter-value doc-letter-to-name">{str(data.kepada)}</td>
                </tr>
              </tbody>
            </table>
            <div className="doc-letter-right">
              <div className="doc-tempat-tanggal">{tanggalSurat}</div>
            </div>
          </div>

          <div className="doc-body">
            <p className="doc-salutation">Salam sejahtera,</p>
            <p>
              Dengan hormat, Bersamaan dengan surat permohonan bantuan dana penyelenggaraan{' '}
              <strong>{acara}</strong> ini, kami sampaikan bahwa kami telah menyelesaikan pelayanan :
            </p>

            <div className="doc-info-section">
              <div className="doc-info-title">Informasi Penanggung Jawab</div>
              <FieldTable
                className="doc-keputusan doc-keputusan-wide"
                rows={[
                  { label: 'Nama Koordinator', value: str(data.namaKoordinator) },
                  { label: 'LevelUP Kota', value: kota },
                  { label: 'Kegiatan Acara', value: acara },
                  { label: 'Tanggal Event', value: str(data.tanggalEvent) },
                  { label: 'Tempat Pelaksanaan Event', value: str(data.tempatPelaksanaan) },
                  { label: 'Jumlah Peserta', value: str(data.jumlahPeserta) },
                  { label: 'Pengajuan Dana', value: fmtRp(str(data.pengajuanDana)) },
                  { label: 'Bank Penerima', value: str(data.bankPenerima) },
                  { label: 'Nomor Rekening', value: str(data.nomorRekening) },
                  { label: 'Nama Pemilik Rekening', value: str(data.namaPemilikRekening) },
                ]}
              />
            </div>

            <p>
              Demikian surat permohonan ini kami buat. Atas perhatian dan dukungan yang senantiasa
              diberikan kami ucapan terima kasih.
            </p>
            <p className="doc-blessing">Tuhan Yesus Memberkati.</p>
          </div>

          <TwoColSignatures
            templateId={TEMPLATE_ID}
            kota={kota}
            acara={acara}
            kotaLogo={kotaLogo}
            approved={approved}
            stampSlots={stampSlots}
            slotIds={['korwil', 'pic']}
            labels={['Korwil PPHTGD', `PIC LEVELUP ${kotaUpper}`]}
            mengetahuiLabel="Hormat Kami,"
          />
        </div>
      </DocPage>

      {/* Halaman 2 — LPJ */}
      <DocPage>
        <DocumentHeader kota={kota} />
        <div className="doc-content">
          <h1 className="doc-title">LAPORAN PERTANGGUNGJAWABAN ( LPJ )</h1>
          <h2 className="doc-subtitle">KEGIATAN ACARA LEVELUP</h2>

          <div className="doc-body">
            <p>
              Telah dilaksanakan <strong>{acara}</strong>, pada hari {str(data.hariKegiatan)},{' '}
              tanggal {str(data.tanggalKegiatan)}, pukul {str(data.pukulKegiatan)}, tempat{' '}
              {str(data.tempatKegiatan)}.
            </p>
            <p>Berikut adalah Laporan Kegiatan Acara {acara}</p>

            <FieldTable
              rows={[
                { label: 'Acara', value: acara },
                { label: 'Tema', value: str(data.tema) },
                { label: 'Tanggal', value: str(data.tanggalKegiatan) },
                { label: 'Pukul', value: str(data.pukulKegiatan) },
                { label: 'Tempat', value: str(data.tempatKegiatan) },
                { label: 'Pembicara', value: str(data.pembicara) },
                { label: 'Pengeluaran Riil', value: fmtRp(str(data.pengeluaranRiil)) },
                { label: 'Jumlah Peserta Riil', value: str(data.jumlahPesertaRiil) },
              ]}
            />

            <p className="doc-checklist-title">Checklist jika sudah melampirkan :</p>
            <ul className="doc-checklist">
              <li>✓ Dokumentasi Acara</li>
              <li>✓ Recap Video Acara</li>
              <li>✓ Laporan Keuangan ( terlampir )</li>
              <li>✓ Dokumentasi Kegiatan ( terlampir )</li>
              <li>✓ *Susunan Panitia ( opsional )</li>
            </ul>

            <p>
              Laporan ini kami susun sebagai bentuk tanggung jawab dan transparansi terhadap
              kegiatan yang telah terlaksana. Semoga laporan ini bermanfaat sebagai bahan refleksi,
              sehingga pelayanan dan kinerja kita ke depan dapat lebih optimal
            </p>
          </div>

          <TwoColSignatures
            templateId={TEMPLATE_ID}
            kota={kota}
            acara={acara}
            kotaLogo={kotaLogo}
            approved={approved}
            stampSlots={stampSlots}
            slotIds={['korwil', 'pic']}
            labels={['Korwil PPHTGD', `PIC/ CPIC LEVELUP ${kotaUpper}`]}
            mengetahuiLabel="Mengetahui,"
          />

          <div className="doc-lampiran-section">
            <div className="doc-lampiran-heading">Lampiran 1</div>
            <div>Laporan Keuangan :</div>
            <h2 className="doc-lampiran-title">LAPORAN KEUANGAN</h2>
            <div className="doc-lampiran-meta">{acara}</div>
            <div className="doc-lampiran-meta">LevelUp {kotaUpper}</div>
            <div className="doc-lampiran-meta">{tanggalLaporanKeuangan}</div>
          </div>
        </div>
      </DocPage>

      {/* Halaman 3 — Rincian Keuangan & Dokumentasi */}
      <DocPage>
        <DocumentHeader kota={kota} />
        <div className="doc-content">
          <div className="doc-lampiran-meta doc-lampiran-meta-right">{tanggalLaporanKeuangan}</div>

          <table className="doc-table doc-financial-table">
            <thead>
              <tr>
                <th className="doc-table-no">No</th>
                <th>Tanggal</th>
                <th>Item</th>
                <th>Jumlah Satuan</th>
                <th>Pengeluaran</th>
                <th>Pemasukan</th>
                <th>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {rowsWithSaldo.map((row, i) => (
                <tr key={i}>
                  <td className="doc-table-no">{i + 1}</td>
                  <td>{row.tanggal}</td>
                  <td>{row.item}</td>
                  <td>{row.jumlahSatuan}</td>
                  <td className="doc-financial-amount">
                    {row.pengeluaran > 0 ? fmtRp(String(row.pengeluaran)) : ''}
                  </td>
                  <td className="doc-financial-amount">
                    {row.pemasukan > 0 ? fmtRp(String(row.pemasukan)) : ''}
                  </td>
                  <td className="doc-financial-amount">
                    {row.pengeluaran > 0 || row.pemasukan > 0
                      ? fmtRp(String(row.saldo))
                      : ''}
                  </td>
                </tr>
              ))}
              <tr className="doc-financial-summary">
                <td colSpan={4} className="doc-financial-summary-label">
                  Saldo Akhir
                </td>
                <td colSpan={3} className="doc-financial-amount">
                  {fmtRp(String(saldoAkhir))}
                </td>
              </tr>
              <tr className="doc-financial-summary">
                <td colSpan={4} className="doc-financial-summary-label">
                  TOTAL PEMASUKAN
                </td>
                <td colSpan={3} className="doc-financial-amount">
                  {fmtRp(String(totalPemasukan))}
                </td>
              </tr>
              <tr className="doc-financial-summary">
                <td colSpan={4} className="doc-financial-summary-label">
                  TOTAL PENGELUARAN
                </td>
                <td colSpan={3} className="doc-financial-amount">
                  {fmtRp(String(totalPengeluaran))}
                </td>
              </tr>
            </tbody>
          </table>

          {picKeuangan && picKegiatan && (
            <table className="doc-signatures">
              <tbody>
                <tr>
                  <td className="doc-sign-mengetahui">Dibuat oleh,</td>
                  <td className="doc-sign-mengetahui">Mengetahui,</td>
                </tr>
                <tr>
                  <td className="doc-sign-role">PIC Keuangan</td>
                  <td className="doc-sign-role">PIC Kegiatan</td>
                </tr>
                <tr>
                  <SignatureCell
                    slot={picKeuangan}
                    templateId={TEMPLATE_ID}
                    kota={kota}
                    subject={acara}
                    kotaLogo={kotaLogo}
                    approved={Boolean(approved.picKeuangan)}
                  />
                  <SignatureCell
                    slot={picKegiatan}
                    templateId={TEMPLATE_ID}
                    kota={kota}
                    subject={acara}
                    kotaLogo={kotaLogo}
                    approved={Boolean(approved.picKegiatan)}
                  />
                </tr>
              </tbody>
            </table>
          )}

          <div className="doc-lampiran-section doc-lampiran-section-spaced">
            <div className="doc-lampiran-heading">Lampiran 2</div>
            <div>Dokumentasi Kegiatan:</div>
            <h2 className="doc-lampiran-title">DOKUMENTASI KEGIATAN</h2>
            <div className="doc-lampiran-meta">{acara}</div>
            <div className="doc-lampiran-meta">LevelUp {kotaUpper}</div>
            <FieldTable
              className="doc-keputusan doc-keputusan-wide doc-dokumentasi-meta"
              rows={[
                { label: 'Lokasi', value: str(data.tempatKegiatan) },
                { label: 'Tanggal', value: str(data.tanggalKegiatan) },
              ]}
            />
          </div>
        </div>
      </DocPage>
    </>
  )
}
