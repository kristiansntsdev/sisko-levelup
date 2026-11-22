# Backlog

## Notifikasi (lanjutan Web Push)

- [ ] **Push pengajuan dana per step ke pengurus kota (ALK Kota)**
  - Urutan: Diajukan → Review Sekretariat / BRIM Nasional (setuju atau tolak) → Siap kirim ke Korwil → Korwil setuju/tolak → PIC LevelUP setuju/tolak → Cair.
  - Sekarang hanya Sekretariat + BRIM Nasional yang dapat push untuk dana (padanan Telegram, lewat `danaTelegram` di `lib/dana-flow.ts`).
  - Cara: di `danaTelegram`, tambah `idCabang: event.id_cabang` + `kotaJuga: true` ke `pushAlert`, dan beri `url` untuk peran `alk-kota` (`/dashboard/v2/kota/alk/reimburse/{idEvent}`). Cek isi pesan per step supaya ALK Kota tahu aksinya (mis. "Kirim link ke Korwil").
- [ ] **Push Air Hidup lanjutan** (Air Hidup sudah di produksi; push "Airmu mau kering" ke PIC sudah ada di job `air`)
  - Level 0–3: kabar kota lain (Kabar Terbaru) lewat push dari action Lapor WW.
  - LevelUP Pusat (5): ringkasan kota yang mau kering + update laporan.
- [ ] Push ke anggota saat tiket nasional disetujui / ditolak, pindah kota di-approve, dan approval Squad (belum diminta).
- [ ] Preferensi notifikasi per jenis (sekarang aktif / nonaktif per HP).
