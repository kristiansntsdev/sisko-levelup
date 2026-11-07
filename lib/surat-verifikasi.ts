// Isi halaman verifikasi Surat Keuangan (/verifikasi/{kode}, dibuka dari QR TTD). Murni, aman untuk client dan demo.
import type { DanaView } from '@/lib/dana-approval'
import { SURAT_KEUANGAN } from '@/lib/surat-keuangan-data'

export type PenandaStatus = 'signed' | 'transferred' | 'pending' | 'rejected'

export type Penanda = {
  key: 'korwil' | 'pic' | 'keuangan'
  nama: string
  peran: string
  /** Waktu keputusan (WIB); null kalau belum */
  at: string | null
  status: PenandaStatus
}

export type SuratVerifikasi = {
  idDokumen: string
  diajukan: string | null
  judul: string
  dibuatOleh: string
  /** Isi surat yang bisa dicocokkan dengan kertas: event, dana, rekening */
  isi: { label: string; value: string }[]
  penanda: Penanda[]
}

export function buildSuratVerifikasi(view: DanaView): SuratVerifikasi {
  const { surat, approvals, rejection, at, korwil } = view
  const ditolak = (oleh: string) => rejection?.oleh === oleh

  const penanda: Penanda[] = []
  // Baris lama tanpa snapshot korwil (disetujui sebelum alur Korwil) tidak punya penanda Korwil.
  if (korwil) {
    const status: PenandaStatus = approvals.korwil ? 'signed' : ditolak('Korwil PPHTGD') ? 'rejected' : 'pending'
    penanda.push({
      key: 'korwil',
      nama: korwil.koordinator || korwil.nama,
      peran: korwil.koordinator ? `Korwil PPHTGD · ${korwil.nama}` : 'Korwil PPHTGD',
      at: status === 'pending' ? null : at.korwil,
      status,
    })
  }
  const picStatus: PenandaStatus = approvals.pic ? 'signed' : ditolak('PIC LevelUP Pusat') ? 'rejected' : 'pending'
  penanda.push({
    key: 'pic',
    nama: SURAT_KEUANGAN.picPusat.nama,
    peran: SURAT_KEUANGAN.picPusat.role,
    at: picStatus === 'pending' ? null : at.pic,
    status: picStatus,
  })
  penanda.push({
    key: 'keuangan',
    nama: SURAT_KEUANGAN.keuangan.nama,
    peran: 'Transfer dana',
    at: approvals.keuangan ? at.cair : null,
    status: approvals.keuangan ? 'transferred' : 'pending',
  })

  return {
    idDokumen: view.idDokumen,
    diajukan: at.diajukan,
    judul: `Permohonan Pengajuan Support Dana — ${surat.namaEvent}`,
    dibuatOleh: surat.kota,
    isi: [
      { label: 'Nama Event', value: surat.namaEvent },
      { label: 'Tanggal Event', value: surat.tanggalEvent },
      { label: 'Jumlah Peserta', value: surat.jumlahPeserta },
      { label: 'Pengajuan Dana', value: surat.pengajuanDana },
      { label: 'Bank Penerima', value: surat.namabank || '-' },
      { label: 'Nomor Rekening', value: surat.norek || '-' },
      { label: 'Nama Pemilik Rekening', value: surat.namarek || '-' },
    ],
    penanda,
  }
}
